import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import BusinessLogo from '../ui/BusinessLogo'
import { getFontStack, loadGoogleFont } from '../../utils/fontLoader'
import { getCategoryTheme } from '../../utils/categoryThemes'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

/**
 * Editorial customer-facing review experience.
 * Powers both PublicReviewPage (/review/:businessId) and the Admin Live Preview.
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
  const hasUploadedLogo = Boolean(business?.logoUrl)
  const categoryTheme = getCategoryTheme(business?.category)

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
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
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
      setTimeout(() => setCopied(false), 2600)
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

  const useSplitDesktop = !isPreview && !isCompact

  const renderBrandIdentity = () => (
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
      {hasUploadedLogo ? (
        <BusinessLogo
          logoUrl={business?.logoUrl}
          logoText={business?.logoText}
          name={business?.name}
          size={isCompact ? 'md' : 'lg'}
          className="border-[#E2DFD7] shadow-xs"
        />
      ) : (
        <div
          className={`${
            isCompact ? 'w-10 h-10 text-xs' : 'w-12 h-12 text-sm'
          } rounded-md border flex items-center justify-center font-semibold tracking-wider shrink-0`}
          style={{
            borderColor: `${accentColor}40`,
            color: accentColor,
            backgroundColor: `${accentColor}0D`,
          }}
          aria-hidden="true"
        >
          {business?.logoText || 'RB'}
        </div>
      )}

      <div className="min-w-0">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.16em] mb-1"
          style={{ color: accentColor }}
        >
          {locationLine || categoryTheme.kicker}
        </p>
        <h1
          className={`${
            useSplitDesktop
              ? 'text-3xl sm:text-4xl lg:text-[40px] leading-[1.08]'
              : isCompact
                ? 'text-xl sm:text-2xl leading-tight'
                : 'text-2xl sm:text-[28px] leading-tight'
          } font-semibold tracking-tight text-[#171716] break-words`}
        >
          {business?.name}
        </h1>
      </div>
    </div>
  )

  const renderProgressBlock = () => {
    if (questions.length <= 1 || step !== 'questionnaire') return null
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#6E6C66]">
          <span className="uppercase tracking-[0.12em] font-medium">
            Progress
          </span>
          <span className="tabular-nums font-medium text-[#171716]">
            {answeredCount} of {questions.length} · {progressPct}%
          </span>
        </div>
        <div
          className="h-[2px] w-full rounded-full overflow-hidden"
          style={{ backgroundColor: categoryTheme.borderColor }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
      </div>
    )
  }

  const renderInteractiveStage = () => (
    <>
      {/* Stage 1: Questionnaire */}
      {step === 'questionnaire' && (
        <form onSubmit={handleSubmit} className="space-y-7">
          {useSplitDesktop ? (
            <div className="lg:hidden">{renderProgressBlock()}</div>
          ) : (
            renderProgressBlock()
          )}

          {questions.length === 0 ? (
            <div className="space-y-3 py-2">
              <label className="block text-[15px] font-medium text-[#171716]">
                Share a few words about your experience
              </label>
              <textarea
                rows={4}
                value={answers.general || ''}
                onChange={(e) => handleShortText('general', e.target.value)}
                placeholder="Write your thoughts here..."
                className="w-full rounded-md border bg-white px-4 py-3 text-[15px] text-[#171716] placeholder:text-[#9C9A94] focus:outline-none transition-colors"
                style={{ borderColor: categoryTheme.borderColor }}
              />
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: categoryTheme.borderColor }}
            >
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`${
                    index === 0 ? 'pt-0' : isCompact ? 'pt-5' : 'pt-7'
                  } ${isCompact ? 'pb-5' : 'pb-7'} space-y-3.5`}
                  style={{ borderColor: categoryTheme.borderColor }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="text-xs font-semibold tabular-nums tracking-wider"
                        style={{ color: accentColor }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <label className="text-[16px] font-medium text-[#171716] leading-snug">
                        {q.text}
                      </label>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-[#8C8A84] shrink-0">
                      {q.required ? 'Required' : 'Optional'}
                    </span>
                  </div>

                  {q.type === 'single_choice' && (
                    <div className="space-y-2 pt-0.5">
                      {q.options.map((opt, optIdx) => {
                        const selected = answers[q.id] === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSingleChoice(q.id, opt)}
                            className="w-full min-h-[48px] text-left px-4 py-3 rounded-md border text-[14px] transition-all duration-150 cursor-pointer flex items-center justify-between gap-3"
                            style={
                              selected
                                ? {
                                    borderColor: accentColor,
                                    backgroundColor: `${accentColor}12`,
                                    color: '#171716',
                                    fontWeight: 500,
                                  }
                                : {
                                    borderColor: categoryTheme.borderColor,
                                    backgroundColor: '#FFFFFF',
                                    color: '#43423D',
                                  }
                            }
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className="text-[11px] font-medium w-5 h-5 rounded-sm flex items-center justify-center shrink-0 border"
                                style={
                                  selected
                                    ? {
                                        borderColor: accentColor,
                                        backgroundColor: accentColor,
                                        color: '#FFFFFF',
                                      }
                                    : {
                                        borderColor: categoryTheme.borderColor,
                                        color: '#8C8A84',
                                      }
                                }
                              >
                                {OPTION_LETTERS[optIdx] || optIdx + 1}
                              </span>
                              <span className="break-words">{opt}</span>
                            </div>

                            <span
                              className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                              style={{
                                borderColor: selected
                                  ? accentColor
                                  : '#CFCBC4',
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
                    <div className="flex flex-wrap gap-2.5 pt-0.5">
                      {q.options.map((opt) => {
                        const selected =
                          Array.isArray(answers[q.id]) &&
                          answers[q.id].includes(opt)
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleMultipleChoice(q.id, opt)}
                            className="min-h-[44px] px-4 py-2.5 rounded-md border text-[14px] transition-all duration-150 cursor-pointer inline-flex items-center gap-2"
                            style={
                              selected
                                ? {
                                    borderColor: accentColor,
                                    backgroundColor: `${accentColor}14`,
                                    color: '#171716',
                                    fontWeight: 500,
                                  }
                                : {
                                    borderColor: categoryTheme.borderColor,
                                    backgroundColor: '#FFFFFF',
                                    color: '#43423D',
                                  }
                            }
                          >
                            <span
                              className="w-4 h-4 rounded-xs border flex items-center justify-center shrink-0"
                              style={
                                selected
                                  ? {
                                      borderColor: accentColor,
                                      backgroundColor: accentColor,
                                      color: '#FFFFFF',
                                    }
                                  : {
                                      borderColor: '#CFCBC4',
                                      backgroundColor: '#FFFFFF',
                                    }
                              }
                            >
                              {selected && <Check className="w-3 h-3" />}
                            </span>
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
                      className="w-full rounded-md border bg-white px-4 py-3 text-[15px] text-[#171716] placeholder:text-[#9C9A94] focus:outline-none transition-colors"
                      style={{ borderColor: categoryTheme.borderColor }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {validationError && (
            <div
              role="alert"
              className="rounded-md border border-error-border bg-error-light px-4 py-3 text-xs text-error"
            >
              {validationError}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] px-6 rounded-md text-sm font-medium text-white inline-flex items-center justify-center gap-2.5 transition-opacity hover:opacity-95 disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Generate Review Draft</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Stage 2: Editorial Review Draft Composition */}
      {step === 'draft' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p
                className="text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ color: accentColor }}
              >
                Ready to Share
              </p>
              <h2 className="text-2xl font-semibold text-[#171716] tracking-tight mt-1">
                Your Review Draft
              </h2>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="text-xs font-medium text-[#666560] hover:text-[#171716] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`}
                />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                onClick={() => setStep('questionnaire')}
                className="text-xs font-medium text-[#666560] hover:text-[#171716] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Edit answers</span>
              </button>
            </div>
          </div>

          {/* Editorial pull-quote draft frame */}
          <div
            className="bg-white border rounded-md p-5 sm:p-6 border-l-[3px]"
            style={{
              borderColor: categoryTheme.borderColor,
              borderLeftColor: accentColor,
            }}
          >
            <textarea
              ref={draftTextareaRef}
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Editable review draft"
              className="w-full bg-transparent text-[16px] sm:text-[17px] text-[#171716] leading-[1.7] focus:outline-none resize-y"
            />
            <p
              className="text-xs text-[#8C8A84] mt-3 pt-3 border-t"
              style={{ borderColor: categoryTheme.borderColor }}
            >
              Tap anywhere in the text above to personalize your words before
              copying.
            </p>
          </div>

          {copied && (
            <div
              className="rounded-md px-4 py-2.5 text-xs font-medium flex items-center gap-2"
              style={{
                backgroundColor: `${accentColor}14`,
                color: accentColor,
              }}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>Review copied successfully! Paste it on Google Reviews.</span>
            </div>
          )}

          {manualCopyHint && (
            <p className="text-xs text-[#666560]">
              Automatic clipboard access was blocked. Your draft is selected —
              press Ctrl+C / Cmd+C to copy manually.
            </p>
          )}

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full min-h-[48px] px-5 rounded-md text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-95 cursor-pointer"
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
                className="w-full min-h-[48px] px-5 rounded-md border bg-white text-sm font-medium text-[#171716] hover:bg-[#F5F4F0] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                style={{ borderColor: categoryTheme.borderColor }}
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
    </>
  )

  // ── Split-Screen Editorial Layout (Desktop Centered Mode) ──
  if (useSplitDesktop) {
    return (
      <div
        className="min-h-screen text-[#171716] flex flex-col lg:grid lg:grid-cols-12"
        style={{
          backgroundColor: categoryTheme.paperBg,
          fontFamily: getFontStack(fontFamily),
        }}
      >
        {/* Left Editorial Brand Identity Column */}
        <aside
          className="lg:col-span-5 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-12 lg:py-14 border-b lg:border-b-0 lg:border-r relative"
          style={{
            backgroundColor: categoryTheme.surfaceTint,
            borderColor: categoryTheme.borderColor,
          }}
        >
          {/* Top accent rule */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: accentColor }}
          />

          <div className="space-y-6 lg:space-y-8 pt-2">
            {renderBrandIdentity()}

            {business?.reviewConfig?.welcomeMessage && (
              <div
                className={`pt-5 border-t ${
                  isCentered ? 'text-center mx-auto max-w-md' : 'text-left'
                }`}
                style={{ borderColor: categoryTheme.borderColor }}
              >
                <p className="text-[15px] sm:text-base text-[#4A4944] leading-relaxed">
                  {business.reviewConfig.welcomeMessage}
                </p>
              </div>
            )}
          </div>

          <div className="hidden lg:block space-y-6">
            {renderProgressBlock()}
            <div
              className="pt-5 border-t flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#8C8A84]"
              style={{ borderColor: categoryTheme.borderColor }}
            >
              <span>{categoryTheme.kicker}</span>
              <span>ReviewBuddy</span>
            </div>
          </div>
        </aside>

        {/* Right Interactive Column */}
        <main className="lg:col-span-7 flex flex-col justify-between px-5 py-8 sm:px-10 lg:px-16 lg:py-16">
          <div className="w-full max-w-[560px] mx-auto my-auto">
            {renderInteractiveStage()}
          </div>

          <footer className="lg:hidden mt-12 pt-6 border-t border-[#E6E4DF] text-center">
            <p className="text-[11px] tracking-[0.14em] uppercase text-[#9C9A94]">
              ReviewBuddy
            </p>
          </footer>
        </main>
      </div>
    )
  }

  // ── Compact / Preview Single-Column Editorial Layout ──
  return (
    <div
      className={`text-[#171716] ${
        isPreview
          ? 'rounded-md border border-border overflow-hidden'
          : 'min-h-screen'
      }`}
      style={{
        backgroundColor: categoryTheme.paperBg,
        fontFamily: getFontStack(fontFamily),
      }}
    >
      <div
        className="h-[3px] w-full transition-colors duration-200"
        style={{ backgroundColor: accentColor }}
      />

      <div
        className={`mx-auto w-full max-w-[600px] px-5 sm:px-7 ${
          isPreview ? 'py-5' : 'py-8 sm:py-12'
        }`}
      >
        <header
          className={`${isCompact ? 'pb-5 mb-6' : 'pb-7 mb-7'} border-b`}
          style={{ borderColor: categoryTheme.borderColor }}
        >
          {renderBrandIdentity()}

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

        {renderInteractiveStage()}

        <footer
          className="mt-10 pt-5 border-t text-center"
          style={{ borderColor: categoryTheme.borderColor }}
        >
          <p className="text-[11px] tracking-[0.14em] uppercase text-[#9C9A94]">
            ReviewBuddy
          </p>
        </footer>
      </div>
    </div>
  )
}
