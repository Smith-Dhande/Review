import CustomerJourneyCard from '../charts/CustomerJourneyCard'

export default function BusinessAnalyticsTab({ business }) {
  const stats = business.analytics || {
    totalScans: 0,
    landingViews: 0,
    totalInitialRatings: 0,
    ratingSum: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    questionnaireCompletions: 0,
    reviewDraftsGenerated: 0,
    copyClicks: 0,
    googleReviewRedirects: 0,
  }

  const totalRatings = stats.totalInitialRatings || 0
  const avgRating =
    totalRatings > 0 ? (stats.ratingSum / totalRatings).toFixed(1) : '—'

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
    { label: 'Total QR Scans', value: (stats.totalScans || 0).toLocaleString() },
    {
      label: 'Landing-Page Visits',
      value: (stats.landingViews || 0).toLocaleString(),
    },
    { label: 'Total Initial Ratings', value: totalRatings.toLocaleString() },
    {
      label: 'Average Initial Rating',
      value: avgRating === '—' ? '—' : `${avgRating} / 5`,
      hint: 'Pre-questionnaire',
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

  const journeyStages = [
    { stage: 'Total Scans', count: stats.totalScans || 0 },
    { stage: 'Landing-Page Visits', count: stats.landingViews || 0 },
    { stage: 'Initial Ratings', count: totalRatings },
    {
      stage: 'Questionnaire Completions',
      count: stats.questionnaireCompletions || 0,
    },
    {
      stage: 'Review Drafts Generated',
      count: stats.reviewDraftsGenerated || 0,
    },
    { stage: 'Copy Clicks', count: stats.copyClicks || 0 },
    {
      stage: 'Google Review Redirects',
      count: stats.googleReviewRedirects || 0,
    },
  ]

  return (
    <div className="space-y-6">
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
                totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
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
    </div>
  )
}
