import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Admin from '../models/Admin.js'
import { usingMongo } from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getAdminFilePath() {
  return (
    process.env.LOCAL_ADMIN_FILE ||
    path.join(__dirname, '..', '..', 'data', 'admin.json')
  )
}

function readLocalAdmins() {
  const filePath = getAdminFilePath()
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function writeLocalAdmins(admins) {
  const filePath = getAdminFilePath()
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(admins, null, 2), 'utf-8')
}

export function toSafeAdmin(doc) {
  if (!doc) return null
  return {
    id: String(doc._id || doc.id),
    email: doc.email,
    name: doc.name,
    role: doc.role || 'Administrator',
    emailNotifications: doc.emailNotifications ?? true,
    sessionVersion: doc.sessionVersion || 1,
  }
}

export async function countAdmins() {
  if (usingMongo()) {
    return Admin.countDocuments()
  }
  return readLocalAdmins().length
}

export async function findAdminByEmail(email, includeSecret = false) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return null

  if (usingMongo()) {
    const query = Admin.findOne({ email: normalized })
    if (includeSecret) query.select('+passwordHash')
    return query.lean()
  }

  const admins = readLocalAdmins()
  return admins.find((a) => a.email === normalized) || null
}

export async function findAdminById(id) {
  if (!id) return null

  if (usingMongo()) {
    const doc = await Admin.findById(id).lean()
    return doc
  }

  const admins = readLocalAdmins()
  return admins.find((a) => String(a.id) === String(id)) || null
}

export async function createAdminRecord({ email, name, passwordHash }) {
  const normalized = String(email || '').trim().toLowerCase()
  const cleanName = String(name || 'Administrator').trim()
  const now = new Date().toISOString()

  if (usingMongo()) {
    const created = await Admin.create({
      email: normalized,
      name: cleanName,
      role: 'Administrator',
      passwordHash,
      sessionVersion: 1,
      failedLoginAttempts: 0,
      lockUntil: null,
    })
    return toSafeAdmin(created)
  }

  const admins = readLocalAdmins()
  if (admins.some((a) => a.email === normalized)) {
    const err = new Error('Administrator already exists')
    err.status = 409
    throw err
  }
  const record = {
    id: crypto.randomUUID(),
    email: normalized,
    name: cleanName,
    role: 'Administrator',
    passwordHash,
    failedLoginAttempts: 0,
    lockUntil: null,
    sessionVersion: 1,
    passwordChangedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  admins.push(record)
  writeLocalAdmins(admins)
  return toSafeAdmin(record)
}

export async function recordFailedLogin(adminId, maxAttempts = 5, lockMs = 15 * 60 * 1000) {
  if (usingMongo()) {
    const doc = await Admin.findById(adminId)
    if (!doc) return null
    doc.failedLoginAttempts = (doc.failedLoginAttempts || 0) + 1
    if (doc.failedLoginAttempts >= maxAttempts) {
      doc.lockUntil = new Date(Date.now() + lockMs)
    }
    await doc.save()
    return doc.toObject()
  }

  const admins = readLocalAdmins()
  const idx = admins.findIndex((a) => String(a.id) === String(adminId))
  if (idx === -1) return null
  admins[idx].failedLoginAttempts = (admins[idx].failedLoginAttempts || 0) + 1
  if (admins[idx].failedLoginAttempts >= maxAttempts) {
    admins[idx].lockUntil = new Date(Date.now() + lockMs).toISOString()
  }
  admins[idx].updatedAt = new Date().toISOString()
  writeLocalAdmins(admins)
  return admins[idx]
}

export async function resetLoginAttempts(adminId) {
  if (usingMongo()) {
    await Admin.findByIdAndUpdate(adminId, {
      $set: { failedLoginAttempts: 0, lockUntil: null },
    })
    return
  }

  const admins = readLocalAdmins()
  const idx = admins.findIndex((a) => String(a.id) === String(adminId))
  if (idx === -1) return
  admins[idx].failedLoginAttempts = 0
  admins[idx].lockUntil = null
  admins[idx].updatedAt = new Date().toISOString()
  writeLocalAdmins(admins)
}

export async function updateAdminPassword(adminId, newPasswordHash) {
  const now = new Date()

  if (usingMongo()) {
    const updated = await Admin.findByIdAndUpdate(
      adminId,
      {
        $set: {
          passwordHash: newPasswordHash,
          passwordChangedAt: now,
          failedLoginAttempts: 0,
          lockUntil: null,
        },
        $inc: { sessionVersion: 1 },
      },
      { new: true },
    ).lean()
    return updated
  }

  const admins = readLocalAdmins()
  const idx = admins.findIndex((a) => String(a.id) === String(adminId))
  if (idx === -1) return null
  admins[idx].passwordHash = newPasswordHash
  admins[idx].passwordChangedAt = now.toISOString()
  admins[idx].failedLoginAttempts = 0
  admins[idx].lockUntil = null
  admins[idx].sessionVersion = (admins[idx].sessionVersion || 1) + 1
  admins[idx].updatedAt = now.toISOString()
  writeLocalAdmins(admins)
  return admins[idx]
}

export async function updateAdminProfile(adminId, updates = {}) {
  const fields = {}
  if (typeof updates.name === 'string' && updates.name.trim()) {
    fields.name = updates.name.trim().slice(0, 120)
  }
  if (typeof updates.emailNotifications === 'boolean') {
    fields.emailNotifications = updates.emailNotifications
  }

  if (usingMongo()) {
    const updated = await Admin.findByIdAndUpdate(
      adminId,
      { $set: fields },
      { new: true },
    ).lean()
    return toSafeAdmin(updated)
  }

  const admins = readLocalAdmins()
  const idx = admins.findIndex((a) => String(a.id) === String(adminId))
  if (idx === -1) return null
  Object.assign(admins[idx], fields, { updatedAt: new Date().toISOString() })
  writeLocalAdmins(admins)
  return toSafeAdmin(admins[idx])
}
