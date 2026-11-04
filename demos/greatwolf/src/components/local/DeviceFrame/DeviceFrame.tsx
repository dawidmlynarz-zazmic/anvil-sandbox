import type { ReactNode } from 'react'
import { cn } from '@anvil/lib/utils'

interface Props {
  kind: 'desktop' | 'phone'
  /** Desktop: the address shown in the browser bar. */
  url?: string
  /** Phone: the status bar shows this over the screen. Hide it for a lock screen that draws its own. */
  statusBar?: boolean
  className?: string
  children: ReactNode
}

// DEMO-ONLY: a frame to set the screen in context. Not an Anvil candidate.
export function DeviceFrame({ kind, url = 'greatwolf.example/discover', statusBar = true, className, children }: Props) {
  if (kind === 'phone') {
    return (
      <div
        data-device="phone"
        className={cn('relative flex h-full max-h-[800px] min-h-0 w-[390px] max-w-full flex-col overflow-hidden rounded-[44px] border-[10px] border-[#1c1c1e] bg-background shadow-xl', className)}
      >
        <span aria-hidden className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1c1c1e]" />
        {statusBar && (
          <div aria-hidden className="type-text-xs-semibold flex h-10 shrink-0 items-end justify-between px-7 pb-1 text-foreground">
            <span>9:41</span>
            <span className="text-muted-foreground">5G · 86%</span>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <span aria-hidden className="mx-auto mb-1.5 mt-1 h-1 w-28 shrink-0 rounded-full bg-foreground/80" />
      </div>
    )
  }
  return (
    <div data-device="desktop" className={cn('flex h-full min-h-0 w-full max-w-[1200px] flex-col overflow-hidden rounded-xl border bg-background shadow-xl', className)}>
      <div aria-hidden className="flex h-10 shrink-0 items-center gap-3 border-b bg-muted px-4">
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-border-strong" />
          <i className="size-2.5 rounded-full bg-border-strong" />
          <i className="size-2.5 rounded-full bg-border-strong" />
        </span>
        <span className="type-text-xs-normal mx-auto w-full max-w-md truncate rounded-md bg-background px-3 py-1 text-center text-muted-foreground">{url}</span>
        <span className="w-10" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col max-lg:flex-none">{children}</div>
    </div>
  )
}
