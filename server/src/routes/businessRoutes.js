import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { requireCsrf } from '../middleware/csrfProtection.js'
import {
  createBusinessRecord,
  deleteBusinessRecord,
  findBusinessByAnyId,
  isLogoAssetReferenced,
  listBusinesses,
  listBusinessesPaginated,
  updateBusinessRecord,
} from '../repositories/businessRepo.js'
import { deleteImageAsset } from '../services/imageStorageService.js'
import {
  businessListQuerySchema,
  createBusinessSchema,
  updateBusinessSchema,
  updateQuestionsSchema,
} from '../validators/businessValidators.js'
import {
  generateQrDataUrl,
  generateQrPngBuffer,
  generateQrSvgString,
} from '../services/qrService.js'
import { classifyQuestion } from '../services/reviewGeneration/questionClassifier.js'
import { clearPendingLogoFromSession } from '../controllers/uploadController.js'
import { buildQrPublicUrl } from '../config/seedData.js'
import { getEnvConfig } from '../config/environment.js'

const router = Router()

const VALID_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/
const classifyQuestionSchema = z.object({
  text: z.string().max(400, 'Question text must be 400 characters or fewer'),
})

router.use(requireAuth, requireAdmin, requireCsrf)

router.param('id', (req, res, next, id) => {
  if (!VALID_ID_RE.test(id)) {
    return res.status(400).json({ message: 'Invalid business identifier' })
  }
  return next()
})

router.post('/classify-question', (req, res) => {
  const parsed = classifyQuestionSchema.safeParse(req.body || {})
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues?.[0]?.message || 'Invalid question text',
    })
  }
  const result = classifyQuestion(parsed.data.text)
  return res.json(result)
})

router.get('/export', async (_req, res, next) => {
  try {
    const items = await listBusinesses()
    const payload = {
      exportedAt: new Date().toISOString(),
      count: items.length,
      businesses: items,
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reviewbuddy-businesses-export.json"',
    )
    return res.send(JSON.stringify(payload, null, 2))
  } catch (err) {
    return next(err)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const parsed = businessListQuerySchema.safeParse(req.query || {})
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid business query parameters',
      })
    }
    const result = await listBusinessesPaginated(parsed.data)
    return res.json(result)
  } catch (err) {
    return next(err)
  }
})

async function cleanupOrphanLogoOnFailure(logoPublicId, req) {
  if (!logoPublicId || !String(logoPublicId).startsWith('reviewbuddy/')) return
  const pending = Array.isArray(req.session?.pendingLogoUploads)
    ? req.session.pendingLogoUploads
    : []
  if (!pending.includes(logoPublicId)) return
  if (await isLogoAssetReferenced(logoPublicId)) return
  await deleteImageAsset(logoPublicId)
  clearPendingLogoFromSession(req, logoPublicId)
}

router.post('/', async (req, res, next) => {
  try {
    const parsed = createBusinessSchema.safeParse(req.body)
    if (!parsed.success) {
      await cleanupOrphanLogoOnFailure(req.body?.logo?.publicId, req)
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid business data',
      })
    }
    const created = await createBusinessRecord(parsed.data)
    if (created.logo?.publicId) {
      clearPendingLogoFromSession(req, created.logo.publicId)
    }
    return res.status(201).json({ business: created })
  } catch (err) {
    await cleanupOrphanLogoOnFailure(req.body?.logo?.publicId, req).catch(() => { })
    return next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const business = await findBusinessByAnyId(req.params.id)
    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }
    return res.json({ business })
  } catch (err) {
    return next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateBusinessSchema.safeParse(req.body)
    if (!parsed.success) {
      await cleanupOrphanLogoOnFailure(req.body?.logo?.publicId, req)
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid business update',
      })
    }
    const updated = await updateBusinessRecord(req.params.id, parsed.data)
    if (!updated) {
      await cleanupOrphanLogoOnFailure(req.body?.logo?.publicId, req)
      return res.status(404).json({ message: 'Business not found' })
    }
    if (updated.logo?.publicId) {
      clearPendingLogoFromSession(req, updated.logo.publicId)
    }
    return res.json({ business: updated })
  } catch (err) {
    await cleanupOrphanLogoOnFailure(req.body?.logo?.publicId, req).catch(() => { })
    return next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await deleteBusinessRecord(req.params.id)
    if (!result) {
      return res.status(404).json({ message: 'Business not found' })
    }
    return res.json(result)
  } catch (err) {
    return next(err)
  }
})

router.put('/:id/questions', async (req, res, next) => {
  try {
    const parsed = updateQuestionsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid questionnaire',
      })
    }
    const updated = await updateBusinessRecord(req.params.id, {
      questions: parsed.data.questions,
    })
    if (!updated) {
      return res.status(404).json({ message: 'Business not found' })
    }
    return res.json({ business: updated })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/qr', async (req, res, next) => {
  try {
    const business = await findBusinessByAnyId(req.params.id)
    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }

    const format = String(req.query.format || 'json').toLowerCase()
    const fileSlug = business.slug || business.publicId
    const configuredFrontend = getEnvConfig().frontendUrl
    const effectiveQrUrl =
      !business.qrPublicUrl ||
      (/localhost|127\.0\.0\.1/i.test(business.qrPublicUrl) &&
        !/localhost|127\.0\.0\.1/i.test(configuredFrontend))
        ? buildQrPublicUrl(business.publicId)
        : business.qrPublicUrl

    if (format === 'png') {
      const pngBuffer = await generateQrPngBuffer(effectiveQrUrl)
      res.setHeader('Content-Type', 'image/png')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileSlug}-review-qr.png"`,
      )
      return res.send(pngBuffer)
    }

    if (format === 'svg') {
      const svg = await generateQrSvgString(effectiveQrUrl)
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileSlug}-review-qr.svg"`,
      )
      return res.send(svg)
    }

    const [dataUrl, svg] = await Promise.all([
      generateQrDataUrl(effectiveQrUrl),
      generateQrSvgString(effectiveQrUrl),
    ])

    return res.json({
      publicId: business.publicId,
      qrPublicUrl: effectiveQrUrl,
      dataUrl,
      svg,
    })
  } catch (err) {
    return next(err)
  }
})

export default router
