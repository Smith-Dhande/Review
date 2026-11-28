import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  findDigitalCardBySlug,
  toPublicDigitalCardPayload,
} from '../repositories/digitalCardRepo.js'
import { recordDigitalCardEvent } from '../repositories/digitalCardAnalyticsRepo.js'
import { digitalCardEventSchema } from '../validators/digitalCardValidators.js'
import { buildVCardForCard } from '../services/vcardService.js'

const router = Router()
const VALID_SLUG_RE = /^[a-zA-Z0-9_-]{1,80}$/

const publicCardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a moment.' },
})

const cardEventsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many events. Please slow down.' },
})

router.use(publicCardLimiter)

router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    if (!VALID_SLUG_RE.test(slug)) {
      return res.status(400).json({ message: 'Invalid digital card identifier' })
    }
    const card = await findDigitalCardBySlug(slug)
    if (!card) {
      return res.status(404).json({ message: 'Digital card not found' })
    }
    return res.json({ card: toPublicDigitalCardPayload(card) })
  } catch (err) {
    return next(err)
  }
})

router.get('/:slug/vcard', async (req, res, next) => {
  try {
    const { slug } = req.params
    if (!VALID_SLUG_RE.test(slug)) {
      return res.status(400).json({ message: 'Invalid digital card identifier' })
    }
    const card = await findDigitalCardBySlug(slug)
    if (!card) {
      return res.status(404).json({ message: 'Digital card not found' })
    }
    if (card.status === 'paused') {
      return res.status(403).json({ message: 'This digital card is currently paused.' })
    }
    const vcf = buildVCardForCard(card)
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${card.slug}.vcf"`,
    )
    return res.send(vcf)
  } catch (err) {
    return next(err)
  }
})

router.post('/:slug/events', cardEventsLimiter, async (req, res, next) => {
  try {
    const { slug } = req.params
    if (!VALID_SLUG_RE.test(slug)) {
      return res.status(400).json({ message: 'Invalid digital card identifier' })
    }
    const parsed = digitalCardEventSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid event payload',
      })
    }
    const card = await findDigitalCardBySlug(slug)
    if (!card || card.status === 'paused') {
      return res.status(404).json({ message: 'Digital card not available' })
    }
    await recordDigitalCardEvent({
      cardSlug: card.slug,
      eventType: parsed.data.event,
      target: parsed.data.target || '',
    })
    return res.json({ ok: true })
  } catch (err) {
    return next(err)
  }
})

export default router
