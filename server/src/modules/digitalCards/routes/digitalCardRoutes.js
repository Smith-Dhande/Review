import { Router } from 'express'
import { requireAuth } from '../../../middleware/requireAuth.js'
import { requireAdmin } from '../../../middleware/requireAdmin.js'
import { requireCsrf } from '../../../middleware/csrfProtection.js'
import {
  cardStatusSchema,
  createDigitalCardSchema,
  listDigitalCardsQuerySchema,
  updateDigitalCardSchema,
} from '../validators/digitalCardValidators.js'
import {
  collectCardAssetIds,
  createDigitalCardRecord,
  deleteDigitalCardRecord,
  duplicateDigitalCardRecord,
  findDigitalCardBySlug,
  isDigitalCardAssetReferenced,
  listDigitalCardsPaginated,
  updateDigitalCardRecord,
} from '../repositories/digitalCardRepo.js'
import {
  deleteDigitalCardEvents,
  queryDigitalCardAnalytics,
  queryDigitalCardsOverview,
} from '../repositories/digitalCardAnalyticsRepo.js'
import {
  generateQrDataUrl,
  generateQrPngBuffer,
  generateQrSvgString,
} from '../../../services/qrService.js'
import { deleteImageAsset } from '../../../services/imageStorageService.js'
import { clearPendingLogoFromSession } from '../../../controllers/uploadController.js'

const router = Router()
const VALID_SLUG_RE = /^[a-zA-Z0-9_-]{1,80}$/
const ALLOWED_RANGES = new Set(['7d', '30d', '90d', 'custom'])

router.use(requireAuth, requireAdmin, requireCsrf)

router.param('id', (req, res, next, id) => {
  if (!VALID_SLUG_RE.test(id)) {
    return res.status(400).json({ message: 'Invalid digital card identifier' })
  }
  return next()
})

function parseRangeQuery(query) {
  const rawRange = String(query.range || '30d')
  if (!ALLOWED_RANGES.has(rawRange)) {
    const err = new Error('Invalid date range parameter.')
    err.status = 400
    throw err
  }
  return {
    range: rawRange,
    from: typeof query.from === 'string' ? query.from : undefined,
    to: typeof query.to === 'string' ? query.to : undefined,
  }
}

async function cleanupPendingAssetsOnFailure(payload, req) {
  const pending = Array.isArray(req.session?.pendingLogoUploads)
    ? req.session.pendingLogoUploads
    : []
  if (!pending.length) return
  const candidateIds = collectCardAssetIds(payload)
  for (const assetId of candidateIds) {
    if (!pending.includes(assetId)) continue
    if (await isDigitalCardAssetReferenced(assetId)) continue
    await deleteImageAsset(assetId)
    clearPendingLogoFromSession(req, assetId)
  }
}

function clearSavedAssetsFromSession(card, req) {
  for (const assetId of collectCardAssetIds(card)) {
    clearPendingLogoFromSession(req, assetId)
  }
}

router.get('/analytics/overview', async (req, res, next) => {
  try {
    const rangeParams = parseRangeQuery(req.query)
    const overview = await queryDigitalCardsOverview(rangeParams)
    return res.json(overview)
  } catch (err) {
    return next(err)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const parsed = listDigitalCardsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid query parameters',
      })
    }
    const result = await listDigitalCardsPaginated(parsed.data)
    return res.json(result)
  } catch (err) {
    return next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const parsed = createDigitalCardSchema.safeParse(req.body)
    if (!parsed.success) {
      await cleanupPendingAssetsOnFailure(req.body, req)
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid digital card data',
      })
    }
    const card = await createDigitalCardRecord(parsed.data)
    clearSavedAssetsFromSession(card, req)
    return res.status(201).json({ card })
  } catch (err) {
    await cleanupPendingAssetsOnFailure(req.body, req).catch(() => {})
    return next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const card = await findDigitalCardBySlug(req.params.id)
    if (!card) {
      return res.status(404).json({ message: 'Digital card not found' })
    }
    return res.json({ card })
  } catch (err) {
    return next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateDigitalCardSchema.safeParse(req.body)
    if (!parsed.success) {
      await cleanupPendingAssetsOnFailure(req.body, req)
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid digital card update',
      })
    }
    const card = await updateDigitalCardRecord(req.params.id, parsed.data)
    if (!card) {
      await cleanupPendingAssetsOnFailure(req.body, req)
      return res.status(404).json({ message: 'Digital card not found' })
    }
    clearSavedAssetsFromSession(card, req)
    return res.json({ card })
  } catch (err) {
    await cleanupPendingAssetsOnFailure(req.body, req).catch(() => {})
    return next(err)
  }
})

router.patch('/:id/status', async (req, res, next) => {
  try {
    const parsed = cardStatusSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid status',
      })
    }
    const card = await updateDigitalCardRecord(req.params.id, {
      status: parsed.data.status,
    })
    if (!card) {
      return res.status(404).json({ message: 'Digital card not found' })
    }
    return res.json({ card })
  } catch (err) {
    return next(err)
  }
})

router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const card = await duplicateDigitalCardRecord(req.params.id)
    if (!card) {
      return res.status(404).json({ message: 'Digital card not found' })
    }
    return res.status(201).json({ card })
  } catch (err) {
    return next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await deleteDigitalCardRecord(
      req.params.id,
      deleteDigitalCardEvents,
    )
    if (!result) {
      return res.status(404).json({ message: 'Digital card not found' })
    }
    return res.json(result)
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/analytics', async (req, res, next) => {
  try {
    const card = await findDigitalCardBySlug(req.params.id)
    if (!card) {
      return res.status(404).json({ message: 'Digital card not found' })
    }
    const rangeParams = parseRangeQuery(req.query)
    const report = await queryDigitalCardAnalytics({
      slug: card.slug,
      ...rangeParams,
    })
    return res.json(report)
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/qr', async (req, res, next) => {
  try {
    const card = await findDigitalCardBySlug(req.params.id)
    if (!card) {
      return res.status(404).json({ message: 'Digital card not found' })
    }
    const format = String(req.query.format || 'json').toLowerCase()
    if (format === 'png') {
      const png = await generateQrPngBuffer(card.publicUrl)
      res.setHeader('Content-Type', 'image/png')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${card.slug}-card-qr.png"`,
      )
      return res.send(png)
    }
    if (format === 'svg') {
      const svg = await generateQrSvgString(card.publicUrl)
      res.setHeader('Content-Type', 'image/svg+xml')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${card.slug}-card-qr.svg"`,
      )
      return res.send(svg)
    }
    const dataUrl = await generateQrDataUrl(card.publicUrl)
    return res.json({ publicUrl: card.publicUrl, dataUrl })
  } catch (err) {
    return next(err)
  }
})

export default router
