import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { BusinessesProvider } from './context/BusinessesContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BusinessesPage from './pages/BusinessesPage'
import BusinessDetailsPage from './pages/BusinessDetailsPage'
import SettingsPage from './pages/SettingsPage'
import PublicReviewPage from './pages/PublicReviewPage'

export default function App() {
  const { user } = useAuth()

  return (
    <BusinessesProvider>
      <Routes>
        {/* Public customer review experience (opened via QR scan or NFC tap) */}
        <Route path="/review/:businessId" element={<PublicReviewPage />} />

        {/* Login — only accessible when logged out */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

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
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route
          path="*"
          element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </BusinessesProvider>
  )
}
