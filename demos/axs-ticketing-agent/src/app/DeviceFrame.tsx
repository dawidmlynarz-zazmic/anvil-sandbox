import { createContext, useContext, useState, type ReactNode } from 'react'

const FrameContext = createContext<HTMLElement | null>(null)

/** The device frame's element, for things that must stay inside it (the full-screen chat). Null until it has mounted. */
export const useFrame = () => useContext(FrameContext)

/**
 * Full-bleed on a phone; a centred phone-sized frame on a larger screen (the app has no desktop layout).
 * The translate makes the frame the containing block for fixed-position children, so a modal portaled into it fills the
 * frame, is clipped by its rounded corners, and slides in from the frame's edge rather than from the browser window's.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted sm:p-6">
      <div
        ref={setFrame}
        className="relative flex h-svh w-full flex-col overflow-hidden bg-background transform-[translateZ(0)] sm:h-(--frame-h) sm:w-97.5 sm:rounded-(--frame-radius) sm:border sm:border-border sm:shadow-lg"
      >
        <FrameContext.Provider value={frame}>{children}</FrameContext.Provider>
      </div>
    </div>
  )
}
