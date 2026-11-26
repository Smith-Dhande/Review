import { classifyQuestion } from './questionClassifier.js'

const NEGATIVE_PATTERNS = [
  /\bpoor\b/i,
  /\brude\b/i,
  /\bslow\b/i,
  /\bbad\b/i,
  /\bcold\b/i,
  /\blate\b/i,
  /\bdirty\b/i,
  /\bunclean\b/i,
  /\bexpensive\b/i,
  /\boverpriced\b/i,
  /\bdisappoint/i,
  /\bunfriendly\b/i,
  /\bunprofessional\b/i,
  /\buncomfortable\b/i,
  /\blong wait\b/i,
  /\bwait time\b/i,
  /\bdelayed?\b/i,
  /\bnoisy\b/i,
  /\bcould be better\b/i,
  /\bneeds? improvement\b/i,
  /\bnot good\b/i,
  /\bnot great\b/i,
  /\bterrible\b/i,
  /\bawful\b/i,
  /\bmediocre\b/i,
]

const MIXED_PATTERNS = [
  /\baverage\b/i,
  /\bokay\b/i,
  /\bdecent\b/i,
  /\bmixed\b/i,
  /\bfair\b/i,
  /\bmoderate\b/i,
  /\bsomewhat\b/i,
]

const POSITIVE_PATTERNS = [
  /\bexcellent\b/i,
  /\bvery friendly\b/i,
  /\bfriendly\b/i,
  /\bwarm\b/i,
  /\battentive\b/i,
  /\bpolite\b/i,
  /\bhelpful\b/i,
  /\bgreat\b/i,
  /\bgood\b/i,
  /\bwonderful\b/i,
  /\bamazing\b/i,
  /\bfantastic\b/i,
  /\bawesome\b/i,
  /\bdelicious\b/i,
  /\bfresh\b/i,
  /\btasty\b/i,
  /\bclean\b/i,
  /\bspotless\b/i,
  /\bcomfortable\b/i,
  /\bcozy\b/i,
  /\bcalming\b/i,
  /\bpeaceful\b/i,
  /\brelaxed\b/i,
  /\bquick\b/i,
  /\bfast\b/i,
  /\bprompt\b/i,
  /\bsmooth\b/i,
  /\bgentle\b/i,
  /\breassuring\b/i,
  /\bskilled\b/i,
  /\bprofessional\b/i,
  /\bexceptional\b/i,
  /\bauthentic\b/i,
  /\bgenerous\b/i,
  /\bconvenient\b/i,
  /\bloved\b/i,
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

export function detectSentiment(values) {
  const joined = values.join(' ')
  const hasNeg = NEGATIVE_PATTERNS.some((re) => re.test(joined))
  const hasMix = MIXED_PATTERNS.some((re) => re.test(joined))
  const hasPos = POSITIVE_PATTERNS.some((re) => re.test(joined))

  if (hasNeg && hasPos) return 'mixed'
  if (hasNeg) return 'negative'
  if (hasMix) return 'mixed'
  if (hasPos) return 'positive'
  return 'neutral'
}

/**
 * Interprets answered questionnaire items into structured AnswerUnits.
 * Unanswered questions (including optional ones) are omitted completely.
 */
export function interpretAnswers(business, answers = {}) {
  const activeQuestions = (business.questions || []).filter(
    (q) => q.enabled !== false,
  )

  const units = []

  for (const q of activeQuestions) {
    const raw = answers[q.id]
    if (raw === undefined || raw === null) continue

    let values = []
    if (q.type === 'multiple_choice' && Array.isArray(raw)) {
      values = raw
        .map((opt) => sanitizeText(String(opt), 120))
        .filter((opt) => opt && (!q.options?.length || q.options.includes(opt)))
    } else if (q.type === 'single_choice' && typeof raw === 'string') {
      const clean = sanitizeText(raw, 120)
      if (clean && (!q.options?.length || q.options.includes(clean))) {
        values = [clean]
      }
    } else if (q.type === 'short_text' && typeof raw === 'string') {
      const clean = sanitizeText(raw, 300)
      if (clean) {
        values = [clean]
      }
    }

    if (values.length === 0) continue

    const resolvedCategory =
      q.category && q.category !== 'auto'
        ? q.category
        : classifyQuestion(q.text).category

    units.push({
      questionId: q.id,
      questionText: q.text,
      category: resolvedCategory,
      customContext: q.customContext || '',
      type: q.type,
      values,
      sentiment: detectSentiment(values),
    })
  }

  // Fallback when business has no configured questions and customer wrote general feedback
  if (activeQuestions.length === 0 && typeof answers.general === 'string') {
    const clean = sanitizeText(answers.general, 300)
    if (clean) {
      units.push({
        questionId: 'general',
        questionText: 'General feedback',
        category: 'overall_experience',
        customContext: '',
        type: 'short_text',
        values: [clean],
        sentiment: detectSentiment([clean]),
      })
    }
  }

  return units
}
