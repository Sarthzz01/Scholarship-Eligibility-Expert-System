import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function StudentLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password, 'student')
      navigate('/student/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Invalid student credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><User size={28} /></div>
          <h2>Student Portal Login</h2>
          <p>Access your personalized eligibility checker & application roadmap</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Student Email Address</span>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input
                type="email"
                required
                placeholder="student@example.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button type="submit" className="primary-button auth-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Student Portal'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>New applicant? <Link to="/student/register">Create Student Account</Link></p>
          <p><Link to="/admin/login" className="secondary-link">Administrator Portal →</Link></p>
        </div>
      </div>
    </div>
  )
}
