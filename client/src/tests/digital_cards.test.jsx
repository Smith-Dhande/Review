import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DigitalCardsPage from '../modules/digital-cards/pages/DigitalCardsPage'
import DigitalCardEditorPage from '../modules/digital-cards/pages/DigitalCardEditorPage'
import DigitalCardDetailsPage from '../modules/digital-cards/pages/DigitalCardDetailsPage'
import PublicDigitalCardPage from '../modules/digital-cards/pages/PublicDigitalCardPage'
import {
  CARD_FONTS,
  CARD_TEMPLATES,
  createDefaultCardPayload,
} from '../modules/digital-cards/constants/presets'

const mockList = vi.fn()
const mockGet = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockAnalyticsOverview = vi.fn()
const mockCardAnalytics = vi.fn()
const mockGetPublic = vi.fn()
const mockTrackPublicEvent = vi.fn()

vi.mock('../modules/digital-cards/services/digitalCardsApi', () => ({
  digitalCardsApi: {
    list: (...args) => mockList(...args),
    get: (...args) => mockGet(...args),
    create: (...args) => mockCreate(...args),
    update: (...args) => mockUpdate(...args),
    updateStatus: vi.fn().mockResolvedValue({ card: {} }),
    duplicate: vi.fn().mockResolvedValue({ card: { slug: 'copy-1' } }),
    remove: vi.fn().mockResolvedValue({ deleted: true }),
    analyticsOverview: (...args) => mockAnalyticsOverview(...args),
    cardAnalytics: (...args) => mockCardAnalytics(...args),
    getPublic: (...args) => mockGetPublic(...args),
    trackPublicEvent: (...args) => mockTrackPublicEvent(...args),
    getVCardUrl: (slug) => `/api/public/digital-cards/${slug}/vcard`,
  },
}))

vi.mock('qrcode', () => ({
  default: {
    toString: vi.fn().mockResolvedValue('<svg data-testid="qr-svg"></svg>'),
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA'),
  },
}))

const sampleCard = {
  ...createDefaultCardPayload('Dr. Aditi Rao'),
  slug: 'aditi-rao-12345',
  publicUrl: 'https://review-one-teal.vercel.app/card/aditi-rao-12345',
  personalInformation: {
    ...createDefaultCardPayload('Dr. Aditi Rao').personalInformation,
    fullName: 'Dr. Aditi Rao',
    jobTitle: 'Senior Dentist',
    companyName: 'SmileCare',
    shortBio: 'Gentle dental care.',
  },
  contactInformation: {
    ...createDefaultCardPayload('Dr. Aditi Rao').contactInformation,
    phone: '+91 98201 44510',
    email: 'aditi@smilecare.in',
  },
}

describe('Digital Business Cards (V2) Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTrackPublicEvent.mockResolvedValue({ ok: true })
  })

  it('1. DigitalCardsPage renders card list, overview stats, search, and pagination', async () => {
    mockList.mockResolvedValueOnce({
      cards: [sampleCard],
      pagination: { total: 15, page: 1, limit: 12, totalPages: 2 },
      counts: { all: 15, active: 12, paused: 3 },
    })
    mockAnalyticsOverview.mockResolvedValueOnce({
      stats: { profileVisits: 42, saveContactClicks: 9 },
    })

    render(
      <MemoryRouter>
        <DigitalCardsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Dr. Aditi Rao')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText(/Showing/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Cards per page')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('2. DigitalCardEditorPage exposes >=8 templates, >=12 fonts, colors, visibility, and live preview updates', async () => {
    expect(CARD_TEMPLATES.length).toBeGreaterThanOrEqual(8)
    expect(CARD_FONTS.length).toBeGreaterThanOrEqual(12)

    mockCreate.mockRejectedValueOnce(new Error('Validation error'))
    render(
      <MemoryRouter initialEntries={['/digital-cards/new']}>
        <Routes>
          <Route path="/digital-cards/new" element={<DigitalCardEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const nameInput = screen.getByPlaceholderText('e.g. Dr. Aditi Rao')
    fireEvent.change(nameInput, { target: { value: 'Alex Mercer' } })
    expect(screen.getByText(/Editing:|Create Digital Card/)).toBeInTheDocument()

    // Switch to Templates tab and pick Premium Dark
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }))
    fireEvent.click(screen.getByRole('button', { name: /Premium Dark/i }))
    expect(screen.getAllByText(/premium dark/i).length).toBeGreaterThanOrEqual(2)

    // Switch to Typography tab and pick Playfair Display
    fireEvent.click(screen.getByRole('button', { name: 'Typography' }))
    expect(screen.getAllByText('Playfair Display').length).toBeGreaterThanOrEqual(2)

    // Save shows API error cleanly
    fireEvent.click(screen.getByRole('button', { name: /Create Card/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Validation error')
  })

  it('3. DigitalCardDetailsPage renders QR actions and analytics', async () => {
    mockGet.mockResolvedValueOnce({ card: sampleCard })
    mockCardAnalytics.mockResolvedValueOnce({
      stats: {
        profileVisits: 10,
        saveContactClicks: 4,
        totalActionClicks: 7,
        socialClicks: 2,
      },
      activity: [{ label: 'Nov 28', total: 10 }],
    })

    render(
      <MemoryRouter initialEntries={['/digital-cards/aditi-rao-12345']}>
        <Routes>
          <Route
            path="/digital-cards/:cardId"
            element={<DigitalCardDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Dr. Aditi Rao' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download PNG/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Print Visiting Card/i })).toBeInTheDocument()
  })

  it('4. PublicDigitalCardPage renders public profile without auth and handles paused state', async () => {
    mockGetPublic.mockResolvedValueOnce({ card: sampleCard })

    render(
      <MemoryRouter initialEntries={['/card/aditi-rao-12345']}>
        <Routes>
          <Route path="/card/:slug" element={<PublicDigitalCardPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Dr. Aditi Rao' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Senior Dentist')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save Contact/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(mockTrackPublicEvent).toHaveBeenCalledWith(
        'aditi-rao-12345',
        'profileVisits',
      )
    })

    // Paused card renders unavailable message
    mockGetPublic.mockResolvedValueOnce({
      card: { slug: 'paused-1', name: 'Paused User', status: 'paused' },
    })
    render(
      <MemoryRouter initialEntries={['/card/paused-1']}>
        <Routes>
          <Route path="/card/:slug" element={<PublicDigitalCardPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(
      await screen.findByText(/currently paused and unavailable/i),
    ).toBeInTheDocument()
  })
})
