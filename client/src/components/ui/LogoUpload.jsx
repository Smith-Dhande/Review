import { useRef, useState } from 'react'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { businessesApi, resolveAssetUrl } from '../../services/api'

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
])
const MAX_BYTES = 1.5 * 1024 * 1024

export default function LogoUpload({ value, onChange }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const processFile = (file) => {
    if (!file) return
    setError('')

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Please upload a PNG, JPG, WebP, or SVG image.')
      return
    }

    if (file.size > MAX_BYTES) {
      setError('Image size must be 1.5 MB or less.')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await businessesApi.uploadLogo({
          mimeType: file.type,
          dataBase64: reader.result,
        })
        onChange(res.logoUrl)
      } catch (err) {
        setError(err.message || 'Failed to upload logo.')
      } finally {
        setUploading(false)
      }
    }
    reader.onerror = () => {
      setError('Could not read the selected file.')
      setUploading(false)
    }
    reader.readAsDataURL(file)
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

  const previewUrl = resolveAssetUrl(value)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Business Logo (Optional)
      </label>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="flex items-center gap-4 p-3 rounded-md border border-border bg-white">
          <div className="w-14 h-14 rounded-md border border-border bg-surface flex items-center justify-center p-1.5 overflow-hidden shrink-0">
            <img
              src={previewUrl}
              alt="Business logo preview"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary">Logo uploaded</p>
            <p className="text-xs text-text-tertiary truncate">
              PNG, JPG, WebP, or SVG
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
              onClick={() => onChange('')}
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
                Drag and drop or click to browse · PNG, JPG, WebP, SVG (max 1.5 MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
