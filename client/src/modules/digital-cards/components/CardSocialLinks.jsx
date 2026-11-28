import { ArrowUpRight } from 'lucide-react'
import SocialPlatformIcon from './SocialPlatformIcon'

function safeHref(url) {
  const s = String(url || '').trim()
  return /^https?:\/\//i.test(s) ? s : ''
}

const BTN_SHAPES = {
  rounded: 'rounded-xl',
  pill: 'rounded-full',
  square: 'rounded-none',
}

export default function CardSocialLinks({
  visibleSocials,
  socialStyle,
  isCentered,
  a,
  theme,
  headingStyle,
  isPreview,
  onActionClick,
}) {
  if (!visibleSocials.length) return null

  const shapeCls = BTN_SHAPES[a.buttonShape || 'rounded'] || 'rounded-xl'
  const accent = a.accentColor || a.primaryColor || '#1B6B4A'

  return (
    <div className="space-y-3">
      {socialStyle === 'section' && (
        <p
          className={`${theme.sectionTitleClass} opacity-65 ${isCentered ? 'text-center' : 'text-left'}`}
          style={headingStyle}
        >
          Connect
        </p>
      )}

      <div
        className={
          socialStyle === 'section'
            ? 'grid grid-cols-1 sm:grid-cols-2 gap-2'
            : `flex flex-wrap gap-2 ${isCentered ? 'justify-center' : 'justify-start'}`
        }
      >
        {visibleSocials.map((s) => {
          const text = s.label || s.platform
          const href = safeHref(s.url)
          if (!href) return null

          const isIconOnly = socialStyle === 'icon_only'
          const isSection = socialStyle === 'section'

          return (
            <a
              key={s.id}
              href={isPreview ? undefined : href}
              target={isPreview ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isPreview) e.preventDefault()
                onActionClick?.('socialClicks', s.platform)
              }}
              aria-label={text}
              title={text}
              style={{
                borderColor: theme.subtleBorderColor(a),
                color: a.textColor,
              }}
              className={`group inline-flex items-center gap-2 border ${
                isIconOnly ? 'rounded-full w-10 h-10 justify-center' : shapeCls
              } ${theme.cardSurfaceClass} text-xs font-medium transition-all duration-150 hover:-translate-y-0.5 motion-reduce:transform-none ${
                isIconOnly
                  ? ''
                  : socialStyle === 'compact_button'
                    ? 'px-3 py-1.5'
                    : isSection
                      ? 'px-3.5 py-2.5 justify-between'
                      : 'px-3.5 py-2'
              }`}
            >
              <span className="inline-flex items-center gap-2 min-w-0 capitalize">
                <span
                  className="inline-flex items-center justify-center shrink-0"
                  style={{ color: accent }}
                >
                  <SocialPlatformIcon platform={s.platform} className="w-4 h-4" />
                </span>
                {!isIconOnly && <span className="truncate">{text}</span>}
              </span>
              {isSection && (
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
