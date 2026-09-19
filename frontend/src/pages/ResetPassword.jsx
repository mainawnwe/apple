import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { resetPassword, forgotPassword } from '../api/auth'
import './Auth.css'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialEmail = location.state?.email || ''

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  if (!email) {
    return <Navigate to="/forgot-password" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (code.length !== 6) return setError('Please enter the 6-digit code.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      await resetPassword({ email, code, new_password: password })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.data?.detail || err.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    setResending(true)
    try {
      await forgotPassword({ email })
      setInfo('A new code has been sent.')
    } catch (err) {
      setError(err.data?.detail || err.message || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">◈</div>
        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">
          Enter the code sent to<br />
          <strong style={{ color: '#e7e7f0' }}>{email}</strong>
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-success">{info}</div>}

          <div className="auth-field">
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              className="auth-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 8 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">Confirm new password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="repeat your password"
              required
              autoComplete="new-password"
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <button
          className="auth-resend"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? 'Sending…' : "Didn't get the code? Resend"}
        </button>
      </div>
    </div>
  )
}
