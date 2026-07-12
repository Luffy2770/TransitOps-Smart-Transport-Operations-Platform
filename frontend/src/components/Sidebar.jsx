import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/lib/nav-config'
import { useAuth } from '@/context/AuthContext'
import { LogOut } from 'lucide-react'

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-ink-950 text-canvas">
      <div className="flex items-center gap-2 border-b border-ink-800 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-signal-amber font-display text-sm font-bold text-ink-950">
          T
        </div>
        <div>
          <p className="font-display text-sm font-semibold tracking-wide">TransitOps</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Fleet Control
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ code, label, path, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-ink-800 text-canvas'
                      : 'text-ink-500 hover:bg-ink-900 hover:text-canvas',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'font-mono text-[10px] tabular-nums',
                        isActive ? 'text-signal-amber' : 'text-ink-700',
                      ].join(' ')}
                    >
                      {code}
                    </span>
                    <Icon size={16} strokeWidth={2} />
                    <span className="font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-ink-800 px-4 py-4">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 font-mono text-xs text-canvas">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-canvas">{user?.email}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-ink-500">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-xs text-ink-500 transition-colors hover:bg-ink-900 hover:text-alert-red"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
