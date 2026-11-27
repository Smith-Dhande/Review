import { useEffect, useState } from 'react'
import CustomerJourneyCard from '../charts/CustomerJourneyCard'
import ChartCard from '../ui/ChartCard'
import ScanActivityChart from '../charts/ScanActivityChart'
import LoadingState from '../ui/LoadingState'
import { analyticsApi } from '../../services/api'

const DATE_RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'custom', label: 'Custom' },
]

export default function BusinessAnalyticsTab({ business }) {
  const [range, setRange] = useState('30d')
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [customTo, setCustomTo] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )

  const [data, setData] = useState(null)
  const [loadedKey, setLoadedKey] = useState('')
  const [fetchError, setFetchError] = useState('')

  const businessId = business.publicId || business.id
  const customRangeError =
    range === 'custom' && (!customFrom || !customTo || customFrom > customTo)
      ? 'Start date must be on or before end date.'
      : ''
  const queryKey = `${businessId}:${range}:${customFrom}:${customTo}`
  const loading = !customRangeError && loadedKey !== queryKey
  const error = customRangeError || fetchError

  useEffect(() => {
    let active = true
    if (customRangeError) return undefined

    analyticsApi
      .business(businessId, {
        range,
        from: range === 'custom' ? customFrom : undefined,
        to: range === 'custom' ? customTo : undefined,
      })
      .then((res) => {
        if (!active) return
        setFetchError('')
        setData(res)
        setLoadedKey(queryKey)
      })
      .catch((err) => {
        if (active) {
          setFetchError(err.message || 'Unable to load business analytics.')
          setLoadedKey(queryKey)
        }
      })

    return () => {
      active = false
    }
  }, [businessId, range, customFrom, customTo, customRangeError, queryKey])

  const stats = data?.stats || {
    landingViews: 0,
    totalInitialRatings: 0,
    averageInitialRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    questionnaireStarts: 0,
    questionnaireCompletions: 0,
    reviewDraftsGenerated: 0,
    copyClicks: 0,
    googleReviewRedirects: 0,
  }

  const totalRatings = stats.totalInitialRatings || 0
  const avgRating =
    totalRatings > 0 ? Number(stats.averageInitialRating || 0).toFixed(1) : '—'

  const pctOfRatings = (count) =>
    totalRatings > 0 ? `${Math.round((count / totalRatings) * 100)}%` : '0%'

  const distribution = stats.ratingDistribution || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  const metrics = [
    {
      label: 'Landing-Page Views',
      value: (stats.landingViews || 0).toLocaleString(),
    },
    { label: 'Total Initial Ratings', value: totalRatings.toLocaleString() },
    {
      label: 'Average Initial Rating',
      value: avgRating === '—' ? '—' : `${avgRating} / 5`,
      hint: 'Pre-questionnaire',
    },
    {
      label: 'Questionnaire Starts',
      value: (stats.questionnaireStarts || 0).toLocaleString(),
    },
    {
      label: 'Questionnaire Completions',
      value: (stats.questionnaireCompletions || 0).toLocaleString(),
      hint: `${pctOfRatings(stats.questionnaireCompletions || 0)} of ratings`,
    },
    {
      label: 'Review Drafts Generated',
      value: (stats.reviewDraftsGenerated || 0).toLocaleString(),
      hint: `${pctOfRatings(stats.reviewDraftsGenerated || 0)} of ratings`,
    },
    { label: 'Copy Clicks', value: (stats.copyClicks || 0).toLocaleString() },
    {
      label: 'Google Review Redirects',
      value: (stats.googleReviewRedirects || 0).toLocaleString(),
      hint: `${pctOfRatings(stats.googleReviewRedirects || 0)} of ratings`,
    },
  ]

  const journeyStages = data?.journey || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Business Analytics
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            Date-filtered customer engagement for {business.name}
          </p>
        </div>

        <div
          role="group"
          aria-label="Business analytics date range"
          className="inline-flex items-center rounded-md border border-border bg-card p-0.5 self-start"
        >
          {DATE_RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer ${range === item.id
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 text-xs">
          <span className="font-medium text-text-secondary">Custom range:</span>
          <input
            type="date"
            aria-label="Start date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
          />
          <span className="text-text-tertiary">to</span>
          <input
            type="date"
            aria-label="End date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-error-light border border-error-border rounded-md px-4 py-3 text-xs text-error"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-card rounded-lg border border-border">
          <LoadingState message="Loading business analytics..." />
        </div>
      ) : (
        <>
          <section
            aria-label="Business metrics"
            className="bg-card rounded-lg border border-border overflow-hidden"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, idx) => {
                const isTopRow = idx < 4
                return (
                  <div
                    key={metric.label}
                    className={`px-5 py-4 border-border ${isTopRow ? 'border-b' : 'border-b lg:border-b-0'
                      } ${idx % 2 === 0 ? 'border-r' : 'lg:border-r'} ${idx === 3 || idx === 7 ? 'lg:border-r-0' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-text-secondary">
                        {metric.label}
                      </p>
                      {metric.hint && (
                        <span className="text-[11px] text-text-tertiary">
                          {metric.hint}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-semibold tracking-tight text-text-primary tabular-nums mt-1.5">
                      {metric.value}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          <ChartCard
            title="Landing-Page Activity"
            description="Genuine landing views over the selected period"
          >
            <ScanActivityChart
              data={data?.activity || data?.dailyActivity || []}
              error={error}
            />
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1-5 Star Rating Distribution */}
            <div className="bg-card rounded-lg border border-border">
              <div className="px-5 pt-5 pb-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">
                  Initial Rating Distribution
                </h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Separate from verified Google reviews
                </p>
              </div>

              <div className="p-5 space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] || 0
                  const pct =
                    totalRatings > 0
                      ? Math.round((count / totalRatings) * 100)
                      : 0
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-medium text-text-secondary tabular-nums shrink-0">
                        {star} {star === 1 ? 'star' : 'stars'}
                      </span>
                      <div className="flex-1 h-2 bg-surface rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-sm transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-medium text-text-primary tabular-nums">
                        {count}
                      </span>
                      <span className="w-9 text-right text-text-tertiary tabular-nums">
                        {pct}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="lg:col-span-2">
              <CustomerJourneyCard stages={journeyStages} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
