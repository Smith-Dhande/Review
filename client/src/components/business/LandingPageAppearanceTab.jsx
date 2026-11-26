import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import PublicReviewExperience from '../public/PublicReviewExperience'
import {
  appearanceAccentPresets,
  appearanceFonts,
} from '../../data/mockData'
import { getFontStack, loadGoogleFontsBatch } from '../../utils/fontLoader'

export default function LandingPageAppearanceTab({ business, onSave }) {
  const [appearance, setAppearance] = useState({
    accentColor: business.appearance?.accentColor || '#1B6B4A',
    fontFamily: business.appearance?.fontFamily || 'Inter',
    businessNameAlignment:
      business.appearance?.businessNameAlignment || 'left',
    logoPlacement: business.appearance?.logoPlacement || 'beside',
    layoutStyle: business.appearance?.layoutStyle || 'centered',
  })
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  useEffect(() => {
    // Load the 10 font choices on demand for the visual font selector
    loadGoogleFontsBatch(appearanceFonts)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedNotice(false)
    try {
      await onSave(appearance)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Customization Controls */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-7 bg-card rounded-lg border border-border"
      >
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">
            Landing Page Appearance
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            Personalize {business.name}&apos;s public review page. Changes
            update the live preview immediately.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* A. Accent Color */}
          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-text-primary">
              Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {appearanceAccentPresets.map((preset) => {
                const selected =
                  appearance.accentColor.toLowerCase() ===
                  preset.value.toLowerCase()
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      setAppearance((prev) => ({
                        ...prev,
                        accentColor: preset.value,
                      }))
                    }
                    title={preset.name}
                    aria-label={preset.name}
                    className={`w-8 h-8 rounded-md border transition-all cursor-pointer ${
                      selected
                        ? 'ring-2 ring-offset-2 ring-text-primary border-transparent'
                        : 'border-border hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.value }}
                  />
                )
              })}

              <label className="inline-flex items-center gap-2 ml-2 px-2.5 py-1.5 rounded-md border border-border bg-white text-xs text-text-secondary cursor-pointer">
                <input
                  type="color"
                  aria-label="Custom accent color"
                  value={appearance.accentColor}
                  onChange={(e) =>
                    setAppearance((prev) => ({
                      ...prev,
                      accentColor: e.target.value,
                    }))
                  }
                  className="w-5 h-5 border-0 p-0 bg-transparent cursor-pointer"
                />
                <span className="font-mono uppercase">
                  {appearance.accentColor}
                </span>
              </label>
            </div>
          </div>

          {/* B. Visual 10-Font Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-text-primary">
                Font Family
              </label>
              <span className="text-xs text-text-tertiary">
                {appearanceFonts.length} curated fonts
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {appearanceFonts.map((font) => {
                const selected = appearance.fontFamily === font
                return (
                  <button
                    key={font}
                    type="button"
                    onClick={() =>
                      setAppearance((prev) => ({
                        ...prev,
                        fontFamily: font,
                      }))
                    }
                    className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-white hover:border-border-hover'
                    }`}
                  >
                    <p className="text-xs font-medium text-text-secondary">
                      {font}
                    </p>
                    <p
                      className="text-sm text-text-primary mt-1 truncate"
                      style={{ fontFamily: getFontStack(font) }}
                    >
                      Your experience matters.
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* C. Business Name Alignment */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Business Name Alignment
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'left', label: 'Left aligned' },
                { id: 'center', label: 'Center aligned' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setAppearance((prev) => ({
                      ...prev,
                      businessNameAlignment: opt.id,
                    }))
                  }
                  className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer ${
                    appearance.businessNameAlignment === opt.id
                      ? 'border-primary bg-primary-light text-text-primary'
                      : 'border-border bg-white text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* D. Logo Display */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Logo Display
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'beside', label: 'Beside business name' },
                { id: 'above', label: 'Above business name' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setAppearance((prev) => ({
                      ...prev,
                      logoPlacement: opt.id,
                    }))
                  }
                  className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors cursor-pointer ${
                    appearance.logoPlacement === opt.id
                      ? 'border-primary bg-primary-light text-text-primary'
                      : 'border-border bg-white text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* E. Landing Page Layout */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Landing Page Layout
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: 'centered',
                  label: 'Centered',
                  desc: 'Spacious editorial header above questionnaire',
                },
                {
                  id: 'compact',
                  label: 'Compact',
                  desc: 'Tighter spacing and compact header',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setAppearance((prev) => ({
                      ...prev,
                      layoutStyle: opt.id,
                    }))
                  }
                  className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                    appearance.layoutStyle === opt.id
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-white hover:border-border-hover'
                  }`}
                >
                  <p className="text-sm font-medium text-text-primary">
                    {opt.label}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-status-active font-medium">
            {savedNotice ? 'Appearance saved' : ''}
          </span>
          <Button type="submit" variant="primary" loading={saving}>
            Save Appearance
          </Button>
        </div>
      </form>

      {/* Live Preview using the exact shared PublicReviewExperience component */}
      <div className="lg:col-span-5 bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Live Preview
          </span>
          <span className="text-xs text-text-tertiary">
            {appearance.fontFamily} · {appearance.layoutStyle}
          </span>
        </div>

        <div className="p-4 bg-surface/50">
          <PublicReviewExperience
            business={business}
            appearanceOverride={appearance}
            isPreview
          />
        </div>
      </div>
    </div>
  )
}
