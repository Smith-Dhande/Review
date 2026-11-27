import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import ChartCard from '../components/ui/ChartCard'
import DataTable from '../components/ui/DataTable'
import StatusText from '../components/ui/StatusText'
import BusinessLogo from '../components/ui/BusinessLogo'
import ScanActivityChart from '../components/charts/ScanActivityChart'
import CustomerJourneyCard from '../components/charts/CustomerJourneyCard'
import { useBusinesses } from '../context/BusinessesContext'
import { analyticsApi } from '../services/api'

const DATE_RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'custom', label: 'Custom' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { businesses } = useBusinesses()
  const [range, setRange] = useState('30d')
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [customTo, setCustomTo] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )

  const [overview, setOverview] = useState({
    businessCounts: { total: 0, active: 0, paused: 0 },
    stats: {
      totalScans: 0,
      landingViews: 0,
      totalInitialRatings: 0,
      averageInitialRating: 0,
      questionnaireCompletions: 0,
      reviewDraftsGenerated: 0,
      copyClicks: 0,
      googleReviewRedirects: 0,
    },
    scanActivity: [],
    businessPerformance: [],
    journey: [],
  })
  const [loadedKey, setLoadedKey] = useState('')
  const [fetchError, setFetchError] = useState('')

  const customRangeError =
    range === 'custom' && (!customFrom || !customTo || customFrom > customTo)
      ? 'Start date must be on or before end date.'
      : ''
  const queryKey = `${range}:${customFrom}:${customTo}`
  const loadingOverview = !customRangeError && loadedKey !== queryKey
  const overviewError = customRangeError || fetchError

  useEffect(() => {
    let active = true
    if (customRangeError) return undefined

    analyticsApi
      .overview({
        range,
        from: range === 'custom' ? customFrom : undefined,
        to: range === 'custom' ? customTo : undefined,
      })
      .then((data) => {
        if (!active) return
        setFetchError('')
        setOverview(data)
        setLoadedKey(queryKey)
      })
      .catch((err) => {
        if (active) {
          setFetchError(err.message || 'Unable to load scan activity')
          setLoadedKey(queryKey)
        }
      })

    return () => {
      active = false
    }
  }, [range, customFrom, customTo, customRangeError, queryKey])

  const businessCounts = useMemo(() => {
    if (overview.businessCounts) return overview.businessCounts
    return businesses.reduce(
      (acc, biz) => {
        acc.total += 1
        if (biz.status === 'active') acc.active += 1
        if (biz.status === 'paused') acc.paused += 1
        return acc
      },
      { total: 0, active: 0, paused: 0 },
    )
  }, [overview.businessCounts, businesses])

  const stats = useMemo(() => overview.stats || {}, [overview.stats])
  const avgInitialRating =
    stats.totalInitialRatings > 0
      ? `${Number(stats.averageInitialRating || 0).toFixed(1)} / 5`
      : '—'

  const metrics = useMemo(
    () => [
      { label: 'Total Businesses', value: businessCounts.total.toLocaleString() },
      { label: 'Active Businesses', value: businessCounts.active.toLocaleString() },
      { label: 'Paused Businesses', value: businessCounts.paused.toLocaleString() },
      {
        label: 'Landing-Page Visits',
        value: (stats.landingViews || 0).toLocaleString(),
      },
      {
        label: 'Initial Ratings',
        value: (stats.totalInitialRatings || 0).toLocaleString(),
        hint: `Avg ${avgInitialRating}`,
      },
      {
        label: 'Questionnaire Completions',
        value: (stats.questionnaireCompletions || 0).toLocaleString(),
      },
      {
        label: 'Review Drafts Generated',
        value: (stats.reviewDraftsGenerated || 0).toLocaleString(),
      },
      {
        label: 'Google Review Redirects',
        value: (stats.googleReviewRedirects || 0).toLocaleString(),
        hint: `${(stats.copyClicks || 0).toLocaleString()} copies`,
      },
    ],
    [businessCounts, stats, avgInitialRating],
  )

  const businessPerformance = useMemo(() => {
    if (Array.isArray(overview.businessPerformance)) {
      return overview.businessPerformance
    }
    return [...businesses]
      .sort(
        (a, b) =>
          (b.analytics?.landingViews || 0) - (a.analytics?.landingViews || 0),
      )
      .slice(0, 8)
  }, [overview.businessPerformance, businesses])

  const performanceColumns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Business',
        render: (_, row) => (
          <div className="flex items-center gap-3">
            <BusinessLogo
              logo={row.logo}
              logoUrl={row.logoUrl}
              logoText={row.logoText}
              name={row.name}
              size="sm"
            />
            <div>
              <p className="font-medium text-text-primary">{row.name}</p>
              <p className="text-xs text-text-tertiary">
                {row.category}
                {row.location ? ` · ${row.location}` : ''}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (_, row) => <StatusText status={row.status} />,
      },
      {
        key: 'landingViews',
        label: 'Visits',
        render: (_, row) => (
          <span className="tabular-nums text-text-primary">
            {(
              row.landingViews ??
              row.analytics?.landingViews ??
              0
            ).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'completions',
        label: 'Completions',
        render: (_, row) => (
          <span className="tabular-nums text-text-secondary">
            {(
              row.questionnaireCompletions ??
              row.analytics?.questionnaireCompletions ??
              0
            ).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'reviewDrafts',
        label: 'Drafts',
        render: (_, row) => (
          <span className="tabular-nums text-text-secondary">
            {(
              row.reviewDraftsGenerated ??
              row.analytics?.reviewDraftsGenerated ??
              0
            ).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'googleRedirects',
        label: 'Google Redirects',
        render: (_, row) => (
          <span className="tabular-nums font-medium text-text-primary">
            {(
              row.googleReviewRedirects ??
              row.analytics?.googleReviewRedirects ??
              0
            ).toLocaleString()}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform overview, scan performance, and customer journey"
        actions={
          <div
            role="group"
            aria-label="Date range filter"
            className="inline-flex items-center rounded-md border border-border bg-card p-0.5"
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
        }
      />

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

      {/* Quick Statistics */}
      <section
        aria-label="Quick statistics"
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

      {/* Scan Activity & Customer Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Scan Activity"
          description="Landing-page visits recorded over the selected period"
        >
          {loadingOverview ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-text-tertiary">
              Loading analytics...
            </div>
          ) : (
            <ScanActivityChart
              data={overview.scanActivity}
              error={overviewError}
            />
          )}
        </ChartCard>

        <CustomerJourneyCard stages={overview.journey} />
      </div>

      {/* Business Performance */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Business Performance
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Top businesses ranked by engagement. Click any row to open its
            workspace.
          </p>
        </div>

        <DataTable
          columns={performanceColumns}
          data={businessPerformance}
          searchable={false}
          pagination={false}
          onRowClick={(row) => navigate(`/businesses/${row.publicId || row.id}`)}
        />
      </section>
    </div>
  )
}
