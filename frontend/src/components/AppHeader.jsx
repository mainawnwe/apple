import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppHeader({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const tabClass = ({ isActive }) =>
    isActive ? 'nav-tab active' : 'nav-tab'

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="logo">◈</span>
          <span>Notes</span>
        </div>

        <nav className="nav-tabs">
          <NavLink to="/" end className={tabClass}>Notes</NavLink>
          <NavLink to="/tasks" className={tabClass}>Tasks</NavLink>
        </nav>

        {children}

        <Link to="/profile" className="btn-ghost" title="Profile">
          👤 {user?.username}
        </Link>
        <button className="btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
