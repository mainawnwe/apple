import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import GlobalSearch from './GlobalSearch'
import ThemeToggle from './ThemeToggle'

export default function AppHeader({ children, mobileSearch = null }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Ctrl+K / Ctrl+/
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

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Lock scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const handleLogout = async () => {
    setDrawerOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const tabClass = ({ isActive }) => (isActive ? 'nav-tab active' : 'nav-tab')
  const drawerLinkClass = ({ isActive }) => (isActive ? 'drawer-link active' : 'drawer-link')

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          {/* Hamburger (mobile only) */}
          <button
            className="hamburger-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Brand */}
          <Link to="/" className="brand">
            <img src="/static/brand/mark.svg" alt="" className="brand-mark" />
            <span className="brand-label">Notes</span>
          </Link>

          {/* Nav tabs (desktop only) */}
          <nav className="nav-tabs">
            <NavLink to="/" end className={tabClass}>Notes</NavLink>
            <NavLink to="/tasks" className={tabClass}>Tasks</NavLink>
            <NavLink to="/reminders" className={tabClass}>Reminders</NavLink>
            <NavLink to="/stats" className={tabClass}>Stats</NavLink>
          </nav>

          {/* Page actions (desktop only) */}
          <div className="topbar-center">
            {children}
          </div>

          {/* Right side */}
          <div className="topbar-right">
            <div className="desktop-only-flex">
              <ThemeToggle />

              <button
                className="btn-ghost search-trigger"
                onClick={() => setSearchOpen(true)}
                title="Search (Ctrl+K)"
              >
                🔍
                <kbd className="kbd-hint">Ctrl+K</kbd>
              </button>
            </div>

            <Link to="/profile" className="btn-ghost user-btn" title="Profile">
              <span className="user-icon">👤</span>
              <span className="user-name">{user?.username}</span>
            </Link>

            <button className="btn-ghost logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Mobile search bar (below topbar) */}
        {mobileSearch && (
          <div className="mobile-search-bar">
            {mobileSearch}
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      <div
        className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <img src="/static/brand/mark.svg" alt="" className="drawer-logo" />
          <div className="drawer-brand">KO NAING KYAW</div>
          <div className="drawer-tagline">FULL STACK DEVELOPER</div>
        </div>

        <nav className="drawer-nav">
          <NavLink to="/" end className={drawerLinkClass}>
            <span className="drawer-icon">🏠</span>
            <span>Notes</span>
          </NavLink>
          <NavLink to="/tasks" className={drawerLinkClass}>
            <span className="drawer-icon">✓</span>
            <span>Tasks</span>
          </NavLink>
          <NavLink to="/reminders" className={drawerLinkClass}>
            <span className="drawer-icon">⏰</span>
            <span>Reminders</span>
          </NavLink>
          <NavLink to="/stats" className={drawerLinkClass}>
            <span className="drawer-icon">📊</span>
            <span>Stats</span>
          </NavLink>
        </nav>

        <div className="drawer-divider" />

        <button className="drawer-link" onClick={toggleTheme}>
          <span className="drawer-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <NavLink to="/profile" className={drawerLinkClass}>
          <span className="drawer-icon">👤</span>
          <span>Profile</span>
        </NavLink>

        <div className="drawer-divider" />

        <div className="drawer-user">
          <div className="drawer-user-icon">👤</div>
          <div className="drawer-user-info">
            <div className="drawer-user-name">{user?.username}</div>
            <div className="drawer-user-email">{user?.email}</div>
          </div>
        </div>

        <button className="drawer-logout" onClick={handleLogout}>
          <span>⎋</span>
          <span>Log out</span>
        </button>
      </aside>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
