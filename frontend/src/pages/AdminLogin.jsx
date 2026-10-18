import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
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
      await login(email, password, 'admin')
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Invalid administrator credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card admin-auth-theme">
        <div className="auth-brand">
          <div className="brand-mark admin-mark"><ShieldCheck size={28} /></div>
          <h2>Administrator Portal</h2>
          <p>Restricted access for scheme governance, rule curation &amp; analytics</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Administrator Email</span>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input
                type="email"
                required
                placeholder="admin@scholarshipexpert.org"
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
                placeholder="Enter admin password"
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

          <button type="submit" className="primary-button admin-submit-btn" disabled={loading}>
            {loading ? 'Verifying Admin Privileges...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="auth-footer-links">
          <div className="admin-security-note">
            <ShieldAlert size={14} />
            <span>Public registration is prohibited. Administrator accounts must be created using the backend bootstrap utility.</span>
          </div>
          <p><Link to="/student/login">Back to Student Login</Link></p>
        </div>
      </div>
    </div>
  )
}
