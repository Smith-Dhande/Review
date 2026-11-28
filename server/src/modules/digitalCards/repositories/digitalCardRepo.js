import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import DigitalCard from '../models/DigitalCard.js'
import { usingMongo } from '../../../config/db.js'
import { sanitizeText } from '../../../services/reviewGenerator.js'
import { deleteImageAsset } from '../../../services/imageStorageService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_CARDS_FILE = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'data',
  'digitalCards.json',
)

function getCardsFile() {
  return process.env.LOCAL_DIGITAL_CARDS_FILE || DEFAULT_CARDS_FILE
}

function readLocalCards() {
  const file = getCardsFile()
  if (!fs.existsSync(file)) return []
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return []
  }
}

function writeLocalCards(cards) {
  const file = getCardsFile()
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(file, JSON.stringify(cards, null, 2), 'utf-8')
}

export function buildCardPublicUrl(slug) {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(
    /\/+$/,
    '',
  )
  return `${base}/card/${slug}`
}

function slugifyName(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 28)
}

async function generateUniqueSlug(name) {
  const base = slugifyName(name) || 'card'
  for (let i = 0; i < 6; i += 1) {
    const suffix = crypto.randomBytes(3).toString('hex')
    const candidate = `${base}-${suffix}`
    const exists = usingMongo()
      ? Boolean(await DigitalCard.exists({ slug: candidate }))
      : readLocalCards().some((c) => c.slug === candidate)
    if (!exists) return candidate
  }
  return `${base}-${crypto.randomBytes(5).toString('hex')}`
}

function normalizeAsset(input) {
  if (!input || typeof input !== 'object') {
    return { url: '', publicId: '', format: '', width: 0, height: 0 }
  }
  const url = typeof input.url === 'string' ? input.url.trim() : ''
  const publicId =
    typeof input.publicId === 'string' ? input.publicId.trim() : ''
  if (!url || url.startsWith('data:') || !/^https?:\/\//i.test(url)) {
    return { url: '', publicId: '', format: '', width: 0, height: 0 }
  }
  if (publicId && !publicId.startsWith('reviewbuddy/')) {
    return { url: '', publicId: '', format: '', width: 0, height: 0 }
  }
  return {
    url: url.slice(0, 800),
    publicId: publicId.slice(0, 240),
    format: sanitizeText(String(input.format || ''), 16),
    width: Math.max(0, Number(input.width) || 0),
    height: Math.max(0, Number(input.height) || 0),
  }
}

const DEFAULT_ACTIONS = [
  { id: 'act-call', type: 'call', label: 'Call Now', enabled: true, order: 0 },
  { id: 'act-wa', type: 'whatsapp', label: 'WhatsApp', enabled: true, order: 1 },
  { id: 'act-email', type: 'email', label: 'Email', enabled: true, order: 2 },
  { id: 'act-save', type: 'save_contact', label: 'Save Contact', enabled: true, order: 3 },
  { id: 'act-web', type: 'website', label: 'Visit Website', enabled: true, order: 4 },
  { id: 'act-dir', type: 'directions', label: 'Get Directions', enabled: true, order: 5 },
]

const DEFAULT_VISIBILITY = {
  showProfilePicture: true,
  showCoverImage: true,
  showCompanyLogo: true,
  showJobTitle: true,
  showProfession: true,
  showCompanyName: true,
  showTagline: true,
  showShortBio: true,
  showLongBio: true,
  showLocation: true,
  showAddress: true,
  showPhone: true,
  showSecondaryPhone: true,
  showEmail: true,
  showWhatsapp: true,
  showWebsite: true,
  showGoogleMaps: true,
  showSocialLinks: true,
  showSaveContact: true,
  showCustomSections: true,
}

export function collectCardAssetIds(card) {
  const ids = new Set()
  if (!card) return ids
  const p = card.personalInformation || {}
  if (p.profilePicture?.publicId) ids.add(p.profilePicture.publicId)
  if (p.coverImage?.publicId) ids.add(p.coverImage.publicId)
  if (p.companyLogo?.publicId) ids.add(p.companyLogo.publicId)
  if (card.appearance?.backgroundImage?.publicId) {
    ids.add(card.appearance.backgroundImage.publicId)
  }
  for (const sec of card.customSections || []) {
    for (const item of sec.items || []) {
      if (item.image?.publicId) ids.add(item.image.publicId)
    }
  }
  return ids
}

export async function isDigitalCardAssetReferenced(
  publicId,
  excludeCardSlug = '',
) {
  if (!publicId || typeof publicId !== 'string') return false
  if (usingMongo()) {
    const slugFilter = excludeCardSlug ? { slug: { $ne: excludeCardSlug } } : {}
    const exists = await DigitalCard.exists({
      ...slugFilter,
      $or: [
        { 'personalInformation.profilePicture.publicId': publicId },
        { 'personalInformation.coverImage.publicId': publicId },
        { 'personalInformation.companyLogo.publicId': publicId },
        { 'appearance.backgroundImage.publicId': publicId },
        { 'customSections.items.image.publicId': publicId },
      ],
    })
    return Boolean(exists)
  }
  return readLocalCards().some((c) => {
    if (excludeCardSlug && c.slug === excludeCardSlug) return false
    return collectCardAssetIds(c).has(publicId)
  })
}

function serializeCard(doc) {
  if (!doc) return null
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc
  return {
    ...obj,
    id: obj.slug,
    publicUrl: buildCardPublicUrl(obj.slug),
  }
}

export function toPublicDigitalCardPayload(card) {
  if (!card) return null
  const c = serializeCard(card)
  if (c.status === 'paused') {
    return {
      slug: c.slug,
      name: c.name,
      status: 'paused',
      templateId: c.templateId,
      appearance: c.appearance,
    }
  }

  const v = { ...DEFAULT_VISIBILITY, ...(c.visibilitySettings || {}) }
  const p = c.personalInformation || {}
  const ci = c.contactInformation || {}

  return {
    slug: c.slug,
    publicUrl: c.publicUrl,
    name: c.name,
    status: c.status,
    templateId: c.templateId,
    appearance: c.appearance,
    visibilitySettings: v,
    personalInformation: {
      fullName: p.fullName || c.name,
      profilePicture: v.showProfilePicture ? p.profilePicture : null,
      coverImage: v.showCoverImage ? p.coverImage : null,
      companyLogo: v.showCompanyLogo ? p.companyLogo : null,
      jobTitle: v.showJobTitle ? p.jobTitle : '',
      profession: v.showProfession ? p.profession : '',
      companyName: v.showCompanyName ? p.companyName : '',
      tagline: v.showTagline ? p.tagline : '',
      shortBio: v.showShortBio ? p.shortBio : '',
      longBio: v.showLongBio ? p.longBio : '',
      location: v.showLocation ? p.location : '',
      address: v.showAddress ? p.address : '',
      googleMapsUrl: v.showGoogleMaps ? p.googleMapsUrl : '',
      websiteUrl: v.showWebsite ? p.websiteUrl : '',
    },
    contactInformation: {
      phone: v.showPhone ? ci.phone : '',
      secondaryPhone: v.showSecondaryPhone ? ci.secondaryPhone : '',
      email: v.showEmail ? ci.email : '',
      whatsappNumber: v.showWhatsapp ? ci.whatsappNumber : '',
      whatsappMessage: v.showWhatsapp ? ci.whatsappMessage : '',
      website: v.showWebsite ? ci.website : '',
      businessAddress: v.showAddress ? ci.businessAddress : '',
      googleMapsUrl: v.showGoogleMaps ? ci.googleMapsUrl : '',
      actions: (ci.actions || []).filter((a) => a.enabled !== false),
    },
    socialLinks: v.showSocialLinks
      ? {
          displayStyle: c.socialLinks?.displayStyle || 'icon_label',
          items: (c.socialLinks?.items || []).filter(
            (s) => s.enabled !== false && s.url,
          ),
        }
      : { displayStyle: 'icon_label', items: [] },
    customSections: v.showCustomSections
      ? (c.customSections || []).filter((sec) => sec.visible !== false)
      : [],
  }
}

function normalizeCardInput(payload = {}, existing = null) {
  const prevP = existing?.personalInformation || {}
  const inP = payload.personalInformation || {}
  const prevC = existing?.contactInformation || {}
  const inC = payload.contactInformation || {}

  return {
    name: sanitizeText(payload.name ?? existing?.name ?? '', 140),
    status:
      (payload.status ?? existing?.status) === 'paused' ? 'paused' : 'active',
    templateId: payload.templateId ?? existing?.templateId ?? 'minimal-white',
    personalInformation: {
      fullName: sanitizeText(inP.fullName ?? prevP.fullName ?? '', 140),
      profilePicture:
        inP.profilePicture !== undefined
          ? normalizeAsset(inP.profilePicture)
          : normalizeAsset(prevP.profilePicture),
      coverImage:
        inP.coverImage !== undefined
          ? normalizeAsset(inP.coverImage)
          : normalizeAsset(prevP.coverImage),
      companyLogo:
        inP.companyLogo !== undefined
          ? normalizeAsset(inP.companyLogo)
          : normalizeAsset(prevP.companyLogo),
      jobTitle: sanitizeText(inP.jobTitle ?? prevP.jobTitle ?? '', 120),
      profession: sanitizeText(inP.profession ?? prevP.profession ?? '', 120),
      companyName: sanitizeText(inP.companyName ?? prevP.companyName ?? '', 140),
      shortBio: sanitizeText(inP.shortBio ?? prevP.shortBio ?? '', 320),
      longBio: sanitizeText(inP.longBio ?? prevP.longBio ?? '', 2000),
      tagline: sanitizeText(inP.tagline ?? prevP.tagline ?? '', 160),
      location: sanitizeText(inP.location ?? prevP.location ?? '', 160),
      address: sanitizeText(inP.address ?? prevP.address ?? '', 300),
      googleMapsUrl: String(inP.googleMapsUrl ?? prevP.googleMapsUrl ?? '').trim(),
      websiteUrl: String(inP.websiteUrl ?? prevP.websiteUrl ?? '').trim(),
    },
    contactInformation: {
      phone: sanitizeText(inC.phone ?? prevC.phone ?? '', 40),
      secondaryPhone: sanitizeText(
        inC.secondaryPhone ?? prevC.secondaryPhone ?? '',
        40,
      ),
      email: sanitizeText(inC.email ?? prevC.email ?? '', 140),
      whatsappNumber: sanitizeText(
        inC.whatsappNumber ?? prevC.whatsappNumber ?? '',
        40,
      ),
      whatsappMessage: sanitizeText(
        inC.whatsappMessage ?? prevC.whatsappMessage ?? '',
        300,
      ),
      website: String(inC.website ?? prevC.website ?? '').trim(),
      businessAddress: sanitizeText(
        inC.businessAddress ?? prevC.businessAddress ?? '',
        300,
      ),
      googleMapsUrl: String(
        inC.googleMapsUrl ?? prevC.googleMapsUrl ?? '',
      ).trim(),
      actions:
        inC.actions ??
        (prevC.actions?.length ? prevC.actions : DEFAULT_ACTIONS),
    },
    socialLinks: payload.socialLinks ??
      existing?.socialLinks ?? { displayStyle: 'icon_label', items: [] },
    customSections: (payload.customSections ?? existing?.customSections ?? []).map(
      (sec) => ({
        ...sec,
        items: (sec.items || []).map((it) => ({
          ...it,
          image: normalizeAsset(it.image),
        })),
      }),
    ),
    appearance: {
      ...(existing?.appearance || {}),
      ...(payload.appearance || {}),
      backgroundImage:
        payload.appearance?.backgroundImage !== undefined
          ? normalizeAsset(payload.appearance.backgroundImage)
          : normalizeAsset(existing?.appearance?.backgroundImage),
    },
    visibilitySettings: {
      ...DEFAULT_VISIBILITY,
      ...(existing?.visibilitySettings || {}),
      ...(payload.visibilitySettings || {}),
    },
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function listDigitalCardsPaginated({
  page = 1,
  limit = 12,
  search = '',
  status = 'all',
} = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 12))
  const cleanSearch = String(search || '').trim().slice(0, 100)
  const cleanStatus = ['active', 'paused'].includes(status) ? status : 'all'

  if (usingMongo()) {
    const filter = {}
    if (cleanStatus !== 'all') filter.status = cleanStatus
    if (cleanSearch) {
      const re = new RegExp(escapeRegex(cleanSearch), 'i')
      filter.$or = [
        { name: re },
        { 'personalInformation.fullName': re },
        { 'personalInformation.profession': re },
        { 'personalInformation.jobTitle': re },
        { 'personalInformation.companyName': re },
      ]
    }
    const skip = (safePage - 1) * safeLimit
    const [docs, total, statusAgg] = await Promise.all([
      DigitalCard.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      DigitalCard.countDocuments(filter),
      DigitalCard.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ])
    const counts = { all: 0, active: 0, paused: 0 }
    for (const row of statusAgg) {
      if (row._id === 'active') counts.active = row.count
      else if (row._id === 'paused') counts.paused = row.count
      counts.all += row.count
    }
    return {
      cards: docs.map(serializeCard),
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
      counts,
    }
  }

  const all = readLocalCards().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
  const counts = {
    all: all.length,
    active: all.filter((c) => c.status === 'active').length,
    paused: all.filter((c) => c.status === 'paused').length,
  }
  const q = cleanSearch.toLowerCase()
  const filtered = all.filter((c) => {
    if (cleanStatus !== 'all' && c.status !== cleanStatus) return false
    if (!q) return true
    const p = c.personalInformation || {}
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.profession || '').toLowerCase().includes(q) ||
      (p.jobTitle || '').toLowerCase().includes(q) ||
      (p.companyName || '').toLowerCase().includes(q)
    )
  })
  const skip = (safePage - 1) * safeLimit
  return {
    cards: filtered.slice(skip, skip + safeLimit).map(serializeCard),
    pagination: {
      total: filtered.length,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(filtered.length / safeLimit)),
    },
    counts,
  }
}

export async function findDigitalCardBySlug(slug) {
  if (!slug) return null
  if (usingMongo()) {
    const doc = await DigitalCard.findOne({ slug }).lean()
    return serializeCard(doc)
  }
  const found = readLocalCards().find((c) => c.slug === slug)
  return serializeCard(found)
}

export async function createDigitalCardRecord(payload) {
  const normalized = normalizeCardInput(payload)
  if (!normalized.name) {
    const err = new Error('Card name is required')
    err.status = 400
    throw err
  }
  const slug = await generateUniqueSlug(normalized.name)
  const publicUrl = buildCardPublicUrl(slug)
  const now = new Date().toISOString()

  if (usingMongo()) {
    const created = await DigitalCard.create({
      ...normalized,
      slug,
      publicUrl,
    })
    return serializeCard(created)
  }

  const cards = readLocalCards()
  const record = {
    ...normalized,
    slug,
    publicUrl,
    createdAt: now,
    updatedAt: now,
  }
  cards.unshift(record)
  writeLocalCards(cards)
  return serializeCard(record)
}

export async function updateDigitalCardRecord(slug, updates) {
  const existing = await findDigitalCardBySlug(slug)
  if (!existing) return null

  const oldAssets = collectCardAssetIds(existing)
  const merged = normalizeCardInput(updates, existing)
  const newAssets = collectCardAssetIds(merged)

  if (usingMongo()) {
    const updated = await DigitalCard.findOneAndUpdate(
      { slug },
      { $set: { ...merged, publicUrl: buildCardPublicUrl(slug) } },
      { new: true, runValidators: true },
    ).lean()
    for (const oldId of oldAssets) {
      if (!newAssets.has(oldId) && !(await isDigitalCardAssetReferenced(oldId, slug))) {
        await deleteImageAsset(oldId)
      }
    }
    return serializeCard(updated)
  }

  const cards = readLocalCards()
  const idx = cards.findIndex((c) => c.slug === slug)
  if (idx === -1) return null
  const updated = {
    ...cards[idx],
    ...merged,
    slug,
    publicUrl: buildCardPublicUrl(slug),
    updatedAt: new Date().toISOString(),
  }
  cards[idx] = updated
  writeLocalCards(cards)
  for (const oldId of oldAssets) {
    if (!newAssets.has(oldId) && !(await isDigitalCardAssetReferenced(oldId, slug))) {
      await deleteImageAsset(oldId)
    }
  }
  return serializeCard(updated)
}

export async function duplicateDigitalCardRecord(slug) {
  const existing = await findDigitalCardBySlug(slug)
  if (!existing) return null
  const copyName = `${existing.name} (Copy)`.slice(0, 140)
  return createDigitalCardRecord({
    ...existing,
    name: copyName,
    status: 'paused',
  })
}

export async function deleteDigitalCardRecord(slug, deleteEventsFn) {
  const existing = await findDigitalCardBySlug(slug)
  if (!existing) return null

  const assets = collectCardAssetIds(existing)

  if (usingMongo()) {
    await DigitalCard.deleteOne({ slug })
  } else {
    const cards = readLocalCards().filter((c) => c.slug !== slug)
    writeLocalCards(cards)
  }

  if (deleteEventsFn) {
    await deleteEventsFn(slug)
  }

  for (const assetId of assets) {
    if (!(await isDigitalCardAssetReferenced(assetId))) {
      await deleteImageAsset(assetId)
    }
  }

  return { deleted: true, slug }
}
