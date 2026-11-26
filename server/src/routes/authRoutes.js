import { Router } from 'express'
import {
  changePassword,
  getCsrf,
  getMe,
  login,
  logout,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { requireCsrf } from '../middleware/csrfProtection.js'
import { createLoginRateLimiter } from '../middleware/rateLimiter.js'

export function createAuthRouter() {
  const router = Router()
  const loginRateLimiter = createLoginRateLimiter()

  router.get('/csrf', getCsrf)
  router.post('/login', loginRateLimiter, requireCsrf, login)
  router.post('/logout', requireAuth, requireAdmin, requireCsrf, logout)
  router.get('/me', requireAuth, requireAdmin, getMe)
  router.post(
    '/change-password',
    requireAuth,
    requireAdmin,
    requireCsrf,
    changePassword,
  )

  return router
}
