import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function Topbar({ title, subtitle }) {
  const [now, setNow] = useState(new Date())
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('transitops_theme') || 'light'
  })

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('transitops_theme', theme)
  }, [theme])

  return (
    <header className="flex items-center justify-between border-b border-paper-line bg-canvas-raised px-8 py-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-slate-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-6">
        <button
          onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-paper-line bg-canvas hover:bg-canvas-raised text-slate-ink hover:text-signal-amber transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          id="theme-toggle"
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <div className="text-right font-mono text-xs text-ink-500">
          <p className="uppercase tracking-wide">
            {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="tabular-nums">{now.toLocaleTimeString()}</p>
        </div>
      </div>
    </header>
  )
}
