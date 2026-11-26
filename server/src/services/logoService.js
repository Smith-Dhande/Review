import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Logo from '../models/Logo.js'
import { usingMongo } from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGOS_DIR = path.join(__dirname, '..', '..', 'data', 'logos')

const ALLOWED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
])

const MAX_BYTES = 1.5 * 1024 * 1024 // 1.5 MB

function sanitizeSvg(svgString) {
  return svgString
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<(iframe|object|embed)[\s\S]*?>[\s\S]*?<\/\1>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}

export async function saveLogoAsset({ mimeType, dataBase64 }) {
  if (!ALLOWED_MIMES.has(mimeType)) {
    const err = new Error(
      'Unsupported file type. Allowed formats: PNG, JPG, WebP, SVG.',
    )
    err.status = 400
    throw err
  }

  if (!dataBase64 || typeof dataBase64 !== 'string') {
    const err = new Error('Missing image data.')
    err.status = 400
    throw err
  }

  // Strip optional data-URI prefix
  const cleanBase64 = dataBase64.replace(/^data:[^;]+;base64,/, '').trim()
  let buffer = Buffer.from(cleanBase64, 'base64')

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    const err = new Error('Logo file must be under 1.5 MB.')
    err.status = 400
    throw err
  }

  if (mimeType === 'image/svg+xml') {
    const sanitized = sanitizeSvg(buffer.toString('utf-8'))
    buffer = Buffer.from(sanitized, 'utf-8')
  }

  const logoId = `logo_${crypto.randomBytes(8).toString('hex')}`
  const finalBase64 = buffer.toString('base64')

  if (usingMongo()) {
    await Logo.create({
      logoId,
      mimeType,
      dataBase64: finalBase64,
    })
  } else {
    if (!fs.existsSync(LOGOS_DIR)) {
      fs.mkdirSync(LOGOS_DIR, { recursive: true })
    }
    fs.writeFileSync(
      path.join(LOGOS_DIR, `${logoId}.json`),
      JSON.stringify({ logoId, mimeType, dataBase64: finalBase64 }),
      'utf-8',
    )
  }

  return {
    logoId,
    logoUrl: `/api/public/logos/${logoId}`,
  }
}

export async function getLogoAsset(logoId) {
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(logoId)) return null

  if (usingMongo()) {
    const doc = await Logo.findOne({ logoId }).lean()
    if (!doc) return null
    return {
      mimeType: doc.mimeType,
      buffer: Buffer.from(doc.dataBase64, 'base64'),
    }
  }

  const filePath = path.join(LOGOS_DIR, `${logoId}.json`)
  if (!fs.existsSync(filePath)) return null
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return {
    mimeType: parsed.mimeType,
    buffer: Buffer.from(parsed.dataBase64, 'base64'),
  }
}
