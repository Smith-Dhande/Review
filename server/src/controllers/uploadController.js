import { deleteImageAsset, uploadImageBuffer } from '../services/imageStorageService.js'
import { isLogoReferencedByAnyBusiness } from '../repositories/businessRepo.js'
import { cleanupLogoSchema } from '../validators/businessValidators.js'

const MAX_PENDING_LOGOS = 20

function trackPendingLogo(req, publicId) {
  if (!req.session || !publicId) return
  const current = Array.isArray(req.session.pendingLogoUploads)
    ? req.session.pendingLogoUploads
    : []
  const next = [publicId, ...current.filter((id) => id !== publicId)].slice(
    0,
    MAX_PENDING_LOGOS,
  )
  req.session.pendingLogoUploads = next
}

export function clearPendingLogoFromSession(req, publicId) {
  if (!req.session || !publicId || !Array.isArray(req.session.pendingLogoUploads)) {
    return
  }
  req.session.pendingLogoUploads = req.session.pendingLogoUploads.filter(
    (id) => id !== publicId,
  )
}

export async function uploadLogo(req, res, next) {
  try {
    const asset = await uploadImageBuffer(req.file.buffer, {
      format: req.detectedImageFormat,
    })
    trackPendingLogo(req, asset.publicId)
    if (req.session) {
      await new Promise((resolve) => req.session.save(() => resolve()))
    }
    return res.status(201).json({ logo: asset })
  } catch (err) {
    return next(err)
  }
}

export async function cleanupTempLogo(req, res, next) {
  try {
    const parsed = cleanupLogoSchema.safeParse(req.body || {})
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues?.[0]?.message || 'Invalid asset publicId.',
      })
    }

    const { publicId } = parsed.data
    const pending = Array.isArray(req.session?.pendingLogoUploads)
      ? req.session.pendingLogoUploads
      : []

    if (!pending.includes(publicId)) {
      return res.status(403).json({
        message: 'Only unattached temporary uploads from your session can be removed.',
      })
    }

    const inUse = await isLogoReferencedByAnyBusiness(publicId)
    if (inUse) {
      clearPendingLogoFromSession(req, publicId)
      return res.status(409).json({
        message: 'Logo is already attached to a business and cannot be deleted here.',
      })
    }

    const deleted = await deleteImageAsset(publicId)
    clearPendingLogoFromSession(req, publicId)
    if (req.session) {
      await new Promise((resolve) => req.session.save(() => resolve()))
    }

    return res.json({ deleted, publicId })
  } catch (err) {
    return next(err)
  }
}
