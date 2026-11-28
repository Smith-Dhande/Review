import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react'

const ToastContext = createContext(null)

const MAX_TOASTS = 3
const DEFAULT_DURATION = 3500
const DEDUPE_WINDOW_MS = 400

const NOOP_TOAST = {
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
}

const TYPE_STYLES = {
  success: {
    icon: CheckCircle2,
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
  },
  error: {
    icon: AlertCircle,
    border: 'border-red-200',
    iconColor: 'text-red-600',
    accentBg: 'bg-red-50',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    accentBg: 'bg-amber-50',
  },
  info: {
    icon: Info,
    border: 'border-sky-200',
    iconColor: 'text-sky-600',
    accentBg: 'bg-sky-50',
  },
}

function ToastItem({ toast, onDismiss, onPause, onResume }) {
  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info
  const Icon = style.icon
  const isError = toast.type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={() => onPause(toast.id)}
      onMouseLeave={() => onResume(toast.id)}
      onFocus={() => onPause(toast.id)}
      onBlur={() => onResume(toast.id)}
      className={`toast-enter pointer-events-auto w-full bg-card border ${style.border} rounded-xl shadow-lg px-3.5 py-3 flex items-start gap-3 transition-all duration-150`}
    >
      <div
        className={`w-7 h-7 rounded-lg ${style.accentBg} ${style.iconColor} flex items-center justify-center shrink-0 mt-0.5`}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="text-xs font-semibold text-text-primary leading-snug break-words">
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p
            className={`text-xs text-text-secondary leading-relaxed break-words ${
              toast.title ? 'mt-0.5' : ''
            }`}
          >
            {toast.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-text-tertiary hover:text-text-primary p-1 -m-1 rounded-md cursor-pointer transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())
  const recentRef = useRef(new Map())
  const idCounterRef = useRef(0)

  const clearTimer = useCallback((id) => {
    const entry = timersRef.current.get(id)
    if (entry?.timerId) {
      clearTimeout(entry.timerId)
    }
    timersRef.current.delete(id)
  }, [])

  const dismissToast = useCallback(
    (id) => {
      clearTimer(id)
      setToasts((prev) => prev.filter((t) => t.id !== id))
    },
    [clearTimer],
  )

  const startTimer = useCallback(
    (id, duration) => {
      if (!duration || duration <= 0) return
      clearTimer(id)
      const startedAt = Date.now()
      const timerId = setTimeout(() => {
        dismissToast(id)
      }, duration)
      timersRef.current.set(id, {
        timerId,
        remaining: duration,
        startedAt,
      })
    },
    [clearTimer, dismissToast],
  )

  const pauseTimer = useCallback((id) => {
    const entry = timersRef.current.get(id)
    if (!entry || !entry.timerId) return
    clearTimeout(entry.timerId)
    const elapsed = Date.now() - entry.startedAt
    const remaining = Math.max(250, entry.remaining - elapsed)
    timersRef.current.set(id, {
      timerId: null,
      remaining,
      startedAt: Date.now(),
    })
  }, [])

  const resumeTimer = useCallback(
    (id) => {
      const entry = timersRef.current.get(id)
      if (!entry || entry.timerId) return
      startTimer(id, entry.remaining)
    },
    [startTimer],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((entry) => {
        if (entry?.timerId) clearTimeout(entry.timerId)
      })
      timers.clear()
    }
  }, [])

  const showToast = useCallback(
    (input, fallbackType = 'info') => {
      const opts =
        typeof input === 'string'
          ? { title: input, type: fallbackType }
          : input || {}

      const type = TYPE_STYLES[opts.type] ? opts.type : 'info'
      const title = String(opts.title || '').trim()
      const message = String(opts.message || '').trim()
      if (!title && !message) return null

      const duration =
        typeof opts.duration === 'number' ? opts.duration : DEFAULT_DURATION

      // Deduplicate identical rapid consecutive toasts
      const key = `${type}:${title}:${message}`
      const now = Date.now()
      const lastShown = recentRef.current.get(key)
      if (lastShown && now - lastShown < DEDUPE_WINDOW_MS) {
        return null
      }
      recentRef.current.set(key, now)

      idCounterRef.current += 1
      const id = `toast-${now}-${idCounterRef.current}`

      setToasts((prev) => {
        const next = [...prev, { id, type, title, message, duration }]
        if (next.length > MAX_TOASTS) {
          const evicted = next.slice(0, next.length - MAX_TOASTS)
          evicted.forEach((t) => clearTimer(t.id))
          return next.slice(next.length - MAX_TOASTS)
        }
        return next
      })

      startTimer(id, duration)
      return id
    },
    [clearTimer, startTimer],
  )

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications"
        className="fixed z-50 top-3 inset-x-3 sm:inset-x-auto sm:top-4 sm:right-4 sm:w-[360px] flex flex-col gap-2.5 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            onPause={pauseTimer}
            onResume={resumeTimer}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx || NOOP_TOAST
}
