import { interpretAnswers } from './answerInterpreter.js'
import { generateSentenceForUnit } from './sentenceGenerator.js'
import { validateComposedReview } from './reviewValidator.js'
import { hashSeed, pickClosing, pickOpening } from './variationEngine.js'

function computeOverallSentiment(units, rating) {
  const hasNeg = units.some((u) => u.sentiment === 'negative')
  const hasPos = units.some((u) => u.sentiment === 'positive')
  const hasMix = units.some((u) => u.sentiment === 'mixed')

  let answerSentiment = 'neutral'
  if ((hasNeg && hasPos) || hasMix) answerSentiment = 'mixed'
  else if (hasNeg) answerSentiment = 'negative'
  else if (hasPos) answerSentiment = 'positive'

  if (!rating) return answerSentiment

  // Combine initial 1-5 star rating with actual answer sentiment
  if (rating === 1) {
    return hasPos ? 'mixed' : 'negative'
  }
  if (rating === 2) {
    return hasPos ? 'mixed' : 'negative'
  }
  if (rating === 3) {
    return answerSentiment === 'negative' ? 'negative' : 'mixed'
  }
  if (rating === 4) {
    if (hasNeg || hasMix) return 'mixed'
    return 'positive'
  }
  // rating === 5
  if (hasNeg) return 'mixed'
  if (hasMix) return 'mixed'
  return 'positive'
}

function addTransition(sentence, prevSentiment, currSentiment) {
  if (
    prevSentiment === 'positive' &&
    (currSentiment === 'negative' || currSentiment === 'mixed')
  ) {
    return `However, ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`
  }
  if (
    (prevSentiment === 'negative' || prevSentiment === 'mixed') &&
    currSentiment === 'positive'
  ) {
    return `On the bright side, ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`
  }
  return sentence
}

/**
 * Composes a coherent, topic-accurate review draft from DB business config,
 * initial 1-5 star rating, and customer answers.
 */
export function generateReviewDraft(business, answers = {}, options = {}) {
  const units = interpretAnswers(business, answers)
  const rating = options.rating ? Number(options.rating) : null
  const configuredTone =
    business.reviewConfig?.tone || 'Natural and Conversational'
  // For 4-star ratings, avoid overly exaggerated enthusiastic openers
  const effectiveTone =
    rating === 4 && configuredTone === 'Enthusiastic'
      ? 'Natural and Conversational'
      : configuredTone
  const length = business.reviewConfig?.length || 'Medium'
  const overallSentiment = computeOverallSentiment(units, rating)

  const salt = options.variationSalt ? `:${options.variationSalt}` : ''
  const seed = hashSeed(
    `${business.publicId || business.name}:${rating ?? 'none'}:${JSON.stringify(answers)}${salt}`,
  )

  const topicSentences = units.map((unit, idx) =>
    generateSentenceForUnit(unit, business, seed, idx),
  )

  const transitionedTopics = topicSentences.map((sentence, idx) => {
    if (idx === 0) return sentence
    return addTransition(sentence, units[idx - 1].sentiment, units[idx].sentiment)
  })

  if (transitionedTopics.length === 0) {
    return validateComposedReview(
      pickOpening(effectiveTone, overallSentiment, business.name, seed),
      units,
      rating,
    )
  }

  const opening = pickOpening(
    effectiveTone,
    overallSentiment,
    business.name,
    seed,
  )
  const closing = pickClosing(
    effectiveTone,
    overallSentiment,
    business.name,
    seed,
  )

  let finalSentences = []

  if (length === 'Short') {
    if (transitionedTopics.length === 1) {
      finalSentences = [opening, transitionedTopics[0]]
    } else {
      finalSentences = transitionedTopics.slice(0, 2)
    }
  } else if (length === 'Medium') {
    finalSentences = [opening, ...transitionedTopics]
    if (finalSentences.length < 3) {
      finalSentences.push(closing)
    } else if (finalSentences.length > 4) {
      finalSentences = [opening, ...transitionedTopics.slice(0, 3)]
    }
  } else {
    finalSentences = [opening, ...transitionedTopics]
    if (business.location && finalSentences.length < 5) {
      finalSentences.push(`Visited their ${business.location} location.`)
    }
    if (finalSentences.length < 6) {
      finalSentences.push(closing)
    }
  }

  return validateComposedReview(finalSentences.join(' '), units, rating)
}
