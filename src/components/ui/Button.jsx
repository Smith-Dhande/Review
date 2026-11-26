import { Loader2 } from 'lucide-react'

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-white border border-border text-text-primary hover:bg-surface',
  danger: 'bg-error text-white hover:bg-red-700',
  ghost: 'text-text-secondary hover:bg-surface hover:text-text-primary',
}

const sizeClasses = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        'rounded-md font-medium transition-colors duration-150 inline-flex items-center justify-center gap-2',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
