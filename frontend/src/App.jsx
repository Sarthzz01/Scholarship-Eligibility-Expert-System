import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CommonLogin from './pages/CommonLogin'
import StudentLogin from './pages/StudentLogin'
import StudentRegister from './pages/StudentRegister'
import AdminLogin from './pages/AdminLogin'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminAlgorithmsCenter from './pages/AdminAlgorithmsCenter'

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner" />
        <p>Loading Scholarship Eligibility Expert System...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
  }

  return <Navigate to="/login" replace />
}

function AlgorithmsRedirect() {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  if (role === 'admin') {
    return <Navigate to="/admin/algorithms" replace />
  }
  // If student tries to access algorithms directly, redirect to student dashboard
  return <Navigate to="/student/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Index Route */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<CommonLogin />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/register" element={<StudentRegister />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Student Dashboard (Discovery & Actionable Guidance Only) */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Dashboard (Governance, Schemes & Rules) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin AI Control Center (All 5 Classical AI Engines) */}
          <Route
            path="/admin/algorithms"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAlgorithmsCenter />
              </ProtectedRoute>
            }
          />

          {/* Legacy / Direct /algorithms Route Guard */}
          <Route path="/algorithms" element={<AlgorithmsRedirect />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
