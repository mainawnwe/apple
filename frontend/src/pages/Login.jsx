import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiLogin({ username, password })
      login(data.token, data.user)
      navigate(from, { replace: true })
    } catch (err) {
      // Special case: account exists but not verified
      if (err.status === 403 && err.data?.code === 'not_verified') {
        navigate('/verify', {
          state: { email: err.data.email, fromSignup: true },
          replace: true,
        })
        return
      }
      setError(err.data?.detail || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">◈</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to access your notes</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your username"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="auth-link-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <div className="auth-link-row">
          Don't have an account?
          <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  )
}
