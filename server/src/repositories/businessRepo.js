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
import { deleteImageAsset } from '../services/imageStorageService.js'
import {
  deleteEventsForBusiness,
  recordAnalyticsEvent,
  recordAnalyticsEventsBatch,
} from './analyticsRepo.js'
import {
  ALLOWED_QUESTION_CATEGORIES,
  classifyQuestion,
} from '../services/reviewGeneration/questionClassifier.js'

const EMPTY_LOGO = {
  url: '',
  publicId: '',
  format: '',
  width: 0,
  height: 0,
}

export async function isLogoAssetReferenced(
  publicId,
  excludeBusinessPublicId = '',
) {
  if (!publicId || typeof publicId !== 'string') return false
  if (usingMongo()) {
    const query = { 'logo.publicId': publicId }
    if (excludeBusinessPublicId) {
      query.publicId = { $ne: excludeBusinessPublicId }
    }
    return Boolean(await Business.exists(query))
  }
  const items = readLocalStore()
  return items.some(
    (b) =>
      b.logo?.publicId === publicId &&
      (!excludeBusinessPublicId || b.publicId !== excludeBusinessPublicId),
  )
}

export function normalizeLogo(input) {
  if (!input || typeof input !== 'object') return { ...EMPTY_LOGO }
  const url = typeof input.url === 'string' ? input.url.trim() : ''
  const publicId =
    typeof input.publicId === 'string' ? input.publicId.trim() : ''

  if (!url) return { ...EMPTY_LOGO }
  // Never store base64 data URIs or non-HTTPS URLs in MongoDB
  if (url.startsWith('data:') || !/^https?:\/\//i.test(url)) {
    return { ...EMPTY_LOGO }
  }
  if (publicId && !publicId.startsWith('reviewbuddy/')) {
    return { ...EMPTY_LOGO }
  }

  return {
    url: url.slice(0, 600),
    publicId: publicId.slice(0, 240),
    format: sanitizeText(String(input.format || ''), 16),
    width: Math.max(0, Number(input.width) || 0),
    height: Math.max(0, Number(input.height) || 0),
  }
}

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

export function normalizeGoogleReviewUrl(raw) {
  const clean = sanitizeText(String(raw || ''), 4096)
  if (!clean) return ''
  // Auto-convert raw Google Place IDs (e.g. ChIJCcAieFGl1jsREQ6h9oXJa-8) into direct review popup links
  if (/^(?:ChIJ|GhIJ|Eh)[A-Za-z0-9_-]{10,}$/.test(clean)) {
    return `https://search.google.com/local/writereview?placeid=${clean}`
  }
  try {
    const parsed = new URL(clean)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return clean
    }
  } catch {
    // Reject non-URL / unsafe schemes (e.g. javascript:, data:)
  }
  return ''
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
    googleReviewUrl: normalizeGoogleReviewUrl(merged.googleReviewUrl),
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
      const cleanText = sanitizeText(q.text, 240)
      const category = ALLOWED_QUESTION_CATEGORIES.includes(q.category)
        ? q.category
        : classifyQuestion(cleanText).category
      return {
        id: sanitizeText(String(q.id || `q-${Date.now()}`), 64),
        text: cleanText,
        category,
        customContext:
          category === 'custom'
            ? sanitizeText(String(q.customContext || ''), 160)
            : '',
        type,
        required: type === 'short_text' ? false : Boolean(q.required),
        enabled: q.enabled !== false,
        options,
      }
    })
}

export function toPublicBusinessPayload(biz) {
  if (!biz) return null
  const publicLogoUrl = biz.logo?.url || ''
  const publicLogo = publicLogoUrl
    ? {
      url: publicLogoUrl,
      width: biz.logo?.width || 0,
      height: biz.logo?.height || 0,
    }
    : null

  if (biz.status === 'paused') {
    return {
      publicId: biz.publicId,
      name: biz.name,
      logoText: biz.logoText,
      logo: publicLogo,
      logoUrl: publicLogoUrl,
      status: 'paused',
      appearance: normalizeAppearance(biz.appearance),
    }
  }

  return {
    publicId: biz.publicId,
    name: biz.name,
    logoText: biz.logoText,
    logo: publicLogo,
    logoUrl: publicLogoUrl,
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
  const logo = obj.logo?.url ? obj.logo : { ...EMPTY_LOGO }
  const rawCreated =
    obj.createdAt instanceof Date
      ? obj.createdAt.toISOString()
      : String(obj.createdAt || new Date().toISOString())
  return {
    ...obj,
    id: obj.publicId,
    qrPublicUrl: buildQrPublicUrl(obj.publicId),
    logo,
    logoUrl: logo.url || '',
    dateAdded: rawCreated.slice(0, 10),
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function listBusinesses() {
  if (usingMongo()) {
    const docs = await Business.find().sort({ createdAt: -1 }).lean()
    return docs.map(serializeBusiness)
  }
  const items = readLocalStore()
  return items
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(serializeBusiness)
}

export async function listBusinessesPaginated({
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
} = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20))
  const cleanSearch = String(search || '').trim().slice(0, 100)
  const cleanStatus = ['active', 'paused'].includes(status) ? status : 'all'

  if (usingMongo()) {
    const filter = {}
    if (cleanStatus !== 'all') {
      filter.status = cleanStatus
    }
    if (cleanSearch) {
      const re = new RegExp(escapeRegex(cleanSearch), 'i')
      filter.$or = [
        { name: re },
        { category: re },
        { location: re },
        { email: re },
        { phone: re },
      ]
    }

    const skip = (safePage - 1) * safeLimit
    const [docs, total, statusCounts] = await Promise.all([
      Business.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Business.countDocuments(filter),
      Business.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    const counts = { all: 0, active: 0, paused: 0 }
    for (const row of statusCounts) {
      if (row._id === 'active') counts.active = row.count
      else if (row._id === 'paused') counts.paused = row.count
      counts.all += row.count
    }

    const totalPages = Math.max(1, Math.ceil(total / safeLimit))
    return {
      businesses: docs.map(serializeBusiness),
      pagination: {
        total,
        totalItems: total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      counts,
    }
  }

  const allItems = readLocalStore().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
  const counts = {
    all: allItems.length,
    active: allItems.filter((b) => b.status === 'active').length,
    paused: allItems.filter((b) => b.status === 'paused').length,
  }

  const q = cleanSearch.toLowerCase()
  const filtered = allItems.filter((b) => {
    if (cleanStatus !== 'all' && b.status !== cleanStatus) return false
    if (!q) return true
    return (
      (b.name || '').toLowerCase().includes(q) ||
      (b.category || '').toLowerCase().includes(q) ||
      (b.location || '').toLowerCase().includes(q) ||
      (b.email || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q)
    )
  })

  const total = filtered.length
  const skip = (safePage - 1) * safeLimit
  const paged = filtered.slice(skip, skip + safeLimit).map(serializeBusiness)

  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  return {
    businesses: paged,
    pagination: {
      total,
      totalItems: total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
    counts,
  }
}

export async function isLogoReferencedByAnyBusiness(publicId) {
  if (!publicId) return false
  if (usingMongo()) {
    const exists = await Business.exists({ 'logo.publicId': publicId })
    return Boolean(exists)
  }
  const items = readLocalStore()
  return items.some((b) => b.logo?.publicId === publicId)
}

export async function findBusinessByAnyId(idOrPublicId) {
  if (usingMongo()) {
    const doc = await Business.findOne({
      $or: [{ publicId: idOrPublicId }, { slug: idOrPublicId }],
    }).lean()
    return serializeBusiness(doc)
  }
  const items = readLocalStore()
  const found = items.find(
    (b) => b.publicId === idOrPublicId || b.slug === idOrPublicId,
  )
  return serializeBusiness(found)
}

export async function findPublicBusinessById(idOrPublicId) {
  if (usingMongo()) {
    return Business.findOne({
      $or: [{ publicId: idOrPublicId }, { slug: idOrPublicId }],
    })
      .select('publicId name logoText logo category location status reviewConfig appearance questions')
      .lean()
  }
  const items = readLocalStore()
  return (
    items.find(
      (b) => b.publicId === idOrPublicId || b.slug === idOrPublicId,
    ) || null
  )
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
    logo: normalizeLogo(payload.logo),
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
      totalInitialRatings: 0,
      ratingSum: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
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
    let oldPublicIdToDelete = ''
    if (updates.logo !== undefined) {
      const prevPublicId = existing.logo?.publicId || ''
      const nextLogo = normalizeLogo(updates.logo)
      existing.logo = nextLogo
      if (prevPublicId && prevPublicId !== nextLogo.publicId) {
        oldPublicIdToDelete = prevPublicId
      }
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
    if (
      oldPublicIdToDelete &&
      !(await isLogoAssetReferenced(oldPublicIdToDelete, existing.publicId))
    ) {
      await deleteImageAsset(oldPublicIdToDelete)
    }
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

  let oldPublicIdToDelete = ''
  let nextLogo = current.logo || { ...EMPTY_LOGO }
  if (updates.logo !== undefined) {
    const prevPublicId = current.logo?.publicId || ''
    nextLogo = normalizeLogo(updates.logo)
    if (prevPublicId && prevPublicId !== nextLogo.publicId) {
      oldPublicIdToDelete = prevPublicId
    }
  }

  const updated = {
    ...current,
    name: nextName,
    logoText:
      updates.name !== undefined ? generateLogoText(nextName) : current.logoText,
    logo: nextLogo,
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
  if (
    oldPublicIdToDelete &&
    !(await isLogoAssetReferenced(oldPublicIdToDelete, updated.publicId))
  ) {
    await deleteImageAsset(oldPublicIdToDelete)
  }
  return serializeBusiness(updated)
}

export async function deleteBusinessRecord(idOrPublicId) {
  if (usingMongo()) {
    const existing = await Business.findOne({
      $or: [{ publicId: idOrPublicId }, { slug: idOrPublicId }],
    })
    if (!existing) return null
    const publicId = existing.publicId
    const logoPublicId = existing.logo?.publicId || ''
    await Business.deleteOne({ _id: existing._id })
    await deleteEventsForBusiness(publicId)
    if (logoPublicId && !(await isLogoAssetReferenced(logoPublicId))) {
      await deleteImageAsset(logoPublicId)
    }
    return { deleted: true, publicId }
  }

  const items = readLocalStore()
  const idx = items.findIndex(
    (b) => b.publicId === idOrPublicId || b.slug === idOrPublicId,
  )
  if (idx === -1) return null
  const [removed] = items.splice(idx, 1)
  writeLocalStore(items)
  await deleteEventsForBusiness(removed.publicId)
  if (
    removed.logo?.publicId &&
    !(await isLogoAssetReferenced(removed.logo.publicId))
  ) {
    await deleteImageAsset(removed.logo.publicId)
  }
  return { deleted: true, publicId: removed.publicId }
}

const ALLOWED_EVENTS = new Set([
  'totalScans',
  'landingViews',
  'initialRating',
  'questionnaireStarts',
  'questionnaireCompletions',
  'reviewDraftsGenerated',
  'copyClicks',
  'googleReviewRedirects',
])

export async function incrementAnalyticsEvent(publicId, eventName, meta = {}) {
  if (!ALLOWED_EVENTS.has(eventName)) return null

  if (eventName === 'initialRating') {
    const rating = Number(meta.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null

    if (usingMongo()) {
      const doc = await Business.findOneAndUpdate(
        { $or: [{ publicId }, { slug: publicId }], status: 'active' },
        {
          $inc: {
            'analytics.totalInitialRatings': 1,
            'analytics.ratingSum': rating,
            [`analytics.ratingDistribution.${rating}`]: 1,
          },
        },
        { new: true },
      )
      if (doc) {
        await recordAnalyticsEvent({
          businessPublicId: doc.publicId,
          eventType: eventName,
          rating,
        })
      }
      return serializeBusiness(doc)
    }

    const items = readLocalStore()
    const idx = items.findIndex(
      (b) =>
        (b.publicId === publicId || b.slug === publicId) &&
        b.status === 'active',
    )
    if (idx === -1) return null

    const current = items[idx]
    current.analytics = current.analytics || {}
    current.analytics.totalInitialRatings =
      (current.analytics.totalInitialRatings || 0) + 1
    current.analytics.ratingSum = (current.analytics.ratingSum || 0) + rating
    current.analytics.ratingDistribution =
      current.analytics.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    current.analytics.ratingDistribution[rating] =
      (current.analytics.ratingDistribution[rating] || 0) + 1
    current.updatedAt = new Date().toISOString()
    writeLocalStore(items)
    await recordAnalyticsEvent({
      businessPublicId: current.publicId,
      eventType: eventName,
      rating,
    })
    return serializeBusiness(current)
  }

  if (usingMongo()) {
    const doc = await Business.findOneAndUpdate(
      { $or: [{ publicId }, { slug: publicId }], status: 'active' },
      { $inc: { [`analytics.${eventName}`]: 1 } },
      { new: true },
    )
    if (doc) {
      await recordAnalyticsEvent({
        businessPublicId: doc.publicId,
        eventType: eventName,
      })
    }
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
  await recordAnalyticsEvent({
    businessPublicId: current.publicId,
    eventType: eventName,
  })
  return serializeBusiness(current)
}

export async function recordSubmissionAnalytics(
  publicId,
  { isRegenerate = false } = {},
) {
  const incFields = isRegenerate
    ? { 'analytics.reviewDraftsGenerated': 1 }
    : {
      'analytics.questionnaireCompletions': 1,
      'analytics.reviewDraftsGenerated': 1,
    }

  const events = isRegenerate
    ? [{ businessPublicId: publicId, eventType: 'reviewDraftsGenerated' }]
    : [
      { businessPublicId: publicId, eventType: 'questionnaireCompletions' },
      { businessPublicId: publicId, eventType: 'reviewDraftsGenerated' },
    ]

  if (usingMongo()) {
    await Promise.all([
      Business.updateOne(
        { publicId, status: 'active' },
        { $inc: incFields },
      ),
      recordAnalyticsEventsBatch(events),
    ])
    return true
  }

  const items = readLocalStore()
  const idx = items.findIndex(
    (b) => b.publicId === publicId && b.status === 'active',
  )
  if (idx === -1) return false

  const current = items[idx]
  current.analytics = current.analytics || {}
  if (!isRegenerate) {
    current.analytics.questionnaireCompletions =
      (current.analytics.questionnaireCompletions || 0) + 1
  }
  current.analytics.reviewDraftsGenerated =
    (current.analytics.reviewDraftsGenerated || 0) + 1
  current.updatedAt = new Date().toISOString()
  writeLocalStore(items)
  await recordAnalyticsEventsBatch(events)
  return true
}
