/**
 * On-demand Google Font loader.
 * Loads only the requested font(s) instead of bundling all 10 fonts upfront.
 */

const GOOGLE_FONT_SPECS = {
  Inter: 'Inter:wght@400;500;600;700',
  'DM Sans': 'DM+Sans:wght@400;500;600;700',
  Poppins: 'Poppins:wght@400;500;600;700',
  Lato: 'Lato:wght@400;700',
  Manrope: 'Manrope:wght@400;500;600;700',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@500;600;700',
  Lora: 'Lora:wght@400;500;600;700',
  Outfit: 'Outfit:wght@400;500;600;700',
  'Source Sans 3': 'Source+Sans+3:wght@400;500;600;700',
}

const loadedFonts = new Set()

export function loadGoogleFont(fontFamily) {
  if (typeof document === 'undefined') return
  const spec = GOOGLE_FONT_SPECS[fontFamily]
  if (!spec || loadedFonts.has(fontFamily)) return

  loadedFonts.add(fontFamily)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`
  link.dataset.rbFont = fontFamily
  document.head.appendChild(link)
}

export function loadGoogleFontsBatch(fontFamilies = []) {
  if (typeof document === 'undefined') return
  const missing = fontFamilies.filter(
    (f) => GOOGLE_FONT_SPECS[f] && !loadedFonts.has(f),
  )
  if (missing.length === 0) return

  missing.forEach((f) => loadedFonts.add(f))
  const query = missing.map((f) => `family=${GOOGLE_FONT_SPECS[f]}`).join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`
  document.head.appendChild(link)
}

export function getFontStack(fontFamily) {
  if (fontFamily === 'Playfair Display' || fontFamily === 'Lora') {
    return `'${fontFamily}', Georgia, serif`
  }
  return `'${fontFamily || 'Inter'}', system-ui, -apple-system, sans-serif`
}
