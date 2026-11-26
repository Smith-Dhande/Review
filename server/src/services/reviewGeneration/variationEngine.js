/**
 * Controlled variation helpers for openings, closings, transitions, and phrasing.
 */

export function hashSeed(input) {
  let h = 2166136261
  const str = String(input || '')
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pickVariant(variants, seed, offset = 0) {
  if (!Array.isArray(variants) || variants.length === 0) return ''
  return variants[(seed + offset) % variants.length]
}

const OPENINGS = {
  'Natural and Conversational': {
    positive: [
      (name) => `I recently visited ${name} and had a really good experience.`,
      (name) => `My recent visit to ${name} was genuinely enjoyable.`,
      (name) => `Had a great time visiting ${name} recently.`,
    ],
    mixed: [
      (name) => `I visited ${name} recently and wanted to share my honest feedback.`,
      (name) => `Here are my candid thoughts from a recent visit to ${name}.`,
    ],
    negative: [
      (name) => `I visited ${name} recently, and unfortunately the experience fell short.`,
      (name) => `My recent visit to ${name} did not go as well as I hoped.`,
    ],
    neutral: [
      (name) => `I visited ${name} recently.`,
      (name) => `Stopped by ${name} recently.`,
    ],
  },
  'Friendly and Casual': {
    positive: [
      (name) => `Stopped by ${name} recently and really enjoyed it!`,
      (name) => `Had a lovely visit to ${name}!`,
      (name) => `Really liked my recent stop at ${name}!`,
    ],
    mixed: [
      (name) => `Dropped into ${name} recently — here's how it went.`,
      (name) => `Visited ${name} recently and had a mix of highs and lows.`,
    ],
    negative: [
      (name) => `Stopped by ${name} recently, though there were a few frustrating parts.`,
      (name) => `Visited ${name} recently, and it wasn't quite what I hoped for.`,
    ],
    neutral: [(name) => `Stopped by ${name} recently.`],
  },
  Professional: {
    positive: [
      (name) => `I had a very positive experience during my visit to ${name}.`,
      (name) => `My recent experience at ${name} met a high standard.`,
    ],
    mixed: [
      (name) => `I recently visited ${name} and wanted to share balanced feedback.`,
      (name) => `Following a recent visit to ${name}, here is an objective summary.`,
    ],
    negative: [
      (name) => `During my recent visit to ${name}, several areas fell short of expectations.`,
      (name) => `I visited ${name} recently and experienced a few notable issues.`,
    ],
    neutral: [(name) => `I recently visited ${name}.`],
  },
  Enthusiastic: {
    positive: [
      (name) => `Had a fantastic experience at ${name}!`,
      (name) => `Really impressed with my recent visit to ${name}!`,
    ],
    mixed: [
      (name) => `Visited ${name} recently and wanted to share both the highlights and a few notes.`,
    ],
    negative: [
      (name) => `Visited ${name} recently, and honestly it was disappointing.`,
    ],
    neutral: [(name) => `Visited ${name} recently.`],
  },
  'Simple and Straightforward': {
    positive: [
      (name) => `Visited ${name} and had a good experience.`,
      (name) => `Had a good visit to ${name}.`,
    ],
    mixed: [(name) => `Visited ${name} recently and had a mixed experience.`],
    negative: [(name) => `Visited ${name} recently and was not satisfied.`],
    neutral: [(name) => `Visited ${name}.`],
  },
}

const CLOSINGS = {
  'Natural and Conversational': {
    positive: [
      (name) => `I would gladly recommend ${name} to others.`,
      (name) => `I'd happily visit ${name} again.`,
    ],
    mixed: [
      () => `Sharing this so others know what to expect.`,
      () => `With a few small improvements, it could be much better.`,
    ],
    negative: [
      () => `Hopefully the team looks into these issues going forward.`,
    ],
    neutral: [(name) => `Sharing a quick note from my visit to ${name}.`],
  },
  'Friendly and Casual': {
    positive: [
      (name) => `Definitely worth checking out ${name} if you're nearby!`,
      (name) => `Would happily go back to ${name} again!`,
    ],
    mixed: [() => `Hope this helps anyone planning a visit.`],
    negative: [() => `Hope things improve on future visits.`],
    neutral: [(name) => `Thanks to the team at ${name}.`],
  },
  Professional: {
    positive: [
      (name) => `Based on this experience, I would recommend ${name}.`,
    ],
    mixed: [() => `Overall, it was a decent visit with clear room for improvement.`],
    negative: [() => `I hope management addresses these concerns promptly.`],
    neutral: [(name) => `Overall, a straightforward experience at ${name}.`],
  },
  Enthusiastic: {
    positive: [
      (name) => `Looking forward to visiting ${name} again soon!`,
    ],
    mixed: [() => `Looking forward to seeing things get even better!`],
    negative: [() => `Hoping for a much better experience next time.`],
    neutral: [(name) => `Thanks for having me, ${name}!`],
  },
  'Simple and Straightforward': {
    positive: [(name) => `Would recommend ${name}.`],
    mixed: [() => `Overall, a mixed experience.`],
    negative: [() => `Needs improvement.`],
    neutral: [() => `That was my experience.`],
  },
}

export function pickOpening(tone, overallSentiment, businessName, seed) {
  const toneGroup = OPENINGS[tone] || OPENINGS['Natural and Conversational']
  const list = toneGroup[overallSentiment] || toneGroup.neutral
  return pickVariant(list, seed, 1)(businessName)
}

export function pickClosing(tone, overallSentiment, businessName, seed) {
  const toneGroup = CLOSINGS[tone] || CLOSINGS['Natural and Conversational']
  const list = toneGroup[overallSentiment] || toneGroup.neutral
  return pickVariant(list, seed, 7)(businessName)
}
