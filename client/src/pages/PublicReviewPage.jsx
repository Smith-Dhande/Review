import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import PublicReviewExperience from '../components/public/PublicReviewExperience'
import BusinessLogo from '../components/ui/BusinessLogo'
import { publicReviewApi } from '../services/api'
import { getFontStack, loadGoogleFont } from '../utils/fontLoader'

export default function PublicReviewPage() {
  const { businessId } = useParams()

  const [business, setBusiness] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'paused' | 'not_found' | 'error'
  const [errorMessage, setErrorMessage] = useState('')

  const trackedLandingRef = useRef(null)
  const trackedStartRef = useRef(false)
  const trackedCopyRef = useRef(false)
  const trackedRedirectRef = useRef(false)

  useEffect(() => {
    let active = true

    publicReviewApi
      .getByBusiness(businessId)
      .then((res) => {
        if (!active) return
        setErrorMessage('')
        const biz = res.business
        setBusiness(biz)
        if (biz?.appearance?.fontFamily) {
          loadGoogleFont(biz.appearance.fontFamily)
        }
        if (biz.status === 'paused') {
          setStatus('paused')
          return
        }
        setStatus('ready')

        if (trackedLandingRef.current !== biz.publicId) {
          trackedLandingRef.current = biz.publicId
          publicReviewApi.trackEvent(biz.publicId, 'totalScans').catch(() => {})
          publicReviewApi.trackEvent(biz.publicId, 'landingViews').catch(() => {})
        }
      })
      .catch((err) => {
        if (!active) return
        if (err.status === 404 || err.status === 400) {
          setStatus('not_found')
        } else {
          setStatus('error')
          setErrorMessage(
            err.message || 'Unable to load this review page right now.',
          )
        }
      })

    return () => {
      active = false
    }
  }, [businessId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="flex items-center gap-2.5 text-sm text-[#666560]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading review experience...</span>
        </div>
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#E6E4DF] rounded-lg p-8 text-center space-y-2">
          <h1 className="text-lg font-semibold text-[#171716]">
            Page not found
          </h1>
          <p className="text-sm text-[#666560]">
            We couldn&apos;t find a business matching this review link. Please
            check the QR code or URL and try again.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'paused') {
    const font = business?.appearance?.fontFamily || 'Inter'
    return (
      <div
        className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6"
        style={{ fontFamily: getFontStack(font) }}
      >
        <div className="w-full max-w-md bg-white border border-[#E6E4DF] rounded-lg p-8 text-center space-y-3">
          <div className="flex justify-center">
            <BusinessLogo
              logoUrl={business?.logoUrl}
              logoText={business?.logoText}
              name={business?.name}
              size="md"
            />
          </div>
          <h1 className="text-lg font-semibold text-[#171716]">
            {business?.name || 'ReviewBuddy'}
          </h1>
          <p className="text-sm text-[#666560]">
            This review page is currently unavailable. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#E6E4DF] rounded-lg p-8 text-center space-y-2">
          <h1 className="text-lg font-semibold text-[#171716]">
            Unable to load page
          </h1>
          <p className="text-sm text-[#666560]">{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <PublicReviewExperience
      business={business}
      onFirstInteraction={() => {
        if (!trackedStartRef.current && business?.publicId) {
          trackedStartRef.current = true
          publicReviewApi
            .trackEvent(business.publicId, 'questionnaireStarts')
            .catch(() => {})
        }
      }}
      onGenerateDraft={async (answers) => {
        const res = await publicReviewApi.completeQuestionnaire(
          business.publicId,
          answers,
          false,
        )
        return res.draft
      }}
      onRegenerateDraft={async (answers) => {
        const res = await publicReviewApi.completeQuestionnaire(
          business.publicId,
          answers,
          true,
        )
        return res.draft
      }}
      onCopySuccess={() => {
        if (!trackedCopyRef.current && business?.publicId) {
          trackedCopyRef.current = true
          publicReviewApi
            .trackEvent(business.publicId, 'copyClicks')
            .catch(() => {})
        }
      }}
      onGoogleRedirect={() => {
        if (!trackedRedirectRef.current && business?.publicId) {
          trackedRedirectRef.current = true
          publicReviewApi
            .trackEvent(business.publicId, 'googleReviewRedirects')
            .catch(() => {})
        }
      }}
    />
  )
}
