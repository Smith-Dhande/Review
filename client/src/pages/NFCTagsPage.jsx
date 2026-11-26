import { useState } from 'react'
import { MoreHorizontal, Plus, Wifi } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusText from '../components/ui/StatusText'
import Button from '../components/ui/Button'
import SlideDownPanel from '../components/ui/SlideDownPanel'
import Input from '../components/ui/Input'
import { nfcTagsData, businessesData } from '../data/mockData'

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

export default function NFCTagsPage() {
  const [search, setSearch] = useState('')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormState)

  const filteredTags = nfcTagsData.filter((tag) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      tag.businessName.toLowerCase().includes(query) ||
      tag.placement.toLowerCase().includes(query)
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
      label: 'Tag ID',
      header: 'Tag ID',
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
      key: 'taps',
      label: 'Taps',
      header: 'Taps',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm text-text-primary tabular-nums">
            {row.taps.toLocaleString()}
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
        title="NFC Tags"
        description="Manage NFC tags for businesses"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'NFC Tags' }]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsPanelOpen((prev) => !prev)}
          >
            <Plus className="w-4 h-4" />
            Create NFC Tag
          </Button>
        }
      />

      <SlideDownPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title="Create NFC Tag"
      >
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="nfc-business"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                Business
              </label>
              <select
                id="nfc-business"
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
              label="Placement"
              name="placement"
              placeholder="e.g. Counter Stand, Reception Desk"
              value={formData.placement}
              onChange={handleFieldChange('placement')}
            />

            <div>
              <label
                htmlFor="nfc-status"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <select
                id="nfc-status"
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
        data={filteredTags}
        searchable
        searchPlaceholder="Search by business or placement..."
        searchValue={search}
        onSearchChange={setSearch}
        searchKeys={['businessName', 'placement']}
        pagination
        emptyTitle="No NFC tags yet"
        emptyDescription="Create an NFC tag to start tracking taps"
        emptyIcon={Wifi}
      />
    </div>
  )
}
