import { useEffect, useRef, useState } from 'react'
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
import { useToast } from '../context/ToastContext'
import { businessesApi } from '../services/api'
import { businessCategories } from '../utils/businessOptions'
import { normalizeGoogleReviewInput } from '../utils/googleReview'

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
  const { showToast } = useToast()
  const {
    businesses,
    pagination,
    counts,
    loading,
    error: listError,
    fetchBusinesses,
    addBusiness,
    updateBusiness,
    toggleBusinessStatus,
  } = useBusinesses()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialFormState)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [togglingId, setTogglingId] = useState(null)
  const [statusError, setStatusError] = useState('')

  const tempLogoIdsRef = useRef(new Set())

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 220)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchBusinesses({
      page,
      limit,
      search: debouncedSearch,
      status: statusFilter,
    })
  }, [fetchBusinesses, page, limit, debouncedSearch, statusFilter])

  const cleanupUnsavedTempLogos = async (keepPublicId = '') => {
    const ids = Array.from(tempLogoIdsRef.current).filter(
      (id) => id && id !== keepPublicId,
    )
    tempLogoIdsRef.current.clear()
    await Promise.all(
      ids.map((id) => businessesApi.cleanupTempLogo(id).catch(() => { })),
    )
  }

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleOpenAdd = () => {
    tempLogoIdsRef.current.clear()
    setEditingId(null)
    setFormError('')
    setFormData(initialFormState)
    setIsPanelOpen(true)
  }

  const handleOpenEdit = (e, business) => {
    e.stopPropagation()
    tempLogoIdsRef.current.clear()
    setEditingId(business.publicId || business.id)
    setFormError('')
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

  const handleToggleStatus = async (e, row) => {
    e.stopPropagation()
    const targetId = row.publicId || row.id
    if (togglingId === targetId) return
    setStatusError('')
    setTogglingId(targetId)
    try {
      await toggleBusinessStatus(targetId, row.status)
      const nextStatus = row.status === 'active' ? 'paused' : 'active'
      showToast({
        type: 'success',
        title: nextStatus === 'active' ? 'Business activated' : 'Business paused',
        message: `${row.name} is now ${nextStatus}.`,
      })
    } catch (err) {
      const msg = err.message || 'Could not update business status.'
      setStatusError(msg)
      showToast({ type: 'error', title: 'Status update failed', message: msg })
    } finally {
      setTogglingId(null)
    }
  }

  const handleClosePanel = () => {
    cleanupUnsavedTempLogos()
    setIsPanelOpen(false)
    setEditingId(null)
    setFormError('')
    setFormData(initialFormState)
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

  const handleSave = async (e) => {
    e.preventDefault()
    if (isSaving) return
    if (!formData.name.trim()) {
      setFormError('Business name is required.')
      return
    }

    const normalizedUrl = normalizeGoogleReviewInput(formData.googleReviewUrl)

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
          reviewConfig: {
            googleReviewUrl: normalizedUrl,
            welcomeMessage: formData.welcomeMessage,
          },
        })
      } else {
        await addBusiness({
          ...formData,
          googleReviewUrl: normalizedUrl,
        })
      }
      await cleanupUnsavedTempLogos(formData.logo?.publicId || '')
      showToast({
        type: 'success',
        title: editingId ? 'Business updated' : 'Business created',
        message: editingId
          ? `${formData.name.trim()} updated successfully.`
          : `${formData.name.trim()} created successfully.`,
      })
      setIsPanelOpen(false)
      setEditingId(null)
      setFormData(initialFormState)
    } catch (err) {
      const msg = err.message || 'Could not save business'
      setFormError(msg)
      showToast({ type: 'error', title: 'Failed to save business', message: msg })
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
      render: (_, row) => {
        const rowId = row.publicId || row.id
        const isToggling = togglingId === rowId
        return (
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
              disabled={isToggling}
              onClick={(e) => handleToggleStatus(e, row)}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
            >
              {isToggling
                ? 'Updating...'
                : row.status === 'active'
                  ? 'Pause'
                  : 'Activate'}
            </button>
          </div>
        )
      },
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
              onChange={handleLogoChange}
              onTempUploaded={(pid) => tempLogoIdsRef.current.add(pid)}
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

            <Input
              label="Google Place ID or Review URL"
              name="googleReviewUrl"
              type="text"
              placeholder="ChIJCcAieFGl1jsREQ6h9oXJa-8"
              value={formData.googleReviewUrl}
              onChange={handleFieldChange('googleReviewUrl')}
              onBlur={(e) => {
                const normalized = normalizeGoogleReviewInput(e.target.value)
                if (normalized !== e.target.value) {
                  setFormData((prev) => ({
                    ...prev,
                    googleReviewUrl: normalized,
                  }))
                }
              }}
            />

            <div className="md:col-span-2">
              <Input
                label="Welcome Message (Optional)"
                name="welcomeMessage"
                placeholder="Thanks for visiting! Answer a few quick questions to draft your review."
                value={formData.welcomeMessage}
                onChange={handleFieldChange('welcomeMessage')}
              />
            </div>
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

      {(statusError || listError) && (
        <div
          role="alert"
          className="bg-error-light border border-error-border rounded-md px-4 py-3 text-xs text-error"
        >
          {statusError || listError}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Status filter"
          className="inline-flex items-center rounded-md border border-border bg-card p-0.5 self-start"
        >
          {[
            { id: 'all', label: `All (${counts.all ?? 0})` },
            { id: 'active', label: `Active (${counts.active ?? 0})` },
            { id: 'paused', label: `Paused (${counts.paused ?? 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer ${statusFilter === tab.id
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
        data={businesses}
        loading={loading}
        searchable
        searchPlaceholder="Search businesses by name, category, or location..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        pagination
        serverPagination={pagination}
        onPageChange={(nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
        onRowClick={(row) => navigate(`/businesses/${row.publicId || row.id}`)}
        emptyTitle="No businesses found"
        emptyDescription="Try adjusting your search or add a new business to get started."
        emptyIcon={Building2}
      />
    </div>
  )
}
