import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// Decorative manifest ticker — purely atmospheric, gives the dark panel
// the feel of a live dispatch board without depending on real data.
const MANIFEST_LINES = [
  { id: 'TR-2291', status: 'DISPATCHED', route: 'MUM → PUN' },
  { id: 'TR-1052', status: 'AVAILABLE', route: 'IDLE · BAY 4' },
  { id: 'DR-118', status: 'ON TRIP', route: 'AHM → SUR' },
  { id: 'TR-3087', status: 'IN SHOP', route: 'SVC · BRAKE' },
  { id: 'DR-204', status: 'AVAILABLE', route: 'IDLE · BAY 1' },
  { id: 'TR-0442', status: 'DISPATCHED', route: 'DEL → JAI' },
  { id: 'TR-1190', status: 'COMPLETED', route: 'PUN → MUM' },
  { id: 'DR-071', status: 'OFF DUTY', route: 'REST · 8H' },
]

const STATUS_COLOR = {
  DISPATCHED: 'text-transit-blue',
  AVAILABLE: 'text-rail-green',
  'ON TRIP': 'text-transit-blue',
  'IN SHOP': 'text-signal-amber',
  COMPLETED: 'text-rail-green',
  'OFF DUTY': 'text-ink-500',
}

function ManifestTicker() {
  const doubled = [...MANIFEST_LINES, ...MANIFEST_LINES]
  return (
    <div className="relative h-full overflow-hidden">
      <div className="animate-ticker flex flex-col gap-3">
        {doubled.map((line, i) => (
          <div
            key={`${line.id}-${i}`}
            className="flex items-center justify-between border-b border-ink-800 pb-3 font-mono text-xs"
          >
            <span className="text-canvas">{line.id}</span>
            <span className={STATUS_COLOR[line.status] ?? 'text-ink-500'}>{line.status}</span>
            <span className="text-ink-500">{line.route}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Could not sign in — check your email and password.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: dispatch board panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink-950 px-10 py-10 text-canvas lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-signal-amber font-display text-sm font-bold text-ink-950">
            T
          </div>
          <span className="font-display text-sm font-semibold tracking-wide">TransitOps</span>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal-amber">
            Live manifest
          </p>
          <h2 className="mt-3 max-w-xs font-display text-2xl font-semibold leading-tight text-canvas">
            One board for every vehicle, driver, and trip on the road.
          </h2>
        </div>

        <div className="h-40">
          <ManifestTicker />
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex w-full flex-1 items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-signal-amber font-display text-sm font-bold text-ink-950">
                T
              </div>
              <span className="font-display text-sm font-semibold tracking-wide text-slate-ink">
                TransitOps
              </span>
            </div>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-widest text-signal-amber">
            Sign in
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-slate-ink">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Enter your credentials to access the fleet console.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-3 py-2.5 text-sm text-alert-red">
                <TriangleAlert size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@transitops.io"
                className="w-full rounded-sm border border-paper-line bg-canvas-raised px-3 py-2.5 text-sm text-slate-ink outline-none transition-colors focus:border-signal-amber focus:ring-2 focus:ring-signal-amber/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-500">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-sm border border-paper-line bg-canvas-raised px-3 py-2.5 pr-10 text-sm text-slate-ink outline-none transition-colors focus:border-signal-amber focus:ring-2 focus:ring-signal-amber/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-slate-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-ink-950 px-4 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              {!isSubmitting && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-wide text-ink-500">
            Fleet Manager · Dispatcher · Safety Officer · Financial Analyst
          </p>
        </div>
      </div>
    </div>
  )
}
