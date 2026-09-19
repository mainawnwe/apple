import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { changePassword } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Profile() {
  const { user, logout, setUser } = useAuth()
  const navigate = useNavigate()

  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (newPw.length < 8) return setPwError('New password must be at least 8 characters.')
    if (newPw !== confirmPw) return setPwError('New passwords do not match.')
    if (oldPw === newPw) return setPwError('New password must be different.')

    setPwLoading(true)
    try {
      const data = await changePassword({ old_password: oldPw, new_password: newPw })
      // Server issues a new token; save it so user stays logged in
      if (data.token) localStorage.setItem('token', data.token)
      setPwSuccess('Password updated successfully.')
      setOldPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      setPwError(err.data?.detail || err.message || 'Failed to update password')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">◈</div>
        <h1 className="auth-title">Your profile</h1>
        <p className="auth-subtitle">Signed in as {user?.username}</p>

        <div className="auth-field" style={{ marginBottom: '1rem' }}>
          <label>Username</label>
          <input type="text" value={user?.username || ''} readOnly />
        </div>

        <div className="auth-field" style={{ marginBottom: '1.5rem' }}>
          <label>Email</label>
          <input type="email" value={user?.email || ''} readOnly />
        </div>

        <div className="auth-divider">Change password</div>

        <form className="auth-form" onSubmit={handleChangePassword}>
          {pwError && <div className="auth-error">{pwError}</div>}
          {pwSuccess && <div className="auth-success">{pwSuccess}</div>}

          <div className="auth-field">
            <label htmlFor="old">Current password</label>
            <input
              id="old"
              type="password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="new">New password</label>
            <input
              id="new"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
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
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="repeat your password"
              required
              autoComplete="new-password"
            />
          </div>

          <button className="auth-btn" type="submit" disabled={pwLoading}>
            {pwLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <div className="auth-divider" style={{ marginTop: '1.75rem' }}>Account</div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Link
            to="/"
            className="auth-btn"
            style={{ textAlign: 'center', textDecoration: 'none', flex: 1, margin: 0 }}
          >
            Back to notes
          </Link>
          <button
            onClick={handleLogout}
            className="auth-btn"
            style={{
              flex: 1,
              background: 'rgba(248, 113, 113, 0.15)',
              color: '#fca5a5',
              margin: 0,
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
