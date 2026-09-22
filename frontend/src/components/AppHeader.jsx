import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GlobalSearch from './GlobalSearch'

export default function AppHeader({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  // Global Ctrl+K / Cmd+K listener (capture phase to bypass browser)
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        e.stopPropagation()
        setSearchOpen(true)
        return false
      }
    }
    // capture = true → runs BEFORE browser default
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const tabClass = ({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="logo">◈</span>
            <span>Notes</span>
          </div>

          <nav className="nav-tabs">
            <NavLink to="/" end className={tabClass}>Notes</NavLink>
            <NavLink to="/tasks" className={tabClass}>Tasks</NavLink>
            <NavLink to="/stats" className={tabClass}>Stats</NavLink>
          </nav>

          {children}

          <button
            className="btn-ghost search-trigger"
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
          >
            🔍
            <kbd className="kbd-hint">Ctrl+K</kbd>
          </button>

          <Link to="/profile" className="btn-ghost" title="Profile">
            👤 {user?.username}
          </Link>
          <button className="btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}