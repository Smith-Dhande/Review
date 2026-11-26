import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  findBusinessByAnyId,
  incrementAnalyticsEvent,
  toPublicBusinessPayload,
} from '../repositories/businessRepo.js'
import { generateReviewDraft } from '../services/reviewGenerator.js'

const router = Router()

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a moment and try again.' },
})

router.use(publicLimiter)

const VALID_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/

router.get('/businesses/:publicId', async (req, res, next) => {
  try {
    const { publicId } = req.params
    if (!VALID_ID_RE.test(publicId)) {
      return res.status(400).json({ message: 'Invalid business identifier' })
    }

    const business = await findBusinessByAnyId(publicId)
    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }

    return res.json({ business: toPublicBusinessPayload(business) })
  } catch (err) {
    return next(err)
  }
})

router.post('/businesses/:publicId/questionnaire/complete', async (req, res, next) => {
  try {
    const { publicId } = req.params
    if (!VALID_ID_RE.test(publicId)) {
      return res.status(400).json({ message: 'Invalid business identifier' })
    }

    const business = await findBusinessByAnyId(publicId)
    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }

    if (business.status === 'paused') {
      return res.status(403).json({
        message: 'This business review page is currently paused.',
      })
    }

    const answers = req.body?.answers
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid questionnaire answers' })
    }

    const activeQuestions = (business.questions || []).filter(
      (q) => q.enabled !== false,
    )

    for (const q of activeQuestions) {
      if (!q.required) continue
      const val = answers[q.id]
      const empty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0)
      if (empty) {
        return res.status(400).json({
          message: `Please answer the required question: ${q.text}`,
        })
      }
    }

    const rawRating = req.body?.rating
    let rating = null
    if (rawRating !== undefined && rawRating !== null) {
      const parsed = Number(rawRating)
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
        return res
          .status(400)
          .json({ message: 'Rating must be an integer between 1 and 5' })
      }
      rating = parsed
    }

    const draft = generateReviewDraft(business, answers, {
      rating,
      variationSalt: req.body?.isRegenerate ? Date.now() : 0,
    })

    if (!req.body?.isRegenerate) {
      await incrementAnalyticsEvent(business.publicId, 'questionnaireCompletions')
    }
    await incrementAnalyticsEvent(business.publicId, 'reviewDraftsGenerated')

    return res.json({ draft })
  } catch (err) {
    return next(err)
  }
})

router.post('/businesses/:publicId/events', async (req, res, next) => {
  try {
    const { publicId } = req.params
    const event = String(req.body?.event || '')
    if (!VALID_ID_RE.test(publicId)) {
      return res.status(400).json({ message: 'Invalid business identifier' })
    }

    const updated = await incrementAnalyticsEvent(publicId, event, {
      rating: req.body?.rating,
    })
    if (!updated) {
      return res.status(404).json({ message: 'Business or event not available' })
    }

    return res.json({ ok: true })
  } catch (err) {
    return next(err)
  }
})

export default router
