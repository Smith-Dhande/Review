/**
 * Semantic question classifier.
 * Analyses question wording and maps it to one of the 16 supported categories.
 * Returns `custom` when no predefined category matches strongly.
 */

export const QUESTION_CATEGORIES = [
  { id: 'staff_behaviour', label: 'Staff Behaviour' },
  { id: 'food_quality', label: 'Food Quality' },
  { id: 'product_quality', label: 'Product Quality' },
  { id: 'service_speed', label: 'Service Speed' },
  { id: 'service_quality', label: 'Service Quality' },
  { id: 'cleanliness', label: 'Cleanliness' },
  { id: 'ambience', label: 'Ambience' },
  { id: 'pricing', label: 'Pricing & Value' },
  { id: 'delivery_experience', label: 'Delivery Experience' },
  { id: 'communication', label: 'Communication' },
  { id: 'professionalism', label: 'Professionalism' },
  { id: 'technical_expertise', label: 'Technical Expertise' },
  { id: 'appointment_experience', label: 'Appointment Experience' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'overall_experience', label: 'Overall Experience' },
  { id: 'custom', label: 'Custom' },
]

export const ALLOWED_QUESTION_CATEGORIES = QUESTION_CATEGORIES.map((c) => c.id)

const CATEGORY_RULES = [
  {
    id: 'staff_behaviour',
    keywords: [
      'staff behaviour',
      'staff behavior',
      'staff friendliness',
      'how was the staff',
      'staff',
      'employee',
      'waiter',
      'server',
      'receptionist',
      'stylist',
      'trainer',
      'friendly',
      'courteous',
      'hospitality',
      'attitude',
      'helpful',
      'behaviour',
      'behavior',
    ],
  },
  {
    id: 'food_quality',
    keywords: [
      'food',
      'dish',
      'dishes',
      'meal',
      'taste',
      'flavor',
      'flavour',
      'menu',
      'coffee',
      'chai',
      'tea',
      'drink',
      'beverage',
      'breakfast',
      'lunch',
      'dinner',
      'dessert',
      'freshness',
      'portion',
      'cuisine',
      'cooked',
    ],
  },
  {
    id: 'product_quality',
    keywords: [
      'product',
      'quality',
      'material',
      'fabric',
      'item',
      'merchandise',
      'collection',
      'selection',
      'stock',
      'book',
      'equipment',
      'durability',
    ],
  },
  {
    id: 'service_speed',
    keywords: [
      'speed',
      'fast',
      'quick',
      'wait time',
      'waiting time',
      'how long',
      'prompt',
      'timely',
      'on time',
      'delay',
      'turnaround',
    ],
  },
  {
    id: 'cleanliness',
    keywords: [
      'clean',
      'cleanliness',
      'hygiene',
      'hygienic',
      'sanitized',
      'neat',
      'tidy',
      'washroom',
      'locker room',
      'spotless',
    ],
  },
  {
    id: 'ambience',
    keywords: [
      'ambience',
      'ambiance',
      'atmosphere',
      'decor',
      'interior',
      'vibe',
      'music',
      'lighting',
      'environment',
      'seating',
    ],
  },
  {
    id: 'pricing',
    keywords: [
      'price',
      'pricing',
      'value for money',
      'cost',
      'affordable',
      'expensive',
      'worth',
      'billing',
      'rates',
    ],
  },
  {
    id: 'delivery_experience',
    keywords: [
      'delivery',
      'packaging',
      'shipping',
      'parcel',
      'courier',
      'arrived',
      'takeaway',
      'pickup',
    ],
  },
  {
    id: 'communication',
    keywords: [
      'communication',
      'explain',
      'explanation',
      'responsive',
      'updates',
      'clarity',
      'listen',
      'informed',
    ],
  },
  {
    id: 'professionalism',
    keywords: [
      'professionalism',
      'professional',
      'manner',
      'conduct',
      'reliable',
      'trustworthy',
      'punctual',
    ],
  },
  {
    id: 'technical_expertise',
    keywords: [
      'expertise',
      'skill',
      'skilled',
      'knowledge',
      'knowledgeable',
      'technique',
      'treatment',
      'procedure',
      'doctor',
      'dentist',
      'therapist',
      'haircut',
      'styling',
      'diagnosis',
    ],
  },
  {
    id: 'appointment_experience',
    keywords: [
      'appointment',
      'booking',
      'reservation',
      'check-in',
      'check in',
      'scheduling',
      'slot',
    ],
  },
  {
    id: 'comfort',
    keywords: [
      'comfort',
      'comfortable',
      'gentle',
      'pain',
      'relaxing',
      'cozy',
      'room',
      'bed',
    ],
  },
  {
    id: 'service_quality',
    keywords: [
      'service',
      'assistance',
      'support',
      'care',
      'attention',
      'helped',
    ],
  },
  {
    id: 'overall_experience',
    keywords: [
      'overall',
      'experience',
      'visit',
      'recommend',
      'enjoy',
      'stand out',
      'stood out',
      'bring you',
      'brought you',
    ],
  },
]

export function getCategoryLabel(categoryId) {
  return (
    QUESTION_CATEGORIES.find((c) => c.id === categoryId)?.label || 'Custom'
  )
}

export function classifyQuestion(questionText = '') {
  const normalized = String(questionText || '').toLowerCase().trim()
  if (!normalized) {
    return { category: 'custom', confidence: 0, label: 'Custom' }
  }

  let bestCategory = 'custom'
  let bestScore = 0

  for (const rule of CATEGORY_RULES) {
    let score = 0
    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) {
        // Multi-word phrase matches carry higher confidence than single words
        score += kw.includes(' ') ? 3 : 1.5
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestCategory = rule.id
    }
  }

  const confidence = Math.min(1, Number((bestScore / 3).toFixed(2)))
  return {
    category: bestCategory,
    confidence,
    label: getCategoryLabel(bestCategory),
  }
}
