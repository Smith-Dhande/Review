import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { reviewTones, reviewLengths } from '../../utils/businessOptions'
import { normalizeGoogleReviewInput } from '../../utils/googleReview'

function buildConfig(business) {
  return {
    googleReviewUrl: business.reviewConfig?.googleReviewUrl || '',
    welcomeMessage: business.reviewConfig?.welcomeMessage || '',
    tone: business.reviewConfig?.tone || 'Natural and Conversational',
    length: business.reviewConfig?.length || 'Medium',
    autoCopyPrompt: business.reviewConfig?.autoCopyPrompt ?? true,
  }
}

export default function ReviewConfigTab({ business, onSave }) {
  const [config, setConfig] = useState(() => buildConfig(business))
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const normalizedUrl = normalizeGoogleReviewInput(config.googleReviewUrl)
    const nextConfig = { ...config, googleReviewUrl: normalizedUrl }
    setConfig(nextConfig)
    setSaving(true)
    setSavedNotice(false)
    setSaveError('')

    try {
      await onSave(nextConfig)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2500)
    } catch (err) {
      setSaveError(err.message || 'Could not save review configuration.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-lg border border-border"
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">
          Review Configuration
        </h3>
        <p className="text-xs text-text-tertiary mt-0.5">
          Control the Google review destination, customer greeting, and
          generated draft style.
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <Input
            label="Google Place ID"
            type="text"
            placeholder="ChIJCcAieFGl1jsREQ6h9oXJa-8"
            value={config.googleReviewUrl}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, googleReviewUrl: e.target.value }))
            }
            onBlur={(e) => {
              const normalized = normalizeGoogleReviewInput(e.target.value)
              if (normalized !== e.target.value) {
                setConfig((prev) => ({ ...prev, googleReviewUrl: normalized }))
              }
            }}
          />
          <p className="text-xs text-text-tertiary mt-1.5">
            Paste a Google Place ID (e.g. <code>ChIJ...</code>) to open the direct
            review popup, or paste a full Google Review URL.
          </p>
        </div>

        <div>
          <label
            htmlFor="welcome-message"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Welcome Message
          </label>
          <textarea
            id="welcome-message"
            rows={3}
            value={config.welcomeMessage}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, welcomeMessage: e.target.value }))
            }
            placeholder="Message shown at the top of the customer review page..."
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-150"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="review-tone"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Review Tone
            </label>
            <select
              id="review-tone"
              value={config.tone}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, tone: e.target.value }))
              }
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {reviewTones.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="review-length"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Review Length
            </label>
            <select
              id="review-length"
              value={config.length}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, length: e.target.value }))
              }
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {reviewLengths.map((len) => (
                <option key={len} value={len}>
                  {len}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-3">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Prompt one-tap copy before redirect
              </p>
              <p className="text-xs text-text-tertiary">
                Remind customers to copy their draft before opening the Google
                review page.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.autoCopyPrompt}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  autoCopyPrompt: e.target.checked,
                }))
              }
              className="mt-1 w-4 h-4 rounded accent-primary cursor-pointer"
            />
          </label>
        </div>

        {saveError && (
          <div
            role="alert"
            className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error"
          >
            {saveError}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-status-active font-medium">
          {savedNotice ? 'Configuration saved' : ''}
        </span>
        <Button type="submit" variant="primary" loading={saving}>
          Save Configuration
        </Button>
      </div>
    </form>
  )
}
