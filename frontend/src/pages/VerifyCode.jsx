import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { verifySignup, resendCode } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function VerifyCode() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const initialEmail = location.state?.email || ''
  const purpose = location.state?.fromSignup ? 'signup' : 'password_reset'

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  if (!email) {
    return <Navigate to="/signup" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (code.length !== 6) {
      return setError('Please enter the 6-digit code.')
    }

    setLoading(true)
    try {
      const data = await verifySignup({ email, code })
      login(data.token, data.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.data?.detail || err.message || 'Verification failed')
      setCode('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    setResending(true)
    try {
      await resendCode({ email, purpose })
      setInfo('A new code has been sent.')
      setCountdown(30)
    } catch (err) {
      setError(err.data?.detail || err.message || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  const handleCodeChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(v)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">◈</div>
        <h1 className="auth-title">Verify your email</h1>
        <p className="auth-subtitle">
          Enter the 6-digit code we sent to<br />
          <strong style={{ color: '#e7e7f0' }}>{email}</strong>
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-success">{info}</div>}

          <div className="auth-field">
            <label htmlFor="code">Verification code</label>
            <input
              ref={inputRef}
              id="code"
              type="text"
              inputMode="numeric"
              className="auth-code-input"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <button
          className="auth-resend"
          onClick={handleResend}
          disabled={resending || countdown > 0}
        >
          {countdown > 0
            ? `Resend code in ${countdown}s`
            : resending
            ? 'Sending…'
            : "Didn't get the code? Resend"}
        </button>
      </div>
    </div>
  )
}
