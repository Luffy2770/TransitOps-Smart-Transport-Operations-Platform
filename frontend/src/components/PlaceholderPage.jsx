import { Topbar } from '@/components/Topbar'

export function PlaceholderPage({ title, subtitle, eta }) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="flex h-[calc(100vh-89px)] items-center justify-center px-8">
        <div className="max-w-sm text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-signal-amber">
            Pending build
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {title} wires up to the live API {eta ? `in the ${eta} block` : 'soon'}. Nothing to
            show yet — this route just confirms navigation works.
          </p>
        </div>
      </div>
    </>
  )
}
