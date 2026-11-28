import { Briefcase, Building2, MapPin, Sparkles } from 'lucide-react'

const HEADING_SIZES = {
  sm: 'text-xl sm:text-2xl',
  md: 'text-2xl sm:text-[26px]',
  lg: 'text-[26px] sm:text-[30px]',
  xl: 'text-3xl sm:text-[34px]',
}

const FONT_WEIGHTS = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
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

const BANNER_HEIGHT_PRESETS = {
  sm: 112,
  md: 160,
  lg: 208,
}

function getBannerHeightPx(bannerHeight) {
  if (typeof bannerHeight === 'number' && Number.isFinite(bannerHeight)) {
    return Math.min(360, Math.max(60, Math.round(bannerHeight)))
  }
  const parsed = Number(bannerHeight)
  if (Number.isFinite(parsed) && parsed >= 60) {
    return Math.min(360, Math.round(parsed))
  }
  return BANNER_HEIGHT_PRESETS[bannerHeight] || 160
}

function AvatarBlock({
  avatarUrl,
  displayName,
  initials,
  a,
  headingStyle,
  borderColor,
  extraClass = '',
  ringColor,
}) {
  const sizeCls = AVATAR_SIZES[a.profileImageSize || 'md'] || 'w-24 h-24'
  const shapeCls = AVATAR_SHAPES[a.profileImageShape || 'circle'] || 'rounded-full'

  return (
    <div
      className={`${sizeCls} ${shapeCls} overflow-hidden border-4 flex items-center justify-center shrink-0 relative ${extraClass}`}
      style={{
        borderColor: borderColor || a.cardBgColor || '#FFFFFF',
        backgroundColor: `${a.primaryColor || '#1B6B4A'}20`,
        color: a.primaryColor || '#1B6B4A',
        boxShadow: ringColor
          ? `0 0 0 1px ${ringColor}, 0 14px 30px -10px rgba(0,0,0,0.3)`
          : '0 10px 25px -8px rgba(0,0,0,0.18)',
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-xl font-bold select-none" style={headingStyle}>
          {initials}
        </span>
      )}
    </div>
  )
}

function IdentityMeta({ p, v, a, centered, theme }) {
  const roleLine = [
    v.showJobTitle !== false ? p.jobTitle : '',
    v.showProfession !== false ? p.profession : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={`min-w-0 space-y-1.5 ${centered ? 'flex flex-col items-center text-center' : 'text-left'}`}
    >
      {roleLine && (
        <p
          className="text-sm font-medium flex items-center gap-1.5 break-words"
          style={{ color: a.accentColor || a.primaryColor }}
        >
          {!centered && <Briefcase className="w-3.5 h-3.5 shrink-0 opacity-85" />}
          <span>{roleLine}</span>
        </p>
      )}

      {v.showCompanyName !== false && p.companyName && (
        <div
          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border max-w-full ${
            theme.isDark ? 'bg-white/[0.05]' : 'bg-black/[0.03]'
          }`}
          style={{ borderColor: theme.subtleBorderColor(a) }}
        >
          <Building2 className="w-3 h-3 shrink-0 opacity-75" />
          <span className="truncate font-medium opacity-85">{p.companyName}</span>
        </div>
      )}

      {v.showTagline !== false && p.tagline && (
        <p className="text-xs italic opacity-75 pt-0.5 max-w-md break-words">
          “{p.tagline}”
        </p>
      )}

      {v.showLocation !== false && p.location && (
        <p className="text-xs opacity-70 flex items-center gap-1 pt-0.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="break-words">{p.location}</span>
        </p>
      )}
    </div>
  )
}

export default function CardHeroHeader({
  card,
  theme,
  displayName,
  initials,
  coverUrl,
  avatarUrl,
  companyLogoUrl,
  headingStyle,
}) {
  const a = card?.appearance || {}
  const p = card?.personalInformation || {}
  const v = card?.visibilitySettings || {}
  const showBanner = a.showBanner !== false
  const bannerHeightPx = getBannerHeightPx(a.bannerHeight)
  const headingSizeCls = HEADING_SIZES[a.headingSize || 'lg'] || 'text-[26px] sm:text-[30px]'
  const fontWeightCls = FONT_WEIGHTS[a.fontWeight || 'semibold'] || 'font-semibold'

  const bannerBackground = coverUrl
    ? {
        backgroundImage: `url(${coverUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : theme.heroLayout === 'neo_block'
      ? { backgroundColor: a.primaryColor || '#DC2626' }
      : theme.heroLayout === 'luxury_noir'
        ? {
            background: `radial-gradient(circle at 50% 25%, ${a.accentColor || '#D4AF37'}2E 0%, #16161B 68%, #0C0C0F 100%)`,
          }
        : theme.heroLayout === 'aurora_layered'
          ? {
              background: `linear-gradient(135deg, ${a.primaryColor || '#4F46E5'} 0%, ${a.secondaryColor || '#06B6D4'} 100%)`,
            }
          : theme.heroLayout === 'glass_floating'
            ? {
                background: `linear-gradient(135deg, ${a.primaryColor || '#38BDF8'}55 0%, ${a.secondaryColor || '#818CF8'}45 100%)`,
              }
            : {
                background: `linear-gradient(135deg, ${a.primaryColor || '#1B6B4A'} 0%, ${a.secondaryColor || '#0F172A'} 100%)`,
              }

  const CompanyLogoBadge = companyLogoUrl ? (
    <div className="h-10 w-10 rounded-lg bg-white/95 p-1.5 shadow-sm border border-black/5 flex items-center justify-center shrink-0">
      <img
        src={companyLogoUrl}
        alt={p.companyName || 'Company logo'}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  ) : null

  // ── 1. Executive Elite / Corporate Split Lockup ──
  if (theme.heroLayout === 'executive_split') {
    const isCentered = a.textAlign === 'center'
    return (
      <div>
        {showBanner && (
          <div style={{ ...bannerBackground, height: `${bannerHeightPx}px` }} className="w-full relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.45), transparent 60%)' }}
            />
            {CompanyLogoBadge && (
              <div className="absolute top-3 right-3">{CompanyLogoBadge}</div>
            )}
          </div>
        )}
        <div className="px-5 sm:px-7 pt-5">
          <div
            className={`flex ${
              isCentered
                ? 'flex-col items-center text-center'
                : 'flex-col sm:flex-row sm:items-end gap-4'
            } ${showBanner && v.showProfilePicture !== false ? '-mt-14 sm:-mt-14 relative z-10' : ''}`}
          >
            {v.showProfilePicture !== false && (
              <AvatarBlock
                avatarUrl={avatarUrl}
                displayName={displayName}
                initials={initials}
                a={a}
                headingStyle={headingStyle}
                borderColor={a.cardBgColor || '#FFFFFF'}
              />
            )}
            <div className={`min-w-0 flex-1 ${isCentered ? 'mt-2' : 'pb-0.5'}`}>
              <div
                className={`h-1 w-8 rounded-full mb-2 ${isCentered ? 'mx-auto' : ''}`}
                style={{ backgroundColor: a.primaryColor || '#1E3A8A' }}
              />
              <h1
                style={headingStyle}
                className={`${headingSizeCls} ${fontWeightCls} ${theme.defaultHeadingTracking} break-words leading-tight`}
              >
                {displayName}
              </h1>
            </div>
            {!showBanner && CompanyLogoBadge}
          </div>
          <div className="mt-3">
            <IdentityMeta p={p} v={v} a={a} centered={isCentered} theme={theme} />
          </div>
        </div>
      </div>
    )
  }

  // ── 2. Creative Studio Asymmetric Composition ──
  if (theme.heroLayout === 'creative_studio') {
    const isCentered = a.textAlign === 'center'
    return (
      <div>
        {showBanner && (
          <div style={{ ...bannerBackground, height: `${bannerHeightPx}px` }} className="w-full relative overflow-hidden">
            <div
              className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full opacity-25"
              style={{ backgroundColor: a.accentColor || '#EA580C' }}
            />
            {CompanyLogoBadge && (
              <div className="absolute top-3 right-3">{CompanyLogoBadge}</div>
            )}
          </div>
        )}
        <div className="px-5 sm:px-7 pt-5">
          <div
            className={`flex flex-col ${
              isCentered ? 'items-center text-center' : 'items-start text-left'
            } ${showBanner && v.showProfilePicture !== false ? '-mt-14 relative z-10' : ''}`}
          >
            <div className={`flex items-end justify-between w-full ${isCentered ? 'justify-center' : ''}`}>
              {v.showProfilePicture !== false && (
                <AvatarBlock
                  avatarUrl={avatarUrl}
                  displayName={displayName}
                  initials={initials}
                  a={a}
                  headingStyle={headingStyle}
                  borderColor={a.cardBgColor || '#FFFFFF'}
                  ringColor={`${a.primaryColor || '#EA580C'}40`}
                />
              )}
              {!isCentered && !showBanner && CompanyLogoBadge}
            </div>

            {p.profession && v.showProfession !== false && (
              <span
                className={`${theme.defaultEyebrowClass} mt-3 px-2.5 py-0.5 rounded-full`}
                style={{
                  backgroundColor: `${a.primaryColor || '#EA580C'}18`,
                  color: a.primaryColor || '#EA580C',
                }}
              >
                {p.profession}
              </span>
            )}

            <h1
              style={headingStyle}
              className={`${headingSizeCls} ${fontWeightCls} ${theme.defaultHeadingTracking} mt-2 break-words leading-[1.1]`}
            >
              {displayName}
            </h1>

            <div className="mt-2 w-full">
              <IdentityMeta p={p} v={v} a={a} centered={isCentered} theme={theme} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 3. Neo Modern Geometric Block ──
  if (theme.heroLayout === 'neo_block') {
    const isCentered = a.textAlign === 'center'
    return (
      <div>
        {showBanner && (
          <div
            style={{
              ...bannerBackground,
              height: `${bannerHeightPx}px`,
              borderBottom: `3px solid ${a.secondaryColor || '#111827'}`,
            }}
            className="w-full relative overflow-hidden"
          >
            {CompanyLogoBadge && (
              <div className="absolute top-3 right-3">{CompanyLogoBadge}</div>
            )}
          </div>
        )}
        <div className="px-5 sm:px-7 pt-5">
          <div
            className={`flex flex-col ${
              isCentered ? 'items-center text-center' : 'items-start text-left'
            } ${showBanner && v.showProfilePicture !== false ? '-mt-14 relative z-10' : ''}`}
          >
            {v.showProfilePicture !== false && (
              <AvatarBlock
                avatarUrl={avatarUrl}
                displayName={displayName}
                initials={initials}
                a={a}
                headingStyle={headingStyle}
                borderColor={a.secondaryColor || '#111827'}
                extraClass="mb-3"
              />
            )}
            <h1
              style={headingStyle}
              className={`${headingSizeCls} font-bold ${theme.defaultHeadingTracking} break-words leading-tight`}
            >
              {displayName}
            </h1>
            <div className="mt-2 w-full">
              <IdentityMeta p={p} v={v} a={a} centered={isCentered} theme={theme} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 4. Modern Editorial Asymmetric Header ──
  if (theme.heroLayout === 'editorial_asymmetric') {
    const isCentered = a.textAlign === 'center'
    return (
      <div>
        {showBanner && (
          <div style={{ ...bannerBackground, height: `${bannerHeightPx}px` }} className="w-full relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.22))' }}
            />
            {CompanyLogoBadge && (
              <div className="absolute top-3 right-3">{CompanyLogoBadge}</div>
            )}
          </div>
        )}
        <div className="px-5 sm:px-7 pt-5">
          <div
            className={`flex flex-col ${
              isCentered ? 'items-center text-center' : 'items-start text-left'
            } ${showBanner && v.showProfilePicture !== false ? '-mt-14 relative z-10' : ''}`}
          >
            {v.showProfilePicture !== false && (
              <AvatarBlock
                avatarUrl={avatarUrl}
                displayName={displayName}
                initials={initials}
                a={a}
                headingStyle={headingStyle}
                borderColor={a.cardBgColor || '#FFFFFF'}
                extraClass="mb-3"
              />
            )}
            <h1
              style={headingStyle}
              className={`${headingSizeCls} ${fontWeightCls} ${theme.defaultHeadingTracking} break-words leading-[1.12]`}
            >
              {displayName}
            </h1>
            <div className="mt-2 w-full">
              <IdentityMeta p={p} v={v} a={a} centered={isCentered} theme={theme} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 5. Luxury Noir, Aurora Layered, Elegant Framed & Glass Floating ──
  const isCentered = a.textAlign !== 'left'
  const isLuxury = theme.heroLayout === 'luxury_noir'
  const isAurora = theme.heroLayout === 'aurora_layered'
  const isGlass = theme.heroLayout === 'glass_floating'
  const isElegant = theme.heroLayout === 'elegant_framed'

  return (
    <div>
      {showBanner && (
        <div style={{ ...bannerBackground, height: `${bannerHeightPx}px` }} className="w-full relative overflow-hidden">
          {isLuxury && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(13,13,16,0.92) 0%, rgba(13,13,16,0.25) 60%, transparent 100%)',
              }}
            />
          )}
          {isAurora && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 55%)',
              }}
            />
          )}
          {isGlass && (
            <div
              className="absolute inset-0 border-b border-white/10"
              style={{
                background:
                  'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 50%)',
              }}
            />
          )}
          {CompanyLogoBadge && (
            <div className="absolute top-3 right-3">{CompanyLogoBadge}</div>
          )}
        </div>
      )}

      <div className="px-5 sm:px-7 pt-5">
        <div
          className={`flex flex-col ${
            isCentered ? 'items-center text-center' : 'items-start text-left'
          } ${showBanner && v.showProfilePicture !== false ? '-mt-16 relative z-10' : ''}`}
        >
          {v.showProfilePicture !== false && (
            <AvatarBlock
              avatarUrl={avatarUrl}
              displayName={displayName}
              initials={initials}
              a={a}
              headingStyle={headingStyle}
              borderColor={
                isLuxury
                  ? '#141417'
                  : isGlass
                    ? 'rgba(255,255,255,0.28)'
                    : a.cardBgColor || '#FFFFFF'
              }
              ringColor={
                isLuxury
                  ? `${a.accentColor || '#D4AF37'}99`
                  : isGlass
                    ? `${a.primaryColor || '#38BDF8'}88`
                    : isElegant
                      ? `${a.accentColor || '#7C2D12'}44`
                      : undefined
              }
              extraClass="mb-3"
            />
          )}

          {isElegant && (
            <div
              className={`flex items-center gap-2 mb-2 ${isCentered ? 'justify-center' : ''}`}
            >
              <span
                className="w-6 h-px"
                style={{ backgroundColor: a.accentColor || a.primaryColor }}
              />
              <Sparkles
                className="w-3 h-3"
                style={{ color: a.accentColor || a.primaryColor }}
              />
              <span
                className="w-6 h-px"
                style={{ backgroundColor: a.accentColor || a.primaryColor }}
              />
            </div>
          )}

          {isLuxury && (
            <div
              className={`w-10 h-0.5 mb-2.5 rounded-full ${isCentered ? 'mx-auto' : ''}`}
              style={{
                background: `linear-gradient(90deg, transparent, ${a.accentColor || '#D4AF37'}, transparent)`,
              }}
            />
          )}

          <h1
            style={headingStyle}
            className={`${headingSizeCls} ${fontWeightCls} ${theme.defaultHeadingTracking} break-words leading-tight`}
          >
            {displayName}
          </h1>

          <div className="mt-2 w-full">
            <IdentityMeta p={p} v={v} a={a} centered={isCentered} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  )
}
