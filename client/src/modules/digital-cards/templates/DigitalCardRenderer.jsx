import { useEffect } from 'react'
import {
  Briefcase,
  Building2,
  Download,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from 'lucide-react'
import { getCardFontStack, loadCardFonts } from '../constants/presets'

function safeHref(url) {
  const s = String(url || '').trim()
  return /^https?:\/\//i.test(s) ? s : ''
}

function buildWhatsAppHref(number, message) {
  const digits = String(number || '').replace(/[^\d]/g, '')
  if (!digits) return ''
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

const HEADING_SIZES = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-[26px]',
  xl: 'text-3xl',
}

const BODY_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const FONT_WEIGHTS = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const LINE_HEIGHTS = {
  tight: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
}

const LETTER_SPACINGS = {
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
}

const RADIUS_CLASSES = {
  none: 'rounded-none',
  sm: 'rounded-md',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
}

const BTN_SHAPES = {
  rounded: 'rounded-lg',
  pill: 'rounded-full',
  square: 'rounded-none',
}

const BTN_SIZES = {
  sm: 'py-2 px-3 text-xs',
  md: 'py-2.5 px-4 text-sm',
  lg: 'py-3 px-5 text-base',
}

const AVATAR_SIZES = {
  sm: 'w-20 h-20',
  md: 'w-24 h-24',
  lg: 'w-28 h-28',
}

const AVATAR_SHAPES = {
  circle: 'rounded-full',
  rounded: 'rounded-2xl',
  square: 'rounded-md',
}

const BANNER_HEIGHTS = {
  sm: 'h-24',
  md: 'h-36',
  lg: 'h-48',
}

const CARD_WIDTHS = {
  narrow: 'max-w-[380px]',
  standard: 'max-w-[460px]',
  wide: 'max-w-[580px]',
}

const SECTION_SPACING = {
  compact: 'space-y-3',
  comfortable: 'space-y-5',
  spacious: 'space-y-7',
}

function getBackdropStyle(a) {
  if (a.backgroundType === 'image' && safeHref(a.backgroundImage?.url)) {
    return {
      backgroundColor: a.backgroundColor,
      backgroundImage: `url(${a.backgroundImage.url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  if (a.backgroundType === 'gradient') {
    return {
      background:
        a.backgroundGradient ||
        `linear-gradient(135deg, ${a.primaryColor} 0%, ${a.secondaryColor} 100%)`,
    }
  }
  if (a.backgroundType === 'pattern' && a.backgroundPattern !== 'none') {
    const dotColor = a.themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
    if (a.backgroundPattern === 'dots') {
      return {
        backgroundColor: a.backgroundColor,
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
      }
    }
    if (a.backgroundPattern === 'grid') {
      return {
        backgroundColor: a.backgroundColor,
        backgroundImage: `linear-gradient(to right, ${dotColor} 1px, transparent 1px), linear-gradient(to bottom, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }
    }
    if (a.backgroundPattern === 'diagonal') {
      return {
        backgroundColor: a.backgroundColor,
        backgroundImage: `repeating-linear-gradient(45deg, ${dotColor}, ${dotColor} 1px, transparent 1px, transparent 12px)`,
      }
    }
  }
  return { backgroundColor: a.backgroundColor }
}

export default function DigitalCardRenderer({
  card,
  isPreview = false,
  previewDevice = 'mobile',
  onActionClick,
  onSaveContact,
}) {
  const a = card?.appearance || {}
  const p = card?.personalInformation || {}
  const c = card?.contactInformation || {}
  const v = card?.visibilitySettings || {}
  const templateId = card?.templateId || 'minimal-white'

  useEffect(() => {
    loadCardFonts([a.headingFont, a.bodyFont, a.buttonFont])
  }, [a.headingFont, a.bodyFont, a.buttonFont])

  const displayName = p.fullName || card?.name || 'Digital Card'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'DC'

  const headingStyle = { fontFamily: getCardFontStack(a.headingFont) }
  const bodyStyle = { fontFamily: getCardFontStack(a.bodyFont) }
  const buttonFontStyle = { fontFamily: getCardFontStack(a.buttonFont) }

  const isCentered =
    templateId === 'corporate-professional' ||
    templateId === 'creative-portfolio' ||
    templateId === 'bold-modern'
      ? a.textAlign === 'center'
      : a.textAlign !== 'left'

  const radiusCls = RADIUS_CLASSES[a.borderRadius || 'lg'] || 'rounded-2xl'
  const btnShapeCls = BTN_SHAPES[a.buttonShape || 'rounded'] || 'rounded-lg'
  const btnSizeCls = BTN_SIZES[a.buttonSize || 'md'] || 'py-2.5 px-4 text-sm'
  const spacingCls = SECTION_SPACING[a.sectionSpacing || 'comfortable'] || 'space-y-5'
  const widthCls = isPreview && previewDevice === 'mobile'
    ? 'max-w-[360px]'
    : CARD_WIDTHS[a.cardWidth || 'standard'] || 'max-w-[460px]'

  const dividerBorder =
    a.dividerStyle === 'none'
      ? 'border-transparent'
      : a.dividerStyle === 'line'
        ? 'border-current/20'
        : 'border-current/10'

  const getButtonStyleObj = (isPrimary = false) => {
    if (a.buttonStyle === 'outlined') {
      return {
        ...buttonFontStyle,
        backgroundColor: 'transparent',
        color: a.buttonBgColor || a.primaryColor,
        border: `1.5px solid ${a.buttonBgColor || a.primaryColor}`,
      }
    }
    if (a.buttonStyle === 'soft') {
      return {
        ...buttonFontStyle,
        backgroundColor: `${a.buttonBgColor || a.primaryColor}1A`,
        color: a.buttonBgColor || a.primaryColor,
        border: `1px solid ${a.buttonBgColor || a.primaryColor}33`,
      }
    }
    return {
      ...buttonFontStyle,
      backgroundColor: isPrimary
        ? a.buttonBgColor || a.primaryColor
        : `${a.buttonBgColor || a.primaryColor}E6`,
      color: a.buttonTextColor || '#FFFFFF',
      border: '1px solid transparent',
    }
  }

  const resolvedWebsite = safeHref(c.website || p.websiteUrl)
  const resolvedMaps = safeHref(c.googleMapsUrl || p.googleMapsUrl)
  const whatsappUrl = buildWhatsAppHref(c.whatsappNumber, c.whatsappMessage)

  const actionMeta = {
    call: {
      available: v.showPhone !== false && Boolean(c.phone),
      href: `tel:${String(c.phone || '').replace(/\s+/g, '')}`,
      icon: Phone,
      event: 'callClicks',
      external: false,
    },
    whatsapp: {
      available: v.showWhatsapp !== false && Boolean(whatsappUrl),
      href: whatsappUrl,
      icon: MessageCircle,
      event: 'whatsappClicks',
      external: true,
    },
    email: {
      available: v.showEmail !== false && Boolean(c.email),
      href: `mailto:${c.email || ''}`,
      icon: Mail,
      event: 'emailClicks',
      external: false,
    },
    website: {
      available: v.showWebsite !== false && Boolean(resolvedWebsite),
      href: resolvedWebsite,
      icon: Globe,
      event: 'websiteClicks',
      external: true,
    },
    directions: {
      available: v.showGoogleMaps !== false && Boolean(resolvedMaps),
      href: resolvedMaps,
      icon: MapPin,
      event: 'directionsClicks',
      external: true,
    },
    save_contact: {
      available: v.showSaveContact !== false,
      isSave: true,
      icon: Download,
      event: 'saveContactClicks',
    },
  }

  const orderedActions = [...(c.actions || [])]
    .filter((act) => act.enabled !== false && actionMeta[act.type]?.available)
    .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))

  const visibleSocials =
    v.showSocialLinks !== false
      ? (card?.socialLinks?.items || []).filter(
          (s) => s.enabled !== false && safeHref(s.url),
        )
      : []

  const visibleSections =
    v.showCustomSections !== false
      ? [...(card?.customSections || [])]
          .filter((s) => s.visible !== false)
          .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
      : []

  const socialStyle = card?.socialLinks?.displayStyle || 'icon_label'
  const showBanner = a.showBanner !== false
  const coverUrl = v.showCoverImage !== false ? safeHref(p.coverImage?.url) : ''
  const avatarUrl =
    v.showProfilePicture !== false ? safeHref(p.profilePicture?.url) : ''
  const companyLogoUrl =
    v.showCompanyLogo !== false ? safeHref(p.companyLogo?.url) : ''

  // Template-specific header banner & container styling
  const isGlass = templateId === 'glass-tech'
  const isBold = templateId === 'bold-modern'
  const isCreative = templateId === 'creative-portfolio'
  const isElegant = templateId === 'elegant-personal'

  const bannerBg = coverUrl
    ? {
        backgroundImage: `url(${coverUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : isBold
      ? { backgroundColor: a.primaryColor || '#DC2626' }
      : {
          background: `linear-gradient(135deg, ${a.primaryColor || '#1B6B4A'} 0%, ${a.secondaryColor || '#0F172A'} 100%)`,
        }

  const cardContainerStyle = {
    backgroundColor: isGlass ? `${a.cardBgColor || '#1E293B'}CC` : a.cardBgColor || '#FFFFFF',
    color: a.textColor || '#171716',
    borderColor: a.borderColor || '#E5E5E3',
    ...(isGlass ? { backdropFilter: 'blur(16px)' } : {}),
  }

  const mobileRadiusCls = {
    none: 'rounded-none',
    md: 'rounded-none sm:rounded-lg',
    xl: 'rounded-none sm:rounded-2xl',
    '2xl': 'rounded-none sm:rounded-3xl',
    full: 'rounded-none sm:rounded-[28px]',
  }[a.borderRadius] || 'rounded-none sm:rounded-2xl'

  const mobileWidthCls = {
    compact: 'sm:max-w-[380px]',
    standard: 'sm:max-w-[460px]',
    wide: 'sm:max-w-[560px]',
  }[a.cardWidth] || 'sm:max-w-[460px]'

  return (
    <div
      style={{ ...getBackdropStyle(a), ...bodyStyle }}
      className={`w-full ${isPreview ? 'p-4 rounded-xl' : 'min-h-screen p-0 sm:py-10 sm:px-4'} flex flex-col items-center justify-start`}
    >
      <div
        style={cardContainerStyle}
        className={`w-full ${isPreview ? `${widthCls} ${radiusCls} border shadow-sm` : `${mobileWidthCls} ${mobileRadiusCls} border-0 sm:border sm:shadow-sm`} overflow-hidden transition-all`}
      >
        {/* Top Banner (Template-specific treatment) */}
        {showBanner && (
          <div
            style={bannerBg}
            className={`w-full ${BANNER_HEIGHTS[a.bannerHeight || 'md']} relative`}
          >
            {companyLogoUrl && (
              <img
                src={companyLogoUrl}
                alt={p.companyName || 'Company logo'}
                className="absolute top-3 right-3 h-9 w-9 object-contain rounded-md bg-white/90 p-1 shadow-xs"
              />
            )}
          </div>
        )}

        {/* Card Body */}
        <div
          className={`p-5 sm:p-7 ${spacingCls} ${LINE_HEIGHTS[a.lineHeight || 'normal']} ${LETTER_SPACINGS[a.letterSpacing || 'normal']} ${BODY_SIZES[a.bodySize || 'md']}`}
        >
          {/* Header / Identity */}
          <div
            className={`flex flex-col ${
              isCentered ? 'items-center text-center' : 'items-start text-left'
            } ${showBanner && avatarUrl ? '-mt-14 sm:-mt-16 relative z-10' : ''}`}
          >
            {v.showProfilePicture !== false && (
              <div
                className={`${AVATAR_SIZES[a.profileImageSize || 'md']} ${AVATAR_SHAPES[a.profileImageShape || 'circle']} overflow-hidden border-4 flex items-center justify-center shrink-0 mb-3 shadow-sm`}
                style={{
                  borderColor: a.cardBgColor || '#FFFFFF',
                  backgroundColor: `${a.primaryColor || '#1B6B4A'}20`,
                  color: a.primaryColor || '#1B6B4A',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold" style={headingStyle}>
                    {initials}
                  </span>
                )}
              </div>
            )}

            {isElegant && (
              <div
                className="w-10 h-0.5 mb-2"
                style={{ backgroundColor: a.accentColor || a.primaryColor }}
              />
            )}

            <h1
              style={headingStyle}
              className={`${HEADING_SIZES[a.headingSize || 'lg']} ${FONT_WEIGHTS[a.fontWeight || 'semibold']} tracking-tight`}
            >
              {displayName}
            </h1>

            {((v.showJobTitle !== false && p.jobTitle) ||
              (v.showProfession !== false && p.profession)) && (
              <p
                className="text-sm font-medium mt-1 flex items-center gap-1.5 opacity-90"
                style={{ color: a.accentColor || a.primaryColor }}
              >
                {!isCentered && <Briefcase className="w-3.5 h-3.5 shrink-0" />}
                <span>
                  {[
                    v.showJobTitle !== false ? p.jobTitle : '',
                    v.showProfession !== false ? p.profession : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </p>
            )}

            {v.showCompanyName !== false && p.companyName && (
              <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>{p.companyName}</span>
              </p>
            )}

            {v.showTagline !== false && p.tagline && (
              <p className="text-xs italic opacity-75 mt-2">{p.tagline}</p>
            )}

            {v.showLocation !== false && p.location && (
              <p className="text-xs opacity-70 mt-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{p.location}</span>
              </p>
            )}
          </div>

          {/* Bio */}
          {((v.showShortBio !== false && p.shortBio) ||
            (v.showLongBio !== false && p.longBio)) && (
            <div
              className={`pt-4 border-t ${dividerBorder} ${isCentered ? 'text-center' : 'text-left'} space-y-2`}
            >
              {v.showShortBio !== false && p.shortBio && (
                <p className="opacity-90">{p.shortBio}</p>
              )}
              {v.showLongBio !== false && p.longBio && (
                <p className="text-xs opacity-75 whitespace-pre-line">
                  {p.longBio}
                </p>
              )}
            </div>
          )}

          {/* Primary Action Buttons */}
          {orderedActions.length > 0 && (
            <div
              className={`pt-4 border-t ${dividerBorder} ${
                isCreative || isBold
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'
                  : 'grid grid-cols-1 gap-2.5'
              }`}
            >
              {orderedActions.map((act, idx) => {
                const meta = actionMeta[act.type]
                const Icon = meta.icon
                const label = act.label || act.type
                if (meta.isSave) {
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        onActionClick?.(meta.event)
                        onSaveContact?.()
                      }}
                      style={getButtonStyleObj(true)}
                      className={`w-full ${btnSizeCls} ${btnShapeCls} font-medium inline-flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90 ${
                        isCreative || isBold ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  )
                }

                return (
                  <a
                    key={act.id}
                    href={isPreview ? undefined : meta.href}
                    target={meta.external && !isPreview ? '_blank' : undefined}
                    rel={meta.external ? 'noopener noreferrer' : undefined}
                    onClick={(e) => {
                      if (isPreview) e.preventDefault()
                      onActionClick?.(meta.event)
                    }}
                    style={getButtonStyleObj(idx === 0)}
                    className={`w-full ${btnSizeCls} ${btnShapeCls} font-medium inline-flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </a>
                )
              })}
            </div>
          )}

          {/* Social Links */}
          {visibleSocials.length > 0 && (
            <div className={`pt-4 border-t ${dividerBorder} space-y-2.5`}>
              {socialStyle === 'section' && (
                <p
                  className="text-xs font-semibold uppercase tracking-wider opacity-70"
                  style={headingStyle}
                >
                  Connect
                </p>
              )}
              <div
                className={
                  socialStyle === 'section'
                    ? 'grid grid-cols-1 gap-2'
                    : `flex flex-wrap gap-2 ${isCentered ? 'justify-center' : 'justify-start'}`
                }
              >
                {visibleSocials.map((s) => {
                  const text = s.label || s.platform
                  return (
                    <a
                      key={s.id}
                      href={isPreview ? undefined : safeHref(s.url)}
                      target={isPreview ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (isPreview) e.preventDefault()
                        onActionClick?.('socialClicks', s.platform)
                      }}
                      title={text}
                      style={{
                        borderColor: a.borderColor || '#E5E5E3',
                        color: a.textColor,
                      }}
                      className={`inline-flex items-center gap-1.5 border ${btnShapeCls} text-xs font-medium transition-opacity hover:opacity-80 ${
                        socialStyle === 'icon_only'
                          ? 'p-2.5'
                          : socialStyle === 'compact_button'
                            ? 'px-2.5 py-1.5'
                            : socialStyle === 'section'
                              ? 'px-3.5 py-2.5 justify-between'
                              : 'px-3 py-2'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <Share2 className="w-3.5 h-3.5 shrink-0" />
                        {socialStyle !== 'icon_only' && <span>{text}</span>}
                      </span>
                      {socialStyle === 'section' && (
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom Content Sections */}
          {visibleSections.map((sec) => (
            <div key={sec.id} className={`pt-4 border-t ${dividerBorder} space-y-2.5`}>
              {sec.title && (
                <div>
                  <h2
                    style={headingStyle}
                    className="text-sm font-semibold tracking-tight"
                  >
                    {sec.title}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-xs opacity-70">{sec.subtitle}</p>
                  )}
                </div>
              )}

              {sec.content && (
                <p className="text-xs opacity-85 whitespace-pre-line">
                  {sec.content}
                </p>
              )}

              {sec.items?.length > 0 && (
                <div
                  className={
                    sec.type === 'skills'
                      ? 'flex flex-wrap gap-1.5'
                      : sec.type === 'gallery'
                        ? 'grid grid-cols-2 gap-2.5'
                        : 'space-y-2'
                  }
                >
                  {sec.items.map((item) => {
                    if (sec.type === 'skills') {
                      return (
                        <span
                          key={item.id}
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${a.accentColor || a.primaryColor}1A`,
                            color: a.accentColor || a.primaryColor,
                          }}
                        >
                          {item.title}
                        </span>
                      )
                    }

                    const itemUrl = safeHref(item.url)
                    return (
                      <div
                        key={item.id}
                        style={{ borderColor: a.borderColor || '#E5E5E3' }}
                        className="rounded-lg border p-3 space-y-1"
                      >
                        {safeHref(item.image?.url) && (
                          <img
                            src={item.image.url}
                            alt={item.title || 'Section image'}
                            className="w-full h-28 object-cover rounded-md mb-2"
                          />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold">{item.title}</p>
                          {itemUrl && (
                            <a
                              href={isPreview ? undefined : itemUrl}
                              target={isPreview ? undefined : '_blank'}
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (isPreview) e.preventDefault()
                              }}
                              style={{ color: a.accentColor || a.primaryColor }}
                              className="text-xs inline-flex items-center gap-1 shrink-0 hover:underline"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs opacity-75">{item.description}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Address footer */}
          {v.showAddress !== false && (c.businessAddress || p.address) && (
            <div className={`pt-4 border-t ${dividerBorder} text-xs opacity-70 flex items-start gap-1.5`}>
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{c.businessAddress || p.address}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
