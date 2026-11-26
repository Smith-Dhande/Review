import { useState } from 'react'
import { MoreHorizontal, Plus, QrCode } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusText from '../components/ui/StatusText'
import Button from '../components/ui/Button'
import SlideDownPanel from '../components/ui/SlideDownPanel'
import Input from '../components/ui/Input'
import { qrCodesData, businessesData } from '../data/mockData'

const getRow = (arg1, arg2) =>
  arg2 && typeof arg2 === 'object' ? arg2 : arg1

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const initialFormState = {
  businessId: businessesData[0]?.id || '',
  placement: '',
  status: 'active',
}

export default function QRCodesPage() {
  const [search, setSearch] = useState('')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormState)

  const filteredQrCodes = qrCodesData.filter((qr) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      qr.businessName.toLowerCase().includes(query) ||
      qr.placement.toLowerCase().includes(query)
    )
  })

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setFormData(initialFormState)
  }

  const handleCreate = (e) => {
    e.preventDefault()
    handleClosePanel()
  }

  const columns = [
    {
      key: 'id',
      label: 'QR ID',
      header: 'QR ID',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm font-medium text-text-primary tabular-nums">
            {row.id}
          </span>
        )
      },
    },
    {
      key: 'businessName',
      label: 'Business',
      header: 'Business',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm font-medium text-text-primary">
            {row.businessName}
          </span>
        )
      },
    },
    {
      key: 'placement',
      label: 'Placement',
      header: 'Placement',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm text-text-secondary">{row.placement}</span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      header: 'Status',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return <StatusText status={row.status} />
      },
    },
    {
      key: 'scans',
      label: 'Scans',
      header: 'Scans',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm text-text-primary tabular-nums">
            {row.scans.toLocaleString()}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      header: 'Created Date',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm text-text-secondary">
            {formatDate(row.createdAt)}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      header: 'Actions',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <button
            type="button"
            aria-label={`Actions for ${row.id}`}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors duration-150"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Codes"
        description="Manage QR codes for businesses"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'QR Codes' }]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsPanelOpen((prev) => !prev)}
          >
            <Plus className="w-4 h-4" />
            Create QR Code
          </Button>
        }
      />

      <SlideDownPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title="Create QR Code"
      >
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="qr-business"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                Business
              </label>
              <select
                id="qr-business"
                name="businessId"
                value={formData.businessId}
                onChange={handleFieldChange('businessId')}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-150"
              >
                {businessesData.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Placement Name"
              name="placement"
              placeholder="e.g. Counter, Table Tent"
              value={formData.placement}
              onChange={handleFieldChange('placement')}
            />

            <div>
              <label
                htmlFor="qr-status"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <select
                id="qr-status"
                name="status"
                value={formData.status}
                onChange={handleFieldChange('status')}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-150"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClosePanel}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create
            </Button>
          </div>
        </form>
      </SlideDownPanel>

      <DataTable
        columns={columns}
        data={filteredQrCodes}
        searchable
        searchPlaceholder="Search by business or placement..."
        searchValue={search}
        onSearchChange={setSearch}
        searchKeys={['businessName', 'placement']}
        pagination
        emptyTitle="No QR codes yet"
        emptyDescription="Create a QR code to start tracking scans"
        emptyIcon={QrCode}
      />
    </div>
  )
}
