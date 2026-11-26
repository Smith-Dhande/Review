import crypto from 'crypto'

const ACTIVE_TOKENS = new Set()

export function issueAdminToken(email) {
  const secret = process.env.ADMIN_TOKEN_SECRET || 'dev-reviewbuddy-secret'
  const raw = `${email}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}:${secret}`
  const token = crypto.createHash('sha256').update(raw).digest('hex')
  ACTIVE_TOKENS.add(token)
  return token
}

export function revokeAdminToken(token) {
  if (token) ACTIVE_TOKENS.delete(token)
}

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : ''

  if (!token || !ACTIVE_TOKENS.has(token)) {
    return res.status(401).json({ message: 'Unauthorized. Please sign in.' })
  }

  return next()
}
