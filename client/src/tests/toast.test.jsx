import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { ToastProvider, useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SettingsPage from '../pages/SettingsPage'
import DigitalCardsPage from '../modules/digital-cards/pages/DigitalCardsPage'
import DigitalCardEditorPage from '../modules/digital-cards/pages/DigitalCardEditorPage'

const mockUpdateProfile = vi.fn()
const mockChangePassword = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'a1', name: 'Admin User', email: 'admin@test.local', role: 'Administrator' },
    updateProfile: (...args) => mockUpdateProfile(...args),
    changePassword: (...args) => mockChangePassword(...args),
  }),
}))

vi.mock('../services/api', () => ({
  businessesApi: {
    exportData: vi.fn(),
  },
}))

const mockList = vi.fn()
const mockOverview = vi.fn()
const mockCreate = vi.fn()
const mockRemove = vi.fn()

vi.mock('../modules/digital-cards/services/digitalCardsApi', () => ({
  digitalCardsApi: {
    list: (...args) => mockList(...args),
    analyticsOverview: (...args) => mockOverview(...args),
    create: (...args) => mockCreate(...args),
    remove: (...args) => mockRemove(...args),
  },
}))

function ToastHarness() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  return (
    <div>
      <button
        type="button"
        onClick={() => showToast({ type: 'success', title: 'Success Title', message: 'Saved!' })}
      >
        Trigger Success
      </button>
      <button
        type="button"
        onClick={() => showToast({ type: 'error', title: 'Error Title', message: 'Failed!' })}
      >
        Trigger Error
      </button>
      <button
        type="button"
        onClick={() => showToast({ type: 'warning', title: 'Warning Title', message: 'Careful!' })}
      >
        Trigger Warning
      </button>
      <button
        type="button"
        onClick={() => showToast({ type: 'info', title: 'Info Title', message: 'FYI!' })}
      >
        Trigger Info
      </button>
      <button
        type="button"
        onClick={() => {
          showToast({ type: 'info', title: 'Toast 1' })
          showToast({ type: 'info', title: 'Toast 2' })
          showToast({ type: 'info', title: 'Toast 3' })
          showToast({ type: 'info', title: 'Toast 4' })
        }}
      >
        Trigger Four
      </button>
      <button type="button" onClick={() => navigate('/digital-cards')}>
        Go V2
      </button>
    </div>
  )
}

describe('Global Toast Notification & ConfirmDialog System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('1. Renders success, error, warning, and info toasts and supports manual dismissal', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <ToastHarness />
        </ToastProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Success' }))
    expect(screen.getByText('Success Title')).toBeInTheDocument()
    expect(screen.getByText('Saved!')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }))
    expect(screen.getByText('Error Title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Warning' }))
    expect(screen.getByText('Warning Title')).toBeInTheDocument()

    // Dismiss one manually
    const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss notification' })
    fireEvent.click(dismissButtons[0])
    expect(screen.queryByText('Success Title')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Info' }))
    expect(screen.getByText('Info Title')).toBeInTheDocument()
  })

  it('2. Auto-dismisses toasts after duration and enforces max 3 simultaneous toasts', () => {
    vi.useFakeTimers()

    render(
      <MemoryRouter>
        <ToastProvider>
          <ToastHarness />
        </ToastProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Four' }))
    expect(screen.queryByText('Toast 1')).toBeNull()
    expect(screen.getByText('Toast 2')).toBeInTheDocument()
    expect(screen.getByText('Toast 3')).toBeInTheDocument()
    expect(screen.getByText('Toast 4')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3600)
    })

    expect(screen.queryByText('Toast 2')).toBeNull()
    expect(screen.queryByText('Toast 3')).toBeNull()
    expect(screen.queryByText('Toast 4')).toBeNull()
  })

  it('3. Persists toast across V1 -> V2 route navigation', () => {
    render(
      <MemoryRouter initialEntries={['/businesses']}>
        <ToastProvider>
          <Routes>
            <Route path="/businesses" element={<ToastHarness />} />
            <Route path="/digital-cards" element={<div>V2 Route</div>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Success' }))
    expect(screen.getByText('Success Title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Go V2' }))
    expect(screen.getByText('V2 Route')).toBeInTheDocument()
    expect(screen.getByText('Success Title')).toBeInTheDocument()
  })

  it('4. Integrates API success toast in V1 SettingsPage', async () => {
    mockUpdateProfile.mockResolvedValueOnce({ user: { name: 'Updated Admin' } })
    render(
      <MemoryRouter>
        <ToastProvider>
          <SettingsPage />
        </ToastProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    await waitFor(() => {
      expect(screen.getByText('Settings saved')).toBeInTheDocument()
    })
  })

  it('5. Integrates API failure toast without false success notification in V2 DigitalCardEditorPage', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'))
    render(
      <MemoryRouter initialEntries={['/digital-cards/new']}>
        <ToastProvider>
          <Routes>
            <Route path="/digital-cards/new" element={<DigitalCardEditorPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('e.g. Dr. Aditi Rao'), {
      target: { value: 'Dr. Test' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Create Card/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to save changes')).toBeInTheDocument()
    })
    expect(screen.queryByText('Card created successfully')).toBeNull()
  })

  it('6. ConfirmDialog confirms destructive delete and triggers success toast in DigitalCardsPage', async () => {
    mockList.mockResolvedValue({
      cards: [
        {
          slug: 'card-1',
          name: 'Sam Rivera',
          status: 'active',
          templateId: 'minimal-white',
          personalInformation: { fullName: 'Sam Rivera', profession: 'Designer' },
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      counts: { all: 1, active: 1, paused: 0 },
    })
    mockOverview.mockResolvedValue({ stats: { profileVisits: 1, saveContactClicks: 0 } })
    mockRemove.mockResolvedValueOnce({ deleted: true })

    render(
      <MemoryRouter>
        <ToastProvider>
          <DigitalCardsPage />
        </ToastProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Sam Rivera')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Sam Rivera' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Delete "Sam Rivera"\?/i)).toBeInTheDocument()

    // Cancel closes dialog without deleting
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockRemove).not.toHaveBeenCalled()

    // Confirm triggers delete and success toast
    fireEvent.click(screen.getByRole('button', { name: 'Delete Sam Rivera' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Card' }))

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith('card-1')
      expect(screen.getByText('Card deleted successfully')).toBeInTheDocument()
    })
  })

  it('7. ConfirmDialog supports Escape dismissal when idle', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Delete Item?"
        description="Permanent action"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
