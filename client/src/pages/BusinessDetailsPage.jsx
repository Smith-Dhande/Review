import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import StatusText from '../components/ui/StatusText'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import BusinessLogo from '../components/ui/BusinessLogo'
import BusinessOverviewTab from '../components/business/BusinessOverviewTab'
import ReviewConfigTab from '../components/business/ReviewConfigTab'
import QuestionnaireTab from '../components/business/QuestionnaireTab'
import LandingPageAppearanceTab from '../components/business/LandingPageAppearanceTab'
import BusinessAnalyticsTab from '../components/business/BusinessAnalyticsTab'
import { useBusinesses } from '../context/BusinessesContext'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { businessesApi } from '../services/api'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'questionnaire', label: 'Questionnaire' },
  { id: 'config', label: 'Review Configuration' },
  { id: 'appearance', label: 'Landing Page Appearance' },
  { id: 'analytics', label: 'Analytics' },
]

export default function BusinessDetailsPage() {
  const { businessId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    businesses,
    updateBusiness,
    deleteBusiness,
    toggleBusinessStatus,
    updateReviewConfig,
    updateAppearance,
    setQuestions,
  } = useBusinesses()

  const cachedBusiness = businesses.find(
    (b) => b.id === businessId || b.publicId === businessId,
  )

  const [fetchedBusiness, setFetchedBusiness] = useState(null)
  const [loadedId, setLoadedId] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [notFoundId, setNotFoundId] = useState('')

  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    let active = true

    businessesApi
      .get(businessId)
      .then((data) => {
        if (!active) return
        setFetchError('')
        setNotFoundId('')
        setFetchedBusiness(data.business || null)
        setLoadedId(businessId)
      })
      .catch((err) => {
        if (!active) return
        if (err.status === 404 || err.status === 400) {
          setNotFoundId(businessId)
          setFetchedBusiness(null)
        } else {
          setFetchError(err.message || 'Unable to load business details.')
        }
        setLoadedId(businessId)
      })

    return () => {
      active = false
    }
  }, [businessId])

  const notFound = notFoundId === businessId
  const fetching = loadedId !== businessId && !notFound && !fetchError

  const business =
    (fetchedBusiness &&
      (fetchedBusiness.publicId === businessId || fetchedBusiness.id === businessId)
      ? fetchedBusiness
      : null) || cachedBusiness

  if (fetching && !business) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <LoadingState message="Loading business workspace..." />
      </div>
    )
  }

  if (notFound || (!business && !fetchError)) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <EmptyState
          title="Business not found"
          description="The requested business record could not be located."
          action={
            <Link to="/businesses">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Back to Businesses
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (!business && fetchError) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center space-y-4">
        <p role="alert" className="text-sm text-error">
          {fetchError}
        </p>
        <Link to="/businesses">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Businesses
          </Button>
        </Link>
      </div>
    )
  }

  const targetId = business.publicId || business.id

  const handleSaveEdit = async (updates) => {
    const updated = await updateBusiness(targetId, updates)
    setFetchedBusiness(updated)
    setIsEditing(false)
    showToast({
      type: 'success',
      title: 'Business updated',
      message: `${updated?.name || business.name} updated successfully.`,
    })
    return updated
  }

  const handleToggleStatus = async () => {
    if (statusLoading) return
    setActionError('')
    setStatusLoading(true)
    try {
      const updated = await toggleBusinessStatus(targetId, business.status)
      if (updated) setFetchedBusiness(updated)
      const nextStatus = business.status === 'active' ? 'paused' : 'active'
      showToast({
        type: 'success',
        title: nextStatus === 'active' ? 'Business activated' : 'Business paused',
        message: `${business.name} is now ${nextStatus}.`,
      })
    } catch (err) {
      const msg = err.message || 'Could not update business status.'
      setActionError(msg)
      showToast({ type: 'error', title: 'Status update failed', message: msg })
    } finally {
      setStatusLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) return
    setActionError('')
    setDeleting(true)
    try {
      await deleteBusiness(targetId)
      showToast({
        type: 'success',
        title: 'Business deleted',
        message: `${business.name} was permanently deleted.`,
      })
      navigate('/businesses', { replace: true })
    } catch (err) {
      const msg = err.message || 'Could not delete business.'
      setActionError(msg)
      showToast({ type: 'error', title: 'Delete failed', message: msg })
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-text-tertiary flex items-center gap-1.5"
      >
        <Link
          to="/businesses"
          className="hover:text-text-primary transition-colors duration-150"
        >
          Businesses
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{business.name}</span>
      </nav>

      {/* Business workspace header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <BusinessLogo
            logo={business.logo}
            logoUrl={business.logoUrl}
            logoText={business.logoText}
            name={business.name}
            size="md"
          />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[26px] font-semibold tracking-tight text-text-primary leading-tight">
                {business.name}
              </h1>
              <StatusText status={business.status} />
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {business.category}
              {business.location ? ` · ${business.location}` : ''}
              {business.phone ? ` · ${business.phone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setActiveTab('overview')
              setIsEditing((prev) => !prev)
            }}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Business'}
          </Button>
          <Button
            variant={business.status === 'active' ? 'secondary' : 'primary'}
            size="sm"
            loading={statusLoading}
            onClick={handleToggleStatus}
          >
            {business.status === 'active'
              ? 'Pause Business'
              : 'Activate Business'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete Business"
          >
            <Trash2 className="w-3.5 h-3.5 text-error" />
          </Button>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="bg-error-light border border-error-border rounded-md px-4 py-3 text-xs text-error"
        >
          {actionError}
        </div>
      )}

      {/* Internal workspace tabs */}
      <div className="border-b border-border overflow-x-auto">
        <nav
          aria-label="Business sections"
          className="flex items-center gap-6 min-w-max"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const count =
              tab.id === 'questionnaire' ? business.questions?.length ?? 0 : null

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id !== 'overview') setIsEditing(false)
                }}
                className={`py-3 text-sm font-medium border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'border-primary text-text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>{tab.label}</span>
                {count !== null && (
                  <span className="text-xs text-text-tertiary tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Active tab content */}
      <div>
        {activeTab === 'overview' && (
          <BusinessOverviewTab
            key={`${targetId}-${isEditing}`}
            business={business}
            isEditing={isEditing}
            onCancelEdit={() => setIsEditing(false)}
            onSaveEdit={handleSaveEdit}
          />
        )}

        {activeTab === 'questionnaire' && (
          <QuestionnaireTab
            questions={business.questions}
            onChange={async (updater) => {
              try {
                const updated = await setQuestions(
                  targetId,
                  updater,
                  business.questions || [],
                )
                if (updated) setFetchedBusiness(updated)
                showToast({
                  type: 'success',
                  title: 'Questionnaire saved',
                  message: 'Review questions updated successfully.',
                })
                return updated
              } catch (err) {
                showToast({
                  type: 'error',
                  title: 'Failed to save questionnaire',
                  message: err.message || 'Could not update questionnaire.',
                })
                throw err
              }
            }}
          />
        )}

        {activeTab === 'config' && (
          <ReviewConfigTab
            key={targetId}
            business={business}
            onSave={async (cfg) => {
              try {
                const updated = await updateReviewConfig(targetId, cfg)
                if (updated) setFetchedBusiness(updated)
                showToast({
                  type: 'success',
                  title: 'Configuration saved',
                  message: 'Review configuration updated successfully.',
                })
                return updated
              } catch (err) {
                showToast({
                  type: 'error',
                  title: 'Save failed',
                  message: err.message || 'Could not save review configuration.',
                })
                throw err
              }
            }}
          />
        )}

        {activeTab === 'appearance' && (
          <LandingPageAppearanceTab
            key={targetId}
            business={business}
            onSave={async (appCfg) => {
              try {
                const updated = await updateAppearance(targetId, appCfg)
                if (updated) setFetchedBusiness(updated)
                showToast({
                  type: 'success',
                  title: 'Appearance saved',
                  message: 'Landing page appearance updated successfully.',
                })
                return updated
              } catch (err) {
                showToast({
                  type: 'error',
                  title: 'Save failed',
                  message: err.message || 'Could not save appearance settings.',
                })
                throw err
              }
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <BusinessAnalyticsTab business={business} />
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${business.name}"?`}
        description="This will permanently delete this business, its custom questionnaire, review configuration, and all associated review analytics. This action cannot be undone."
        confirmLabel="Delete Business"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
