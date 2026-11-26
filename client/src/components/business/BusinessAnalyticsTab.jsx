import CustomerJourneyCard from '../charts/CustomerJourneyCard'

export default function BusinessAnalyticsTab({ business }) {
  const stats = business.analytics || {
    totalScans: 0,
    landingViews: 0,
    questionnaireCompletions: 0,
    reviewDraftsGenerated: 0,
    copyClicks: 0,
    googleReviewRedirects: 0,
  }

  const metrics = [
    { label: 'Total QR Scans', value: stats.totalScans.toLocaleString() },
    { label: 'Landing-Page Visits', value: stats.landingViews.toLocaleString() },
    {
      label: 'Questionnaire Completions',
      value: stats.questionnaireCompletions.toLocaleString(),
    },
    {
      label: 'Review Drafts Generated',
      value: stats.reviewDraftsGenerated.toLocaleString(),
    },
    { label: 'Copy Clicks', value: stats.copyClicks.toLocaleString() },
    {
      label: 'Google Review Redirects',
      value: stats.googleReviewRedirects.toLocaleString(),
      hint: 'Outbound clicks',
    },
  ]

  const journeyStages = [
    { stage: 'Total Scans', count: stats.totalScans },
    { stage: 'Landing-Page Visits', count: stats.landingViews },
    {
      stage: 'Questionnaire Completions',
      count: stats.questionnaireCompletions,
    },
    { stage: 'Review Drafts Generated', count: stats.reviewDraftsGenerated },
    { stage: 'Copy Clicks', count: stats.copyClicks },
    { stage: 'Google Review Redirects', count: stats.googleReviewRedirects },
  ]

  return (
    <div className="space-y-6">
      <section
        aria-label="Business metrics"
        className="bg-card rounded-lg border border-border overflow-hidden"
      >
        <div className="grid grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, idx) => {
            const isTopRow = idx < 3
            return (
              <div
                key={metric.label}
                className={`px-5 py-4 border-border ${
                  isTopRow ? 'border-b' : 'border-b lg:border-b-0'
                } ${idx % 2 === 0 ? 'border-r' : 'lg:border-r'} ${
                  idx === 2 || idx === 5 ? 'lg:border-r-0' : ''
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

      <CustomerJourneyCard stages={journeyStages} />
    </div>
  )
}
