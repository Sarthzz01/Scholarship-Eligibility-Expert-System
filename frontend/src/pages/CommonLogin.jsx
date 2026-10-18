import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function CommonLogin() {
  const [role, setRole] = useState('student') // 'student' or 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password, role)
      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><GraduationCap size={28} /></div>
          <h2>Scholarship Expert</h2>
          <p>AI-Powered Eligibility & Decision Support System</p>
        </div>

        <div className="role-selector-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => { setRole('student'); setError('') }}
          >
            <User size={16} /> Student Portal
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => { setRole('admin'); setError('') }}
          >
            <ShieldCheck size={16} /> Administrator
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email Address</span>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input
                type="email"
                required
                placeholder={role === 'admin' ? 'admin@scholarshipexpert.org' : 'student@example.edu'}
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
            {loading ? 'Authenticating...' : `Sign in as ${role === 'admin' ? 'Administrator' : 'Student'}`}
          </button>
        </form>

        <div className="auth-footer-links">
          {role === 'student' ? (
            <p>Don&apos;t have an account yet? <Link to="/student/register">Register as Student</Link></p>
          ) : (
            <p className="admin-hint">Administrator accounts must be provisioned via the secure bootstrap utility.</p>
          )}
        </div>
      </div>
    </div>
  )
}
