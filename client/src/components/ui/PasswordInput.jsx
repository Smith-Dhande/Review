import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({
  label,
  error,
  id,
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false)
  const generatedId = useId()
  const inputId = id || generatedId

  const inputClasses = [
    'w-full rounded-md border bg-white px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 transition-colors duration-150',
    error
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-border focus:border-primary focus:ring-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ')

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
      <div className="relative">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={inputClasses}
          aria-invalid={error ? 'true' : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0 bg-transparent border-none cursor-pointer text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}
