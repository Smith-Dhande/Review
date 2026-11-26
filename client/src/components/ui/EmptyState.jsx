import { isValidElement } from 'react'

export default function EmptyState({ icon, title, description, action }) {
  const IconComponent = !isValidElement(icon) ? icon : null

  return (
    <div className="py-16 text-center px-4">
      {icon && (
        <div className="mx-auto w-12 h-12 rounded-lg bg-surface flex items-center justify-center mb-4 text-text-tertiary [&>svg]:w-6 [&>svg]:h-6">
          {IconComponent ? <IconComponent className="w-6 h-6" /> : icon}
        </div>
      )}
      {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
      {description && (
        <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
