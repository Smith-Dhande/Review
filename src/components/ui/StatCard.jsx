import { isValidElement } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

const changeColors = {
  positive: 'text-status-active',
  negative: 'text-error',
  neutral: 'text-text-secondary',
}

export default function StatCard({
  label,
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
}) {
  const displayLabel = label ?? title
  const IconComponent = !isValidElement(icon) ? icon : null

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      {icon && (
        <div className="rounded-md bg-surface w-9 h-9 flex items-center justify-center text-text-secondary [&>svg]:w-4 [&>svg]:h-4">
          {IconComponent ? <IconComponent className="w-4 h-4" /> : icon}
        </div>
      )}
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mt-3">
        {displayLabel}
      </p>
      <p className="text-2xl font-semibold text-text-primary mt-1">{value}</p>
      {change && (
        <p
          className={`text-xs font-medium mt-1 inline-flex items-center gap-0.5 ${
            changeColors[changeType] || changeColors.neutral
          }`}
        >
          {changeType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5" />}
          {changeType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5" />}
          <span>{change}</span>
        </p>
      )}
    </div>
  )
}
