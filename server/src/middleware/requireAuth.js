import { findAdminById, toSafeAdmin } from '../repositories/adminRepo.js'
import { getEnvConfig } from '../config/environment.js'
import { clearSessionCookie } from '../config/session.js'

/**
 * Validates server-side session, idle/absolute timeouts, and sessionVersion.
 */
export async function requireAuth(req, res, next) {
  try {
    const sess = req.session
    if (!sess || !sess.adminId) {
      return res.status(401).json({ message: 'Unauthorized. Please sign in.' })
    }

    const env = getEnvConfig()
    const now = Date.now()
    if (!sess.createdAt || now - sess.createdAt > env.sessionMaxLifetimeMs) {
      return sess.destroy(() => {
        clearSessionCookie(res, env)
        return res
          .status(401)
          .json({ message: 'Session expired. Please sign in again.' })
      })
    }

    const admin = await findAdminById(sess.adminId)
    if (!admin) {
      return sess.destroy(() => {
        clearSessionCookie(res, env)
        return res.status(401).json({ message: 'Unauthorized. Please sign in.' })
      })
    }

    // Invalidate sessions created before a password change
    if ((sess.sessionVersion || 0) !== (admin.sessionVersion || 1)) {
      return sess.destroy(() => {
        clearSessionCookie(res, env)
        return res
          .status(401)
          .json({ message: 'Session invalidated. Please sign in again.' })
      })
    }

    req.admin = toSafeAdmin(admin)
    return next()
  } catch (err) {
    return next(err)
  }
}
