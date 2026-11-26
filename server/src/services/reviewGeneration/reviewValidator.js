/**
 * Post-generation validator ensuring safety, fidelity, and rating consistency.
 */

export function validateComposedReview(text, units = [], rating = null) {
  const cleaned = String(text || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) {
    return 'Thank you for sharing your feedback.'
  }

  const hasNegative = units.some((u) => u.sentiment === 'negative')
  const isLowRating = rating !== null && rating <= 2

  if ((hasNegative || isLowRating) && /amazing|fantastic|can't wait to visit/i.test(cleaned)) {
    return cleaned.replace(/Can't wait to visit.*?!/gi, '').trim()
  }

  return cleaned
}
