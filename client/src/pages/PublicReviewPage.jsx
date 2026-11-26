import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Copy, ExternalLink, RotateCcw } from 'lucide-react'
import Button from '../components/ui/Button'
import { useBusinesses } from '../context/BusinessesContext'

function formatList(items) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0].toLowerCase()
  if (items.length === 2) {
    return `${items[0].toLowerCase()} and ${items[1].toLowerCase()}`
  }
  const lower = items.map((i) => i.toLowerCase())
  return `${lower.slice(0, -1).join(', ')}, and ${lower[lower.length - 1]}`
}

function generateReviewDraft(business, answers) {
  const name = business.name
  const tone = business.reviewConfig?.tone || 'Friendly'
  const length = business.reviewConfig?.length || 'Medium'

  const highlights = []
  const notes = []

  for (const question of business.questions || []) {
    const answer = answers[question.id]
    if (!answer) continue

    if (question.type === 'multiple_choice' && Array.isArray(answer)) {
      if (answer.length > 0) {
        highlights.push(formatList(answer))
      }
    } else if (question.type === 'single_choice' && typeof answer === 'string') {
      highlights.push(answer.toLowerCase())
    } else if (question.type === 'short_text' && typeof answer === 'string') {
      if (answer.trim()) {
        notes.push(answer.trim())
      }
    }
  }

  const openerByTone = {
    Friendly: `Had a wonderful experience at ${name}!`,
    Warm: `Really enjoyed my visit to ${name}.`,
    Professional: `I had a great experience visiting ${name}.`,
    Casual: `Stopped by ${name} and loved it.`,
    Calm: `Had a peaceful and pleasant visit to ${name}.`,
  }

  const opener = openerByTone[tone] || openerByTone.Friendly

  const sentences = [opener]

  if (highlights.length > 0) {
    sentences.push(`Especially appreciated ${highlights.join(', and ')}.`)
  }

  if (notes.length > 0) {
    sentences.push(notes.join(' '))
  }

  if (length !== 'Short') {
    sentences.push(`Would happily recommend ${name} to anyone nearby.`)
  }

  if (length === 'Detailed' && business.location) {
    sentences.push(
      `Conveniently located in ${business.location}, and well worth a visit.`,
    )
  }

  return sentences.join(' ')
}

export default function PublicReviewPage() {
  const { businessId } = useParams()
  const { businesses, recordPublicEvent } = useBusinesses()

  const business = useMemo(
    () =>
      businesses.find(
        (b) => b.id === businessId || b.slug === businessId,
      ),
    [businesses, businessId],
  )

  const [answers, setAnswers] = useState({})
  const [validationError, setValidationError] = useState('')
  const [draft, setDraft] = useState('')
  const [step, setStep] = useState('questionnaire') // 'questionnaire' | 'draft'
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (business && business.status === 'active') {
      recordPublicEvent(business.id, 'landingViews')
    }
    // Run once when landing on this business review page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id])

  if (!business || business.status === 'paused') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 text-center space-y-2">
          <h1 className="text-lg font-semibold text-text-primary">
            Review page unavailable
          </h1>
          <p className="text-sm text-text-secondary">
            This business review page is currently paused or does not exist.
          </p>
        </div>
      </div>
    )
  }

  const questions = business.questions || []

  const handleSingleChoice = (qId, option) => {
    setValidationError('')
    setAnswers((prev) => ({ ...prev, [qId]: option }))
  }

  const handleMultipleChoice = (qId, option) => {
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
    setValidationError('')
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const handleSubmitQuestionnaire = (e) => {
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

    const generated = generateReviewDraft(business, answers)
    setDraft(generated)
    setStep('draft')
    recordPublicEvent(business.id, 'questionnaireCompletions')
    recordPublicEvent(business.id, 'reviewDraftsGenerated')
  }

  const handleCopyDraft = async () => {
    if (!draft.trim()) return
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      recordPublicEvent(business.id, 'copyClicks')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard fallback ignored
    }
  }

  const handleGoogleRedirect = () => {
    recordPublicEvent(business.id, 'googleReviewRedirects')
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:py-12">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Business Header */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center text-sm font-semibold text-text-primary shrink-0">
              {business.logoText}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary tracking-tight">
                {business.name}
              </h1>
              <p className="text-xs text-text-tertiary mt-0.5">
                {business.category}
                {business.location ? ` · ${business.location}` : ''}
              </p>
            </div>
          </div>

          {business.reviewConfig?.welcomeMessage && (
            <p className="text-sm text-text-secondary mt-4 pt-4 border-t border-border leading-relaxed">
              {business.reviewConfig.welcomeMessage}
            </p>
          )}
        </div>

        {/* Step 1: Dynamic Business Questionnaire */}
        {step === 'questionnaire' && (
          <form
            onSubmit={handleSubmitQuestionnaire}
            className="bg-card border border-border rounded-lg p-6 space-y-6"
          >
            {questions.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Share a few words about your visit to {business.name}.
                </p>
                <textarea
                  rows={4}
                  value={answers.general || ''}
                  onChange={(e) => handleShortText('general', e.target.value)}
                  placeholder="Write your feedback here..."
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={q.id} className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <label className="text-sm font-medium text-text-primary">
                        {index + 1}. {q.text}
                      </label>
                      {!q.required && (
                        <span className="text-xs text-text-tertiary shrink-0">
                          Optional
                        </span>
                      )}
                    </div>

                    {q.type === 'single_choice' && (
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt) => {
                          const selected = answers[q.id] === opt
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSingleChoice(q.id, opt)}
                              className={`text-left px-3.5 py-2.5 rounded-md border text-sm transition-colors duration-150 cursor-pointer ${
                                selected
                                  ? 'border-primary bg-primary-light text-text-primary font-medium'
                                  : 'border-border bg-white text-text-secondary hover:border-border-hover hover:text-text-primary'
                              }`}
                            >
                              {opt}
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
                              className={`px-3.5 py-2 rounded-md border text-sm transition-colors duration-150 cursor-pointer ${
                                selected
                                  ? 'border-primary bg-primary-light text-text-primary font-medium'
                                  : 'border-border bg-white text-text-secondary hover:border-border-hover hover:text-text-primary'
                              }`}
                            >
                              {opt}
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
                        placeholder="Add your thoughts..."
                        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {validationError && (
              <div
                role="alert"
                className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error"
              >
                {validationError}
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-end">
              <Button type="submit" variant="primary" className="w-full sm:w-auto">
                Generate Review Draft
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Editable Draft + Copy + Google Review Redirect */}
        {step === 'draft' && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Your Review Draft
                </h2>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Feel free to edit your draft before copying and posting on
                  Google.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('questionnaire')}
                className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Edit answers</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Editable review draft"
              className="w-full rounded-md border border-border bg-white px-3.5 py-3 text-sm text-text-primary leading-relaxed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopyDraft}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-status-active" />
                    Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Review
                  </>
                )}
              </Button>

              {business.reviewConfig?.googleReviewUrl ? (
                <a
                  href={business.reviewConfig.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleGoogleRedirect}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors duration-150"
                >
                  <span>Continue to Google Review</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <Button type="button" variant="primary" disabled className="flex-1">
                  Google Review URL Not Set
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-text-tertiary">
          Powered by ReviewBuddy
        </p>
      </div>
    </div>
  )
}
