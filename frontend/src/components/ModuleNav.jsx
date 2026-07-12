import { NavLink, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from '../lib/nav-config.js'
import { useAuth } from '../context/AuthContext.jsx'

export function ModuleNav() {
  const { role, email, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="topnav">
      <div className="brand-block">
        <div className="brand-mark">
          <i className="bi bi-diagram-3-fill" />
        </div>
        <div className="brand-text-group">
          <div className="brand-title">TransitOps</div>
          <div className="brand-subtitle">Smart Transport Operations</div>
        </div>
      </div>

      <nav className="module-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `module-nav-link${isActive ? ' active' : ''}`
            }
          >
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="nav-status-group">
        {role && (
          <div className="rbac-pill" title={email ?? ''}>
            <i className="bi bi-person-check" />
            {role}
          </div>
        )}
        <div className="status-pill">
          <span className="pulse-dot" />
          System Online
        </div>
        <button type="button" className="nav-signout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left" />
        </button>
      </div>
    </header>
  )
}
