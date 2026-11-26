import { X } from 'lucide-react'
import Button from './Button'

export default function SlideDownPanel({ isOpen, onClose, title, children }) {
  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isOpen
          ? 'max-h-[600px] opacity-100 overflow-y-auto'
          : 'max-h-0 overflow-hidden opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close panel"
            className="px-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
