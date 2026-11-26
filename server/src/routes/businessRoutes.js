import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { requireCsrf } from '../middleware/csrfProtection.js'
import {
  createBusinessRecord,
  findBusinessByAnyId,
  listBusinesses,
  updateBusinessRecord,
} from '../repositories/businessRepo.js'
import {
  generateQrDataUrl,
  generateQrPngBuffer,
  generateQrSvgString,
} from '../services/qrService.js'
import { classifyQuestion } from '../services/reviewGeneration/questionClassifier.js'

const router = Router()

router.use(requireAuth, requireAdmin, requireCsrf)

router.post('/classify-question', (req, res) => {
  const text = String(req.body?.text || '')
  const result = classifyQuestion(text)
  return res.json(result)
})

router.get('/', async (_req, res, next) => {
  try {
    const items = await listBusinesses()
    res.json({ businesses: items })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const created = await createBusinessRecord(req.body)
    res.status(201).json({ business: created })
  } catch (err) {
    next(err)
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
    const updated = await updateBusinessRecord(req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ message: 'Business not found' })
    }
    return res.json({ business: updated })
  } catch (err) {
    return next(err)
  }
})

router.put('/:id/questions', async (req, res, next) => {
  try {
    const updated = await updateBusinessRecord(req.params.id, {
      questions: req.body?.questions || [],
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

    if (format === 'png') {
      const pngBuffer = await generateQrPngBuffer(business.qrPublicUrl)
      res.setHeader('Content-Type', 'image/png')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileSlug}-review-qr.png"`,
      )
      return res.send(pngBuffer)
    }

    if (format === 'svg') {
      const svg = await generateQrSvgString(business.qrPublicUrl)
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileSlug}-review-qr.svg"`,
      )
      return res.send(svg)
    }

    const [dataUrl, svg] = await Promise.all([
      generateQrDataUrl(business.qrPublicUrl),
      generateQrSvgString(business.qrPublicUrl),
    ])

    return res.json({
      publicId: business.publicId,
      qrPublicUrl: business.qrPublicUrl,
      dataUrl,
      svg,
    })
  } catch (err) {
    return next(err)
  }
})

export default router
