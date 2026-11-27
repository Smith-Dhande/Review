const PLACE_ID_RE = /^(?:ChIJ|GhIJ|Eh)[A-Za-z0-9_-]{10,}$/

/**
 * Converts a raw Google Place ID (e.g. ChIJCcAieFGl1jsREQ6h9oXJa-8) into a
 * direct Google Write-a-Review popup URL, leaving full URLs untouched.
 */
export function normalizeGoogleReviewInput(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (PLACE_ID_RE.test(trimmed)) {
    return `https://search.google.com/local/writereview?placeid=${trimmed}`
  }
  return trimmed
}
