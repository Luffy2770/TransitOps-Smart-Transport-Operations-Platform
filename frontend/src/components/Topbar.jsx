import { useEffect, useState } from 'react'

export function Topbar({ title, subtitle }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between border-b border-paper-line bg-canvas-raised px-8 py-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-slate-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      <div className="text-right font-mono text-xs text-ink-500">
        <p className="uppercase tracking-wide">
          {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <p className="tabular-nums">{now.toLocaleTimeString()}</p>
      </div>
    </header>
  )
}
