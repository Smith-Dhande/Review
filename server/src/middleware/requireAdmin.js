/**
 * Deny-by-default administrator authorization check.
 * Must be used after requireAuth.
 */
export function requireAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== 'Administrator') {
    return res
      .status(403)
      .json({ message: 'Forbidden. Administrator access required.' })
  }
  return next()
}
