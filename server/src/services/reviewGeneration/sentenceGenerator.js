import { pickVariant } from './variationEngine.js'

function joinList(items) {
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
  const s = String(str || '').trim()
  if (!s) return ''
  return /[.!?]$/.test(s) ? s : `${s}.`
}

function extractCustomSubject(questionText, customContext) {
  if (customContext && customContext.trim()) {
    return lowerFirst(customContext.trim().replace(/[.?!]+$/, ''))
  }
  const cleaned = String(questionText || '')
    .replace(/\?/g, '')
    .replace(
      /^(how was|how were|what did you think of|what about|rate|describe|tell us about)\s+(the\s+)?/i,
      '',
    )
    .trim()
  if (!cleaned || cleaned.length > 60) return ''
  return lowerFirst(cleaned)
}

function getBrandNoun(category, fallback) {
  const map = {
    Restaurant: { food: 'the food', service: 'the table service' },
    Café: { food: 'the food and drinks', service: 'the counter service' },
    Beauty: { expertise: 'the styling', service: 'the salon service' },
    Wellness: { expertise: 'the treatment', comfort: 'the space' },
    Healthcare: { expertise: 'the care', comfort: 'the clinic environment' },
  }
  return map[category] || {}
}

/**
 * Generates a single topic-accurate sentence for one answered QuestionUnit.
 * Strictly preserves the question's semantic category and customer sentiment.
 */
export function generateSentenceForUnit(unit, business, seed, index) {
  const rawJoined = joinList(unit.values)
  const val = lowerFirst(rawJoined)
  const brand = getBrandNoun(business.category)

  // Short text: preserve customer's own words directly
  if (unit.type === 'short_text') {
    return ensurePeriod(unit.values[0])
  }

  const s = unit.sentiment

  switch (unit.category) {
    case 'staff_behaviour':
      if (s === 'negative') {
        return pickVariant(
          [
            `The staff behaviour was disappointing (${val}).`,
            `Staff behaviour felt ${val} and could have been more welcoming.`,
          ],
          seed,
          index,
        )
      }
      if (s === 'mixed') {
        return pickVariant(
          [
            `The staff behaviour was ${val}.`,
            `As for the staff, their behaviour felt ${val}.`,
          ],
          seed,
          index,
        )
      }
      return pickVariant(
        [
          `The staff were ${val}.`,
          `The staff behaviour was ${val} and welcoming.`,
          `I appreciated the staff being ${val}.`,
        ],
        seed,
        index,
      )

    case 'food_quality':
      if (s === 'negative') {
        return pickVariant(
          [
            `The food quality fell short (${val}).`,
            `${brand.food ? 'The food' : 'Food quality'} was ${val}.`,
          ],
          seed,
          index,
        )
      }
      return pickVariant(
        [
          `The food quality was ${val}.`,
          `In terms of food, ${val} stood out.`,
          `The food and flavours were ${val}.`,
        ],
        seed,
        index,
      )

    case 'product_quality':
      if (s === 'negative') {
        return `Product quality was ${val} and did not meet expectations.`
      }
      return pickVariant(
        [
          `The product quality was ${val}.`,
          `I found the product selection to be ${val}.`,
        ],
        seed,
        index,
      )

    case 'service_speed':
      if (s === 'negative') {
        return pickVariant(
          [
            `Service speed was ${val}, which took longer than expected.`,
            `Wait times felt ${val}.`,
          ],
          seed,
          index,
        )
      }
      return pickVariant(
        [
          `The service speed was ${val}.`,
          `Everything moved along nicely with ${val} service.`,
        ],
        seed,
        index,
      )

    case 'service_quality':
      if (s === 'negative') {
        return `The service quality was ${val}.`
      }
      return pickVariant(
        [
          `The service quality was ${val}.`,
          `The overall service was ${val}.`,
        ],
        seed,
        index,
      )

    case 'cleanliness':
      if (s === 'negative') {
        return `Cleanliness needed attention (${val}).`
      }
      return pickVariant(
        [
          `The space was ${val} and well maintained.`,
          `Cleanliness was ${val}.`,
        ],
        seed,
        index,
      )

    case 'ambience':
      if (s === 'negative') {
        return `The ambience felt ${val}.`
      }
      return pickVariant(
        [
          `The ambience was ${val} and pleasant.`,
          `The atmosphere felt ${val}.`,
        ],
        seed,
        index,
      )

    case 'pricing':
      if (s === 'negative') {
        return `Pricing felt ${val} compared to what was offered.`
      }
      return pickVariant(
        [
          `The pricing felt ${val}.`,
          `I found the value for money to be ${val}.`,
        ],
        seed,
        index,
      )

    case 'delivery_experience':
      if (s === 'negative') {
        return `The delivery experience was ${val}.`
      }
      return `The delivery experience was ${val}.`

    case 'communication':
      if (s === 'negative') {
        return `Communication could have been clearer (${val}).`
      }
      return `Communication was ${val}.`

    case 'professionalism':
      if (s === 'negative') {
        return `Professionalism fell short (${val}).`
      }
      return `The team demonstrated ${val} professionalism.`

    case 'technical_expertise':
      if (s === 'negative') {
        return `The ${brand.expertise || 'technical execution'} felt ${val}.`
      }
      return pickVariant(
        [
          `The expertise and execution felt ${val}.`,
          `I was pleased with the skill shown (${val}).`,
        ],
        seed,
        index,
      )

    case 'appointment_experience':
      if (s === 'negative') {
        return `The appointment and scheduling process was ${val}.`
      }
      return `Booking and appointment handling was ${val}.`

    case 'comfort':
      if (s === 'negative') {
        return `The comfort level was ${val}.`
      }
      return `The ${brand.comfort || 'overall comfort'} was ${val}.`

    case 'overall_experience':
      if (s === 'negative') {
        return `Overall, the experience felt ${val}.`
      }
      return pickVariant(
        [
          `What stood out most was ${val}.`,
          `Highlights of the visit included ${val}.`,
        ],
        seed,
        index,
      )

    case 'custom':
    default: {
      const subject = extractCustomSubject(unit.questionText, unit.customContext)
      if (subject) {
        if (s === 'negative') {
          return `Regarding ${subject}, it felt ${val}.`
        }
        return `Regarding ${subject}, my experience was ${val}.`
      }
      return ensurePeriod(rawJoined)
    }
  }
}
