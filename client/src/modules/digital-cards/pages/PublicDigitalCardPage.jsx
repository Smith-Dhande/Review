import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, PauseCircle } from 'lucide-react'
import { digitalCardsApi } from '../services/digitalCardsApi'
import { useToast } from '../../../context/ToastContext'
import DigitalCardRenderer from '../templates/DigitalCardRenderer'

export default function PublicDigitalCardPage() {
  const { slug } = useParams()
  const { showToast } = useToast()
  const [card, setCard] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'paused' | 'not_found' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const trackedRef = useRef(null)

  useEffect(() => {
    let active = true
    digitalCardsApi
      .getPublic(slug)
      .then((res) => {
        if (!active) return
        const c = res.card
        setCard(c)
        if (c.status === 'paused') {
          setStatus('paused')
          return
        }
        setStatus('ready')
        document.title = `${c.personalInformation?.fullName || c.name} — Digital Card`

        if (trackedRef.current !== c.slug) {
          trackedRef.current = c.slug
          let visited = false
          try {
            const key = `rb_card_visit_${c.slug}`
            visited = sessionStorage.getItem(key) === '1'
            if (!visited) sessionStorage.setItem(key, '1')
          } catch {
            // Ignore private browsing sessionStorage restrictions
          }
          if (!visited) {
            digitalCardsApi
              .trackPublicEvent(c.slug, 'profileVisits')
              .catch(() => {})
          }
        }
      })
      .catch((err) => {
        if (!active) return
        if (err.status === 404 || err.status === 400) {
          setStatus('not_found')
        } else {
          setStatus('error')
          setErrorMessage(
            err.message || 'Unable to load this digital card right now.',
          )
        }
      })

    return () => {
      active = false
    }
  }, [slug])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-[#666560]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  if (status === 'paused') {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white border border-[#E5E5E3] rounded-xl p-6 text-center space-y-2">
          <PauseCircle className="w-8 h-8 text-[#8C8A84] mx-auto" />
          <h1 className="text-base font-semibold text-[#171716]">
            {card?.name || 'Digital Card'}
          </h1>
          <p className="text-xs text-[#666560]">
            This digital business card is currently paused and unavailable.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'not_found' || status === 'error') {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white border border-[#E5E5E3] rounded-xl p-6 text-center space-y-2">
          <h1 className="text-base font-semibold text-[#171716]">
            {status === 'not_found' ? 'Card Not Found' : 'Unavailable'}
          </h1>
          <p className="text-xs text-[#666560]">
            {status === 'not_found'
              ? 'The digital business card link you opened does not exist or has been removed.'
              : errorMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <DigitalCardRenderer
      card={card}
      isPreview={false}
      onActionClick={(eventType, target) => {
        if (eventType) {
          digitalCardsApi
            .trackPublicEvent(card.slug, eventType, target)
            .catch(() => {})
        }
      }}
      onSaveContact={() => {
        const url = digitalCardsApi.getVCardUrl(card.slug)
        const a = document.createElement('a')
        a.href = url
        a.download = `${card.slug}.vcf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        showToast({
          type: 'success',
          title: 'Contact file downloaded',
          message: `Open ${card.slug}.vcf to save contact.`,
        })
      }}
    />
  )
}
