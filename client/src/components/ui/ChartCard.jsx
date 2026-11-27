export default function ChartCard({
  title,
  description,
  children,
  className = '',
}) {
  return (
    <div className={`bg-card rounded-lg border border-border min-w-0 ${className}`.trim()}>
      <div className="px-5 pt-5 pb-0">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
