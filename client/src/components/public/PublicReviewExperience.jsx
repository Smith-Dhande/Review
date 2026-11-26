import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import BusinessLogo from '../ui/BusinessLogo'
import { getFontStack, loadGoogleFont } from '../../utils/fontLoader'

/**
 * Shared editorial customer-facing review experience.
 * Used by both PublicReviewPage (/review/:businessId) and the admin Live Preview
 * so both always stay 100% visually and functionally consistent.
 */
export default function PublicReviewExperience({
  business,
  appearanceOverride,
  isPreview = false,
  onFirstInteraction,
  onGenerateDraft,
  onRegenerateDraft,
  onCopySuccess,
  onGoogleRedirect,
}) {
  const [answers, setAnswers] = useState({})
  const [validationError, setValidationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [step, setStep] = useState('questionnaire') // 'questionnaire' | 'draft'
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const [manualCopyHint, setManualCopyHint] = useState(false)

  const draftTextareaRef = useRef(null)

  const appearance = appearanceOverride || business?.appearance || {}
  const accentColor = appearance.accentColor || '#1B6B4A'
  const fontFamily = appearance.fontFamily || 'Inter'
  const isCentered = appearance.businessNameAlignment === 'center'
  const isAbove = appearance.logoPlacement === 'above'
  const isCompact = appearance.layoutStyle === 'compact'
  const hasLogo = Boolean(business?.logoUrl || business?.logoText)

  useEffect(() => {
    loadGoogleFont(fontFamily)
  }, [fontFamily])

  const questions = useMemo(
    () => (business?.questions || []).filter((q) => q.enabled !== false),
    [business],
  )

  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const val = answers[q.id]
      if (Array.isArray(val)) return val.length > 0
      return typeof val === 'string' && val.trim().length > 0
    }).length
  }, [questions, answers])

  const progressPct =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0

  const handleSingleChoice = (qId, option) => {
    onFirstInteraction?.()
    setValidationError('')
    setAnswers((prev) => ({ ...prev, [qId]: option }))
  }

  const handleMultipleChoice = (qId, option) => {
    onFirstInteraction?.()
    setValidationError('')
    setAnswers((prev) => {
      const current = Array.isArray(prev[qId]) ? prev[qId] : []
      const exists = current.includes(option)
      return {
        ...prev,
        [qId]: exists
          ? current.filter((item) => item !== option)
          : [...current, option],
      }
    })
  }

  const handleShortText = (qId, value) => {
    onFirstInteraction?.()
    setValidationError('')
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    for (const q of questions) {
      if (!q.required) continue
      const val = answers[q.id]
      const isEmpty =
        val === undefined ||
        val === '' ||
        (Array.isArray(val) && val.length === 0)
      if (isEmpty) {
        setValidationError(`Please answer: "${q.text}"`)
        return
      }
    }

    if (isPreview) {
      setDraft(
        `Had a wonderful experience at ${business?.name || 'this business'}. Everything felt thoughtful and welcoming — would gladly recommend it.`,
      )
      setStep('draft')
      return
    }

    setSubmitting(true)
    setValidationError('')
    try {
      const generated = await onGenerateDraft(answers)
      setDraft(generated)
      setStep('draft')
    } catch (err) {
      setValidationError(err.message || 'Could not generate review draft.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegenerate = async () => {
    if (isPreview || !onRegenerateDraft) return
    setRegenerating(true)
    try {
      const generated = await onRegenerateDraft(answers)
      setDraft(generated)
    } catch {
      // Keep existing draft
    } finally {
      setRegenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!draft.trim()) return
    setManualCopyHint(false)
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      onCopySuccess?.()
      setTimeout(() => setCopied(false), 2500)
    } catch {
      if (draftTextareaRef.current) {
        draftTextareaRef.current.focus()
        draftTextareaRef.current.select()
      }
      setManualCopyHint(true)
    }
  }

  const locationLine = [business?.category, business?.location]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={`bg-[#FAF9F6] text-[#171716] ${
        isPreview ? 'rounded-md border border-border overflow-hidden' : 'min-h-screen'
      }`}
      style={{ fontFamily: getFontStack(fontFamily) }}
    >
      {/* Top editorial accent hairline */}
      <div
        className="h-[3px] w-full transition-colors duration-200"
        style={{ backgroundColor: accentColor }}
      />

      <div
        className={`mx-auto w-full max-w-[560px] px-5 sm:px-6 ${
          isPreview
            ? isCompact
              ? 'py-5'
              : 'py-7'
            : isCompact
              ? 'py-7 sm:py-10'
              : 'py-10 sm:py-16'
        }`}
      >
        {/* A. Editorial Business Identity & Welcome */}
        <header
          className={`${
            isCompact ? 'pb-6 mb-6' : 'pb-8 mb-8'
          } border-b border-[#E6E4DF]`}
        >
          <div
            className={`flex gap-4 ${
              isAbove ? 'flex-col' : 'flex-row items-center'
            } ${
              isCentered
                ? isAbove
                  ? 'items-center text-center'
                  : 'justify-center text-left'
                : 'items-start text-left'
            }`}
          >
            {hasLogo && (
              <BusinessLogo
                logoUrl={business?.logoUrl}
                logoText={business?.logoText}
                name={business?.name}
                size={isCompact ? 'md' : 'lg'}
                className="border-[#E6E4DF]"
              />
            )}

            <div className="min-w-0">
              {locationLine && (
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787670] mb-1">
                  {locationLine}
                </p>
              )}
              <h1
                className={`${
                  isCompact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-[28px]'
                } font-semibold tracking-tight text-[#171716] leading-tight break-words`}
              >
                {business?.name}
              </h1>
            </div>
          </div>

          {business?.reviewConfig?.welcomeMessage && (
            <p
              className={`text-[15px] text-[#57554F] leading-relaxed ${
                isCompact ? 'mt-4' : 'mt-5'
              } ${isCentered ? 'text-center mx-auto max-w-md' : 'text-left'}`}
            >
              {business.reviewConfig.welcomeMessage}
            </p>
          )}
        </header>

        {/* B. Questionnaire Section */}
        {step === 'questionnaire' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#787670]">
                  <span className="uppercase tracking-[0.1em] font-medium">
                    Your Experience
                  </span>
                  <span className="tabular-nums">
                    {answeredCount} / {questions.length}
                  </span>
                </div>
                <div className="h-[3px] w-full bg-[#EAE8E3] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: accentColor,
                    }}
                  />
                </div>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="space-y-3 py-2">
                <label className="block text-sm font-medium text-[#171716]">
                  Share a few words about your visit
                </label>
                <textarea
                  rows={4}
                  value={answers.general || ''}
                  onChange={(e) => handleShortText('general', e.target.value)}
                  placeholder="Write your thoughts here..."
                  className="w-full rounded-md border border-[#DCDAD4] bg-white px-3.5 py-3 text-[15px] text-[#171716] placeholder:text-[#9C9A94] focus:outline-none focus:border-[#171716]"
                />
              </div>
            ) : (
              <div className="divide-y divide-[#E6E4DF]">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className={`${
                      index === 0 ? 'pt-1' : isCompact ? 'pt-5' : 'pt-7'
                    } ${isCompact ? 'pb-5' : 'pb-7'} space-y-3.5`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-xs font-medium text-[#8C8A84] tabular-nums">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <label className="text-[15px] font-medium text-[#171716] leading-snug">
                          {q.text}
                        </label>
                      </div>
                      <span className="text-[11px] uppercase tracking-wider text-[#8C8A84] shrink-0">
                        {q.required ? 'Required' : 'Optional'}
                      </span>
                    </div>

                    {q.type === 'single_choice' && (
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const selected = answers[q.id] === opt
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSingleChoice(q.id, opt)}
                              className="w-full min-h-[44px] text-left px-4 py-2.5 rounded-md border text-sm transition-all duration-150 cursor-pointer flex items-center justify-between gap-3"
                              style={
                                selected
                                  ? {
                                      borderColor: accentColor,
                                      backgroundColor: `${accentColor}12`,
                                      color: '#171716',
                                      fontWeight: 500,
                                    }
                                  : {
                                      borderColor: '#E2E0DA',
                                      backgroundColor: '#FFFFFF',
                                      color: '#4A4944',
                                    }
                              }
                            >
                              <span>{opt}</span>
                              <span
                                className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                                style={{
                                  borderColor: selected ? accentColor : '#CFCBC4',
                                }}
                              >
                                {selected && (
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: accentColor }}
                                  />
                                )}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {q.type === 'multiple_choice' && (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => {
                          const selected =
                            Array.isArray(answers[q.id]) &&
                            answers[q.id].includes(opt)
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleMultipleChoice(q.id, opt)}
                              className="min-h-[42px] px-4 py-2 rounded-md border text-sm transition-all duration-150 cursor-pointer inline-flex items-center gap-2"
                              style={
                                selected
                                  ? {
                                      borderColor: accentColor,
                                      backgroundColor: `${accentColor}12`,
                                      color: '#171716',
                                      fontWeight: 500,
                                    }
                                  : {
                                      borderColor: '#E2E0DA',
                                      backgroundColor: '#FFFFFF',
                                      color: '#4A4944',
                                    }
                              }
                            >
                              {selected && (
                                <Check
                                  className="w-3.5 h-3.5 shrink-0"
                                  style={{ color: accentColor }}
                                />
                              )}
                              <span>{opt}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {q.type === 'short_text' && (
                      <textarea
                        rows={3}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleShortText(q.id, e.target.value)}
                        placeholder="Add any details in your own words (optional)..."
                        className="w-full rounded-md border border-[#E2E0DA] bg-white px-3.5 py-2.5 text-sm text-[#171716] placeholder:text-[#9C9A94] focus:outline-none focus:border-[#171716]"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {validationError && (
              <div
                role="alert"
                className="rounded-md border border-error-border bg-error-light px-3.5 py-2.5 text-xs text-error"
              >
                {validationError}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[46px] px-5 rounded-md text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-95 disabled:opacity-60 cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Generate Review Draft</span>
              </button>
            </div>
          </form>
        )}

        {/* C. Review Generation & Preview Section */}
        {step === 'draft' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#787670]">
                  Ready to Share
                </p>
                <h2 className="text-xl font-semibold text-[#171716] tracking-tight mt-1">
                  Your Review Draft
                </h2>
              </div>

              <div className="flex items-center gap-3 pt-1 shrink-0">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="text-xs text-[#666560] hover:text-[#171716] inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`}
                  />
                  <span>Regenerate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('questionnaire')}
                  className="text-xs text-[#666560] hover:text-[#171716] inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit answers</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#E2E0DA] rounded-md p-4">
              <textarea
                ref={draftTextareaRef}
                rows={5}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Editable review draft"
                className="w-full bg-transparent text-[15px] text-[#171716] leading-relaxed focus:outline-none resize-y"
              />
              <p className="text-[11px] text-[#8C8A84] mt-2 pt-2 border-t border-[#F0EEE9]">
                You can edit this draft freely before copying and posting on
                Google.
              </p>
            </div>

            {copied && (
              <p className="text-xs font-medium" style={{ color: accentColor }}>
                Review copied successfully!
              </p>
            )}

            {manualCopyHint && (
              <p className="text-xs text-[#666560]">
                Automatic clipboard access was blocked. Your draft is selected —
                press Ctrl+C / Cmd+C to copy manually.
              </p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full min-h-[46px] px-5 rounded-md text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Review Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Review</span>
                  </>
                )}
              </button>

              {business?.reviewConfig?.googleReviewUrl ? (
                <a
                  href={isPreview ? undefined : business.reviewConfig.googleReviewUrl}
                  target={isPreview ? undefined : '_blank'}
                  rel={isPreview ? undefined : 'noopener noreferrer'}
                  onClick={(e) => {
                    if (isPreview) {
                      e.preventDefault()
                      return
                    }
                    onGoogleRedirect?.()
                  }}
                  className="w-full min-h-[46px] px-5 rounded-md border border-[#DCDAD4] bg-white text-sm font-medium text-[#171716] hover:bg-[#F5F4F0] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Continue to Google Reviews</span>
                  <ExternalLink className="w-4 h-4 text-[#787670]" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[44px] px-4 rounded-md bg-[#EFECE6] text-[#8C8A84] text-sm font-medium cursor-not-allowed"
                >
                  Google Review URL Not Configured
                </button>
              )}
            </div>
          </div>
        )}

        {/* E. Minimal Footer */}
        <footer className="mt-12 pt-6 border-t border-[#EAE8E3] text-center">
          <p className="text-[11px] tracking-wider uppercase text-[#9C9A94]">
            ReviewBuddy
          </p>
        </footer>
      </div>
    </div>
  )
}
