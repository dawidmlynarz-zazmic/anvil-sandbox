import type { ReactNode } from 'react'

/** The bar at the bottom of every step. The main action is always in the same place, bottom right. */
export function StepFooter({ note, status, children }: { note?: ReactNode; status?: ReactNode; children: ReactNode }) {
  return (
    <footer className="border-border flex shrink-0 items-center justify-between gap-4 border-t px-6 py-3">
      <p className="text-muted-foreground flex min-w-0 items-center gap-2 type-text-xs-normal">{note}</p>
      <div className="flex shrink-0 items-center gap-3">
        {status && <p className="text-muted-foreground type-text-xs-normal">{status}</p>}
        {children}
      </div>
    </footer>
  )
}
