import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GlobalSearch from './GlobalSearch'
import ThemeToggle from './ThemeToggle'

export default function AppHeader({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      const isK =
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        !e.altKey &&
        (e.key.toLowerCase() === 'k' || e.key === '/')
      if (isK) {
        e.preventDefault()
        e.stopPropagation()
        setSearchOpen(true)
        return false
      }
    }
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
          {/* LEFT: brand + nav */}
          <div className="topbar-left">
            <Link to="/" className="brand">
              <span className="logo">◈</span>
              <span>Notes</span>
            </Link>

            <nav className="nav-tabs">
              <NavLink to="/" end className={tabClass}>Notes</NavLink>
              <NavLink to="/tasks" className={tabClass}>Tasks</NavLink>
              <NavLink to="/stats" className={tabClass}>Stats</NavLink>
            </nav>
          </div>

          {/* CENTER: page-specific actions */}
          <div className="topbar-center">
            {children}
          </div>

          {/* RIGHT: user menu — single block */}
          <div className="topbar-right">
            <ThemeToggle />

            <button
              className="btn-ghost search-trigger"
              onClick={() => setSearchOpen(true)}
              title="Search (Ctrl+K or Ctrl+/)"
            >
              🔍
              <kbd className="kbd-hint">Ctrl+K</kbd>
            </button>

            <Link to="/profile" className="btn-ghost user-btn" title="Profile">
              👤 {user?.username}
            </Link>

            <button className="btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}