import mongoose from 'mongoose'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { seedBusinesses } from './seedData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DATA_FILE = path.join(__dirname, '..', 'data', 'businesses.json')

let isMongoConnected = false

function getDataFile() {
  const custom = (process.env.LOCAL_BUSINESSES_FILE || '').trim()
  if (custom) return custom
  if (process.env.NODE_ENV === 'test') {
    return path.join(os.tmpdir(), 'reviewbuddy-test-businesses.json')
  }
  return DEFAULT_DATA_FILE
}

export async function connectDatabase() {
  const isTest = process.env.NODE_ENV === 'test'
  const testMongoUri = (process.env.TEST_MONGODB_URI || '').trim()
  const prodUri = (process.env.MONGODB_URI || '').trim()

  // Prevent tests from accidentally connecting to live production MongoDB Atlas
  const uri = isTest
    ? testMongoUri || (process.env.ALLOW_TEST_MONGO === 'true' ? prodUri : '')
    : prodUri

  if (uri) {
    try {
      const rawPool = Number(process.env.MONGO_MAX_POOL_SIZE)
      const maxPoolSize =
        Number.isInteger(rawPool) && rawPool >= 2 && rawPool <= 25 ? rawPool : 10

      await mongoose.connect(uri, {
        maxPoolSize,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        maxIdleTimeMS: 30000,
      })
      isMongoConnected = true
      if (!isTest) {
        console.log('[DB] Connected to MongoDB Atlas')
      }
      return true
    } catch (err) {
      console.error('[DB] MongoDB connection failed:', err.message)
      throw err
    }
  }

  // Local JSON fallback when MONGODB_URI is not configured yet (or isolated test mode)
  isMongoConnected = false
  const dataFile = getDataFile()
  const dir = path.dirname(dataFile)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(seedBusinesses(), null, 2), 'utf-8')
  }
  if (!isTest) {
    console.log('[DB] MONGODB_URI not set — using local JSON store at server/src/data/businesses.json')
  }
  return false
}

export function usingMongo() {
  return isMongoConnected
}

export function readLocalStore() {
  const dataFile = getDataFile()
  if (!fs.existsSync(dataFile)) {
    const dir = path.dirname(dataFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const initial = seedBusinesses()
    fs.writeFileSync(dataFile, JSON.stringify(initial, null, 2), 'utf-8')
    return initial
  }
  const raw = fs.readFileSync(dataFile, 'utf-8')
  return JSON.parse(raw)
}

export function writeLocalStore(data) {
  const dataFile = getDataFile()
  const dir = path.dirname(dataFile)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8')
}
