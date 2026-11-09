import { createContext, useContext, useEffect, useState, type ReactNode, type RefObject } from 'react'

// Page layouts follow the width the page actually has, not the window: with Wiley's 420px sidebar open on a 1024px
// screen the page is ~600px wide and should lay out like a phone, not a crushed desktop.

const WIDE_PAGE = 760

const PageWidth = createContext(Number.POSITIVE_INFINITY)

export function PageWidthProvider({ target, children }: { target: RefObject<HTMLElement | null>; children: ReactNode }) {
  const [width, setWidth] = useState(Number.POSITIVE_INFINITY)
  useEffect(() => {
    const el = target.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [target])
  return <PageWidth.Provider value={width}>{children}</PageWidth.Provider>
}

/** True when the page area is wide enough for the desktop layouts (columns, side-by-side cards). */
export function usePageWide() {
  return useContext(PageWidth) >= WIDE_PAGE
}
