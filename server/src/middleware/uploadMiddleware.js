import multer from 'multer'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5 MB

const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp'])

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      const err = new Error(
        'Unsupported image format. Only PNG, JPG, JPEG, and WebP are allowed.',
      )
      err.status = 400
      return cb(err)
    }
    return cb(null, true)
  },
})

/**
 * Verifies actual file magic bytes so disguised files (e.g. .txt/.exe renamed to .png) are rejected.
 */
export function detectImageFormatFromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png'
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }

  return null
}

export function uploadLogoMiddleware(req, res, next) {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(413)
          .json({ message: 'Image size must be 5 MB or less.' })
      }
      return res
        .status(err.status || 400)
        .json({ message: err.message || 'Invalid file upload.' })
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No image file provided.' })
    }

    const detected = detectImageFormatFromBuffer(req.file.buffer)
    if (!detected) {
      return res.status(400).json({
        message:
          'Invalid or corrupted image file. File content must be PNG, JPG, or WebP.',
      })
    }

    req.detectedImageFormat = detected
    return next()
  })
}
