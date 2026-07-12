import { ModuleNav } from '../components/ModuleNav.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function PlaceholderPage({ icon, role, description }) {
  const { email } = useAuth()

  return (
    <div className="command-shell">
      <ModuleNav />

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
            <div className="route-block-title" style={{ justifyContent: 'center', marginBottom: 8 }}>
              Signed in as {email}
            </div>
          )}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            This module wires up to the live API once the backend route exists.
          </p>
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
