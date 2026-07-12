import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEMO_ACCOUNTS = [
  {
    email: 'fleet@transitops.in',
    password: 'fleet123',
    role: 'Fleet Manager',
    route: '/fleet',
  },
  {
    email: 'dispatcher@transitops.in',
    password: 'dispatch123',
    role: 'Dispatcher',
    route: '/dashboard',
  },
  {
    email: 'safety@transitops.in',
    password: 'safety123',
    role: 'Safety Officer',
    route: '/safety',
  },
  {
    email: 'finance@transitops.in',
    password: 'finance123',
    role: 'Financial Analyst',
    route: '/analytics',
  },
]

const ROLE_ACCESS = {
  'Fleet Manager': {
    title: 'FLEET MANAGER ACCESS',
    items: ['Vehicle Registry', 'Fleet Lifecycle', 'Maintenance Operations'],
  },
  Dispatcher: {
    title: 'DISPATCHER ACCESS',
    items: ['Trip Management', 'Vehicle Assignment', 'Driver Assignment'],
  },
  'Safety Officer': {
    title: 'SAFETY OFFICER ACCESS',
    items: ['Driver Compliance', 'License Monitoring', 'Safety Scores'],
  },
  'Financial Analyst': {
    title: 'FINANCIAL ANALYST ACCESS',
    items: ['Fuel Analytics', 'Expense Management', 'Vehicle ROI'],
  },
}

const MAX_ATTEMPTS = 5

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ email: '', password: '', role: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [showDenied, setShowDenied] = useState(false)
  const [successInfo, setSuccessInfo] = useState(null)

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setShowDenied(false)
  }

  const validate = () => {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.email.trim()) {
      nextErrors.email = 'Operator email is required.'
    } else if (!emailPattern.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid TransitOps email address.'
    }

    if (!formData.password) {
      nextErrors.password = 'Access key is required.'
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Access key must contain at least 8 characters.'
    }

    if (!formData.role) {
      nextErrors.role = 'Select an authorized access role.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLocked) return
    if (!validate()) return

    setIsAuthenticating(true)
    setShowDenied(false)

    setTimeout(() => {
      const match = DEMO_ACCOUNTS.find(
        (acc) =>
          acc.email.toLowerCase() === formData.email.trim().toLowerCase() &&
          acc.password === formData.password &&
          acc.role === formData.role,
      )

      if (match) {
        setIsAuthenticating(false)
        setSuccessInfo(match)

        localStorage.setItem('email', match.email)
        localStorage.setItem('role', match.role)
        localStorage.setItem('isAuthenticated', 'true')

        setTimeout(() => {
          navigate(match.route)
        }, 1000)
      } else {
        setIsAuthenticating(false)
        const nextAttempts = failedAttempts + 1
        setFailedAttempts(nextAttempts)
        setShowDenied(true)
        if (nextAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true)
        }
      }
    }, 1100)
  }

  const activeRolePreview = ROLE_ACCESS[formData.role]

  return (
    <div className="command-shell">
      {/* TOP NAVIGATION */}
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

      {/* MAIN CONTENT */}
      <main className="command-main">
        {/* LEFT: LIVE FLEET NETWORK */}
        <section className="fleet-panel">
          <div className="eyebrow-tag">Live Fleet Network</div>
          <h1 className="fleet-heading">
            MOVE <span className="accent-word">SMARTER.</span>
            <br />
            OPERATE <span className="accent-word">BETTER.</span>
          </h1>
          <p className="fleet-subtitle">
            One intelligent workspace for your fleet, drivers, trips and transport
            operations.
          </p>

          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-value">24</div>
              <div className="kpi-label">Active vehicles</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">08</div>
              <div className="kpi-label">Trips in progress</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">92%</div>
              <div className="kpi-label">Fleet readiness</div>
            </div>
          </div>

          <div className="route-block">
            <div className="route-block-title">Live Route Network</div>
            <div className="route-line-wrap">
              <div className="route-line">
                <span className="route-stop start" />
                <span className="route-stop mid" />
                <span className="route-stop end" />
                <span className="route-moving-dot" />
              </div>
              <div className="route-city-labels">
                <span>Ahmedabad</span>
                <span>Vadodara</span>
                <span>Surat</span>
              </div>
              <div className="route-meta">
                <div className="trip-info">
                  <strong>TR-2048</strong> · Ahmedabad → Surat
                </div>
                <div className="transit-badge">
                  <span className="pulse-dot" />
                  In transit
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: SECURE ACCESS TERMINAL */}
        <section className="terminal-col">
          <div className="terminal-panel">
            {successInfo ? (
              <div className="success-state">
                <div className="success-check">
                  <i className="bi bi-check-lg" />
                </div>
                <div className="success-title">IDENTITY VERIFIED</div>
                <div className="success-sub">Access granted.</div>
                <div className="success-welcome">Welcome, {successInfo.role}.</div>
              </div>
            ) : (
              <>
                <div className="terminal-header">
                  <div className="lock-icon">
                    <i className="bi bi-shield-lock" />
                  </div>
                  <div className="terminal-title">Secure Access Terminal</div>
                </div>
                <div className="terminal-subtitle">Identity verification required</div>

                <div className="terminal-welcome">Welcome back</div>
                <div className="terminal-welcome-sub">
                  Sign in to access your TransitOps workspace.
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {/* EMAIL */}
                  <div className="field-group">
                    <label className="field-label" htmlFor="email">Email Address</label>
                    <div className={`input-shell ${errors.email ? 'has-error' : ''}`}>
                      <i className="bi bi-envelope field-icon" />
                      <input
                        id="email"
                        type="email"
                        placeholder="operator@transitops.in"
                        value={formData.email}
                        onChange={handleChange('email')}
                        disabled={isLocked}
                      />
                    </div>
                    {errors.email && (
                      <div className="field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.email}
                      </div>
                    )}
                  </div>

                  {/* PASSWORD */}
                  <div className="field-group">
                    <label className="field-label" htmlFor="password">Password</label>
                    <div className={`input-shell ${errors.password ? 'has-error' : ''}`}>
                      <i className="bi bi-lock field-icon" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange('password')}
                        disabled={isLocked}
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                      </button>
                    </div>
                    {errors.password && (
                      <div className="field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.password}
                      </div>
                    )}
                  </div>

                  {/* ROLE */}
                  <div className="field-group">
                    <label className="field-label" htmlFor="role">Access Role</label>
                    <div className={`input-shell ${errors.role ? 'has-error' : ''}`}>
                      <i className="bi bi-diagram-2 field-icon" />
                      <select
                        id="role"
                        value={formData.role}
                        onChange={handleChange('role')}
                        disabled={isLocked}
                      >
                        <option value="">Select access role</option>
                        <option value="Fleet Manager">Fleet Manager</option>
                        <option value="Dispatcher">Dispatcher</option>
                        <option value="Safety Officer">Safety Officer</option>
                        <option value="Financial Analyst">Financial Analyst</option>
                      </select>
                      <i className="bi bi-chevron-down select-chevron" />
                    </div>
                    {errors.role && (
                      <div className="field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.role}
                      </div>
                    )}
                  </div>

                  {/* ROLE PREVIEW */}
                  {activeRolePreview && (
                    <div className="role-preview" key={formData.role}>
                      <div className="role-preview-title">{activeRolePreview.title}</div>
                      <ul className="role-preview-list">
                        {activeRolePreview.items.map((item) => (
                          <li key={item}>
                            <i className="bi bi-check-circle-fill" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* REMEMBER / FORGOT */}
                  <div className="utility-row">
                    <label className="remember-check">
                      <input type="checkbox" disabled={isLocked} />
                      Remember this terminal
                    </label>
                    <a href="#!" className="forgot-link">Forgot credentials?</a>
                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    className="initialize-btn"
                    disabled={isAuthenticating || isLocked}
                  >
                    {isAuthenticating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        />
                        Authenticating...
                      </>
                    ) : isLocked ? (
                      <>
                        <i className="bi bi-lock-fill" /> Terminal locked
                      </>
                    ) : (
                      <>
                        Continue <i className="bi bi-arrow-right" />
                      </>
                    )}
                  </button>

                  {/* SECURITY ALERT */}
                  {(showDenied || isLocked) && (
                    <div className={`security-alert ${isLocked ? 'locked' : ''}`}>
                      <div className="security-alert-title">
                        <i className="bi bi-exclamation-triangle-fill" />
                        {isLocked ? 'TERMINAL LOCKED' : 'ACCESS DENIED'}
                      </div>
                      <div className="security-alert-msg">
                        {isLocked
                          ? 'Maximum authentication attempts reached.'
                          : 'Credential verification failed.'}
                      </div>
                      {!isLocked && (
                        <div className="security-alert-attempt">
                          Attempt {failedAttempts} of {MAX_ATTEMPTS}
                        </div>
                      )}
                      <div className="security-indicators">
                        {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                          <span
                            key={i}
                            className={`security-dot ${i < failedAttempts ? 'filled' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </section>
      </main>

      {/* BOTTOM STATUS BAR */}
      <footer className="status-bar">
        <span>TransitOps Network</span>
        <span className="status-bar-mid">Encrypted Session · RBAC Active</span>
        <span>Version 1.0.0 · 2026</span>
      </footer>
    </div>
  )
}

export default Login
