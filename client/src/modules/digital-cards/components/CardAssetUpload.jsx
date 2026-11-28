import { useRef, useState } from 'react'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { digitalCardsApi } from '../services/digitalCardsApi'

export default function CardAssetUpload({ label, value, onChange, hint }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const res = await digitalCardsApi.uploadAsset(file)
      onChange(res.logo)
    } catch (err) {
      setError(err.message || 'Image upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = async () => {
    const publicId = value?.publicId
    onChange(null)
    if (publicId) {
      digitalCardsApi.cleanupAsset(publicId).catch(() => {})
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-primary">{label}</span>
        {hint && <span className="text-[11px] text-text-tertiary">{hint}</span>}
      </div>

      <div className="flex items-center gap-3">
        {value?.url ? (
          <img
            src={value.url}
            alt={label}
            className="w-12 h-12 rounded-md object-cover border border-border shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md border border-dashed border-border bg-surface flex items-center justify-center text-text-tertiary shrink-0">
            <Upload className="w-4 h-4" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-white text-text-primary hover:bg-surface inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>{value?.url ? 'Replace' : 'Upload'}</span>
            )}
          </button>

          {value?.url && (
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemove}
              aria-label={`Remove ${label}`}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-border bg-white text-error hover:bg-error-light inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
}
