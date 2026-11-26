import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { reviewTones, reviewLengths } from '../../data/mockData'

export default function ReviewConfigTab({ business, onSave }) {
  const [config, setConfig] = useState({
    googleReviewUrl: business.reviewConfig?.googleReviewUrl || '',
    welcomeMessage: business.reviewConfig?.welcomeMessage || '',
    tone: business.reviewConfig?.tone || 'Natural and Conversational',
    length: business.reviewConfig?.length || 'Medium',
    autoCopyPrompt: business.reviewConfig?.autoCopyPrompt ?? true,
  })
  const [savedNotice, setSavedNotice] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(config)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2500)
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
        <Input
          label="Google Review URL"
          type="url"
          placeholder="https://g.page/r/..."
          value={config.googleReviewUrl}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, googleReviewUrl: e.target.value }))
          }
        />

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
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-status-active font-medium">
          {savedNotice ? 'Configuration saved' : ''}
        </span>
        <Button type="submit" variant="primary">
          Save Configuration
        </Button>
      </div>
    </form>
  )
}
