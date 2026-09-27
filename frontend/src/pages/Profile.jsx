import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AppHeader from '../components/AppHeader'
import '../App.css'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.info('Logged out')
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
      if (data.token) localStorage.setItem('token', data.token)
      setPwSuccess('Password updated successfully.')
      toast.success('Password updated')
      setOldPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      const msg = err.data?.detail || err.message || 'Failed to update password'
      setPwError(msg)
      toast.error(msg)
    } finally {
      setPwLoading(false)
    }
  }

  const initials = (user?.username || '?').slice(0, 2).toUpperCase()

  return (
    <div className="app">
      <AppHeader />
      <main className="settings-page">
        {/* Back button */}
        <button className="back-btn" onClick={handleBack}>
          <span className="back-arrow">←</span>
          <span>Back</span>
        </button>

        {/* Profile Header */}
        <header className="settings-header">
          <div className="settings-avatar">
            <span>{initials}</span>
          </div>
          <div className="settings-header-info">
            <h1 className="settings-username">{user?.username}</h1>
            <p className="settings-email">{user?.email}</p>
            <p className="settings-meta">
              <span className="settings-meta-dot" />
              Signed in
            </p>
          </div>
        </header>

        {/* Account Section */}
        <section className="settings-section">
          <div className="settings-section-head">
            <h2 className="settings-section-title">Account</h2>
            <p className="settings-section-desc">
              Your account information is managed by the system
            </p>
          </div>

          <div className="settings-grid">
            <div className="settings-field">
              <label>Username</label>
              <div className="settings-value">{user?.username}</div>
            </div>

            <div className="settings-field">
              <label>Email address</label>
              <div className="settings-value">{user?.email}</div>
            </div>
          </div>
        </section>

        <div className="settings-divider" />

        {/* Security Section */}
        <section className="settings-section">
          <div className="settings-section-head">
            <h2 className="settings-section-title">Security</h2>
            <p className="settings-section-desc">
              Update your password to keep your account secure
            </p>
          </div>

          <form className="settings-form" onSubmit={handleChangePassword}>
            {pwError && <div className="auth-error">{pwError}</div>}
            {pwSuccess && <div className="auth-success">{pwSuccess}</div>}

            <div className="settings-field">
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

            <div className="settings-grid">
              <div className="settings-field">
                <label htmlFor="new">New password</label>
                <input
                  id="new"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="settings-field">
                <label htmlFor="confirm">Confirm new password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-primary" type="submit" disabled={pwLoading}>
                {pwLoading ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </section>

        <div className="settings-divider" />

        {/* Session Section */}
        <section className="settings-section">
          <div className="settings-section-head">
            <h2 className="settings-section-title">Session</h2>
            <p className="settings-section-desc">
              Sign out from this device
            </p>
          </div>

          <div className="settings-actions">
            <button className="btn-danger" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
