import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import DigitalCardEvent from '../models/DigitalCardEvent.js'
import DigitalCard from '../models/DigitalCard.js'
import { usingMongo } from '../../../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_EVENTS_FILE = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'data',
  'digitalCardEvents.json',
)

function getEventsFile() {
  return process.env.LOCAL_DIGITAL_CARD_EVENTS_FILE || DEFAULT_EVENTS_FILE
}

function readLocalEvents() {
  const file = getEventsFile()
  if (!fs.existsSync(file)) return []
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return []
  }
}

function writeLocalEvents(events) {
  const file = getEventsFile()
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(file, JSON.stringify(events, null, 2), 'utf-8')
}

export async function recordDigitalCardEvent({ cardSlug, eventType, target = '' }) {
  if (usingMongo()) {
    await DigitalCardEvent.create({ cardSlug, eventType, target })
    return
  }
  const events = readLocalEvents()
  events.push({
    cardSlug,
    eventType,
    target,
    createdAt: new Date().toISOString(),
  })
  writeLocalEvents(events)
}

export async function deleteDigitalCardEvents(cardSlug) {
  if (usingMongo()) {
    await DigitalCardEvent.deleteMany({ cardSlug })
    return
  }
  const filtered = readLocalEvents().filter((e) => e.cardSlug !== cardSlug)
  writeLocalEvents(filtered)
}

function resolveDateWindow(range, fromStr, toStr) {
  const now = new Date()
  if (range === 'custom') {
    if (!fromStr || !toStr) {
      const err = new Error('Both start and end dates are required for custom range.')
      err.status = 400
      throw err
    }
    const start = new Date(`${fromStr}T00:00:00.000Z`)
    const end = new Date(`${toStr}T23:59:59.999Z`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      const err = new Error('Invalid custom date range.')
      err.status = 400
      throw err
    }
    if (Math.ceil((end - start) / (24 * 60 * 60 * 1000)) > 366) {
      const err = new Error('Custom date range cannot exceed 366 days.')
      err.status = 400
      throw err
    }
    return { start, end }
  }
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  start.setUTCHours(0, 0, 0, 0)
  return { start, end: now }
}

function buildDayBuckets(start, end) {
  const buckets = []
  const cursor = new Date(start)
  cursor.setUTCHours(0, 0, 0, 0)
  const endDay = new Date(end)
  endDay.setUTCHours(0, 0, 0, 0)

  while (cursor <= endDay && buckets.length < 367) {
    const key = cursor.toISOString().slice(0, 10)
    const label = cursor.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    buckets.push({ key, label, total: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return buckets
}

function emptyStats() {
  return {
    profileVisits: 0,
    callClicks: 0,
    whatsappClicks: 0,
    emailClicks: 0,
    websiteClicks: 0,
    socialClicks: 0,
    directionsClicks: 0,
    saveContactClicks: 0,
  }
}

export async function queryDigitalCardsOverview({ range = '30d', from, to } = {}) {
  const { start, end } = resolveDateWindow(range, from, to)
  const stats = emptyStats()
  const buckets = buildDayBuckets(start, end)
  const dayMap = new Map(buckets.map((b) => [b.key, b]))

  if (usingMongo()) {
    const [totalsAgg, visitsByDayAgg] = await Promise.all([
      DigitalCardEvent.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
      ]),
      DigitalCardEvent.aggregate([
        {
          $match: {
            eventType: 'profileVisits',
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ])
    for (const row of totalsAgg) {
      if (row._id in stats) stats[row._id] = row.count
    }
    for (const row of visitsByDayAgg) {
      if (dayMap.has(row._id)) dayMap.get(row._id).total = row.count
    }
  } else {
    const events = readLocalEvents().filter((e) => {
      const t = new Date(e.createdAt).getTime()
      return t >= start.getTime() && t <= end.getTime()
    })
    for (const ev of events) {
      if (ev.eventType in stats) stats[ev.eventType] += 1
      if (ev.eventType === 'profileVisits') {
        const dayKey = new Date(ev.createdAt).toISOString().slice(0, 10)
        if (dayMap.has(dayKey)) dayMap.get(dayKey).total += 1
      }
    }
  }

  return {
    range,
    start: start.toISOString(),
    end: end.toISOString(),
    stats,
    activity: buckets.map(({ label, total }) => ({ label, total })),
  }
}

export async function queryDigitalCardAnalytics({
  slug,
  range = '30d',
  from,
  to,
}) {
  const { start, end } = resolveDateWindow(range, from, to)
  if (usingMongo()) {
    const exists = await DigitalCard.exists({ slug })
    if (!exists) return null
  }

  const stats = emptyStats()
  const buckets = buildDayBuckets(start, end)
  const dayMap = new Map(buckets.map((b) => [b.key, b]))

  if (usingMongo()) {
    const [totalsAgg, visitsByDayAgg] = await Promise.all([
      DigitalCardEvent.aggregate([
        { $match: { cardSlug: slug, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
      ]),
      DigitalCardEvent.aggregate([
        {
          $match: {
            cardSlug: slug,
            eventType: 'profileVisits',
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ])
    for (const row of totalsAgg) {
      if (row._id in stats) stats[row._id] = row.count
    }
    for (const row of visitsByDayAgg) {
      if (dayMap.has(row._id)) dayMap.get(row._id).total = row.count
    }
  } else {
    const events = readLocalEvents().filter((e) => {
      if (e.cardSlug !== slug) return false
      const t = new Date(e.createdAt).getTime()
      return t >= start.getTime() && t <= end.getTime()
    })
    for (const ev of events) {
      if (ev.eventType in stats) stats[ev.eventType] += 1
      if (ev.eventType === 'profileVisits') {
        const dayKey = new Date(ev.createdAt).toISOString().slice(0, 10)
        if (dayMap.has(dayKey)) dayMap.get(dayKey).total += 1
      }
    }
  }

  const totalActionClicks =
    stats.callClicks +
    stats.whatsappClicks +
    stats.emailClicks +
    stats.websiteClicks +
    stats.socialClicks +
    stats.directionsClicks

  return {
    slug,
    range,
    start: start.toISOString(),
    end: end.toISOString(),
    stats: {
      ...stats,
      totalActionClicks,
    },
    activity: buckets.map(({ label, total }) => ({ label, total })),
  }
}
