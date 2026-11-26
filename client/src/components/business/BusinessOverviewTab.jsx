import { useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { Check, Copy, Download, ExternalLink } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import StatusText from '../ui/StatusText'
import BusinessLogo from '../ui/BusinessLogo'
import LogoUpload from '../ui/LogoUpload'
import QrPreviewSvg from './QrPreviewSvg'
import { getPublicReviewUrl } from '../../context/BusinessesContext'
import { businessCategories } from '../../data/mockData'

export default function BusinessOverviewTab({
  business,
  isEditing,
  onCancelEdit,
  onSaveEdit,
}) {
  const [formData, setFormData] = useState({
    name: business.name || '',
    logo: business.logo?.url ? business.logo : null,
    category: business.category || businessCategories[0],
    location: business.location || '',
    address: business.address || '',
    phone: business.phone || '',
    email: business.email || '',
  })
  const [copied, setCopied] = useState(false)

  const publicUrl = getPublicReviewUrl(business)
  const fileSlug = business.slug || business.publicId || business.id

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSaveEdit(formData)
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

  const handleDownloadPng = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#1A1A1A',
          light: '#FFFFFF',
        },
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${fileSlug}-review-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      // Ignore download failure
    }
  }

  const handleDownloadSvg = async () => {
    try {
      const svg = await QRCode.toString(publicUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#1A1A1A',
          light: '#FFFFFF',
        },
      })
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileSlug}-review-qr.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      // Ignore download failure
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
          onChange={(logo) => setFormData((prev) => ({ ...prev, logo }))}
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

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
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
              id={`business-qr-${business.publicId || business.id}`}
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
                onClick={handleDownloadPng}
                className="w-full"
              >
                <Download className="w-3.5 h-3.5" />
                Download PNG
              </Button>
            </div>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="w-full text-center text-xs text-text-secondary hover:text-text-primary py-1 cursor-pointer transition-colors"
            >
              Download vector SVG
            </button>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <p className="text-xs text-text-tertiary">
              Program NFC tags with this same URL.
            </p>
            <Link
              to={`/review/${business.publicId || business.id}`}
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
