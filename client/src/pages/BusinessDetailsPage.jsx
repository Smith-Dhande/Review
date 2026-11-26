import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button'
import StatusText from '../components/ui/StatusText'
import EmptyState from '../components/ui/EmptyState'
import BusinessLogo from '../components/ui/BusinessLogo'
import BusinessOverviewTab from '../components/business/BusinessOverviewTab'
import ReviewConfigTab from '../components/business/ReviewConfigTab'
import QuestionnaireTab from '../components/business/QuestionnaireTab'
import LandingPageAppearanceTab from '../components/business/LandingPageAppearanceTab'
import BusinessAnalyticsTab from '../components/business/BusinessAnalyticsTab'
import { useBusinesses } from '../context/BusinessesContext'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'questionnaire', label: 'Questionnaire' },
  { id: 'config', label: 'Review Configuration' },
  { id: 'appearance', label: 'Landing Page Appearance' },
  { id: 'analytics', label: 'Analytics' },
]

export default function BusinessDetailsPage() {
  const { businessId } = useParams()
  const {
    businesses,
    updateBusiness,
    toggleBusinessStatus,
    updateReviewConfig,
    updateAppearance,
    setQuestions,
  } = useBusinesses()

  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)

  const business = businesses.find(
    (b) => b.id === businessId || b.publicId === businessId,
  )

  if (!business) {
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

  const handleSaveEdit = async (updates) => {
    await updateBusiness(business.publicId || business.id, updates)
    setIsEditing(false)
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

        <div className="flex items-center gap-2.5 shrink-0">
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
            onClick={() =>
              toggleBusinessStatus(business.publicId || business.id)
            }
          >
            {business.status === 'active'
              ? 'Pause Business'
              : 'Activate Business'}
          </Button>
        </div>
      </div>

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
            business={business}
            isEditing={isEditing}
            onCancelEdit={() => setIsEditing(false)}
            onSaveEdit={handleSaveEdit}
          />
        )}

        {activeTab === 'questionnaire' && (
          <QuestionnaireTab
            questions={business.questions}
            onChange={(updater) =>
              setQuestions(business.publicId || business.id, updater)
            }
          />
        )}

        {activeTab === 'config' && (
          <ReviewConfigTab
            business={business}
            onSave={(cfg) =>
              updateReviewConfig(business.publicId || business.id, cfg)
            }
          />
        )}

        {activeTab === 'appearance' && (
          <LandingPageAppearanceTab
            business={business}
            onSave={(appCfg) =>
              updateAppearance(business.publicId || business.id, appCfg)
            }
          />
        )}

        {activeTab === 'analytics' && (
          <BusinessAnalyticsTab business={business} />
        )}
      </div>
    </div>
  )
}
