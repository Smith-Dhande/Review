import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Copy,
  CopyPlus,
  Download,
  ExternalLink,
  Pencil,
  Printer,
  Trash2,
} from 'lucide-react'
import QRCode from 'qrcode'
import Button from '../../../components/ui/Button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../context/ToastContext'
import StatusText from '../../../components/ui/StatusText'
import EmptyState from '../../../components/ui/EmptyState'
import ChartCard from '../../../components/ui/ChartCard'
import ScanActivityChart from '../../../components/charts/ScanActivityChart'
import QrPreviewSvg from '../../../components/business/QrPreviewSvg'
import { digitalCardsApi } from '../services/digitalCardsApi'
import { getDigitalCardPublicUrl } from '../constants/presets'

const DATE_RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'custom', label: 'Custom' },
]

export default function DigitalCardDetailsPage() {
  const { cardId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  const [range, setRange] = useState('30d')
  const [customFrom, setCustomFrom] = useState(() =>
    new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  )
  const [customTo, setCustomTo] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState('')

  useEffect(() => {
    let active = true
    digitalCardsApi
      .get(cardId)
      .then((res) => {
        if (!active) return
        setError('')
        setCard(res.card)
      })
      .catch((err) => {
        if (active) setError(err.message || 'Digital card not found.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [cardId])

  useEffect(() => {
    let active = true
    digitalCardsApi
      .cardAnalytics(cardId, {
        range,
        from: range === 'custom' ? customFrom : undefined,
        to: range === 'custom' ? customTo : undefined,
      })
      .then((data) => {
        if (!active) return
        setAnalyticsError('')
        setAnalytics(data)
      })
      .catch((err) => {
        if (active) setAnalyticsError(err.message || 'Analytics unavailable.')
      })
      .finally(() => {
        if (active) setAnalyticsLoading(false)
      })
    return () => {
      active = false
    }
  }, [cardId, range, customFrom, customTo])

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-10 text-center text-sm text-text-tertiary">
        Loading digital card...
      </div>
    )
  }

  if (!card) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <EmptyState
          title="Digital card not found"
          description={error || 'The requested digital card could not be located.'}
          action={
            <Link to="/digital-cards">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back to Digital Cards
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  const publicUrl = getDigitalCardPublicUrl(card)
  const p = card.personalInformation || {}

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      showToast({
        type: 'info',
        title: 'Public URL copied',
        message: 'Digital card link copied to clipboard.',
      })
      setTimeout(() => setCopied(false), 1800)
    } catch {
      showToast({
        type: 'warning',
        title: 'Copy failed',
        message: 'Could not access clipboard.',
      })
    }
  }

  const handleDownloadPng = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${card.slug}-card-qr.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      showToast({
        type: 'success',
        title: 'QR PNG downloaded',
        message: `${card.slug}-card-qr.png saved.`,
      })
    } catch {
      showToast({
        type: 'error',
        title: 'QR download failed',
        message: 'Could not generate QR PNG.',
      })
    }
  }

  const handleDownloadSvg = async () => {
    try {
      const svg = await QRCode.toString(publicUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
      })
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${card.slug}-card-qr.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast({
        type: 'success',
        title: 'QR SVG downloaded',
        message: `${card.slug}-card-qr.svg saved.`,
      })
    } catch {
      showToast({
        type: 'error',
        title: 'QR download failed',
        message: 'Could not generate QR SVG.',
      })
    }
  }

  const handlePrintVisitingCard = async () => {
    try {
      const svg = await QRCode.toString(publicUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
      })
      const w = window.open('', '_blank', 'width=560,height=420')
      if (!w) {
        showToast({
          type: 'warning',
          title: 'Popup blocked',
          message: 'Please allow popups to print the visiting card.',
        })
        return
      }
      showToast({
        type: 'info',
        title: 'Printable visiting card ready',
        message: 'Print dialog opened.',
      })
      const doc = w.document
      doc.open()
      doc.write(`<!doctype html><html><head><title></title><style>
        body{font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;color:#171716;}
        .vc{width:380px;border:1px solid #E5E5E3;border-radius:12px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:20px;}
        .name{font-size:18px;font-weight:700;margin:0 0 4px;}
        .role{font-size:12px;color:#666;margin:0 0 8px;}
        .hint{font-size:11px;color:#888;margin:0;}
        .qr{width:120px;height:120px;flex-shrink:0;}
        .qr svg{width:100%;height:100%;}
      </style></head><body><div class="vc">
        <div>
          <h1 class="name" id="vc-name"></h1>
          <p class="role" id="vc-role"></p>
          <p class="hint">Scan to view digital card & save contact</p>
        </div>
        <div class="qr">${svg}</div>
      </div></body></html>`)
      doc.close()
      doc.title = `${p.fullName || card.name} - Visiting Card`
      const nameEl = doc.getElementById('vc-name')
      if (nameEl) nameEl.textContent = p.fullName || card.name
      const roleEl = doc.getElementById('vc-role')
      if (roleEl) {
        roleEl.textContent = [p.jobTitle || p.profession, p.companyName]
          .filter(Boolean)
          .join(' · ')
      }
      w.focus()
      w.print()
    } catch {
      // Ignore
    }
  }

  const stats = analytics?.stats || {}

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-xs text-text-tertiary flex items-center gap-1.5">
        <Link to="/digital-cards" className="hover:text-text-primary">
          Digital Business Cards
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{p.fullName || card.name}</span>
      </nav>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[26px] font-semibold tracking-tight text-text-primary">
              {p.fullName || card.name}
            </h1>
            <StatusText status={card.status} />
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {[p.jobTitle || p.profession, p.companyName, p.location]
              .filter(Boolean)
              .join(' · ') || 'Digital Business Card'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/digital-cards/${card.slug}/edit`)}
          >
            <Pencil className="w-3.5 h-3.5" />
            Customize Card
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                const next = card.status === 'active' ? 'paused' : 'active'
                const res = await digitalCardsApi.updateStatus(card.slug, next)
                setCard(res.card)
                showToast({
                  type: 'success',
                  title: next === 'active' ? 'Card activated' : 'Card paused',
                  message: `${p.fullName || card.name} is now ${next}.`,
                })
              } catch (err) {
                const msg = err.message || 'Could not update status.'
                setError(msg)
                showToast({ type: 'error', title: 'Status update failed', message: msg })
              } finally {
                setBusy(false)
              }
            }}
          >
            {card.status === 'active' ? 'Pause Card' : 'Activate Card'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                const res = await digitalCardsApi.duplicate(card.slug)
                showToast({
                  type: 'success',
                  title: 'Card duplicated',
                  message: `Created a paused copy: ${res.card.name}.`,
                })
                navigate(`/digital-cards/${res.card.slug}`)
              } catch (err) {
                const msg = err.message || 'Could not duplicate card.'
                setError(msg)
                showToast({ type: 'error', title: 'Duplicate failed', message: msg })
              } finally {
                setBusy(false)
              }
            }}
          >
            <CopyPlus className="w-3.5 h-3.5" />
            Duplicate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete Card"
          >
            <Trash2 className="w-3.5 h-3.5 text-error" />
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
              {DATE_RANGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRange(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm cursor-pointer ${
                    range === item.id
                      ? 'bg-surface text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {range === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs"
                />
                <span>to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
            )}
          </div>

          {analyticsError && (
            <div role="alert" className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error">
              {analyticsError}
            </div>
          )}

          <div className="bg-card rounded-lg border border-border grid grid-cols-2 sm:grid-cols-4">
            {[
              { label: 'Profile Visits', value: stats.profileVisits || 0 },
              { label: 'Save Contact', value: stats.saveContactClicks || 0 },
              { label: 'Action Clicks', value: stats.totalActionClicks || 0 },
              { label: 'Social Clicks', value: stats.socialClicks || 0 },
            ].map((m, idx) => (
              <div
                key={m.label}
                className={`px-4 py-3.5 border-border ${idx < 3 ? 'sm:border-r' : ''} ${idx % 2 === 0 ? 'border-r sm:border-r' : ''} border-b sm:border-b-0`}
              >
                <p className="text-xs text-text-secondary">{m.label}</p>
                <p className="text-xl font-semibold text-text-primary tabular-nums mt-1">
                  {analyticsLoading ? '—' : m.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <ChartCard
            title="Profile Visits"
            description="Anonymous profile visits over the selected period"
          >
            <ScanActivityChart data={analytics?.activity || []} />
          </ChartCard>
        </div>

        {/* Single Permanent QR Code & NFC URL */}
        <div className="bg-card rounded-lg border border-border self-start">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">
              QR Code &amp; Public Link
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5">
              Same permanent URL for QR &amp; NFC tags
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-center py-3 bg-surface/60 rounded-lg border border-border">
              <QrPreviewSvg value={publicUrl} size={156} />
            </div>

            <div className="flex items-center gap-2 bg-surface rounded-md px-3 py-2 border border-border">
              <span className="text-xs text-text-primary truncate flex-1 font-mono">
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy card URL"
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-status-active" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied' : 'Copy URL'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownloadPng}>
                <Download className="w-3.5 h-3.5" />
                Download PNG
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-text-secondary">
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="hover:text-text-primary cursor-pointer"
              >
                Download SVG
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                onClick={handlePrintVisitingCard}
                className="inline-flex items-center gap-1 hover:text-text-primary cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Visiting Card
              </button>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Open live profile</span>
              <a
                href={`/card/${card.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Preview</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${p.fullName || card.name}"?`}
        description="This will permanently delete this digital card, disable its public QR/NFC link, and remove all associated visit and click analytics. This action cannot be undone."
        confirmLabel="Delete Card"
        loading={busy}
        onConfirm={async () => {
          setBusy(true)
          try {
            await digitalCardsApi.remove(card.slug)
            showToast({
              type: 'success',
              title: 'Card deleted successfully',
              message: `${p.fullName || card.name} was permanently removed.`,
            })
            navigate('/digital-cards', { replace: true })
          } catch (err) {
            const msg = err.message || 'Could not delete card.'
            setError(msg)
            showToast({ type: 'error', title: 'Delete failed', message: msg })
            setConfirmDelete(false)
          } finally {
            setBusy(false)
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
