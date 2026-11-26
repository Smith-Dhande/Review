import { useState } from 'react'
import { resolveAssetUrl } from '../../services/api'

const MONOGRAM_SIZES = {
  sm: 'w-9 h-9 text-xs rounded-md',
  md: 'w-12 h-12 text-sm rounded-lg',
  lg: 'w-14 h-14 text-base rounded-lg',
}

const IMAGE_CONTAINER_SIZES = {
  sm: 'h-9 min-w-[36px] max-w-[72px] rounded-md px-1',
  md: 'h-12 min-w-[48px] max-w-[140px] rounded-lg px-2',
  lg: 'h-14 min-w-[56px] max-w-[180px] rounded-lg px-2.5',
}

const OPTIMIZED_WIDTHS = {
  sm: 144,
  md: 280,
  lg: 360,
}

/**
 * Injects Cloudinary automatic format, quality, and aspect-safe resize transformations
 * without altering transparent PNGs or non-Cloudinary URLs.
 */
function getOptimizedLogoUrl(rawUrl, size) {
  const resolved = resolveAssetUrl(rawUrl)
  if (!resolved) return ''
  const marker = '/image/upload/'
  if (resolved.includes('res.cloudinary.com') && resolved.includes(marker)) {
    const width = OPTIMIZED_WIDTHS[size] || 280
    return resolved.replace(
      marker,
      `${marker}f_auto,q_auto,c_limit,w_${width}/`,
    )
  }
  return resolved
}

/**
 * Displays a business logo supporting both square and horizontal aspect ratios
 * using `object-contain`, or a refined monogram fallback when no logo is uploaded.
 */
export default function BusinessLogo({
  logo,
  logoUrl,
  logoText,
  name,
  size = 'md',
  lazy = true,
  className = '',
}) {
  const [imgError, setImgError] = useState(false)
  const rawUrl = logo?.url || logoUrl || ''
  const optimizedUrl = getOptimizedLogoUrl(rawUrl, size)

  if (optimizedUrl && !imgError) {
    const imgSizeClass = IMAGE_CONTAINER_SIZES[size] || IMAGE_CONTAINER_SIZES.md
    return (
      <div
        className={`${imgSizeClass} bg-white border border-border inline-flex items-center justify-center py-1 overflow-hidden shrink-0 ${className}`}
      >
        <img
          src={optimizedUrl}
          alt={`${name || 'Business'} logo`}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          width={logo?.width || undefined}
          height={logo?.height || undefined}
          onError={() => setImgError(true)}
          className="max-h-full w-auto max-w-full object-contain"
        />
      </div>
    )
  }

  const monoSizeClass = MONOGRAM_SIZES[size] || MONOGRAM_SIZES.md
  return (
    <div
      className={`${monoSizeClass} bg-surface border border-border flex items-center justify-center font-semibold text-text-primary shrink-0 ${className}`}
      aria-hidden="true"
    >
      {logoText || 'RB'}
    </div>
  )
}
