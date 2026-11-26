import argon2 from 'argon2'

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
}

export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, ARGON2_OPTIONS)
}

export async function verifyPassword(hash, plainPassword) {
  if (!hash || !plainPassword) return false
  try {
    return await argon2.verify(hash, plainPassword)
  } catch {
    return false
  }
}

export function validatePasswordComplexity(password) {
  if (typeof password !== 'string' || password.length < 10) {
    return 'Password must be at least 10 characters long.'
  }
  if (password.length > 128) {
    return 'Password must be 128 characters or fewer.'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character.'
  }
  return null
}
