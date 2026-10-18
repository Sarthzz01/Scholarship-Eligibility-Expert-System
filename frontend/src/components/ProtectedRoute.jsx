import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner" />
        <p>Verifying session security...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirectPath = requiredRole === 'admin' ? '/admin/login' : '/login'
    return <Navigate to={redirectPath} state={{ from: location }} replace />
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect user to their own designated dashboard
    const targetDashboard = role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
    return <Navigate to={targetDashboard} replace />
  }

  return children
}
