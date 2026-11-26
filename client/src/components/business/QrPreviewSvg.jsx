import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Renders a real, scannable QR code using the `qrcode` library.
 */
export default function QrPreviewSvg({ value = '', size = 148, id }) {
  const [svgMarkup, setSvgMarkup] = useState('')

  useEffect(() => {
    let active = true
    if (!value) return

    QRCode.toString(value, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1A1A1A',
        light: '#FFFFFF',
      },
    })
      .then((svg) => {
        if (active) setSvgMarkup(svg)
      })
      .catch(() => {
        if (active) setSvgMarkup('')
      })

    return () => {
      active = false
    }
  }, [value])

  if (!svgMarkup) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-white rounded-md border border-border flex items-center justify-center text-xs text-text-tertiary"
      >
        Generating...
      </div>
    )
  }

  return (
    <div
      id={id}
      style={{ width: size, height: size }}
      className="bg-white rounded-md border border-border p-1.5 shrink-0 [&>svg]:w-full [&>svg]:h-full"
      role="img"
      aria-label="Business QR Code"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  )
}
