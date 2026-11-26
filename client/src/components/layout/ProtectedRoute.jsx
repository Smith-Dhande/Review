import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingState from '../ui/LoadingState'

export default function ProtectedRoute({ children }) {
  const { user, isCheckingAuth } = useAuth()

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingState message="Verifying session..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
