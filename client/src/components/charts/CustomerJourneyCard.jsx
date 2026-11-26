export default function CustomerJourneyCard({ stages = [] }) {
  const maxCount = stages[0]?.count || 1

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-5 pt-5 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Customer Journey
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            Progression from initial scan to outbound Google review redirect
          </p>
        </div>
        <span className="text-xs text-text-tertiary">
          Overall redirect rate:{' '}
          <span className="font-medium text-text-primary tabular-nums">
            {stages.length > 0 && maxCount > 0
              ? `${Math.round((stages[stages.length - 1].count / maxCount) * 100)}%`
              : '0%'}
          </span>
        </span>
      </div>

      <div className="p-5 space-y-3.5">
        {stages.map((item, index) => {
          const pctOfTotal =
            maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
          const prevCount = index > 0 ? stages[index - 1].count : item.count
          const stepRate =
            index > 0 && prevCount > 0
              ? Math.round((item.count / prevCount) * 100)
              : 100

          return (
            <div key={item.stage} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-medium text-text-tertiary tabular-nums w-4">
                    {index + 1}.
                  </span>
                  <span className="font-medium text-text-primary truncate">
                    {item.stage}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 tabular-nums">
                  {index > 0 && (
                    <span className="text-xs text-text-tertiary">
                      {stepRate}% from prev
                    </span>
                  )}
                  <span className="font-semibold text-text-primary w-14 text-right">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-text-secondary w-10 text-right">
                    {pctOfTotal}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-surface rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary rounded-sm transition-all duration-300"
                  style={{ width: `${pctOfTotal}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-5 py-3 border-t border-border bg-surface/40 rounded-b-lg">
        <p className="text-xs text-text-tertiary">
          Note: Google review redirects track outbound clicks to the Google
          review page and are not confirmed review submissions.
        </p>
      </div>
    </div>
  )
}
