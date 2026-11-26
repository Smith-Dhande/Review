import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import ChartCard from '../components/ui/ChartCard'
import DataTable from '../components/ui/DataTable'
import StatusText from '../components/ui/StatusText'
import ScanActivityChart from '../components/charts/ScanActivityChart'
import CustomerJourneyCard from '../components/charts/CustomerJourneyCard'
import { useBusinesses } from '../context/BusinessesContext'
import { dashboardAnalyticsByRange } from '../data/mockData'

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
  const [customFrom, setCustomFrom] = useState('2026-01-01')
  const [customTo, setCustomTo] = useState('2026-11-26')

  const rangeData =
    dashboardAnalyticsByRange[range] || dashboardAnalyticsByRange['30d']

  const liveCounts = useMemo(() => {
    return businesses.reduce(
      (acc, biz) => {
        acc.total += 1
        if (biz.status === 'active') acc.active += 1
        if (biz.status === 'paused') acc.paused += 1
        acc.totalScans += biz.analytics?.totalScans || 0
        acc.landingViews += biz.analytics?.landingViews || 0
        acc.completions += biz.analytics?.questionnaireCompletions || 0
        acc.drafts += biz.analytics?.reviewDraftsGenerated || 0
        acc.copies += biz.analytics?.copyClicks || 0
        acc.redirects += biz.analytics?.googleReviewRedirects || 0
        return acc
      },
      {
        total: 0,
        active: 0,
        paused: 0,
        totalScans: 0,
        landingViews: 0,
        completions: 0,
        drafts: 0,
        copies: 0,
        redirects: 0,
      },
    )
  }, [businesses])

  const metrics = useMemo(
    () => [
      { label: 'Total Businesses', value: liveCounts.total.toLocaleString() },
      { label: 'Active Businesses', value: liveCounts.active.toLocaleString() },
      { label: 'Paused Businesses', value: liveCounts.paused.toLocaleString() },
      { label: 'Total Scans', value: liveCounts.totalScans.toLocaleString() },
      {
        label: 'Questionnaire Completions',
        value: liveCounts.completions.toLocaleString(),
      },
      {
        label: 'Review Drafts Generated',
        value: liveCounts.drafts.toLocaleString(),
      },
      { label: 'Copy Clicks', value: liveCounts.copies.toLocaleString() },
      {
        label: 'Google Review Redirects',
        value: liveCounts.redirects.toLocaleString(),
        hint: 'Outbound clicks',
      },
    ],
    [liveCounts],
  )

  const liveJourney = useMemo(
    () => [
      { stage: 'Total Scans', count: liveCounts.totalScans },
      { stage: 'Landing-Page Views', count: liveCounts.landingViews },
      { stage: 'Questionnaire Completions', count: liveCounts.completions },
      { stage: 'Review Drafts Generated', count: liveCounts.drafts },
      { stage: 'Copy Clicks', count: liveCounts.copies },
      { stage: 'Google Review Redirects', count: liveCounts.redirects },
    ],
    [liveCounts],
  )

  const businessPerformance = useMemo(() => {
    return [...businesses]
      .sort(
        (a, b) => (b.analytics?.totalScans || 0) - (a.analytics?.totalScans || 0),
      )
      .slice(0, 8)
  }, [businesses])

  const performanceColumns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Business',
        render: (_, row) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center text-xs font-semibold text-text-primary shrink-0">
              {row.logoText}
            </div>
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
        key: 'totalScans',
        label: 'Total Scans',
        render: (_, row) => (
          <span className="tabular-nums text-text-primary">
            {(row.analytics?.totalScans || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'completions',
        label: 'Completions',
        render: (_, row) => (
          <span className="tabular-nums text-text-secondary">
            {(row.analytics?.questionnaireCompletions || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'reviewDrafts',
        label: 'Drafts',
        render: (_, row) => (
          <span className="tabular-nums text-text-secondary">
            {(row.analytics?.reviewDraftsGenerated || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'googleRedirects',
        label: 'Google Redirects',
        render: (_, row) => (
          <span className="tabular-nums font-medium text-text-primary">
            {(row.analytics?.googleReviewRedirects || 0).toLocaleString()}
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
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer ${
                  range === item.id
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
                className={`px-5 py-4 border-border ${
                  isTopRow ? 'border-b' : 'border-b lg:border-b-0'
                } ${idx % 2 === 0 ? 'border-r' : 'lg:border-r'} ${
                  idx === 3 || idx === 7 ? 'lg:border-r-0' : ''
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
          description="Total scans over the selected period"
        >
          <ScanActivityChart data={rangeData.scanActivity} />
        </ChartCard>

        <CustomerJourneyCard stages={liveJourney} />
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
