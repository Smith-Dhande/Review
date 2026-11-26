const statusConfig = {
  active: {
    label: 'Active',
    colorClass: 'text-status-active',
  },
  inactive: {
    label: 'Inactive',
    colorClass: 'text-status-inactive',
  },
  pending: {
    label: 'Pending',
    colorClass: 'text-status-pending',
  },
}

export default function StatusText({ status }) {
  const normalized = String(status || '').toLowerCase()
  const config = statusConfig[normalized] || {
    label: normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : '',
    colorClass: 'text-text-secondary',
  }

  return (
    <span className={`font-medium text-sm ${config.colorClass}`}>
      {config.label}
    </span>
  )
}
