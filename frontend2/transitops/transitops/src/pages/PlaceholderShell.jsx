import { useNavigate } from 'react-router-dom'

function PlaceholderPage({ icon, role, description }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('email')
    localStorage.removeItem('role')
    localStorage.removeItem('isAuthenticated')
    navigate('/')
  }

  const email = typeof window !== 'undefined' ? localStorage.getItem('email') : null

  return (
    <div className="command-shell">
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
        <div className="nav-status-group">
          <div className="status-pill">
            <span className="pulse-dot" />
            System Online
          </div>
        </div>
      </header>

      <main
        className="command-main"
        style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}
      >
        <div
          className="terminal-panel"
          style={{ maxWidth: 480, textAlign: 'center', padding: '40px 34px' }}
        >
          <div
            className="lock-icon"
            style={{ width: 56, height: 56, fontSize: '1.4rem', margin: '0 auto 18px' }}
          >
            <i className={`bi ${icon}`} />
          </div>
          <div className="terminal-welcome" style={{ marginBottom: 8 }}>
            {role} Workspace
          </div>
          <p className="fleet-subtitle" style={{ margin: '0 auto 22px', maxWidth: 380 }}>
            {description}
          </p>
          {email && (
            <div className="route-block-title" style={{ justifyContent: 'center', marginBottom: 24 }}>
              Signed in as {email}
            </div>
          )}
          <button className="initialize-btn" style={{ width: 'auto', padding: '11px 28px' }} onClick={handleLogout}>
            <i className="bi bi-box-arrow-left" /> Sign Out
          </button>
        </div>
      </main>

      <footer className="status-bar">
        <span>TransitOps Network</span>
        <span className="status-bar-mid">Encrypted Session · RBAC Active</span>
        <span>Version 1.0.0 · 2026</span>
      </footer>
    </div>
  )
}

export default PlaceholderPage
