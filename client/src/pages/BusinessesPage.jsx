import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import StatusText from '../components/ui/StatusText'
import Button from '../components/ui/Button'
import SlideDownPanel from '../components/ui/SlideDownPanel'
import Input from '../components/ui/Input'
import BusinessLogo from '../components/ui/BusinessLogo'
import LogoUpload from '../components/ui/LogoUpload'
import { useBusinesses } from '../context/BusinessesContext'
import { businessCategories } from '../data/mockData'

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
  logo: null,
  category: businessCategories[0] || 'Restaurant',
  location: '',
  address: '',
  phone: '',
  email: '',
  googleReviewUrl: '',
  welcomeMessage: '',
  status: 'active',
}

export default function BusinessesPage() {
  const navigate = useNavigate()
  const { businesses, addBusiness, updateBusiness, toggleBusinessStatus } =
    useBusinesses()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialFormState)

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase()
    return businesses.filter((business) => {
      const matchesStatus =
        statusFilter === 'all' || business.status === statusFilter
      if (!matchesStatus) return false
      if (!query) return true
      return (
        business.name.toLowerCase().includes(query) ||
        business.category.toLowerCase().includes(query) ||
        (business.location || '').toLowerCase().includes(query) ||
        (business.email || '').toLowerCase().includes(query) ||
        (business.phone || '').toLowerCase().includes(query)
      )
    })
  }, [businesses, search, statusFilter])

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData(initialFormState)
    setIsPanelOpen(true)
  }

  const handleOpenEdit = (e, business) => {
    e.stopPropagation()
    setEditingId(business.id)
    setFormData({
      name: business.name || '',
      logo: business.logo?.url ? business.logo : null,
      category: business.category || businessCategories[0],
      location: business.location || '',
      address: business.address || '',
      phone: business.phone || '',
      email: business.email || '',
      googleReviewUrl: business.reviewConfig?.googleReviewUrl || '',
      welcomeMessage: business.reviewConfig?.welcomeMessage || '',
      status: business.status || 'active',
    })
    setIsPanelOpen(true)
  }

  const handleToggleStatus = (e, businessId) => {
    e.stopPropagation()
    toggleBusinessStatus(businessId)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setEditingId(null)
    setFormData(initialFormState)
  }

  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSaving(true)
    setFormError('')
    try {
      if (editingId) {
        await updateBusiness(editingId, {
          name: formData.name,
          logo: formData.logo,
          category: formData.category,
          location: formData.location,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          status: formData.status,
        })
      } else {
        await addBusiness(formData)
      }
      handleClosePanel()
    } catch (err) {
      setFormError(err.message || 'Could not save business')
    } finally {
      setIsSaving(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Business',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <BusinessLogo
            logo={row.logo}
            logoUrl={row.logoUrl}
            logoText={row.logoText}
            name={row.name}
            size="sm"
          />
          <div>
            <div className="text-sm font-medium text-text-primary">
              {row.name}
            </div>
            {row.location && (
              <div className="text-xs text-text-tertiary">{row.location}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, row) => (
        <span className="text-sm text-text-secondary">{row.category}</span>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (_, row) => (
        <div>
          <div className="text-sm text-text-primary">{row.phone || '—'}</div>
          {row.email && (
            <div className="text-xs text-text-tertiary">{row.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'questions',
      label: 'Questionnaire',
      render: (_, row) => {
        const count = row.questions?.length || 0
        if (count === 0) {
          return (
            <span className="text-xs text-text-tertiary">Not configured</span>
          )
        }
        return (
          <span className="text-sm text-text-secondary tabular-nums">
            {count} {count === 1 ? 'question' : 'questions'}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusText status={row.status} />,
    },
    {
      key: 'dateAdded',
      label: 'Created',
      render: (_, row) => (
        <span className="text-sm text-text-secondary">
          {formatDate(row.dateAdded)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => handleOpenEdit(e, row)}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-white text-text-primary hover:bg-surface transition-colors duration-150 cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => handleToggleStatus(e, row.id)}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface transition-colors duration-150 cursor-pointer"
          >
            {row.status === 'active' ? 'Pause' : 'Activate'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        description="Manage business profiles, questionnaires, and generated QR codes"
        actions={
          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4" />
            Add Business
          </Button>
        }
      />

      <SlideDownPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title={editingId ? 'Edit Business' : 'Add New Business'}
      >
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <LogoUpload
              value={formData.logo}
              onChange={(logo) => setFormData((prev) => ({ ...prev, logo }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              name="name"
              placeholder="e.g. Chai Junction"
              value={formData.name}
              onChange={handleFieldChange('name')}
              required
            />

            <div>
              <label
                htmlFor="business-category"
                className="block text-sm font-medium text-text-primary mb-1.5"
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

            <Input
              label="Location (Optional)"
              name="location"
              placeholder="e.g. Bandra West, Mumbai"
              value={formData.location}
              onChange={handleFieldChange('location')}
            />

            <div>
              <label
                htmlFor="business-status"
                className="block text-sm font-medium text-text-primary mb-1.5"
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
                <option value="paused">Paused</option>
              </select>
            </div>

            <Input
              label="Phone Number"
              name="phone"
              placeholder="+91 98201 44510"
              value={formData.phone}
              onChange={handleFieldChange('phone')}
            />

            <Input
              label="Contact Email"
              name="email"
              type="email"
              placeholder="hello@business.in"
              value={formData.email}
              onChange={handleFieldChange('email')}
            />

            <Input
              label="Address (Optional)"
              name="address"
              placeholder="Shop 4, Carter Road, Bandra West"
              value={formData.address}
              onChange={handleFieldChange('address')}
            />

            {!editingId && (
              <Input
                label="Google Review URL"
                name="googleReviewUrl"
                type="url"
                placeholder="https://g.page/r/..."
                value={formData.googleReviewUrl}
                onChange={handleFieldChange('googleReviewUrl')}
              />
            )}

            {!editingId && (
              <div className="md:col-span-2">
                <Input
                  label="Welcome Message (Optional)"
                  name="welcomeMessage"
                  placeholder="Thanks for visiting! Answer a few quick questions to draft your review."
                  value={formData.welcomeMessage}
                  onChange={handleFieldChange('welcomeMessage')}
                />
              </div>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="bg-error-light border border-error-border rounded-md px-3 py-2 text-xs text-error mt-4"
            >
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClosePanel}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {editingId ? 'Save Changes' : 'Save Business'}
            </Button>
          </div>
        </form>
      </SlideDownPanel>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Status filter"
          className="inline-flex items-center rounded-md border border-border bg-card p-0.5 self-start"
        >
          {[
            { id: 'all', label: `All (${businesses.length})` },
            {
              id: 'active',
              label: `Active (${businesses.filter((b) => b.status === 'active').length})`,
            },
            {
              id: 'paused',
              label: `Paused (${businesses.filter((b) => b.status === 'paused').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredBusinesses}
        searchable
        searchPlaceholder="Search businesses by name, category, location, or contact..."
        searchValue={search}
        onSearchChange={setSearch}
        pagination
        onRowClick={(row) => navigate(`/businesses/${row.id}`)}
        emptyTitle="No businesses found"
        emptyDescription="Try adjusting your search or add a new business to get started."
        emptyIcon={Building2}
      />
    </div>
  )
}
