import { Loader2 } from 'lucide-react'

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="py-16 text-center px-4">
      <Loader2 className="mx-auto w-6 h-6 text-text-tertiary animate-spin mb-3" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  )
}
