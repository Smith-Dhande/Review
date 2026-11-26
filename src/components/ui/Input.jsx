import { useId } from 'react'

export default function Input({
  label,
  error,
  type = 'text',
  id,
  className = '',
  ...rest
}) {
  const generatedId = useId()
  const inputId = id || generatedId

  const inputClasses = [
    'w-full rounded-md border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 transition-colors duration-150',
    error
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-border focus:border-primary focus:ring-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const inputElement = (
    <input
      id={id || (label ? inputId : undefined)}
      type={type}
      className={inputClasses}
      aria-invalid={error ? 'true' : undefined}
      {...rest}
    />
  )

  if (!label && !error) {
    return inputElement
  }

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          {label}
        </label>
      )}
      {inputElement}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}
