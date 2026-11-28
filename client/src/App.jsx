import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { BusinessesProvider } from './context/BusinessesContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoadingState from './components/ui/LoadingState'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BusinessesPage from './pages/BusinessesPage'
import BusinessDetailsPage from './pages/BusinessDetailsPage'
import SettingsPage from './pages/SettingsPage'
import PublicReviewPage from './pages/PublicReviewPage'

const DigitalCardsPage = lazy(
  () => import('./modules/digital-cards/pages/DigitalCardsPage'),
)
const DigitalCardEditorPage = lazy(
  () => import('./modules/digital-cards/pages/DigitalCardEditorPage'),
)
const DigitalCardDetailsPage = lazy(
  () => import('./modules/digital-cards/pages/DigitalCardDetailsPage'),
)
const PublicDigitalCardPage = lazy(
  () => import('./modules/digital-cards/pages/PublicDigitalCardPage'),
)

function LoginRoute() {
  const { user, isCheckingAuth } = useAuth()

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingState message="Checking session..." />
      </div>
    )
  }

  return user ? <Navigate to="/dashboard" replace /> : <LoginPage />
}

export default function App() {
  const { user } = useAuth()

  return (
    <BusinessesProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-bg flex items-center justify-center">
            <LoadingState message="Loading..." />
          </div>
        }
      >
        <Routes>
          {/* Public customer review experience (V1) */}
          <Route path="/review/:businessId" element={<PublicReviewPage />} />

          {/* Public digital business card experience (V2) */}
          <Route path="/card/:slug" element={<PublicDigitalCardPage />} />

          {/* Login — only accessible when logged out */}
          <Route path="/login" element={<LoginRoute />} />

          {/* Protected authenticated application */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="businesses" element={<BusinessesPage />} />
            <Route path="businesses/:businessId" element={<BusinessDetailsPage />} />
            <Route path="digital-cards" element={<DigitalCardsPage />} />
            <Route path="digital-cards/new" element={<DigitalCardEditorPage />} />
            <Route path="digital-cards/:cardId" element={<DigitalCardDetailsPage />} />
            <Route path="digital-cards/:cardId/edit" element={<DigitalCardEditorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route
            path="*"
            element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
          />
        </Routes>
      </Suspense>
    </BusinessesProvider>
  )
}
