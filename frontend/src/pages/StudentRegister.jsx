import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Lock, Mail, User, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function StudentRegister() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password) {
      setError('All fields are required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await register(email, password, fullName)
      navigate('/student/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try a different email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><UserPlus size={28} /></div>
          <h2>Create Student Account</h2>
          <p>Join to find verified scholarships and plan your application journey</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Full Name</span>
            <div className="input-with-icon">
              <User size={16} className="field-icon" />
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          </label>

          <label>
            <span>Email Address</span>
            <div className="input-with-icon">
              <Mail size={16} className="field-icon" />
              <input
                type="email"
                required
                placeholder="jane.doe@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label>
            <span>Password (min. 6 characters)</span>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Create a strong password"
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

          <label>
            <span>Confirm Password</span>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </label>

          <button type="submit" className="primary-button auth-submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register as Student'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>Already have an account? <Link to="/student/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  )
}
