import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import AnalyticsEvent from '../models/AnalyticsEvent.js'
import Business from '../models/Business.js'
import { readLocalStore, usingMongo } from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getEventsFile() {
  return (
    process.env.LOCAL_EVENTS_FILE ||
    path.join(__dirname, '..', '..', 'data', 'analyticsEvents.json')
  )
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

export async function recordAnalyticsEvent({
  businessPublicId,
  eventType,
  rating = null,
}) {
  if (usingMongo()) {
    await AnalyticsEvent.create({
      businessPublicId,
      eventType,
      rating: eventType === 'initialRating' ? rating : null,
    })
    return
  }

  const events = readLocalEvents()
  events.push({
    businessPublicId,
    eventType,
    rating: eventType === 'initialRating' ? rating : null,
    createdAt: new Date().toISOString(),
  })
  writeLocalEvents(events)
}

export async function recordAnalyticsEventsBatch(items = []) {
  if (!Array.isArray(items) || items.length === 0) return

  if (usingMongo()) {
    const docs = items.map((item) => ({
      businessPublicId: item.businessPublicId,
      eventType: item.eventType,
      rating: item.eventType === 'initialRating' ? item.rating ?? null : null,
    }))
    await AnalyticsEvent.insertMany(docs, { ordered: false })
    return
  }

  const now = new Date().toISOString()
  const events = readLocalEvents()
  for (const item of items) {
    events.push({
      businessPublicId: item.businessPublicId,
      eventType: item.eventType,
      rating: item.eventType === 'initialRating' ? item.rating ?? null : null,
      createdAt: now,
    })
  }
  writeLocalEvents(events)
}

export async function deleteEventsForBusiness(businessPublicId) {
  if (usingMongo()) {
    await AnalyticsEvent.deleteMany({ businessPublicId })
    return
  }
  const events = readLocalEvents().filter(
    (e) => e.businessPublicId !== businessPublicId,
  )
  writeLocalEvents(events)
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
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      const err = new Error('Invalid custom date range.')
      err.status = 400
      throw err
    }
    if (start > end) {
      const err = new Error('Start date cannot be after end date.')
      err.status = 400
      throw err
    }
    const diffDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000))
    if (diffDays > 366) {
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

  while (cursor <= endDay && buckets.length < 95) {
    const isoDay = cursor.toISOString().slice(0, 10)
    const label = cursor.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    buckets.push({ key: isoDay, label, total: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return buckets
}

export async function queryAnalyticsOverview({ range = '30d', from, to }) {
  const { start, end } = resolveDateWindow(range, from, to)

  const stats = {
    totalScans: 0,
    landingViews: 0,
    totalInitialRatings: 0,
    ratingSum: 0,
    questionnaireStarts: 0,
    questionnaireCompletions: 0,
    reviewDraftsGenerated: 0,
    copyClicks: 0,
    googleReviewRedirects: 0,
  }
  const businessCounts = { total: 0, active: 0, paused: 0 }

  const dayMap = new Map()
  const buckets = buildDayBuckets(start, end)
  for (const b of buckets) {
    dayMap.set(b.key, b)
  }

  let businessPerformance = []

  if (usingMongo()) {
    const [aggResult, statusAgg] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: '$eventType',
                  count: { $sum: 1 },
                  ratingSum: { $sum: { $ifNull: ['$rating', 0] } },
                },
              },
            ],
            visitsByDay: [
              { $match: { eventType: 'landingViews' } },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$createdAt',
                      timezone: 'UTC',
                    },
                  },
                  count: { $sum: 1 },
                },
              },
            ],
            byBusiness: [
              {
                $group: {
                  _id: {
                    businessPublicId: '$businessPublicId',
                    eventType: '$eventType',
                  },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      Business.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ])

    for (const row of statusAgg) {
      if (row._id === 'active') businessCounts.active = row.count
      else if (row._id === 'paused') businessCounts.paused = row.count
    }
    businessCounts.total = businessCounts.active + businessCounts.paused

    const facet = aggResult[0] || { totals: [], visitsByDay: [], byBusiness: [] }
    for (const row of facet.totals) {
      if (row._id === 'initialRating') {
        stats.totalInitialRatings = row.count
        stats.ratingSum = row.ratingSum
      } else if (row._id in stats) {
        stats[row._id] = row.count
      }
    }

    for (const row of facet.visitsByDay) {
      if (dayMap.has(row._id)) {
        dayMap.get(row._id).total = row.count
      }
    }

    const perfMap = new Map()
    for (const row of facet.byBusiness) {
      const pid = row._id.businessPublicId
      const evType = row._id.eventType
      if (!perfMap.has(pid)) {
        perfMap.set(pid, {
          publicId: pid,
          landingViews: 0,
          questionnaireCompletions: 0,
          reviewDraftsGenerated: 0,
          googleReviewRedirects: 0,
        })
      }
      const entry = perfMap.get(pid)
      if (evType in entry) entry[evType] += row.count
    }

    const sortedPerf = Array.from(perfMap.values())
      .sort(
        (a, b) =>
          b.landingViews - a.landingViews ||
          b.googleReviewRedirects - a.googleReviewRedirects,
      )
      .slice(0, 8)

    const topIds = sortedPerf.map((p) => p.publicId)
    const topDocs =
      topIds.length > 0
        ? await Business.find({ publicId: { $in: topIds } })
            .select('publicId name category location status logo logoText')
            .lean()
        : []
    const docMap = new Map(topDocs.map((b) => [b.publicId, b]))

    businessPerformance = sortedPerf
      .map((p) => {
        const b = docMap.get(p.publicId)
        if (!b) return null
        return {
          publicId: b.publicId,
          id: b.publicId,
          name: b.name,
          category: b.category || '',
          location: b.location || '',
          status: b.status,
          logo: b.logo?.url ? b.logo : null,
          logoUrl: b.logo?.url || '',
          logoText: b.logoText || '',
          ...p,
          rangeStats: p,
        }
      })
      .filter(Boolean)

    if (businessPerformance.length < 8) {
      const seen = new Set(businessPerformance.map((b) => b.publicId))
      const extraDocs = await Business.find(
        seen.size > 0 ? { publicId: { $nin: Array.from(seen) } } : {},
      )
        .select('publicId name category location status logo logoText')
        .sort({ createdAt: -1 })
        .limit(8 - businessPerformance.length)
        .lean()
      for (const b of extraDocs) {
        const zeroStats = {
          publicId: b.publicId,
          landingViews: 0,
          questionnaireCompletions: 0,
          reviewDraftsGenerated: 0,
          googleReviewRedirects: 0,
        }
        businessPerformance.push({
          publicId: b.publicId,
          id: b.publicId,
          name: b.name,
          category: b.category || '',
          location: b.location || '',
          status: b.status,
          logo: b.logo?.url ? b.logo : null,
          logoUrl: b.logo?.url || '',
          logoText: b.logoText || '',
          ...zeroStats,
          rangeStats: zeroStats,
        })
      }
    }
  } else {
    const businesses = readLocalStore()
    businessCounts.total = businesses.length
    businessCounts.active = businesses.filter((b) => b.status === 'active').length
    businessCounts.paused = businesses.filter((b) => b.status === 'paused').length

    const perfMap = new Map()
    for (const b of businesses) {
      perfMap.set(b.publicId, {
        publicId: b.publicId,
        id: b.publicId,
        name: b.name,
        category: b.category || '',
        location: b.location || '',
        status: b.status,
        logo: b.logo?.url ? b.logo : null,
        logoUrl: b.logo?.url || '',
        logoText: b.logoText || '',
        landingViews: 0,
        questionnaireCompletions: 0,
        reviewDraftsGenerated: 0,
        googleReviewRedirects: 0,
      })
    }

    const events = readLocalEvents().filter((e) => {
      const t = new Date(e.createdAt).getTime()
      return t >= start.getTime() && t <= end.getTime()
    })

    for (const ev of events) {
      const perf = perfMap.get(ev.businessPublicId)
      if (ev.eventType === 'totalScans') {
        stats.totalScans += 1
      } else if (ev.eventType === 'landingViews') {
        stats.landingViews += 1
        const dayKey = new Date(ev.createdAt).toISOString().slice(0, 10)
        if (dayMap.has(dayKey)) {
          dayMap.get(dayKey).total += 1
        }
        if (perf) perf.landingViews += 1
      } else if (ev.eventType === 'initialRating') {
        stats.totalInitialRatings += 1
        stats.ratingSum += Number(ev.rating) || 0
      } else if (ev.eventType === 'questionnaireStarts') {
        stats.questionnaireStarts += 1
      } else if (ev.eventType === 'questionnaireCompletions') {
        stats.questionnaireCompletions += 1
        if (perf) perf.questionnaireCompletions += 1
      } else if (ev.eventType === 'reviewDraftsGenerated') {
        stats.reviewDraftsGenerated += 1
        if (perf) perf.reviewDraftsGenerated += 1
      } else if (ev.eventType === 'copyClicks') {
        stats.copyClicks += 1
      } else if (ev.eventType === 'googleReviewRedirects') {
        stats.googleReviewRedirects += 1
        if (perf) perf.googleReviewRedirects += 1
      }
    }

    businessPerformance = Array.from(perfMap.values())
      .sort(
        (a, b) =>
          b.landingViews - a.landingViews ||
          b.googleReviewRedirects - a.googleReviewRedirects,
      )
      .slice(0, 8)
      .map((entry) => ({
        ...entry,
        rangeStats: {
          publicId: entry.publicId,
          landingViews: entry.landingViews,
          questionnaireCompletions: entry.questionnaireCompletions,
          reviewDraftsGenerated: entry.reviewDraftsGenerated,
          googleReviewRedirects: entry.googleReviewRedirects,
        },
      }))
  }

  const averageInitialRating =
    stats.totalInitialRatings > 0
      ? Number((stats.ratingSum / stats.totalInitialRatings).toFixed(1))
      : 0

  return {
    range,
    start: start.toISOString(),
    end: end.toISOString(),
    businessCounts,
    stats: {
      ...stats,
      averageInitialRating,
    },
    scanActivity: buckets.map(({ label, total }) => ({ label, total })),
    businessPerformance,
    journey: [
      { stage: 'Landing-Page Visits', count: stats.landingViews },
      { stage: 'Initial Ratings', count: stats.totalInitialRatings },
      {
        stage: 'Questionnaire Completions',
        count: stats.questionnaireCompletions,
      },
      { stage: 'Review Drafts Generated', count: stats.reviewDraftsGenerated },
      { stage: 'Copy Clicks', count: stats.copyClicks },
      { stage: 'Google Review Redirects', count: stats.googleReviewRedirects },
    ],
  }
}

    export async function queryBusinessAnalytics({
      businessId,
      range = '30d',
      from,
      to,
    }) {
      const { start, end } = resolveDateWindow(range, from, to)

      let business = null
      if (usingMongo()) {
        business = await Business.findOne({
          $or: [{ publicId: businessId }, { slug: businessId }],
        })
          .select('publicId name status')
          .lean()
      } else {
        business =
          readLocalStore().find(
            (b) => b.publicId === businessId || b.slug === businessId,
          ) || null
      }

      if (!business) return null

      const stats = {
        totalScans: 0,
        landingViews: 0,
        totalInitialRatings: 0,
        ratingSum: 0,
        questionnaireCompletions: 0,
        reviewDraftsGenerated: 0,
        copyClicks: 0,
        googleReviewRedirects: 0,
      }
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

      const dayMap = new Map()
      const buckets = buildDayBuckets(start, end)
      for (const b of buckets) {
        dayMap.set(b.key, b)
      }

      if (usingMongo()) {
        const [totalsAgg, ratingsAgg, visitsByDayAgg] = await Promise.all([
          AnalyticsEvent.aggregate([
            {
              $match: {
                businessPublicId: business.publicId,
                createdAt: { $gte: start, $lte: end },
              },
            },
            {
              $group: {
                _id: '$eventType',
                count: { $sum: 1 },
                ratingSum: { $sum: { $ifNull: ['$rating', 0] } },
              },
            },
          ]),
          AnalyticsEvent.aggregate([
            {
              $match: {
                businessPublicId: business.publicId,
                eventType: 'initialRating',
                rating: { $in: [1, 2, 3, 4, 5] },
                createdAt: { $gte: start, $lte: end },
              },
            },
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 },
              },
            },
          ]),
          AnalyticsEvent.aggregate([
            {
              $match: {
                businessPublicId: business.publicId,
                eventType: 'landingViews',
                createdAt: { $gte: start, $lte: end },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt',
                    timezone: 'UTC',
                  },
                },
                count: { $sum: 1 },
              },
            },
          ]),
        ])

        for (const row of totalsAgg) {
          if (row._id === 'initialRating') {
            stats.totalInitialRatings = row.count
            stats.ratingSum = row.ratingSum
          } else if (row._id in stats) {
            stats[row._id] = row.count
          }
        }

        for (const row of ratingsAgg) {
          if (row._id >= 1 && row._id <= 5) {
            ratingDistribution[row._id] = row.count
          }
        }

        for (const row of visitsByDayAgg) {
          if (dayMap.has(row._id)) {
            dayMap.get(row._id).total = row.count
          }
        }
      } else {
        const events = readLocalEvents().filter((e) => {
          if (e.businessPublicId !== business.publicId) return false
          const t = new Date(e.createdAt).getTime()
          return t >= start.getTime() && t <= end.getTime()
        })

        for (const ev of events) {
          if (ev.eventType === 'totalScans') {
            stats.totalScans += 1
          } else if (ev.eventType === 'landingViews') {
            stats.landingViews += 1
            const dayKey = new Date(ev.createdAt).toISOString().slice(0, 10)
            if (dayMap.has(dayKey)) {
              dayMap.get(dayKey).total += 1
            }
          } else if (ev.eventType === 'initialRating') {
            stats.totalInitialRatings += 1
            const r = Number(ev.rating)
            stats.ratingSum += r || 0
            if (r >= 1 && r <= 5) {
              ratingDistribution[r] += 1
            }
          } else if (ev.eventType === 'questionnaireCompletions') {
            stats.questionnaireCompletions += 1
          } else if (ev.eventType === 'reviewDraftsGenerated') {
            stats.reviewDraftsGenerated += 1
          } else if (ev.eventType === 'copyClicks') {
            stats.copyClicks += 1
          } else if (ev.eventType === 'googleReviewRedirects') {
            stats.googleReviewRedirects += 1
          }
        }
      }

      const averageInitialRating =
        stats.totalInitialRatings > 0
          ? Number((stats.ratingSum / stats.totalInitialRatings).toFixed(1))
          : 0

      const visits = stats.landingViews
      const conversionRates = {
        visitToRatingPct:
          visits > 0 ? Math.round((stats.totalInitialRatings / visits) * 100) : 0,
        ratingToCompletionPct:
          stats.totalInitialRatings > 0
            ? Math.round(
              (stats.questionnaireCompletions / stats.totalInitialRatings) * 100,
            )
            : 0,
        visitToRedirectPct:
          visits > 0 ? Math.round((stats.googleReviewRedirects / visits) * 100) : 0,
      }

      return {
        businessPublicId: business.publicId,
        businessName: business.name,
        status: business.status,
        range,
        start: start.toISOString(),
        end: end.toISOString(),
        stats: {
          ...stats,
          averageInitialRating,
          ratingDistribution,
        },
        conversionRates,
        activity: buckets.map(({ label, total }) => ({ label, total })),
        dailyActivity: buckets.map(({ label, total }) => ({ label, total })),
        journey: [
          { stage: 'Landing-Page Visits', count: stats.landingViews },
          { stage: 'Initial Ratings', count: stats.totalInitialRatings },
          {
            stage: 'Questionnaire Completions',
            count: stats.questionnaireCompletions,
          },
          { stage: 'Review Drafts Generated', count: stats.reviewDraftsGenerated },
          { stage: 'Copy Clicks', count: stats.copyClicks },
          { stage: 'Google Review Redirects', count: stats.googleReviewRedirects },
        ],
      }
    }
