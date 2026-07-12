import { cn } from '@/lib/utils'

// Maps every status enum in the schema to a color track.
// Keeping this centralized means every page renders statuses identically.
const STATUS_STYLES = {
  // Vehicle
  Available: 'text-rail-green bg-rail-green-dim',
  'On Trip': 'text-transit-blue bg-transit-blue-dim',
  'In Shop': 'text-signal-amber bg-signal-amber-dim',
  Retired: 'text-ink-500 bg-ink-800/5',
  // Driver
  'Off Duty': 'text-ink-500 bg-ink-800/5',
  Suspended: 'text-alert-red bg-alert-red-dim',
  // Trip
  Draft: 'text-ink-500 bg-ink-800/5',
  Dispatched: 'text-transit-blue bg-transit-blue-dim',
  Completed: 'text-rail-green bg-rail-green-dim',
  Cancelled: 'text-alert-red bg-alert-red-dim',
}

const DOT_STYLES = {
  Available: 'bg-rail-green',
  'On Trip': 'bg-transit-blue',
  'In Shop': 'bg-signal-amber',
  Retired: 'bg-ink-500',
  'Off Duty': 'bg-ink-500',
  Suspended: 'bg-alert-red',
  Draft: 'bg-ink-500',
  Dispatched: 'bg-transit-blue',
  Completed: 'bg-rail-green',
  Cancelled: 'bg-alert-red',
}

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide',
        STATUS_STYLES[status] ?? 'text-ink-500 bg-ink-800/5',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT_STYLES[status] ?? 'bg-ink-500')} />
      {status}
    </span>
  )
}
