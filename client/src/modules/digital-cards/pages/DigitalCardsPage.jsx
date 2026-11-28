import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Copy,
  CopyPlus,
  CreditCard,
  Download,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react'
import QRCode from 'qrcode'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import StatusText from '../../../components/ui/StatusText'
import Button from '../../../components/ui/Button'
import { digitalCardsApi } from '../services/digitalCardsApi'
import { getDigitalCardPublicUrl } from '../constants/presets'

export default function DigitalCardsPage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [counts, setCounts] = useState({ all: 0, active: 0, paused: 0 })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  })
  const [overviewStats, setOverviewStats] = useState({
    profileVisits: 0,
    saveContactClicks: 0,
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [listRes, ovRes] = await Promise.all([
        digitalCardsApi.list({
          page,
          limit: pageSize,
          search: search.trim(),
          status: statusFilter,
        }),
        digitalCardsApi.analyticsOverview({ range: '30d' }),
      ])
      setCards(listRes.cards || [])
      if (listRes.pagination) setPagination(listRes.pagination)
      if (listRes.counts) setCounts(listRes.counts)
      if (ovRes.stats) setOverviewStats(ovRes.stats)
    } catch (err) {
      setError(err.message || 'Failed to load digital business cards.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 150)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleCopyUrl = async (e, card) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(getDigitalCardPublicUrl(card))
      setCopiedId(card.slug)
      setTimeout(() => setCopiedId(null), 1800)
    } catch {
      // Ignore clipboard failure
    }
  }

  const handleDownloadQr = async (e, card) => {
    e.stopPropagation()
    try {
      const url = getDigitalCardPublicUrl(card)
      const dataUrl = await QRCode.toDataURL(url, {
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
    } catch {
      // Ignore QR error
    }
  }

  const handleToggleStatus = async (e, card) => {
    e.stopPropagation()
    if (busyId) return
    setBusyId(card.slug)
    setError('')
    try {
      const next = card.status === 'active' ? 'paused' : 'active'
      await digitalCardsApi.updateStatus(card.slug, next)
      await loadData()
    } catch (err) {
      setError(err.message || 'Could not update card status.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDuplicate = async (e, card) => {
    e.stopPropagation()
    if (busyId) return
    setBusyId(card.slug)
    setError('')
    try {
      await digitalCardsApi.duplicate(card.slug)
      await loadData()
    } catch (err) {
      setError(err.message || 'Could not duplicate card.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (e, slug) => {
    e.stopPropagation()
    if (busyId) return
    setBusyId(slug)
    setError('')
    try {
      await digitalCardsApi.remove(slug)
      setConfirmDeleteId(null)
      await loadData()
    } catch (err) {
      setError(err.message || 'Could not delete card.')
    } finally {
      setBusyId(null)
    }
  }

  const metrics = [
    { label: 'Total Digital Cards', value: counts.all.toLocaleString() },
    { label: 'Active Cards', value: counts.active.toLocaleString() },
    { label: 'Paused Cards', value: counts.paused.toLocaleString() },
    {
      label: 'Profile Visits (30d)',
      value: (overviewStats.profileVisits || 0).toLocaleString(),
    },
    {
      label: 'Contact Saves (30d)',
      value: (overviewStats.saveContactClicks || 0).toLocaleString(),
    },
  ]

  const columns = [
    {
      key: 'name',
      label: 'Card',
      render: (_, row) => {
        const p = row.personalInformation || {}
        const avatar = p.profilePicture?.url
        return (
          <div className="flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={p.fullName || row.name}
                className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                {(p.fullName || row.name || 'DC').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-text-primary">
                {p.fullName || row.name}
              </p>
              <p className="text-xs text-text-tertiary">
                {[p.jobTitle || p.profession, p.companyName]
                  .filter(Boolean)
                  .join(' · ') || row.templateId}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusText status={row.status} />,
    },
    {
      key: 'templateId',
      label: 'Template',
      render: (_, row) => (
        <span className="text-xs text-text-secondary capitalize">
          {String(row.templateId || 'minimal-white').replace(/-/g, ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div
          className="flex items-center gap-1.5 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => navigate(`/digital-cards/${row.slug}/edit`)}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-white text-text-primary hover:bg-surface cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={busyId === row.slug}
            onClick={(e) => handleDuplicate(e, row)}
            title="Duplicate card"
            className="p-1.5 text-xs rounded-md border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface cursor-pointer disabled:opacity-50"
          >
            <CopyPlus className="w-3.5 h-3.5" />
          </button>
          <a
            href={`/card/${row.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview public card"
            className="p-1.5 text-xs rounded-md border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={(e) => handleCopyUrl(e, row)}
            title="Copy public URL"
            className="p-1.5 text-xs rounded-md border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface cursor-pointer"
          >
            {copiedId === row.slug ? (
              <Check className="w-3.5 h-3.5 text-status-active" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => handleDownloadQr(e, row)}
            title="Download QR PNG"
            className="p-1.5 text-xs rounded-md border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={busyId === row.slug}
            onClick={(e) => handleToggleStatus(e, row)}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface cursor-pointer disabled:opacity-50"
          >
            {busyId === row.slug
              ? '...'
              : row.status === 'active'
                ? 'Pause'
                : 'Activate'}
          </button>
          {confirmDeleteId !== row.slug ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteId(row.slug)}
              aria-label={`Delete ${row.name}`}
              className="p-1.5 text-xs rounded-md border border-border bg-white text-error hover:bg-error-light cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                disabled={busyId === row.slug}
                onClick={(e) => handleDelete(e, row.slug)}
                className="px-2 py-1 text-xs font-medium rounded-md bg-error text-white cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-2 py-1 text-xs text-text-secondary cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Business Cards"
        description="Create, customize, and share individual digital visiting cards via QR & NFC"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/digital-cards/new')}
          >
            <Plus className="w-4 h-4" />
            Create Digital Card
          </Button>
        }
      />

      {/* Overview Stats */}
      <section
        aria-label="Digital cards statistics"
        className="bg-card rounded-lg border border-border overflow-hidden"
      >
        <div className="grid grid-cols-2 lg:grid-cols-5">
          {metrics.map((m, idx) => (
            <div
              key={m.label}
              className={`px-5 py-4 border-border ${
                idx < 4 ? 'lg:border-r' : ''
              } ${idx % 2 === 0 ? 'border-r lg:border-r' : ''} border-b lg:border-b-0`}
            >
              <p className="text-xs font-medium text-text-secondary">
                {m.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight text-text-primary tabular-nums mt-1.5">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error"
        >
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div
        role="group"
        aria-label="Digital card status filter"
        className="inline-flex items-center rounded-md border border-border bg-card p-0.5"
      >
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'active', label: `Active (${counts.active})` },
          { id: 'paused', label: `Paused (${counts.paused})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatusFilter(tab.id)
              setPage(1)
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-surface text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={cards}
        searchable
        searchPlaceholder="Search by name, profession, or company..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        pagination={false}
        onRowClick={(row) => navigate(`/digital-cards/${row.slug}`)}
        emptyTitle={
          loading ? 'Loading digital cards...' : 'No digital cards found'
        }
        emptyDescription={
          loading
            ? 'Fetching cards...'
            : 'Create your first digital business card to get started.'
        }
        emptyIcon={CreditCard}
      />

      {pagination.total > 0 && (
        <div
          aria-label="Pagination"
          className="bg-card border border-border rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Showing{' '}
              <span className="font-medium text-text-primary tabular-nums">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>
              –
              <span className="font-medium text-text-primary tabular-nums">
                {Math.min(pagination.total, pagination.page * pagination.limit)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-text-primary tabular-nums">
                {pagination.total}
              </span>{' '}
              {pagination.total === 1 ? 'card' : 'cards'}
            </span>
            <label className="inline-flex items-center gap-1.5">
              <span className="text-text-tertiary">Per page</span>
              <select
                aria-label="Cards per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 text-xs bg-surface border border-border rounded-md text-text-primary cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (pNum) =>
                  pNum === 1 ||
                  pNum === pagination.totalPages ||
                  Math.abs(pNum - pagination.page) <= 1,
              )
              .map((pNum, idx, arr) => {
                const prev = arr[idx - 1]
                const showEllipsis = prev && pNum - prev > 1
                return (
                  <span key={pNum} className="inline-flex items-center gap-1.5">
                    {showEllipsis && (
                      <span className="px-1 text-text-tertiary">…</span>
                    )}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setPage(pNum)}
                      aria-current={
                        pNum === pagination.page ? 'page' : undefined
                      }
                      className={`min-w-7 h-7 px-2 rounded-md text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                        pNum === pagination.page
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
                      }`}
                    >
                      {pNum}
                    </button>
                  </span>
                )
              })}

            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
