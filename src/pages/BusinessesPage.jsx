import { useState } from 'react'
import { Building2, MoreHorizontal, Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusText from '../components/ui/StatusText'
import Button from '../components/ui/Button'
import SlideDownPanel from '../components/ui/SlideDownPanel'
import Input from '../components/ui/Input'
import {
  businessesData,
  businessCategories,
  indianCities,
} from '../data/mockData'

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
  name: '',
  category: businessCategories[0] || '',
  city: indianCities[0] || '',
  googleMapsUrl: '',
  status: 'active',
}

export default function BusinessesPage() {
  const [search, setSearch] = useState('')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormState)

  const filteredBusinesses = businessesData.filter((business) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      business.name.toLowerCase().includes(query) ||
      business.category.toLowerCase().includes(query) ||
      business.city.toLowerCase().includes(query)
    )
  })

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setFormData(initialFormState)
  }

  const handleSave = (e) => {
    e.preventDefault()
    handleClosePanel()
  }

  const columns = [
    {
      key: 'name',
      label: 'Business',
      header: 'Business',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <div>
            <div className="text-sm font-medium text-text-primary">
              {row.name}
            </div>
            <div className="text-xs text-text-tertiary">{row.city}</div>
          </div>
        )
      },
    },
    {
      key: 'category',
      label: 'Category',
      header: 'Category',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return <span className="text-sm text-text-secondary">{row.category}</span>
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
      key: 'qrCodes',
      label: 'QR Codes',
      header: 'QR Codes',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm text-text-primary tabular-nums">
            {row.qrCodes}
          </span>
        )
      },
    },
    {
      key: 'nfcTags',
      label: 'NFC Tags',
      header: 'NFC Tags',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm text-text-primary tabular-nums">
            {row.nfcTags}
          </span>
        )
      },
    },
    {
      key: 'totalScans',
      label: 'Total Scans',
      header: 'Total Scans',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm text-text-primary tabular-nums">
            {row.totalScans.toLocaleString()}
          </span>
        )
      },
    },
    {
      key: 'dateAdded',
      label: 'Date Added',
      header: 'Date Added',
      render: (arg1, arg2) => {
        const row = getRow(arg1, arg2)
        return (
          <span className="text-sm text-text-secondary">
            {formatDate(row.dateAdded)}
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
            aria-label={`Actions for ${row.name}`}
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
        title="Businesses"
        description="Manage registered businesses"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Businesses' }]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsPanelOpen((prev) => !prev)}
          >
            <Plus className="w-4 h-4" />
            Add Business
          </Button>
        }
      />

      <SlideDownPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title="Add New Business"
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              name="name"
              placeholder="e.g. Chai Junction"
              value={formData.name}
              onChange={handleFieldChange('name')}
            />

            <div>
              <label
                htmlFor="business-category"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                Category
              </label>
              <select
                id="business-category"
                name="category"
                value={formData.category}
                onChange={handleFieldChange('category')}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-150"
              >
                {businessCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="business-city"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                City
              </label>
              <select
                id="business-city"
                name="city"
                value={formData.city}
                onChange={handleFieldChange('city')}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-150"
              >
                {indianCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Google Maps URL"
              name="googleMapsUrl"
              type="url"
              placeholder="https://maps.google.com/..."
              value={formData.googleMapsUrl}
              onChange={handleFieldChange('googleMapsUrl')}
            />

            <div>
              <label
                htmlFor="business-status"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <select
                id="business-status"
                name="status"
                value={formData.status}
                onChange={handleFieldChange('status')}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-150"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
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
              Save Business
            </Button>
          </div>
        </form>
      </SlideDownPanel>

      <DataTable
        columns={columns}
        data={filteredBusinesses}
        searchable
        searchPlaceholder="Search businesses by name, category, or city..."
        searchValue={search}
        onSearchChange={setSearch}
        searchKeys={['name', 'category', 'city']}
        pagination
        emptyTitle="No businesses yet"
        emptyDescription="Add your first business to get started"
        emptyIcon={Building2}
      />
    </div>
  )
}
