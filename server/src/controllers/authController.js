import {
  authenticateAdmin,
  changeAdminPassword,
} from '../services/authService.js'
import {
  changePasswordSchema,
  loginSchema,
} from '../validators/authValidators.js'
import { ensureCsrfToken } from '../middleware/csrfProtection.js'
import { clearSessionCookie } from '../config/session.js'
import { getEnvConfig } from '../config/environment.js'
import { updateAdminProfile } from '../repositories/adminRepo.js'
import { z } from 'zod'

function formatZodError(error) {
  return error.issues?.[0]?.message || 'Invalid request input.'
}

export function getCsrf(req, res, next) {
  const csrfToken = ensureCsrfToken(req)
  if (!req.session) {
    return res.json({ csrfToken })
  }
  return req.session.save((err) => {
    if (err) return next(err)
    return res.json({ csrfToken })
  })
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodError(parsed.error) })
    }

    const admin = await authenticateAdmin(
      parsed.data.email,
      parsed.data.password,
    )

    // Regenerate session ID to prevent session fixation
    return req.session.regenerate((regenErr) => {
      if (regenErr) return next(regenErr)

      req.session.adminId = admin.id
      req.session.sessionVersion = admin.sessionVersion
      req.session.createdAt = Date.now()
      const csrfToken = ensureCsrfToken(req)

      return req.session.save((saveErr) => {
        if (saveErr) return next(saveErr)
        return res.json({
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
          csrfToken,
        })
      })
    })
  } catch (err) {
    return next(err)
  }
}

export function logout(req, res, next) {
  const env = getEnvConfig()
  if (!req.session) {
    clearSessionCookie(res, env)
    return res.json({ ok: true })
  }

  return req.session.destroy((err) => {
    if (err) return next(err)
    clearSessionCookie(res, env)
    return res.json({ ok: true })
  })
}

export function getMe(req, res) {
  const csrfToken = ensureCsrfToken(req)
  return res.json({
    user: {
      id: req.admin.id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      emailNotifications: req.admin.emailNotifications ?? true,
    },
    csrfToken,
  })
}

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120).optional(),
  emailNotifications: z.boolean().optional(),
})

export async function updateMe(req, res, next) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodError(parsed.error) })
    }
    const updated = await updateAdminProfile(req.admin.id, parsed.data)
    if (!updated) {
      return res.status(404).json({ message: 'Administrator not found.' })
    }
    return res.json({ user: updated })
  } catch (err) {
    return next(err)
  }
}

export async function changePassword(req, res, next) {
  try {
    const parsed = changePasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodError(parsed.error) })
    }

    const updatedAdmin = await changeAdminPassword(
      req.admin.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    )

    // Rotate current session with incremented sessionVersion; all other sessions are now invalid
    return req.session.regenerate((regenErr) => {
      if (regenErr) return next(regenErr)

      req.session.adminId = updatedAdmin.id
      req.session.sessionVersion = updatedAdmin.sessionVersion
      req.session.createdAt = Date.now()
      const csrfToken = ensureCsrfToken(req)

      return req.session.save((saveErr) => {
        if (saveErr) return next(saveErr)
        return res.json({
          message: 'Password updated successfully.',
          csrfToken,
        })
      })
    })
  } catch (err) {
    return next(err)
  }
}
