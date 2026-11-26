import { Router } from 'express'
import {
  issueAdminToken,
  requireAdmin,
  revokeAdminToken,
} from '../middleware/auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  const expectedEmail = (
    process.env.ADMIN_EMAIL || 'admin@reviewbuddy.com'
  ).toLowerCase()
  const expectedPassword = process.env.ADMIN_PASSWORD || 'password'

  if (email !== expectedEmail || password !== expectedPassword) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const token = issueAdminToken(email)
  return res.json({
    token,
    user: {
      id: '1',
      name: 'Admin',
      email,
      role: 'Administrator',
    },
  })
})

router.post('/logout', requireAdmin, (req, res) => {
  const token = (req.headers.authorization || '').slice(7).trim()
  revokeAdminToken(token)
  return res.json({ ok: true })
})

export default router
