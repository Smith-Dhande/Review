import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import {
  queryAnalyticsOverview,
  queryBusinessAnalytics,
} from '../repositories/analyticsRepo.js'
import { analyticsRangeQuerySchema } from '../validators/businessValidators.js'

const router = Router()
const VALID_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/

router.use(requireAuth, requireAdmin)

function parseRangeQuery(query) {
  const parsed = analyticsRangeQuerySchema.safeParse({
    range: query.range || '30d',
    from: typeof query.from === 'string' ? query.from : undefined,
    to: typeof query.to === 'string' ? query.to : undefined,
  })
  if (!parsed.success) {
    const err = new Error(
      parsed.error.issues?.[0]?.message || 'Invalid date range parameter.',
    )
    err.status = 400
    throw err
  }
  return parsed.data
}

router.get('/overview', async (req, res, next) => {
  try {
    const { range, from, to } = parseRangeQuery(req.query)
    const overview = await queryAnalyticsOverview({ range, from, to })
    return res.json(overview)
  } catch (err) {
    return next(err)
  }
})

router.get('/business/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params
    if (!VALID_ID_RE.test(businessId)) {
      return res.status(400).json({ message: 'Invalid business identifier' })
    }
    const { range, from, to } = parseRangeQuery(req.query)
    const report = await queryBusinessAnalytics({ businessId, range, from, to })
    if (!report) {
      return res.status(404).json({ message: 'Business not found' })
    }
    return res.json(report)
  } catch (err) {
    return next(err)
  }
})

export default router
