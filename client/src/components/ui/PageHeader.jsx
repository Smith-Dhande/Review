import { Fragment } from 'react'
import { Link } from 'react-router-dom'

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-text-tertiary mb-2 flex items-center flex-wrap gap-1.5"
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <span>/</span>}
                {crumb.href && !isLast ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-text-primary transition-colors duration-150"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-text-secondary' : ''}>
                    {crumb.label}
                  </span>
                )}
              </Fragment>
            )
          })}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}
