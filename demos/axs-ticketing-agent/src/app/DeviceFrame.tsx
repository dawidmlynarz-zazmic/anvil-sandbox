import type { ReactNode } from 'react'

/** Full-bleed on a phone; a centred phone-sized frame on a larger screen (the app has no desktop layout). */
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted sm:p-6">
      <div className="relative flex h-svh w-full flex-col overflow-hidden bg-background sm:h-(--frame-h) sm:w-97.5 sm:rounded-3xl sm:border sm:border-border sm:shadow-lg">
        {children}
      </div>
    </div>
  )
}
