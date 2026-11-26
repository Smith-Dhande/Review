import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { seedBusinesses } from './seedData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '..', 'data', 'businesses.json')

let isMongoConnected = false

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI?.trim()

  if (uri) {
    try {
      await mongoose.connect(uri)
      isMongoConnected = true
      console.log('[DB] Connected to MongoDB Atlas')
      return true
    } catch (err) {
      console.error('[DB] MongoDB connection failed:', err.message)
      throw err
    }
  }

  // Local JSON fallback when MONGODB_URI is not configured yet
  isMongoConnected = false
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedBusinesses(), null, 2), 'utf-8')
  }
  console.log('[DB] MONGODB_URI not set — using local JSON store at server/data/businesses.json')
  return false
}

export function usingMongo() {
  return isMongoConnected
}

export function readLocalStore() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = seedBusinesses()
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8')
    return initial
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(raw)
}

export function writeLocalStore(data) {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}
