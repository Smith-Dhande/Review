import { useRef, useState } from 'react'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { businessesApi } from '../../services/api'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export default function LogoUpload({ value, onChange, onTempUploaded }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const processFile = async (file) => {
    if (!file) return
    setError('')

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Please upload a PNG, JPG, JPEG, or WebP image.')
      return
    }

    if (file.size > MAX_BYTES) {
      setError('Image size must be 5 MB or less.')
      return
    }

    setUploading(true)
    try {
      const res = await businessesApi.uploadLogo(file)
      if (res.logo?.publicId) {
        onTempUploaded?.(res.logo.publicId)
      }
      onChange(res.logo)
    } catch (err) {
      setError(err.message || 'Failed to upload logo.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  const previewUrl = typeof value === 'string' ? value : value?.url || ''

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Business Logo (Optional)
      </label>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="flex items-center gap-4 p-3 rounded-md border border-border bg-white">
          <div className="h-14 min-w-[56px] max-w-[140px] rounded-md border border-border bg-surface flex items-center justify-center px-2 py-1 overflow-hidden shrink-0">
            <img
              src={previewUrl}
              alt="Business logo preview"
              className="max-h-full w-auto max-w-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary">Logo uploaded</p>
            <p className="text-xs text-text-tertiary truncate">
              {value?.format ? value.format.toUpperCase() : 'PNG, JPG, WebP'}
              {value?.width && value?.height
                ? ` · ${value.width}×${value.height}`
                : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-border bg-white text-text-primary hover:bg-surface cursor-pointer transition-colors"
            >
              {uploading ? 'Uploading...' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove logo"
              className="p-1.5 rounded-md border border-border bg-white text-text-tertiary hover:text-error cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          className={`flex items-center justify-between gap-4 p-4 rounded-md border border-dashed transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary-light/40'
              : 'border-border bg-white hover:border-border-hover hover:bg-surface/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-surface border border-border flex items-center justify-center text-text-secondary shrink-0">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {uploading ? 'Uploading logo...' : 'Upload Logo'}
              </p>
              <p className="text-xs text-text-tertiary">
                Drag and drop or click to browse · PNG, JPG, JPEG, WebP (max 5
                MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
