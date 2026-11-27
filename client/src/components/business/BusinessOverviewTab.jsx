import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { Check, Copy, Download, ExternalLink, Printer } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import StatusText from '../ui/StatusText'
import BusinessLogo from '../ui/BusinessLogo'
import LogoUpload from '../ui/LogoUpload'
import QrPreviewSvg from './QrPreviewSvg'
import { getPublicReviewUrl } from '../../context/BusinessesContext'
import { businessesApi } from '../../services/api'
import { businessCategories } from '../../utils/businessOptions'

function buildInitialForm(business) {
  return {
    name: business.name || '',
    logo: business.logo?.url ? business.logo : null,
    category: business.category || businessCategories[0],
    location: business.location || '',
    address: business.address || '',
    phone: business.phone || '',
    email: business.email || '',
  }
}

export default function BusinessOverviewTab({
  business,
  isEditing,
  onCancelEdit,
  onSaveEdit,
}) {
  const [formData, setFormData] = useState(() => buildInitialForm(business))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied, setCopied] = useState(false)
  const [qrDownloading, setQrDownloading] = useState('')
  const [qrError, setQrError] = useState('')

  const tempLogoIdsRef = useRef(new Set())

  const publicUrl = getPublicReviewUrl(business)
  const targetId = business.publicId || business.id
  const fileSlug = business.slug || targetId

  const cleanupTempLogos = async (keepPublicId = '') => {
    const ids = Array.from(tempLogoIdsRef.current).filter(
      (id) => id && id !== keepPublicId,
    )
    tempLogoIdsRef.current.clear()
    await Promise.all(
      ids.map((id) => businessesApi.cleanupTempLogo(id).catch(() => { })),
    )
  }

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleLogoChange = (nextLogo) => {
    const prevId = formData.logo?.publicId
    if (
      prevId &&
      prevId !== nextLogo?.publicId &&
      tempLogoIdsRef.current.has(prevId)
    ) {
      tempLogoIdsRef.current.delete(prevId)
      businessesApi.cleanupTempLogo(prevId).catch(() => { })
    }
    setFormData((prev) => ({ ...prev, logo: nextLogo }))
  }

  const handleCancel = () => {
    cleanupTempLogos()
    setSaveError('')
    onCancelEdit()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!formData.name.trim()) {
      setSaveError('Business name is required.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await onSaveEdit(formData)
      await cleanupTempLogos(formData.logo?.publicId || '')
    } catch (err) {
      setSaveError(err.message || 'Could not update business information.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard fallback ignored
    }
  }

  const handleDownloadQr = async (format) => {
    if (qrDownloading) return
    setQrError('')
    setQrDownloading(format)
    try {
      const blob = await businessesApi.downloadQr(targetId, format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileSlug}-review-qr.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setQrError(err.message || `Could not download QR ${format.toUpperCase()}.`)
    } finally {
      setQrDownloading('')
    }
  }

  const handlePrintQrCard = async () => {
    setQrError('')
    try {
      const svg = await QRCode.toString(publicUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#1A1A1A', light: '#FFFFFF' },
      })
      const win = window.open('', '_blank', 'width=560,height=720')
      if (!win) {
        setQrError('Please allow popups to open the printable QR card.')
        return
      }
      const safeName = String(business.name || 'ReviewBuddy').replace(
        /[&<>"']/g,
        (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]),
      )
      win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeName} — Review QR Card</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 32px; display: flex; justify-content: center; background: #fafaf8; color: #1a1a1a; }
    .card { width: 380px; background: #fff; border: 1px solid #e5e5e3; border-radius: 14px; padding: 32px 28px; text-align: center; }
    .kicker { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #1b6b4a; font-weight: 600; margin: 0 0 8px; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    .sub { font-size: 14px; color: #57554f; margin: 0 0 24px; }
    .qr { width: 240px; height: 240px; margin: 0 auto 20px; border: 1px solid #e5e5e3; border-radius: 10px; padding: 10px; background: #fff; }
    .qr svg { width: 100%; height: 100%; display: block; }
    .foot { font-size: 12px; color: #787670; border-top: 1px solid #e5e5e3; padding-top: 14px; margin-top: 14px; }
    @media print { body { background: #fff; padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="card">
    <p class="kicker">Share Your Experience</p>
    <h1>${safeName}</h1>
    <p class="sub">Scan this QR code to share quick feedback and draft your review.</p>
    <div class="qr">${svg}</div>
    <p class="foot">Powered by ReviewBuddy</p>
    <button class="no-print" onclick="window.print()" style="margin-top:16px;padding:8px 16px;cursor:pointer;">Print Card</button>
  </div>
</body>
</html>`)
      win.document.close()
    } catch {
      setQrError('Could not prepare printable QR card.')
    }
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-lg border border-border p-6 space-y-5"
      >
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Edit Business Information
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            Update profile, location, and contact details for {business.name}.
            The public QR URL remains unchanged.
          </p>
        </div>

        <LogoUpload
          value={formData.logo}
          onChange={handleLogoChange}
          onTempUploaded={(pid) => tempLogoIdsRef.current.add(pid)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Business Name"
            value={formData.name}
            onChange={handleChange('name')}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Category
            </label>
            <select
              value={formData.category}
              onChange={handleChange('category')}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {businessCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Location (Optional)"
            value={formData.location}
            onChange={handleChange('location')}
            placeholder="e.g. Bandra West, Mumbai"
          />
          <Input
            label="Address (Optional)"
            value={formData.address}
            onChange={handleChange('address')}
            placeholder="Full street address"
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={handleChange('phone')}
            placeholder="+91 98201 44510"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="hello@business.in"
          />
        </div>

        {saveError && (
          <div
            role="alert"
            className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error"
          >
            {saveError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Business Information */}
      <div className="lg:col-span-2 bg-card rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Business Information
          </h3>
          <BusinessLogo
            logo={business.logo}
            logoUrl={business.logoUrl}
            logoText={business.logoText}
            name={business.name}
            size="sm"
          />
        </div>
        <dl className="divide-y divide-border">
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Business Name
            </dt>
            <dd className="text-sm font-medium text-text-primary sm:col-span-2">
              {business.name}
            </dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Category
            </dt>
            <dd className="text-sm text-text-primary sm:col-span-2">
              {business.category}
            </dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Status
            </dt>
            <dd className="sm:col-span-2">
              <StatusText status={business.status} />
            </dd>
          </div>
          {business.location && (
            <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Location
              </dt>
              <dd className="text-sm text-text-primary sm:col-span-2">
                {business.location}
              </dd>
            </div>
          )}
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Phone
            </dt>
            <dd className="text-sm text-text-primary sm:col-span-2">
              {business.phone || '—'}
            </dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Email
            </dt>
            <dd className="text-sm text-text-primary sm:col-span-2">
              {business.email || '—'}
            </dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Address
            </dt>
            <dd className="text-sm text-text-primary sm:col-span-2">
              {business.address || '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Single Generated Business QR Code */}
      <div className="bg-card rounded-lg border border-border self-start">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">
            Business QR Code
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {business.name} · Permanent review link
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex justify-center py-3 bg-surface/60 rounded-lg border border-border">
            <QrPreviewSvg
              id={`business-qr-${targetId}`}
              value={publicUrl}
              size={156}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-text-secondary">
              Public Review URL
            </p>
            <div className="flex items-center gap-2 bg-surface rounded-md px-3 py-2 border border-border">
              <span className="text-xs text-text-primary truncate flex-1 font-mono">
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                aria-label="Copy public review URL"
                className="text-text-tertiary hover:text-text-primary cursor-pointer shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-status-active" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyUrl}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-status-active" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy URL
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={qrDownloading === 'png'}
                onClick={() => handleDownloadQr('png')}
                className="w-full"
              >
                <Download className="w-3.5 h-3.5" />
                Download PNG
              </Button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={qrDownloading === 'svg'}
                onClick={() => handleDownloadQr('svg')}
                className="text-xs text-text-secondary hover:text-text-primary py-1 cursor-pointer transition-colors disabled:opacity-50"
              >
                {qrDownloading === 'svg' ? 'Downloading SVG...' : 'Download vector SVG'}
              </button>

              <button
                type="button"
                onClick={handlePrintQrCard}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 py-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print QR Card</span>
              </button>
            </div>

            {qrError && (
              <p role="alert" className="text-xs text-error">
                {qrError}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <p className="text-xs text-text-tertiary">
              Program NFC tags with this same URL.
            </p>
            <Link
              to={`/review/${targetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Preview</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
