import { useEffect } from 'react'
import {
  Download,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react'
import { getCardFontStack, loadCardFonts } from '../constants/presets'
import { getTemplateTheme } from './templateThemes'
import CardHeroHeader from '../components/CardHeroHeader'
import CardActionButtons from '../components/CardActionButtons'
import CardSocialLinks from '../components/CardSocialLinks'
import CardCustomSections from '../components/CardCustomSections'

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

const BODY_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
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

const CARD_WIDTHS = {
  narrow: 'max-w-[380px]',
  standard: 'max-w-[460px]',
  wide: 'max-w-[580px]',
}

const SECTION_SPACING = {
  compact: 'space-y-4',
  comfortable: 'space-y-5',
  spacious: 'space-y-7',
}

function getBackdropStyle(a, theme) {
  const overlay = theme.backdropOverlay ? theme.backdropOverlay(a) : {}
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
  return { backgroundColor: a.backgroundColor, ...overlay }
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
  const theme = getTemplateTheme(templateId)

  useEffect(() => {
    loadCardFonts([a.headingFont, a.bodyFont, a.buttonFont])
  }, [a.headingFont, a.bodyFont, a.buttonFont])

  const displayName = p.fullName || card?.name || 'Digital Card'
  const initials =
    displayName
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
    templateId === 'bold-modern' ||
    templateId === 'minimal-white'
      ? a.textAlign === 'center'
      : a.textAlign !== 'left'

  const radiusCls = RADIUS_CLASSES[a.borderRadius || 'lg'] || 'rounded-2xl'
  const spacingCls = SECTION_SPACING[a.sectionSpacing || 'comfortable'] || 'space-y-5'
  const widthCls =
    isPreview && previewDevice === 'mobile'
      ? 'max-w-[360px]'
      : CARD_WIDTHS[a.cardWidth || 'standard'] || 'max-w-[460px]'

  const dividerBorder =
    a.dividerStyle === 'none'
      ? 'border-transparent'
      : a.dividerStyle === 'line'
        ? 'border-current/20'
        : 'border-current/10'

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
  const coverUrl = v.showCoverImage !== false ? safeHref(p.coverImage?.url) : ''
  const avatarUrl =
    v.showProfilePicture !== false ? safeHref(p.profilePicture?.url) : ''
  const companyLogoUrl =
    v.showCompanyLogo !== false ? safeHref(p.companyLogo?.url) : ''

  const cardContainerStyle = theme.cardFrameStyle(a)

  const mobileRadiusCls = {
    none: 'rounded-none',
    sm: 'rounded-none sm:rounded-md',
    md: 'rounded-none sm:rounded-xl',
    lg: 'rounded-none sm:rounded-2xl',
    xl: 'rounded-none sm:rounded-3xl',
    '2xl': 'rounded-none sm:rounded-3xl',
    full: 'rounded-none sm:rounded-[28px]',
  }[a.borderRadius] || 'rounded-none sm:rounded-2xl'

  const mobileWidthCls = {
    narrow: 'sm:max-w-[380px]',
    compact: 'sm:max-w-[380px]',
    standard: 'sm:max-w-[460px]',
    wide: 'sm:max-w-[580px]',
  }[a.cardWidth] || 'sm:max-w-[460px]'

  const isNeo = templateId === 'bold-modern'

  return (
    <div
      style={{ ...getBackdropStyle(a, theme), ...bodyStyle }}
      className={`w-full overflow-x-hidden ${
        isPreview
          ? 'p-4 rounded-xl'
          : 'min-h-screen p-0 sm:py-10 sm:px-4'
      } flex flex-col items-center justify-start`}
    >
      <article
        style={cardContainerStyle}
        className={`card-reveal w-full ${
          isPreview
            ? `${widthCls} ${radiusCls} ${isNeo ? 'border-2' : 'border'}`
            : `${mobileWidthCls} ${mobileRadiusCls} ${
                isNeo ? 'border-0 sm:border-2' : 'border-0 sm:border'
              }`
        } overflow-hidden transition-all`}
      >
        {/* Template-specific Hero & Identity Lockup */}
        <CardHeroHeader
          card={card}
          theme={theme}
          displayName={displayName}
          initials={initials}
          coverUrl={coverUrl}
          avatarUrl={avatarUrl}
          companyLogoUrl={companyLogoUrl}
          headingStyle={headingStyle}
        />

        {/* Card Body */}
        <div
          className={`px-5 pb-6 pt-4 sm:px-7 sm:pb-7 ${spacingCls} ${LINE_HEIGHTS[a.lineHeight || 'normal']} ${LETTER_SPACINGS[a.letterSpacing || 'normal']} ${BODY_SIZES[a.bodySize || 'md']}`}
        >
          {/* Bio */}
          {((v.showShortBio !== false && p.shortBio) ||
            (v.showLongBio !== false && p.longBio)) && (
            <div
              className={`pt-4 border-t ${dividerBorder} ${isCentered ? 'text-center' : 'text-left'} space-y-2`}
            >
              {v.showShortBio !== false && p.shortBio && (
                <p className="opacity-90 break-words leading-relaxed">
                  {p.shortBio}
                </p>
              )}
              {v.showLongBio !== false && p.longBio && (
                <p className="text-xs opacity-75 whitespace-pre-line break-words leading-relaxed">
                  {p.longBio}
                </p>
              )}
            </div>
          )}

          {/* Primary & Secondary Contact Actions */}
          {orderedActions.length > 0 && (
            <div className={`pt-4 border-t ${dividerBorder}`}>
              <CardActionButtons
                orderedActions={orderedActions}
                actionMeta={actionMeta}
                a={a}
                theme={theme}
                buttonFontStyle={buttonFontStyle}
                isPreview={isPreview}
                onActionClick={onActionClick}
                onSaveContact={onSaveContact}
              />
            </div>
          )}

          {/* Brand-Aware Social Links */}
          {visibleSocials.length > 0 && (
            <div className={`pt-4 border-t ${dividerBorder}`}>
              <CardSocialLinks
                visibleSocials={visibleSocials}
                socialStyle={socialStyle}
                isCentered={isCentered}
                a={a}
                theme={theme}
                headingStyle={headingStyle}
                isPreview={isPreview}
                onActionClick={onActionClick}
              />
            </div>
          )}

          {/* Tailored Custom Sections */}
          <CardCustomSections
            visibleSections={visibleSections}
            a={a}
            theme={theme}
            dividerBorder={dividerBorder}
            headingStyle={headingStyle}
            isPreview={isPreview}
          />

          {/* Address Footer */}
          {v.showAddress !== false && (c.businessAddress || p.address) && (
            <div
              className={`pt-4 border-t ${dividerBorder} text-xs opacity-70 flex items-start gap-2 ${
                isCentered ? 'justify-center text-center' : ''
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="break-words">
                {c.businessAddress || p.address}
              </span>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
