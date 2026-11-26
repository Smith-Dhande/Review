/**
 * Deterministic, rule-based review draft generator.
 * No external AI APIs. Sanitizes all customer text and preserves
 * authentic sentiment (positive, mixed, or negative).
 */

const NEGATIVE_KEYWORDS = [
  'slow',
  'rude',
  'bad',
  'poor',
  'cold',
  'late',
  'expensive',
  'noisy',
  'dirty',
  'wait',
  'disappoint',
  'issue',
  'problem',
  'average',
  'okay',
  'could be better',
  'not great',
  'needs improvement',
]

export function sanitizeText(input, maxLen = 400) {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

function hasMixedOrNegativeTone(texts) {
  const combined = texts.join(' ').toLowerCase()
  return NEGATIVE_KEYWORDS.some((kw) => combined.includes(kw))
}

function joinNaturalList(items) {
  const clean = items.map((s) => s.trim()).filter(Boolean)
  if (clean.length === 0) return ''
  if (clean.length === 1) return clean[0]
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`
}

function lowerFirst(str) {
  if (!str) return ''
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function ensurePeriod(str) {
  const s = str.trim()
  if (!s) return ''
  return /[.!?]$/.test(s) ? s : `${s}.`
}

const OPENERS = {
  'Natural and Conversational': {
    positive: (name) => `Had a really good experience visiting ${name}.`,
    mixed: (name) => `I visited ${name} recently and wanted to share my honest thoughts.`,
  },
  'Friendly and Casual': {
    positive: (name) => `Stopped by ${name} and had a great time!`,
    mixed: (name) => `Dropped into ${name} recently — here's how it went.`,
  },
  Professional: {
    positive: (name) => `I had a very positive experience at ${name}.`,
    mixed: (name) => `I recently visited ${name} and wanted to share balanced feedback.`,
  },
  Enthusiastic: {
    positive: (name) => `Had a fantastic experience at ${name}!`,
    mixed: (name) => `Visited ${name} and wanted to share a few highlights and notes.`,
  },
  'Simple and Straightforward': {
    positive: (name) => `Visited ${name} and had a good experience.`,
    mixed: (name) => `Visited ${name} recently.`,
  },
}

const CLOSERS = {
  'Natural and Conversational': {
    positive: (name) => `I'd gladly recommend ${name} to others.`,
    mixed: () => `Sharing this so others know what to expect.`,
  },
  'Friendly and Casual': {
    positive: (name) => `Definitely worth checking out ${name} if you're nearby!`,
    mixed: () => `Hope this helps anyone planning a visit.`,
  },
  Professional: {
    positive: (name) => `I would recommend ${name} based on my visit.`,
    mixed: () => `Overall, it was a useful visit with room for improvement.`,
  },
  Enthusiastic: {
    positive: (name) => `Can't wait to visit ${name} again soon!`,
    mixed: () => `Looking forward to seeing things get even better.`,
  },
  'Simple and Straightforward': {
    positive: (name) => `Would recommend ${name}.`,
    mixed: () => `Overall a mixed experience.`,
  },
}

/**
 * Generates a review draft from business config + validated customer answers.
 */
export function generateReviewDraft(business, answers = {}) {
  const name = business.name || 'this place'
  const tone = business.reviewConfig?.tone || 'Natural and Conversational'
  const length = business.reviewConfig?.length || 'Medium'
  const activeQuestions = (business.questions || []).filter(
    (q) => q.enabled !== false,
  )

  const selectedHighlights = []
  const freeTextNotes = []

  for (const q of activeQuestions) {
    const raw = answers[q.id]
    if (raw === undefined || raw === null) continue

    if (q.type === 'multiple_choice' && Array.isArray(raw)) {
      const valid = raw
        .map((opt) => sanitizeText(String(opt), 120))
        .filter((opt) => q.options?.includes(opt))
      if (valid.length > 0) {
        selectedHighlights.push(joinNaturalList(valid))
      }
    } else if (q.type === 'single_choice' && typeof raw === 'string') {
      const clean = sanitizeText(raw, 120)
      if (clean && q.options?.includes(clean)) {
        selectedHighlights.push(clean)
      }
    } else if (q.type === 'short_text' && typeof raw === 'string') {
      const clean = sanitizeText(raw, 300)
      if (clean) {
        freeTextNotes.push(ensurePeriod(clean))
      }
    }
  }

  // Fallback if business had no questions and customer wrote general feedback
  if (activeQuestions.length === 0 && typeof answers.general === 'string') {
    const clean = sanitizeText(answers.general, 300)
    if (clean) freeTextNotes.push(ensurePeriod(clean))
  }

  const isMixed = hasMixedOrNegativeTone([...selectedHighlights, ...freeTextNotes])
  const sentimentKey = isMixed ? 'mixed' : 'positive'

  const openerFn =
    OPENERS[tone]?.[sentimentKey] || OPENERS['Natural and Conversational'][sentimentKey]
  const closerFn =
    CLOSERS[tone]?.[sentimentKey] || CLOSERS['Natural and Conversational'][sentimentKey]

  const sentences = [openerFn(name)]

  if (selectedHighlights.length > 0) {
    const firstPart = lowerFirst(selectedHighlights[0])
    if (isMixed) {
      sentences.push(`What stood out to me was ${firstPart}.`)
    } else if (tone === 'Professional') {
      sentences.push(`In particular, I appreciated ${firstPart}.`)
    } else {
      sentences.push(`I especially noticed ${firstPart}.`)
    }

    if (selectedHighlights.length > 1 && length !== 'Short') {
      const secondPart = lowerFirst(joinNaturalList(selectedHighlights.slice(1)))
      sentences.push(`The experience also included ${secondPart}.`)
    }
  }

  if (freeTextNotes.length > 0) {
    if (length === 'Short' && sentences.length >= 2) {
      sentences[1] = freeTextNotes[0]
    } else {
      sentences.push(freeTextNotes.join(' '))
    }
  }

  if (length === 'Medium' && sentences.length < 3) {
    sentences.push(closerFn(name))
  }

  if (length === 'Detailed') {
    if (business.location) {
      sentences.push(`Visited their ${business.location} location.`)
    }
    sentences.push(closerFn(name))
    if (sentences.length < 5) {
      sentences.push(
        isMixed
          ? `Hopefully this feedback helps the team at ${name} continue improving.`
          : `Overall, everything felt well thought out and consistent.`,
      )
    }
  }

  // Enforce target sentence bounds cleanly
  if (length === 'Short') {
    return sentences.slice(0, 2).join(' ')
  }
  if (length === 'Medium') {
    return sentences.slice(0, 4).join(' ')
  }
  return sentences.slice(0, 6).join(' ')
}
