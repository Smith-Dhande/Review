import QRCode from 'qrcode'

/**
 * Generates a high-resolution PNG buffer (1024px) from a business's permanent public URL.
 */
export async function generateQrPngBuffer(publicUrl) {
  return QRCode.toBuffer(publicUrl, {
    type: 'png',
    width: 1024,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1A1A1A',
      light: '#FFFFFF',
    },
  })
}

/**
 * Generates a crisp SVG string from a business's permanent public URL.
 */
export async function generateQrSvgString(publicUrl) {
  return QRCode.toString(publicUrl, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1A1A1A',
      light: '#FFFFFF',
    },
  })
}

/**
 * Generates a PNG Data URL for JSON preview responses.
 */
export async function generateQrDataUrl(publicUrl) {
  return QRCode.toDataURL(publicUrl, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1A1A1A',
      light: '#FFFFFF',
    },
  })
}
