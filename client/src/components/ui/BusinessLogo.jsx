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

/**
 * Displays a business logo supporting both square and horizontal aspect ratios
 * using `object-contain`, or a refined monogram fallback when no logo is uploaded.
 */
export default function BusinessLogo({
  logoUrl,
  logoText,
  name,
  size = 'md',
  className = '',
}) {
  const [imgError, setImgError] = useState(false)
  const resolvedUrl = resolveAssetUrl(logoUrl)

  if (resolvedUrl && !imgError) {
    const imgSizeClass = IMAGE_CONTAINER_SIZES[size] || IMAGE_CONTAINER_SIZES.md
    return (
      <div
        className={`${imgSizeClass} bg-white border border-border inline-flex items-center justify-center py-1 overflow-hidden shrink-0 ${className}`}
      >
        <img
          src={resolvedUrl}
          alt={`${name || 'Business'} logo`}
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
