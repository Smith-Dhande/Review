import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { requireCsrf } from '../middleware/csrfProtection.js'
import { uploadLogoMiddleware } from '../middleware/uploadMiddleware.js'
import { cleanupTempLogo, uploadLogo } from '../controllers/uploadController.js'

export function createUploadRouter() {
  const router = Router()

  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many upload requests. Please slow down.' },
  })

  router.post(
    '/logo',
    requireAuth,
    requireAdmin,
    requireCsrf,
    uploadLimiter,
    uploadLogoMiddleware,
    uploadLogo,
  )

  router.delete(
    '/logo',
    requireAuth,
    requireAdmin,
    requireCsrf,
    cleanupTempLogo,
  )

  return router
}
