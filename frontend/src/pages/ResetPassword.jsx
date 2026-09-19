import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { resetPassword, forgotPassword, verifyResetCode } from '../api/auth'
import './Auth.css'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialEmail = location.state?.email || ''

  const [step, setStep] = useState('code')   // 'code' | 'password'
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [verifiedCode, setVerifiedCode] = useState('')  // save code after verification

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  if (!email) {
    return <Navigate to="/forgot-password" replace />
  }

  // ---------- Step 1: Verify code ----------
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (code.length !== 6) return setError('Please enter the 6-digit code.')

    setLoading(true)
    try {
      await verifyResetCode({ email, code })
      setVerifiedCode(code)
      setStep('password')
      setInfo('Code verified. Now set your new password.')
    } catch (err) {
      setError(err.data?.detail || err.message || 'Invalid code.')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Step 2: Reset password ----------
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      await resetPassword({ email, code: verifiedCode, new_password: password })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.data?.detail || err.message || 'Reset failed')
      // If code expired between steps, send user back
      if (err.status === 400) {
        setStep('code')
        setVerifiedCode('')
      }
    } finally {
      setLoading(false)
    }
  }

  // ---------- Resend ----------
  const handleResend = async () => {
    setError('')
    setInfo('')
    setResending(true)
    try {
      await forgotPassword({ email })
      setInfo('A new code has been sent.')
      setStep('code')
      setCode('')
      setVerifiedCode('')
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

        {step === 'code' ? (
          <>
            <h1 className="auth-title">Verify your code</h1>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to<br />
              <strong style={{ color: '#e7e7f0' }}>{email}</strong>
            </p>

            <form className="auth-form" onSubmit={handleVerifyCode}>
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

              <button
                className="auth-btn"
                type="submit"
                disabled={loading || code.length !== 6}
              >
                {loading ? 'Verifying…' : 'Verify code'}
              </button>
            </form>

            <button
              className="auth-resend"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending…' : "Didn't get the code? Resend"}
            </button>
          </>
        ) : (
          <>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">
              Your code was verified. Choose a new password.
            </p>

            <form className="auth-form" onSubmit={handleResetPassword}>
              {error && <div className="auth-error">{error}</div>}
              {info && <div className="auth-success">{info}</div>}

              <div className="auth-field">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="at least 8 characters"
                  required
                  autoFocus
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
              onClick={() => setStep('code')}
            >
              ← Back to code
            </button>
          </>
        )}
      </div>
    </div>
  )
}