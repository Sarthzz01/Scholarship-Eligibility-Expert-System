import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
export const API_BASE = 'http://127.0.0.1:8000/api'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('scholarship_auth_token'))
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('scholarship_auth_user')
    if (saved) {
      try { return JSON.parse(saved) } catch { return null }
    }
    return null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
          localStorage.setItem('scholarship_auth_user', JSON.stringify(userData))
        } else {
          // Token expired or invalid
          logout()
        }
      } catch {
        // Network error - keep user data from storage
      } finally {
        setLoading(false)
      }
    }
    verifySession()
  }, [token])

  async function login(email, password, expectedRole = null) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, expected_role: expectedRole })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Login failed')
    }
    setToken(data.access_token)
    const userInfo = {
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role
    }
    setUser(userInfo)
    localStorage.setItem('scholarship_auth_token', data.access_token)
    localStorage.setItem('scholarship_auth_user', JSON.stringify(userInfo))
    return userInfo
  }

  async function register(email, password, fullName) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Registration failed')
    }
    setToken(data.access_token)
    const userInfo = {
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role
    }
    setUser(userInfo)
    localStorage.setItem('scholarship_auth_token', data.access_token)
    localStorage.setItem('scholarship_auth_user', JSON.stringify(userInfo))
    return userInfo
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('scholarship_auth_token')
    localStorage.removeItem('scholarship_auth_user')
  }

  async function authFetch(url, options = {}) {
    const headers = {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
      logout()
      throw new Error('Your session has expired. Please log in again.')
    }
    return res
  }

  return (
    <AuthContext.Provider value={{
      token,
      user,
      role: user?.role,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      register,
      logout,
      authFetch
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
