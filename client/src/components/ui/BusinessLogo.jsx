import { useState } from 'react'
import { resolveAssetUrl } from '../../services/api'

const SIZE_CLASSES = {
  sm: 'w-9 h-9 text-xs rounded-md',
  md: 'w-12 h-12 text-sm rounded-lg',
  lg: 'w-14 h-14 text-base rounded-lg',
}

/**
 * Displays a business logo with aspect-ratio-safe `object-contain` fitting,
 * or a refined monogram fallback when no logo is uploaded or image fails.
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
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md

  if (resolvedUrl && !imgError) {
    return (
      <div
        className={`${sizeClass} bg-white border border-border flex items-center justify-center p-1 overflow-hidden shrink-0 ${className}`}
      >
        <img
          src={resolvedUrl}
          alt={`${name || 'Business'} logo`}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} bg-surface border border-border flex items-center justify-center font-semibold text-text-primary shrink-0 ${className}`}
      aria-hidden="true"
    >
      {logoText || 'RB'}
    </div>
  )
}
