import crypto from 'crypto'
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js'

const DEFAULT_FOLDER = 'reviewbuddy/businesses/logos'

// Optional test-mode adapter override so integration tests can verify lifecycle without live network
let customAdapter = null
export function setImageStorageAdapter(adapter) {
  customAdapter = adapter
}

function buildSafePublicId() {
  return `logo_${crypto.randomBytes(10).toString('hex')}`
}

/**
 * Uploads a validated image buffer to Cloudinary and returns URL + asset metadata.
 */
export async function uploadImageBuffer(buffer, options = {}) {
  if (customAdapter?.upload) {
    return customAdapter.upload(buffer, options)
  }

  if (!isCloudinaryConfigured()) {
    const err = new Error(
      'Cloudinary image storage is not configured on the server.',
    )
    err.status = 503
    throw err
  }

  const folder = options.folder || DEFAULT_FOLDER
  const publicId = buildSafePublicId()

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        invalidate: true,
      },
      (error, result) => {
        if (error || !result) {
          const err = new Error(
            'Failed to upload image to Cloudinary. Please try again.',
          )
          err.status = 502
          return reject(err)
        }
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format || options.format || '',
          width: Number(result.width) || 0,
          height: Number(result.height) || 0,
        })
      },
    )

    stream.end(buffer)
  })
}

/**
 * Deletes a Cloudinary asset by publicId.
 * Never throws on missing/already-deleted assets so DB state stays clean.
 */
export async function deleteImageAsset(publicId) {
  if (!publicId || typeof publicId !== 'string') return false
  if (!publicId.startsWith('reviewbuddy/')) return false

  if (customAdapter?.destroy) {
    return customAdapter.destroy(publicId)
  }

  if (!isCloudinaryConfigured()) return false

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    })
    return true
  } catch (err) {
    console.warn('[Cloudinary] Cleanup warning:', err.message)
    return false
  }
}
