import crypto from 'crypto'
import Business, {
  ALLOWED_ALIGNMENTS,
  ALLOWED_FONTS,
  ALLOWED_LAYOUT_STYLES,
  ALLOWED_LENGTHS,
  ALLOWED_LOGO_PLACEMENTS,
  ALLOWED_TONES,
} from '../models/Business.js'
import { readLocalStore, usingMongo, writeLocalStore } from '../config/db.js'
import { buildQrPublicUrl } from '../config/seedData.js'
import { sanitizeText } from '../services/reviewGenerator.js'

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function generateLogoText(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return 'RB'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function createPermanentPublicId(name) {
  const base = slugify(name).slice(0, 20) || 'biz'
  const suffix = crypto.randomBytes(3).toString('hex')
  return `${base}-${suffix}`
}

export function normalizeAppearance(input = {}, existing = {}) {
  const merged = {
    accentColor: '#1B6B4A',
    fontFamily: 'Inter',
    businessNameAlignment: 'left',
    logoPlacement: 'beside',
    layoutStyle: 'centered',
    ...existing,
    ...input,
  }

  return {
    accentColor: HEX_COLOR_RE.test(merged.accentColor)
      ? merged.accentColor
      : '#1B6B4A',
    fontFamily: ALLOWED_FONTS.includes(merged.fontFamily)
      ? merged.fontFamily
      : 'Inter',
    businessNameAlignment: ALLOWED_ALIGNMENTS.includes(
      merged.businessNameAlignment,
    )
      ? merged.businessNameAlignment
      : 'left',
    logoPlacement: ALLOWED_LOGO_PLACEMENTS.includes(merged.logoPlacement)
      ? merged.logoPlacement
      : 'beside',
    layoutStyle: ALLOWED_LAYOUT_STYLES.includes(merged.layoutStyle)
      ? merged.layoutStyle
      : 'centered',
  }
}

export function normalizeReviewConfig(input = {}, existing = {}, name = '') {
  const merged = {
    googleReviewUrl: '',
    welcomeMessage: `Thanks for visiting ${name}! Answer a few quick questions to draft your review.`,
    tone: 'Natural and Conversational',
    length: 'Medium',
    autoCopyPrompt: true,
    ...existing,
    ...input,
  }

  return {
    googleReviewUrl: sanitizeText(merged.googleReviewUrl, 500),
    welcomeMessage: sanitizeText(merged.welcomeMessage, 400),
    tone: ALLOWED_TONES.includes(merged.tone)
      ? merged.tone
      : 'Natural and Conversational',
    length: ALLOWED_LENGTHS.includes(merged.length) ? merged.length : 'Medium',
    autoCopyPrompt: Boolean(merged.autoCopyPrompt),
  }
}

export function normalizeQuestions(questions = []) {
  if (!Array.isArray(questions)) return []
  return questions
    .filter((q) => q && typeof q.text === 'string' && q.text.trim())
    .map((q) => {
      const type = ['single_choice', 'multiple_choice', 'short_text'].includes(
        q.type,
      )
        ? q.type
        : 'single_choice'
      const options =
        type === 'short_text'
          ? []
          : (Array.isArray(q.options) ? q.options : [])
              .map((o) => sanitizeText(String(o), 120))
              .filter(Boolean)
      return {
        id: sanitizeText(String(q.id || `q-${Date.now()}`), 64),
        text: sanitizeText(q.text, 240),
        type,
        required: type === 'short_text' ? false : Boolean(q.required),
        enabled: q.enabled !== false,
        options,
      }
    })
}

export function toPublicBusinessPayload(biz) {
  if (!biz) return null
  if (biz.status === 'paused') {
    return {
      publicId: biz.publicId,
      name: biz.name,
      logoText: biz.logoText,
      logoUrl: biz.logoUrl || '',
      status: 'paused',
      appearance: normalizeAppearance(biz.appearance),
    }
  }

  return {
    publicId: biz.publicId,
    name: biz.name,
    logoText: biz.logoText,
    logoUrl: biz.logoUrl || '',
    category: biz.category || '',
    location: biz.location || '',
    status: biz.status,
    reviewConfig: {
      googleReviewUrl: biz.reviewConfig?.googleReviewUrl || '',
      welcomeMessage: biz.reviewConfig?.welcomeMessage || '',
      tone: biz.reviewConfig?.tone || 'Natural and Conversational',
      length: biz.reviewConfig?.length || 'Medium',
      autoCopyPrompt: biz.reviewConfig?.autoCopyPrompt ?? true,
    },
    appearance: normalizeAppearance(biz.appearance),
    questions: (biz.questions || []).filter((q) => q.enabled !== false),
  }
}

function serializeBusiness(doc) {
  if (!doc) return null
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc
  return {
    ...obj,
    id: obj.publicId,
    dateAdded: (obj.createdAt || new Date().toISOString()).slice(0, 10),
  }
}

export async function listBusinesses() {
  if (usingMongo()) {
    const docs = await Business.find().sort({ createdAt: -1 })
    return docs.map(serializeBusiness)
  }
  const items = readLocalStore()
  return items
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(serializeBusiness)
}

export async function findBusinessByAnyId(idOrPublicId) {
  if (usingMongo()) {
    const doc = await Business.findOne({
      $or: [{ publicId: idOrPublicId }, { slug: idOrPublicId }],
    })
    return serializeBusiness(doc)
  }
  const items = readLocalStore()
  const found = items.find(
    (b) => b.publicId === idOrPublicId || b.slug === idOrPublicId,
  )
  return serializeBusiness(found)
}

export async function createBusinessRecord(payload) {
  const name = sanitizeText(payload.name, 140)
  if (!name) {
    const err = new Error('Business name is required')
    err.status = 400
    throw err
  }

  const publicId = createPermanentPublicId(name)
  const qrPublicUrl = buildQrPublicUrl(publicId)
  const now = new Date().toISOString()

  const record = {
    publicId,
    qrPublicUrl,
    name,
    slug: slugify(name),
    logoText: generateLogoText(name),
    logoUrl: sanitizeText(payload.logoUrl || '', 500),
    category: sanitizeText(payload.category || 'Other', 60),
    location: sanitizeText(payload.location || '', 160),
    address: sanitizeText(payload.address || '', 260),
    phone: sanitizeText(payload.phone || '', 40),
    email: sanitizeText(payload.email || '', 140),
    status: payload.status === 'paused' ? 'paused' : 'active',
    reviewConfig: normalizeReviewConfig(payload.reviewConfig || payload, {}, name),
    appearance: normalizeAppearance(payload.appearance || {}),
    questions: normalizeQuestions(payload.questions || []),
    analytics: {
      totalScans: 0,
      landingViews: 0,
      questionnaireStarts: 0,
      questionnaireCompletions: 0,
      reviewDraftsGenerated: 0,
      copyClicks: 0,
      googleReviewRedirects: 0,
    },
    createdAt: now,
    updatedAt: now,
  }

  if (usingMongo()) {
    const created = await Business.create(record)
    return serializeBusiness(created)
  }

  const items = readLocalStore()
  items.unshift(record)
  writeLocalStore(items)
  return serializeBusiness(record)
}

export async function updateBusinessRecord(idOrPublicId, updates) {
  if (usingMongo()) {
    const existing = await Business.findOne({
      $or: [{ publicId: idOrPublicId }, { slug: idOrPublicId }],
    })
    if (!existing) return null

    if (updates.name !== undefined) {
      const cleanName = sanitizeText(updates.name, 140)
      if (cleanName) {
        existing.name = cleanName
        existing.logoText = generateLogoText(cleanName)
      }
    }
    if (updates.logoUrl !== undefined) {
      existing.logoUrl = sanitizeText(updates.logoUrl, 500)
    }
    if (updates.category !== undefined) {
      existing.category = sanitizeText(updates.category, 60)
    }
    if (updates.location !== undefined) {
      existing.location = sanitizeText(updates.location, 160)
    }
    if (updates.address !== undefined) {
      existing.address = sanitizeText(updates.address, 260)
    }
    if (updates.phone !== undefined) {
      existing.phone = sanitizeText(updates.phone, 40)
    }
    if (updates.email !== undefined) {
      existing.email = sanitizeText(updates.email, 140)
    }
    if (updates.status !== undefined) {
      existing.status = updates.status === 'paused' ? 'paused' : 'active'
    }
    if (updates.reviewConfig !== undefined) {
      existing.reviewConfig = normalizeReviewConfig(
        updates.reviewConfig,
        existing.reviewConfig?.toObject?.() || existing.reviewConfig,
        existing.name,
      )
    }
    if (updates.appearance !== undefined) {
      existing.appearance = normalizeAppearance(
        updates.appearance,
        existing.appearance?.toObject?.() || existing.appearance,
      )
    }
    if (updates.questions !== undefined) {
      existing.questions = normalizeQuestions(updates.questions)
    }

    // Notice: publicId and qrPublicUrl are immutable and NEVER overwritten
    await existing.save()
    return serializeBusiness(existing)
  }

  const items = readLocalStore()
  const idx = items.findIndex(
    (b) => b.publicId === idOrPublicId || b.slug === idOrPublicId,
  )
  if (idx === -1) return null

  const current = items[idx]
  const nextName =
    updates.name !== undefined
      ? sanitizeText(updates.name, 140) || current.name
      : current.name

  const updated = {
    ...current,
    name: nextName,
    logoText:
      updates.name !== undefined ? generateLogoText(nextName) : current.logoText,
    logoUrl:
      updates.logoUrl !== undefined
        ? sanitizeText(updates.logoUrl, 500)
        : current.logoUrl,
    category:
      updates.category !== undefined
        ? sanitizeText(updates.category, 60)
        : current.category,
    location:
      updates.location !== undefined
        ? sanitizeText(updates.location, 160)
        : current.location,
    address:
      updates.address !== undefined
        ? sanitizeText(updates.address, 260)
        : current.address,
    phone:
      updates.phone !== undefined
        ? sanitizeText(updates.phone, 40)
        : current.phone,
    email:
      updates.email !== undefined
        ? sanitizeText(updates.email, 140)
        : current.email,
    status:
      updates.status !== undefined
        ? updates.status === 'paused'
          ? 'paused'
          : 'active'
        : current.status,
    reviewConfig:
      updates.reviewConfig !== undefined
        ? normalizeReviewConfig(
            updates.reviewConfig,
            current.reviewConfig,
            nextName,
          )
        : current.reviewConfig,
    appearance:
      updates.appearance !== undefined
        ? normalizeAppearance(updates.appearance, current.appearance)
        : current.appearance,
    questions:
      updates.questions !== undefined
        ? normalizeQuestions(updates.questions)
        : current.questions,
    // Preserve immutable publicId and qrPublicUrl
    publicId: current.publicId,
    qrPublicUrl: current.qrPublicUrl,
    updatedAt: new Date().toISOString(),
  }

  items[idx] = updated
  writeLocalStore(items)
  return serializeBusiness(updated)
}

const ALLOWED_EVENTS = new Set([
  'totalScans',
  'landingViews',
  'questionnaireStarts',
  'questionnaireCompletions',
  'reviewDraftsGenerated',
  'copyClicks',
  'googleReviewRedirects',
])

export async function incrementAnalyticsEvent(publicId, eventName) {
  if (!ALLOWED_EVENTS.has(eventName)) return null

  if (usingMongo()) {
    const doc = await Business.findOneAndUpdate(
      { $or: [{ publicId }, { slug: publicId }], status: 'active' },
      { $inc: { [`analytics.${eventName}`]: 1 } },
      { new: true },
    )
    return serializeBusiness(doc)
  }

  const items = readLocalStore()
  const idx = items.findIndex(
    (b) =>
      (b.publicId === publicId || b.slug === publicId) && b.status === 'active',
  )
  if (idx === -1) return null

  const current = items[idx]
  current.analytics = current.analytics || {}
  current.analytics[eventName] = (current.analytics[eventName] || 0) + 1
  current.updatedAt = new Date().toISOString()
  writeLocalStore(items)
  return serializeBusiness(current)
}
