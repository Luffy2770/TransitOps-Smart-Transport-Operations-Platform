import { Topbar } from '@/components/Topbar'
import { useAuth } from '@/context/AuthContext'

const KPI_SKELETON = [
  'Available vehicles',
  'Active trips',
  'In maintenance',
  'Fleet utilization',
]

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <>
      <Topbar title="Dashboard" subtitle={`Welcome back, ${user?.role ?? 'operator'}`} />
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_SKELETON.map((label) => (
            <div
              key={label}
              className="rounded-sm border border-paper-line bg-canvas-raised p-5"
            >
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-500">
                {label}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-ink-700">—</p>
              <p className="mt-1 text-xs text-ink-500">Live once KPI endpoint lands</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-sm border border-dashed border-paper-line p-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal-amber">
            Pending build
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
            KPI cards and charts go live in the Hour 5.5–6.5 block once the aggregation
            endpoints exist. This confirms auth + routing work end to end.
          </p>
        </div>
      </div>
    </>
  )
}
