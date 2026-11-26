import { uploadImageBuffer } from '../services/imageStorageService.js'

export async function uploadLogo(req, res, next) {
  try {
    const asset = await uploadImageBuffer(req.file.buffer, {
      format: req.detectedImageFormat,
    })
    return res.status(201).json({ logo: asset })
  } catch (err) {
    return next(err)
  }
}
