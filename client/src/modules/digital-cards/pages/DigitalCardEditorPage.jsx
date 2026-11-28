import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  Layers,
  LayoutTemplate,
  Monitor,
  Palette,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  Type,
  User,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import DigitalCardRenderer from '../templates/DigitalCardRenderer'
import CardAssetUpload from '../components/CardAssetUpload'
import { digitalCardsApi } from '../services/digitalCardsApi'
import {
  CARD_FONTS,
  CARD_TEMPLATES,
  COLOR_PALETTES,
  CUSTOM_SECTION_TYPES,
  SOCIAL_PLATFORMS,
  createDefaultCardPayload,
  getCardFontStack,
  loadCardFonts,
} from '../constants/presets'

const EDITOR_TABS = [
  { id: 'identity', label: 'Personal Info', group: 'Content', hint: 'Name, role, photo & bio', icon: User },
  { id: 'contact', label: 'Contact & Actions', group: 'Content', hint: 'Phone, WhatsApp, email & CTA order', icon: Phone },
  { id: 'social', label: 'Social Links', group: 'Content', hint: 'Social profiles & display style', icon: Share2 },
  { id: 'sections', label: 'Sections', group: 'Content', hint: 'Services, skills, portfolio & links', icon: Layers },
  { id: 'templates', label: 'Templates', group: 'Design', hint: 'Start with a curated card style', icon: LayoutTemplate },
  { id: 'typography', label: 'Typography', group: 'Design', hint: 'Distinctive fonts & text scale', icon: Type },
  { id: 'colors', label: 'Colors & BG', group: 'Design', hint: 'Palettes, gradients & surfaces', icon: Palette },
  { id: 'layout', label: 'Layout & Buttons', group: 'Design', hint: 'Header, avatar, spacing & buttons', icon: SlidersHorizontal },
  { id: 'visibility', label: 'Visibility', group: 'Design', hint: 'Toggle public fields on or off', icon: Eye },
]

export default function DigitalCardEditorPage() {
  const { cardId } = useParams()
  const isNew = !cardId
  const navigate = useNavigate()

  const [card, setCard] = useState(() => createDefaultCardPayload(''))
  const [activeTab, setActiveTab] = useState('identity')
  const [previewDevice, setPreviewDevice] = useState('mobile')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveNotice, setSaveNotice] = useState('')

  useEffect(() => {
    if (activeTab === 'typography') {
      loadCardFonts(CARD_FONTS.map((f) => f.name))
    }
  }, [activeTab])

  useEffect(() => {
    if (!dirty) return undefined
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    if (isNew) return
    let active = true
    digitalCardsApi
      .get(cardId)
      .then((res) => {
        if (!active) return
        setCard({
          ...createDefaultCardPayload(res.card.name),
          ...res.card,
          personalInformation: {
            ...createDefaultCardPayload('').personalInformation,
            ...(res.card.personalInformation || {}),
          },
          contactInformation: {
            ...createDefaultCardPayload('').contactInformation,
            ...(res.card.contactInformation || {}),
          },
          socialLinks: {
            displayStyle: res.card.socialLinks?.displayStyle || 'icon_label',
            items: res.card.socialLinks?.items || [],
          },
          appearance: {
            ...createDefaultCardPayload('').appearance,
            ...(res.card.appearance || {}),
          },
          visibilitySettings: {
            ...createDefaultCardPayload('').visibilitySettings,
            ...(res.card.visibilitySettings || {}),
          },
        })
        setDirty(false)
      })
      .catch((err) => {
        if (active) setSaveError(err.message || 'Failed to load card.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [cardId, isNew])

  const patchCard = (updater) => {
    setDirty(true)
    setSaveNotice('')
    setCard((prev) =>
      typeof updater === 'function' ? updater(prev) : { ...prev, ...updater },
    )
  }

  const updatePersonal = (field, val) =>
    patchCard((prev) => ({
      ...prev,
      personalInformation: { ...prev.personalInformation, [field]: val },
    }))

  const updateContact = (field, val) =>
    patchCard((prev) => ({
      ...prev,
      contactInformation: { ...prev.contactInformation, [field]: val },
    }))

  const updateAppearance = (updates) =>
    patchCard((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...updates },
    }))

  const updateVisibility = (key, val) =>
    patchCard((prev) => ({
      ...prev,
      visibilitySettings: { ...prev.visibilitySettings, [key]: val },
    }))

  const applyTemplate = (tpl) => {
    patchCard((prev) => ({
      ...prev,
      templateId: tpl.id,
      appearance: {
        ...prev.appearance,
        ...tpl.defaults,
      },
    }))
  }

  const handleResetToTemplate = () => {
    const tpl =
      CARD_TEMPLATES.find((t) => t.id === card.templateId) || CARD_TEMPLATES[0]
    updateAppearance(tpl.defaults)
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    if (saving) return
    if (!card.name?.trim()) {
      setSaveError('Card name is required.')
      setActiveTab('identity')
      return
    }
    setSaving(true)
    setSaveError('')
    setSaveNotice('')
    try {
      const payload = {
        name: card.name.trim(),
        status: card.status,
        templateId: card.templateId,
        personalInformation: card.personalInformation,
        contactInformation: card.contactInformation,
        socialLinks: card.socialLinks,
        customSections: card.customSections,
        appearance: card.appearance,
        visibilitySettings: card.visibilitySettings,
      }
      if (isNew) {
        const res = await digitalCardsApi.create(payload)
        setDirty(false)
        navigate(`/digital-cards/${res.card.slug}/edit`, { replace: true })
      } else {
        const res = await digitalCardsApi.update(card.slug, payload)
        setCard((prev) => ({ ...prev, ...res.card }))
        setDirty(false)
        setSaveNotice('Changes saved')
        setTimeout(() => setSaveNotice(''), 2500)
      }
    } catch (err) {
      setSaveError(err.message || 'Could not save digital card.')
    } finally {
      setSaving(false)
    }
  }

  const sortedActions = useMemo(
    () =>
      [...(card.contactInformation?.actions || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [card.contactInformation?.actions],
  )

  const moveAction = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= sortedActions.length) return
    const next = [...sortedActions]
    const [moved] = next.splice(idx, 1)
    next.splice(target, 0, moved)
    updateContact(
      'actions',
      next.map((a, i) => ({ ...a, order: i })),
    )
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-text-tertiary">
        Loading card studio...
      </div>
    )
  }

  const p = card.personalInformation || {}
  const c = card.contactInformation || {}
  const a = card.appearance || {}
  const v = card.visibilitySettings || {}

  return (
    <div className="space-y-4">
      {/* Top Studio Bar */}
      <div className="bg-card border border-border rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={isNew ? '/digital-cards' : `/digital-cards/${card.slug}`}
            className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <span className="text-border">|</span>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">
              {isNew ? 'Create Digital Card' : `Editing: ${p.fullName || card.name}`}
            </h1>
            <p className="text-[11px] text-text-tertiary">
              {dirty ? 'Unsaved changes' : saveNotice || 'All changes saved'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center rounded-md border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              aria-label="Mobile preview"
              className={`px-2.5 py-1 text-xs rounded-sm inline-flex items-center gap-1 cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-card text-text-primary shadow-2xs'
                  : 'text-text-secondary'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              aria-label="Desktop preview"
              className={`px-2.5 py-1 text-xs rounded-sm inline-flex items-center gap-1 cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-card text-text-primary shadow-2xs'
                  : 'text-text-secondary'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={saving}
            onClick={handleSave}
          >
            <Save className="w-3.5 h-3.5" />
            {isNew ? 'Create Card' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {saveError && (
        <div
          role="alert"
          className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error"
        >
          {saveError}
        </div>
      )}

      {/* Clean Studio Layout: Minimal Section Rail + Form | Sticky Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Controls */}
        <div className="xl:col-span-7 bg-card border border-border rounded-xl overflow-hidden flex flex-col md:flex-row">
          {/* Mobile Section Selector */}
          <div className="md:hidden border-b border-border bg-surface/40 px-4 py-2.5">
            <label className="block text-[11px] font-medium text-text-tertiary mb-1">
              Section
            </label>
            <select
              aria-label="Editor section"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-text-primary"
            >
              {EDITOR_TABS.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  {idx + 1}. {t.label} ({t.group})
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Minimal Vertical Step Rail */}
          <nav
            aria-label="Card editor sections"
            className="hidden md:flex md:flex-col md:w-48 shrink-0 border-r border-border bg-surface/30 p-3 space-y-4"
          >
            {['Content', 'Design'].map((groupName) => (
              <div key={groupName} className="space-y-1">
                <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  {groupName}
                </p>
                {EDITOR_TABS.filter((t) => t.group === groupName).map((t) => {
                  const Icon = t.icon
                  const isActive = activeTab === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full px-2.5 py-2 text-xs font-medium rounded-lg flex items-center gap-2 text-left cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-card text-text-primary shadow-2xs border border-border'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface/70'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-primary' : 'text-text-tertiary'
                        }`}
                      />
                      <span className="truncate">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Active Section Form + Step Footer */}
          <div className="flex-1 flex flex-col min-w-0">
            {(() => {
              const currentIdx = EDITOR_TABS.findIndex((t) => t.id === activeTab)
              const currentTab = EDITOR_TABS[currentIdx] || EDITOR_TABS[0]
              return (
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-2 bg-card">
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">
                      {currentTab.label}
                    </h2>
                    <p className="text-[11px] text-text-tertiary">
                      {currentTab.hint}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-text-tertiary tabular-nums">
                    Step {currentIdx + 1} of {EDITOR_TABS.length}
                  </span>
                </div>
              )
            })()}

            <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto">
            {activeTab === 'identity' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Card Label (Admin)"
                    value={card.name}
                    onChange={(e) => patchCard({ name: e.target.value })}
                    placeholder="e.g. Dr. Aditi Rao"
                    required
                  />
                  <Input
                    label="Full Name (Public)"
                    value={p.fullName}
                    onChange={(e) => updatePersonal('fullName', e.target.value)}
                    placeholder="Dr. Aditi Rao"
                  />
                  <Input
                    label="Job Title"
                    value={p.jobTitle}
                    onChange={(e) => updatePersonal('jobTitle', e.target.value)}
                    placeholder="Senior Dentist"
                  />
                  <Input
                    label="Profession"
                    value={p.profession}
                    onChange={(e) => updatePersonal('profession', e.target.value)}
                    placeholder="Healthcare"
                  />
                  <Input
                    label="Company Name"
                    value={p.companyName}
                    onChange={(e) => updatePersonal('companyName', e.target.value)}
                    placeholder="SmileCare Clinic"
                  />
                  <Input
                    label="Location"
                    value={p.location}
                    onChange={(e) => updatePersonal('location', e.target.value)}
                    placeholder="Bandra, Mumbai"
                  />
                </div>
                <Input
                  label="Personal Tagline"
                  value={p.tagline}
                  onChange={(e) => updatePersonal('tagline', e.target.value)}
                  placeholder="Helping you smile with confidence"
                />
                <Input
                  label="Short Biography"
                  value={p.shortBio}
                  onChange={(e) => updatePersonal('shortBio', e.target.value)}
                  placeholder="1-2 line summary shown near top"
                />
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Long Biography
                  </label>
                  <textarea
                    rows={3}
                    value={p.longBio}
                    onChange={(e) => updatePersonal('longBio', e.target.value)}
                    placeholder="Detailed background, experience, or credentials..."
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="pt-2 border-t border-border space-y-4">
                  <CardAssetUpload
                    label="Profile Picture"
                    hint="PNG/JPG/WebP"
                    value={p.profilePicture}
                    onChange={(asset) => updatePersonal('profilePicture', asset)}
                  />
                  <CardAssetUpload
                    label="Cover / Banner Image"
                    hint="Optional"
                    value={p.coverImage}
                    onChange={(asset) => updatePersonal('coverImage', asset)}
                  />
                  <CardAssetUpload
                    label="Company Logo"
                    hint="Optional"
                    value={p.companyLogo}
                    onChange={(asset) => updatePersonal('companyLogo', asset)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Phone Number"
                    value={c.phone}
                    onChange={(e) => updateContact('phone', e.target.value)}
                    placeholder="+91 98201 44510"
                  />
                  <Input
                    label="Secondary Phone"
                    value={c.secondaryPhone}
                    onChange={(e) =>
                      updateContact('secondaryPhone', e.target.value)
                    }
                    placeholder="+91 22 2600 1122"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={c.email}
                    onChange={(e) => updateContact('email', e.target.value)}
                    placeholder="name@company.com"
                  />
                  <Input
                    label="WhatsApp Number"
                    value={c.whatsappNumber}
                    onChange={(e) =>
                      updateContact('whatsappNumber', e.target.value)
                    }
                    placeholder="+91 98201 44510"
                  />
                  <Input
                    label="Website URL"
                    value={c.website}
                    onChange={(e) => updateContact('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                  <Input
                    label="Google Maps URL"
                    value={c.googleMapsUrl}
                    onChange={(e) =>
                      updateContact('googleMapsUrl', e.target.value)
                    }
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <Input
                  label="WhatsApp Pre-filled Message"
                  value={c.whatsappMessage}
                  onChange={(e) =>
                    updateContact('whatsappMessage', e.target.value)
                  }
                  placeholder="Hi! I got your digital card."
                />
                <Input
                  label="Business / Office Address"
                  value={c.businessAddress}
                  onChange={(e) =>
                    updateContact('businessAddress', e.target.value)
                  }
                  placeholder="Suite 402, Link Road, Mumbai"
                />

                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-text-primary">
                    Action Buttons (Enable &amp; Reorder)
                  </p>
                  {sortedActions.map((act, idx) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border bg-surface/40"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={act.enabled !== false}
                          onChange={(e) => {
                            const next = sortedActions.map((item) =>
                              item.id === act.id
                                ? { ...item, enabled: e.target.checked }
                                : item,
                            )
                            updateContact('actions', next)
                          }}
                          className="accent-primary cursor-pointer"
                        />
                        <input
                          type="text"
                          value={act.label}
                          onChange={(e) => {
                            const next = sortedActions.map((item) =>
                              item.id === act.id
                                ? { ...item, label: e.target.value }
                                : item,
                            )
                            updateContact('actions', next)
                          }}
                          className="text-xs bg-white border border-border rounded px-2 py-1 flex-1 min-w-0"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveAction(idx, -1)}
                          aria-label={`Move ${act.label} up`}
                          className="p-1 text-text-secondary hover:text-text-primary cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveAction(idx, 1)}
                          aria-label={`Move ${act.label} down`}
                          className="p-1 text-text-secondary hover:text-text-primary cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">
                    Social Links Display Style
                  </label>
                  <select
                    value={card.socialLinks?.displayStyle || 'icon_label'}
                    onChange={(e) =>
                      patchCard((prev) => ({
                        ...prev,
                        socialLinks: {
                          ...prev.socialLinks,
                          displayStyle: e.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs"
                  >
                    <option value="icon_only">Icon Only</option>
                    <option value="icon_label">Icon with Label</option>
                    <option value="compact_button">Compact Button</option>
                    <option value="section">Full Social Links Section</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  {(card.socialLinks?.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-md border border-border space-y-2 bg-surface/30"
                    >
                      <div className="flex items-center gap-2">
                        <select
                          value={item.platform}
                          onChange={(e) => {
                            const next = card.socialLinks.items.map((s) =>
                              s.id === item.id
                                ? { ...s, platform: e.target.value }
                                : s,
                            )
                            patchCard((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, items: next },
                            }))
                          }}
                          className="rounded border border-border bg-white px-2 py-1 text-xs"
                        >
                          {SOCIAL_PLATFORMS.map((sp) => (
                            <option key={sp.id} value={sp.id}>
                              {sp.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Custom label (optional)"
                          value={item.label || ''}
                          onChange={(e) => {
                            const next = card.socialLinks.items.map((s) =>
                              s.id === item.id
                                ? { ...s, label: e.target.value }
                                : s,
                            )
                            patchCard((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, items: next },
                            }))
                          }}
                          className="flex-1 rounded border border-border bg-white px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = card.socialLinks.items.filter(
                              (s) => s.id !== item.id,
                            )
                            patchCard((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, items: next },
                            }))
                          }}
                          className="text-error p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={item.url || ''}
                        onChange={(e) => {
                          const next = card.socialLinks.items.map((s) =>
                            s.id === item.id ? { ...s, url: e.target.value } : s,
                          )
                          patchCard((prev) => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, items: next },
                          }))
                        }}
                        className="w-full rounded border border-border bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    patchCard((prev) => ({
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        items: [
                          ...(prev.socialLinks?.items || []),
                          {
                            id: `soc-${Date.now()}`,
                            platform: 'instagram',
                            label: '',
                            url: '',
                            enabled: true,
                          },
                        ],
                      },
                    }))
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Social Link
                </Button>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {CUSTOM_SECTION_TYPES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        patchCard((prev) => ({
                          ...prev,
                          customSections: [
                            ...(prev.customSections || []),
                            {
                              id: `sec-${Date.now()}`,
                              type: st.id,
                              title: st.label,
                              subtitle: '',
                              content: '',
                              items:
                                st.id === 'text'
                                  ? []
                                  : [
                                      {
                                        id: `item-${Date.now()}`,
                                        title: `${st.label} Item`,
                                        description: '',
                                        url: '',
                                      },
                                    ],
                              visible: true,
                              order: (prev.customSections || []).length,
                            },
                          ],
                        }))
                      }
                      className="px-2.5 py-1 text-xs rounded-md border border-border bg-white hover:bg-surface cursor-pointer"
                    >
                      + {st.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {(card.customSections || []).map((sec, sIdx) => (
                    <div
                      key={sec.id}
                      className="p-3 rounded-md border border-border space-y-2.5 bg-surface/20"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const next = card.customSections.map((s) =>
                              s.id === sec.id
                                ? { ...s, title: e.target.value }
                                : s,
                            )
                            patchCard({ customSections: next })
                          }}
                          className="text-xs font-semibold bg-white border border-border rounded px-2 py-1 flex-1"
                        />
                        <label className="text-xs inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sec.visible !== false}
                            onChange={(e) => {
                              const next = card.customSections.map((s) =>
                                s.id === sec.id
                                  ? { ...s, visible: e.target.checked }
                                  : s,
                              )
                              patchCard({ customSections: next })
                            }}
                          />
                          <span>Show</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (sIdx === 0) return
                            const next = [...card.customSections]
                            ;[next[sIdx - 1], next[sIdx]] = [next[sIdx], next[sIdx - 1]]
                            patchCard({
                              customSections: next.map((s, i) => ({
                                ...s,
                                order: i,
                              })),
                            })
                          }}
                          className="p-1 text-text-secondary cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            patchCard({
                              customSections: card.customSections.filter(
                                (s) => s.id !== sec.id,
                              ),
                            })
                          }
                          className="p-1 text-error cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {sec.type === 'text' ? (
                        <textarea
                          rows={2}
                          value={sec.content || ''}
                          onChange={(e) => {
                            const next = card.customSections.map((s) =>
                              s.id === sec.id
                                ? { ...s, content: e.target.value }
                                : s,
                            )
                            patchCard({ customSections: next })
                          }}
                          placeholder="Section text..."
                          className="w-full text-xs bg-white border border-border rounded px-2 py-1.5"
                        />
                      ) : (
                        <div className="space-y-2">
                          {(sec.items || []).map((it) => (
                            <div
                              key={it.id}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white p-2 rounded border border-border"
                            >
                              <input
                                type="text"
                                placeholder="Title"
                                value={it.title || ''}
                                onChange={(e) => {
                                  const next = card.customSections.map((s) =>
                                    s.id === sec.id
                                      ? {
                                          ...s,
                                          items: s.items.map((x) =>
                                            x.id === it.id
                                              ? { ...x, title: e.target.value }
                                              : x,
                                          ),
                                        }
                                      : s,
                                  )
                                  patchCard({ customSections: next })
                                }}
                                className="text-xs border border-border rounded px-2 py-1"
                              />
                              <input
                                type="url"
                                placeholder="Optional URL (https://...)"
                                value={it.url || ''}
                                onChange={(e) => {
                                  const next = card.customSections.map((s) =>
                                    s.id === sec.id
                                      ? {
                                          ...s,
                                          items: s.items.map((x) =>
                                            x.id === it.id
                                              ? { ...x, url: e.target.value }
                                              : x,
                                          ),
                                        }
                                      : s,
                                  )
                                  patchCard({ customSections: next })
                                }}
                                className="text-xs border border-border rounded px-2 py-1"
                              />
                              <input
                                type="text"
                                placeholder="Short description (optional)"
                                value={it.description || ''}
                                onChange={(e) => {
                                  const next = card.customSections.map((s) =>
                                    s.id === sec.id
                                      ? {
                                          ...s,
                                          items: s.items.map((x) =>
                                            x.id === it.id
                                              ? {
                                                  ...x,
                                                  description: e.target.value,
                                                }
                                              : x,
                                          ),
                                        }
                                      : s,
                                  )
                                  patchCard({ customSections: next })
                                }}
                                className="sm:col-span-2 text-xs border border-border rounded px-2 py-1"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const next = card.customSections.map((s) =>
                                s.id === sec.id
                                  ? {
                                      ...s,
                                      items: [
                                        ...(s.items || []),
                                        {
                                          id: `item-${Date.now()}`,
                                          title: 'New Item',
                                          description: '',
                                          url: '',
                                        },
                                      ],
                                    }
                                  : s,
                              )
                              patchCard({ customSections: next })
                            }}
                            className="text-xs text-primary hover:underline cursor-pointer"
                          >
                            + Add item
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CARD_TEMPLATES.map((tpl) => {
                  const selected = card.templateId === tpl.id
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-primary bg-primary-light ring-1 ring-primary'
                          : 'border-border bg-white hover:border-border-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-text-primary">
                          {tpl.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: tpl.defaults.backgroundColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: tpl.defaults.primaryColor }}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-text-tertiary">{tpl.desc}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {activeTab === 'typography' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { key: 'headingFont', label: 'Heading Font' },
                    { key: 'bodyFont', label: 'Body Font' },
                    { key: 'buttonFont', label: 'Button Font' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-text-primary mb-1">
                        {f.label}
                      </label>
                      <select
                        value={a[f.key] || 'Inter'}
                        onChange={(e) =>
                          updateAppearance({ [f.key]: e.target.value })
                        }
                        className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs"
                      >
                        {CARD_FONTS.map((font) => (
                          <option key={font.name} value={font.name}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-medium text-text-secondary mb-2">
                    Font Previews (Click to apply to Headings)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CARD_FONTS.map((font) => (
                      <button
                        key={font.name}
                        type="button"
                        onClick={() =>
                          updateAppearance({ headingFont: font.name })
                        }
                        className={`p-2.5 rounded-md border text-left cursor-pointer ${
                          a.headingFont === font.name
                            ? 'border-primary bg-primary-light'
                            : 'border-border bg-white hover:bg-surface/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                          <span>{font.name}</span>
                          <span>{font.category}</span>
                        </div>
                        <p
                          className="text-sm text-text-primary mt-0.5 truncate"
                          style={{ fontFamily: getCardFontStack(font.name) }}
                        >
                          {p.fullName || card.name || font.sample || 'Signature Style'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-border">
                  {[
                    { key: 'headingSize', label: 'Heading Size', opts: ['sm', 'md', 'lg', 'xl'] },
                    { key: 'bodySize', label: 'Body Size', opts: ['sm', 'md', 'lg'] },
                    { key: 'fontWeight', label: 'Weight', opts: ['normal', 'medium', 'semibold', 'bold'] },
                    { key: 'lineHeight', label: 'Line Height', opts: ['tight', 'normal', 'relaxed'] },
                    { key: 'letterSpacing', label: 'Letter Spacing', opts: ['tight', 'normal', 'wide'] },
                  ].map((ctrl) => (
                    <div key={ctrl.key}>
                      <label
                        htmlFor={`typo-${ctrl.key}`}
                        className="block text-[11px] font-medium text-text-secondary mb-1"
                      >
                        {ctrl.label}
                      </label>
                      <select
                        id={`typo-${ctrl.key}`}
                        value={a[ctrl.key] || (ctrl.key === 'letterSpacing' ? 'normal' : a[ctrl.key])}
                        onChange={(e) =>
                          updateAppearance({ [ctrl.key]: e.target.value })
                        }
                        className="w-full rounded border border-border bg-white px-2 py-1 text-xs capitalize"
                      >
                        {ctrl.opts.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    Preset Palettes
                  </span>
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to template default
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_PALETTES.map((pal) => (
                    <button
                      key={pal.name}
                      type="button"
                      onClick={() => updateAppearance(pal)}
                      className="p-2 rounded-md border border-border bg-white hover:border-primary text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span
                          className="w-4 h-4 rounded-sm border border-black/10"
                          style={{ backgroundColor: pal.backgroundColor }}
                        />
                        <span
                          className="w-4 h-4 rounded-sm border border-black/10"
                          style={{ backgroundColor: pal.primaryColor }}
                        />
                        <span
                          className="w-4 h-4 rounded-sm border border-black/10"
                          style={{ backgroundColor: pal.cardBgColor }}
                        />
                      </div>
                      <p className="text-[11px] font-medium text-text-primary truncate">
                        {pal.name}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                  {[
                    ['primaryColor', 'Primary'],
                    ['secondaryColor', 'Secondary'],
                    ['accentColor', 'Accent'],
                    ['backgroundColor', 'Page BG'],
                    ['cardBgColor', 'Card BG'],
                    ['textColor', 'Text'],
                    ['buttonBgColor', 'Button BG'],
                    ['buttonTextColor', 'Button Text'],
                    ['borderColor', 'Border'],
                  ].map(([key, label]) => (
                    <label key={key} className="space-y-1 block">
                      <span className="text-[11px] font-medium text-text-secondary">
                        {label}
                      </span>
                      <div className="flex items-center gap-1.5 border border-border rounded px-2 py-1 bg-white">
                        <input
                          type="color"
                          value={a[key] || '#1B6B4A'}
                          onChange={(e) =>
                            updateAppearance({ [key]: e.target.value })
                          }
                          className="w-5 h-5 border-0 p-0 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={a[key] || ''}
                          onChange={(e) =>
                            updateAppearance({ [key]: e.target.value })
                          }
                          className="w-full text-xs font-mono uppercase focus:outline-none"
                        />
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">
                      Background Style
                    </label>
                    <select
                      value={a.backgroundType || 'solid'}
                      onChange={(e) =>
                        updateAppearance({ backgroundType: e.target.value })
                      }
                      className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs"
                    >
                      <option value="solid">Solid Color</option>
                      <option value="gradient">Subtle Gradient</option>
                      <option value="pattern">Pattern / Texture</option>
                      <option value="image">Background Image</option>
                    </select>
                  </div>
                  {a.backgroundType === 'pattern' && (
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">
                        Pattern Preset
                      </label>
                      <select
                        value={a.backgroundPattern || 'dots'}
                        onChange={(e) =>
                          updateAppearance({ backgroundPattern: e.target.value })
                        }
                        className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs"
                      >
                        <option value="dots">Dots</option>
                        <option value="grid">Architectural Grid</option>
                        <option value="diagonal">Diagonal Lines</option>
                      </select>
                    </div>
                  )}
                </div>

                {a.backgroundType === 'image' && (
                  <CardAssetUpload
                    label="Background Image"
                    value={a.backgroundImage}
                    onChange={(asset) =>
                      updateAppearance({ backgroundImage: asset })
                    }
                  />
                )}
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-4">
                {/* Editable Banner Height + Show Banner */}
                <div className="p-3 rounded-lg border border-border bg-surface/30 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="banner-height-range"
                      className="text-xs font-medium text-text-primary"
                    >
                      Banner Height
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={a.showBanner !== false}
                        onChange={(e) =>
                          updateAppearance({ showBanner: e.target.checked })
                        }
                        className="accent-primary"
                      />
                      <span>Show Banner</span>
                    </label>
                  </div>

                  {a.showBanner !== false && (() => {
                    const presetMap = { sm: 112, md: 160, lg: 208 }
                    const currentPx =
                      typeof a.bannerHeight === 'number'
                        ? a.bannerHeight
                        : presetMap[a.bannerHeight] ||
                          (Number.isFinite(Number(a.bannerHeight))
                            ? Number(a.bannerHeight)
                            : 160)
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            id="banner-height-range"
                            type="range"
                            min={60}
                            max={360}
                            step={4}
                            value={currentPx}
                            onChange={(e) =>
                              updateAppearance({
                                bannerHeight: Number(e.target.value),
                              })
                            }
                            className="flex-1 accent-primary cursor-pointer"
                          />
                          <div className="flex items-center gap-1 border border-border rounded bg-white px-2 py-1 w-20">
                            <input
                              type="number"
                              aria-label="Banner Height in pixels"
                              min={60}
                              max={360}
                              value={currentPx}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                if (Number.isFinite(val)) {
                                  updateAppearance({
                                    bannerHeight: Math.min(360, Math.max(60, val)),
                                  })
                                }
                              }}
                              className="w-full text-xs tabular-nums focus:outline-none"
                            />
                            <span className="text-[10px] text-text-tertiary">px</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { label: 'Compact (100px)', value: 100 },
                            { label: 'Standard (160px)', value: 160 },
                            { label: 'Tall (220px)', value: 220 },
                            { label: 'Hero (280px)', value: 280 },
                          ].map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() =>
                                updateAppearance({ bannerHeight: preset.value })
                              }
                              className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                                currentPx === preset.value
                                  ? 'border-primary bg-primary-light text-primary'
                                  : 'border-border bg-white text-text-secondary hover:text-text-primary'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'profileImageShape', label: 'Avatar Shape', opts: ['circle', 'rounded', 'square'] },
                    { key: 'profileImageSize', label: 'Avatar Size', opts: ['sm', 'md', 'lg'] },
                    { key: 'textAlign', label: 'Text Align', opts: ['left', 'center'] },
                    { key: 'sectionSpacing', label: 'Spacing', opts: ['compact', 'comfortable', 'spacious'] },
                    { key: 'buttonStyle', label: 'Button Style', opts: ['filled', 'outlined', 'soft'] },
                    { key: 'buttonShape', label: 'Button Shape', opts: ['rounded', 'pill', 'square'] },
                    { key: 'buttonSize', label: 'Button Size', opts: ['sm', 'md', 'lg'] },
                    { key: 'borderRadius', label: 'Card Radius', opts: ['none', 'sm', 'md', 'lg', 'xl'] },
                    { key: 'cardWidth', label: 'Card Width', opts: ['narrow', 'standard', 'wide'] },
                    { key: 'dividerStyle', label: 'Dividers', opts: ['line', 'subtle', 'none'] },
                  ].map((ctrl) => (
                    <div key={ctrl.key}>
                      <label className="block text-[11px] font-medium text-text-secondary mb-1">
                        {ctrl.label}
                      </label>
                      <select
                        value={a[ctrl.key]}
                        onChange={(e) =>
                          updateAppearance({ [ctrl.key]: e.target.value })
                        }
                        className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs capitalize"
                      >
                        {ctrl.opts.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'visibility' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  ['showProfilePicture', 'Profile Picture'],
                  ['showCoverImage', 'Cover / Banner Image'],
                  ['showCompanyLogo', 'Company Logo'],
                  ['showJobTitle', 'Job Title'],
                  ['showProfession', 'Profession'],
                  ['showCompanyName', 'Company Name'],
                  ['showTagline', 'Tagline'],
                  ['showShortBio', 'Short Biography'],
                  ['showLongBio', 'Long Biography'],
                  ['showLocation', 'Location'],
                  ['showAddress', 'Address'],
                  ['showPhone', 'Primary Phone'],
                  ['showSecondaryPhone', 'Secondary Phone'],
                  ['showEmail', 'Email'],
                  ['showWhatsapp', 'WhatsApp'],
                  ['showWebsite', 'Website'],
                  ['showGoogleMaps', 'Google Maps'],
                  ['showSocialLinks', 'Social Links'],
                  ['showSaveContact', 'Save Contact Button'],
                  ['showCustomSections', 'Custom Sections'],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-md border border-border bg-surface/30 text-xs cursor-pointer"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={v[key] !== false}
                      onChange={(e) => updateVisibility(key, e.target.checked)}
                      className="accent-primary"
                    />
                  </label>
                ))}
              </div>
            )}
            </div>

            {/* Step Navigation Footer */}
            {(() => {
              const currentIdx = EDITOR_TABS.findIndex((t) => t.id === activeTab)
              const prevTab = currentIdx > 0 ? EDITOR_TABS[currentIdx - 1] : null
              const nextTab =
                currentIdx < EDITOR_TABS.length - 1
                  ? EDITOR_TABS[currentIdx + 1]
                  : null
              return (
                <div className="px-5 py-3 border-t border-border bg-surface/30 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={!prevTab}
                    onClick={() => prevTab && setActiveTab(prevTab.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-card text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{prevTab ? prevTab.label : 'Start'}</span>
                  </button>
                  {nextTab ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(nextTab.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-surface border border-border text-text-primary hover:bg-card cursor-pointer"
                    >
                      <span>Next: {nextTab.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      loading={saving}
                      onClick={handleSave}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isNew ? 'Create Card' : 'Save Changes'}
                    </Button>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Right Live Preview */}
        <div className="xl:col-span-5 xl:sticky xl:top-6 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-text-secondary">
              Live Card Preview
            </span>
            <span className="text-text-tertiary capitalize">
              {String(card.templateId || 'minimal-white').replace(/-/g, ' ')} ·{' '}
              {previewDevice}
            </span>
          </div>
          <div className="p-4 bg-surface/50 max-h-[75vh] overflow-y-auto flex justify-center">
            <DigitalCardRenderer
              card={card}
              isPreview
              previewDevice={previewDevice}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
