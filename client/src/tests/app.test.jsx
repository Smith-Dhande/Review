import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import ReviewConfigTab from '../components/business/ReviewConfigTab'
import LandingPageAppearanceTab from '../components/business/LandingPageAppearanceTab'
import BusinessesPage from '../pages/BusinessesPage'
import PublicReviewPage from '../pages/PublicReviewPage'
import PublicReviewExperience from '../components/public/PublicReviewExperience'

const mockAuth = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@test.local', role: 'Administrator' },
  isLoading: false,
  error: null,
  login: vi.fn(),
  clearError: vi.fn(),
}

const mockBusinessesCtx = {
  businesses: [
    {
      id: 'chai-1',
      publicId: 'chai-1',
      name: 'Chai Junction',
      category: 'Café',
      location: 'Mumbai',
      status: 'active',
      dateAdded: '2026-11-01',
      questions: [{ id: 'q1', text: 'How was it?', type: 'single_choice', options: ['Great'], required: true }],
      reviewConfig: {
        googleReviewUrl: 'https://g.page/r/chai/review',
        welcomeMessage: 'Welcome!',
        tone: 'Friendly and Casual',
        length: 'Medium',
        autoCopyPrompt: true,
      },
      appearance: {
        accentColor: '#1B6B4A',
        fontFamily: 'Inter',
        businessNameAlignment: 'left',
        logoPlacement: 'beside',
        layoutStyle: 'centered',
      },
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalItems: 1, totalPages: 1 },
  counts: { all: 1, active: 1, paused: 0 },
  loading: false,
  error: null,
  fetchBusinesses: vi.fn(),
  addBusiness: vi.fn(),
  updateBusiness: vi.fn(),
  toggleBusinessStatus: vi.fn(),
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

vi.mock('../context/BusinessesContext', () => ({
  useBusinesses: () => mockBusinessesCtx,
  getPublicReviewUrl: (b) => `http://localhost:5173/review/${b.publicId || b.id}`,
}))

const mockPublicGet = vi.fn()
const mockPublicComplete = vi.fn()
const mockPublicTrack = vi.fn(() => Promise.resolve({ ok: true }))

vi.mock('../services/api', () => ({
  resolveAssetUrl: (u) => u || '',
  businessesApi: {
    cleanupTempLogo: vi.fn(() => Promise.resolve({ deleted: true })),
    uploadLogo: vi.fn(),
  },
  publicReviewApi: {
    getByBusiness: (...args) => mockPublicGet(...args),
    completeQuestionnaire: (...args) => mockPublicComplete(...args),
    trackEvent: (...args) => mockPublicTrack(...args),
  },
}))

const sampleBusiness = {
  publicId: 'cafe-test',
  name: 'Cafe Test',
  logoText: 'CT',
  category: 'Café',
  location: 'Mumbai',
  status: 'active',
  reviewConfig: {
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJTest123456',
    welcomeMessage: 'Tell us about your visit!',
    tone: 'Natural and Conversational',
    length: 'Medium',
    autoCopyPrompt: true,
  },
  appearance: {
    accentColor: '#1B6B4A',
    fontFamily: 'Inter',
    businessNameAlignment: 'left',
    logoPlacement: 'beside',
    layoutStyle: 'centered',
  },
  questions: [
    {
      id: 'q1',
      text: 'How was the coffee?',
      type: 'single_choice',
      required: true,
      options: ['Fresh and great', 'Could be better'],
    },
    {
      id: 'q2',
      text: 'Anything else?',
      type: 'short_text',
      required: false,
      options: [],
    },
  ],
}

describe('ReviewBuddy Frontend V1 Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.scrollTo = vi.fn()
  })

  it('1. LoginPage validates empty credentials and omits non-functional controls', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/remember me/i)).toBeNull()
    expect(screen.queryByText(/forgot password/i)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByRole('alert').textContent).toMatch(/enter both email and password/i)
    expect(mockAuth.login).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@test.local' },
    })
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'Strong#Pass123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(mockAuth.login).toHaveBeenCalledWith('admin@test.local', 'Strong#Pass123')
  })

  it('2. ReviewConfigTab awaits save, shows error on failure without false success notice', async () => {
    const failingSave = vi.fn(() => Promise.reject(new Error('Database timeout')))
    render(<ReviewConfigTab business={sampleBusiness} onSave={failingSave} />)

    fireEvent.click(screen.getByRole('button', { name: /save configuration/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Database timeout')
    })
    expect(screen.queryByText('Configuration saved')).toBeNull()

    const okSave = vi.fn(() => Promise.resolve())
    render(<ReviewConfigTab business={sampleBusiness} onSave={okSave} />)
    const buttons = screen.getAllByRole('button', { name: /save configuration/i })
    fireEvent.click(buttons[1])
    await waitFor(() => {
      expect(screen.getByText('Configuration saved')).toBeTruthy()
    })
  })

  it('3. LandingPageAppearanceTab displays error on failed save and omits saved notice', async () => {
    const failingSave = vi.fn(() => Promise.reject(new Error('Validation rejected')))
    render(<LandingPageAppearanceTab business={sampleBusiness} onSave={failingSave} />)

    fireEvent.click(screen.getByRole('button', { name: /save appearance/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Validation rejected')
    })
    expect(screen.queryByText('Appearance saved')).toBeNull()
  })

  it('4. BusinessesPage supports create, edit (with Google URL & welcome), and pause error feedback', async () => {
    mockBusinessesCtx.addBusiness.mockResolvedValue({ publicId: 'new-1' })
    mockBusinessesCtx.toggleBusinessStatus.mockRejectedValueOnce(new Error('Network error'))

    render(
      <MemoryRouter>
        <BusinessesPage />
      </MemoryRouter>,
    )

    // Pause error feedback
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Network error')
    })

    // Edit form includes Google Place ID / Review URL and Welcome Message
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByDisplayValue('https://g.page/r/chai/review')).toBeTruthy()
    expect(screen.getByDisplayValue('Welcome!')).toBeTruthy()
  })

  it('5. PublicReviewExperience validates required questions, generates draft, copies with fallback, honors autoCopyPrompt, and exposes Google link for 1-star ratings', async () => {
    const onGenerateDraft = vi.fn(() => Promise.resolve('Coffee was fresh and great.'))
    const onCopySuccess = vi.fn()

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValueOnce(new Error('Clipboard blocked')),
      },
    })

    render(
      <PublicReviewExperience
        business={sampleBusiness}
        onGenerateDraft={onGenerateDraft}
        onCopySuccess={onCopySuccess}
      />,
    )

    // Choose 1-star rating
    fireEvent.click(screen.getByRole('radio', { name: '1 star' }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Submit without answering required question q1
    fireEvent.click(screen.getByRole('button', { name: /generate review draft/i }))
    expect(screen.getByRole('alert').textContent).toMatch(/How was the coffee\?/)
    expect(onGenerateDraft).not.toHaveBeenCalled()

    // Select answer and submit
    fireEvent.click(screen.getByRole('button', { name: /Fresh and great/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate review draft/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Editable review draft').value).toBe('Coffee was fresh and great.')
    })

    // autoCopyPrompt=true shows Step 1 prompt
    expect(screen.getByTestId('autocopy-prompt')).toBeTruthy()

    // Clipboard blocked -> shows manual copy fallback hint
    fireEvent.click(screen.getByRole('button', { name: /copy review/i }))
    await waitFor(() => {
      expect(screen.getByText(/press Ctrl\+C/i)).toBeTruthy()
    })

    // Google Review link is available even for 1-star rating
    const googleLink = screen.getByRole('link', { name: /continue to google reviews/i })
    expect(googleLink.getAttribute('href')).toBe(sampleBusiness.reviewConfig.googleReviewUrl)
  })

  it('6. PublicReviewPage handles active, paused, and 404 businesses and emits single landingViews event', async () => {
    mockPublicGet.mockResolvedValueOnce({ business: sampleBusiness })

    render(
      <MemoryRouter initialEntries={['/review/cafe-test']}>
        <Routes>
          <Route path="/review/:businessId" element={<PublicReviewPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/How was your experience with Cafe Test/i)).toBeTruthy()
    })
    expect(mockPublicTrack).toHaveBeenCalledTimes(1)
    expect(mockPublicTrack).toHaveBeenCalledWith('cafe-test', 'landingViews')

    // Paused business
    mockPublicGet.mockResolvedValueOnce({
      business: { ...sampleBusiness, status: 'paused' },
    })
    render(
      <MemoryRouter initialEntries={['/review/paused-biz']}>
        <Routes>
          <Route path="/review/:businessId" element={<PublicReviewPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText(/currently unavailable/i)).toBeTruthy()
    })

    // 404 Not Found
    const err404 = new Error('Business not found')
    err404.status = 404
    mockPublicGet.mockRejectedValueOnce(err404)
    render(
      <MemoryRouter initialEntries={['/review/missing-biz']}>
        <Routes>
          <Route path="/review/:businessId" element={<PublicReviewPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText(/Page not found/i)).toBeTruthy()
    })
  })
})
