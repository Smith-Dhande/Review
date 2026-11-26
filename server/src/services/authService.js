import {
  findAdminByEmail,
  findAdminById,
  recordFailedLogin,
  resetLoginAttempts,
  toSafeAdmin,
  updateAdminPassword,
} from '../repositories/adminRepo.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

// Precomputed dummy Argon2id hash to equalize timing when email does not exist
let dummyHashPromise = null
function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword('Dummy!Password#TimingSafe99')
  }
  return dummyHashPromise
}

const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

export async function authenticateAdmin(email, password) {
  const admin = await findAdminByEmail(email, true)

  if (!admin) {
    // Perform dummy Argon2id verification to avoid user enumeration via timing
    const dummy = await getDummyHash()
    await verifyPassword(dummy, password)
    const err = new Error('Invalid email or password.')
    err.status = 401
    throw err
  }

  // Temporary lockout check (recoverable after LOCK_DURATION_MS)
  if (admin.lockUntil && new Date(admin.lockUntil) > new Date()) {
    const err = new Error(
      'Too many failed login attempts. Please try again later.',
    )
    err.status = 429
    throw err
  }

  const isValid = await verifyPassword(admin.passwordHash, password)
  if (!isValid) {
    const adminId = admin._id || admin.id
    await recordFailedLogin(adminId, MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS)
    const err = new Error('Invalid email or password.')
    err.status = 401
    throw err
  }

  const adminId = admin._id || admin.id
  await resetLoginAttempts(adminId)
  return toSafeAdmin(admin)
}

export async function changeAdminPassword(adminId, currentPassword, newPassword) {
  const admin = await findAdminById(adminId)
  if (!admin) {
    const err = new Error('Administrator account not found.')
    err.status = 404
    throw err
  }

  // Re-fetch with passwordHash if using Mongoose
  const fullAdmin = await findAdminByEmail(admin.email, true)
  const validCurrent = await verifyPassword(
    fullAdmin?.passwordHash,
    currentPassword,
  )
  if (!validCurrent) {
    const err = new Error('Current password is incorrect.')
    err.status = 400
    throw err
  }

  const isSame = await verifyPassword(fullAdmin?.passwordHash, newPassword)
  if (isSame) {
    const err = new Error(
      'New password must be different from your current password.',
    )
    err.status = 400
    throw err
  }

  const newHash = await hashPassword(newPassword)
  const updated = await updateAdminPassword(adminId, newHash)
  return toSafeAdmin(updated)
}
