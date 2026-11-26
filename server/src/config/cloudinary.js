import { v2 as cloudinary } from 'cloudinary'

let configured = false

export function initCloudinary() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim()
  const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim()
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim()

  if (!cloudName || !apiKey || !apiSecret) {
    configured = false
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[Cloudinary] CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET not set — image uploads will return 503 until configured.',
      )
    }
    return false
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
  configured = true
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Cloudinary] Configured for cloud "${cloudName}"`)
  }
  return true
}

export function isCloudinaryConfigured() {
  return configured
}

export { cloudinary }
