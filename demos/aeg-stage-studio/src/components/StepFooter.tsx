import type { ReactNode } from 'react'

/**
 * The bar at the bottom of every step. The main action is always in the same place, bottom right. On a narrow work
 * area the status line gives way, so the note keeps a readable width.
 */
export function StepFooter({ note, status, children }: { note?: ReactNode; status?: ReactNode; children: ReactNode }) {
  return (
    <footer className="border-border @container flex shrink-0 items-center justify-between gap-4 border-t px-6 py-3">
      <p className="text-muted-foreground line-clamp-2 flex min-w-0 flex-1 items-center gap-2 type-text-xs-normal">{note}</p>
      <div className="flex shrink-0 items-center gap-3">
        {status && <p className="text-muted-foreground hidden max-w-56 type-text-xs-normal @2xl:block">{status}</p>}
        {children}
      </div>
    </footer>
  )
}
