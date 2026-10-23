// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#chroma-ring
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@anvil/lib/utils'
import './chroma-ring.css'

export interface ChromaRingProps {
  /** What the ring surrounds, usually a button. It keeps its own shape; the ring follows it. */
  children: ReactNode
  /** Corner radius, as a CSS value. By default it is read from the child, so the ring always follows its corners. */
  radius?: string
  /** Thickness of the ring, in px. */
  borderWidth?: number
  /** Seconds for the highlights to go once round. */
  duration?: number
  /** Blur of the glow, in px. 0 turns the glow off. */
  blur?: number
  /** The quiet ring that is always there: any CSS colour. */
  base?: string
  /** The three tones of the highlight, from its centre outward. Any CSS colours. */
  colors?: [string, string, string]
  className?: string
}

/**
 * A hairline ring with two flowing, multi-tone highlights and a soft glow, for something that should draw the eye while
 * it waits to be used (a launcher). The tones default to Anvil's primary blue and the foreground-on-primary white, so
 * it follows the theme. Decorative: `aria-hidden`, no pointer events, holds still under reduced motion. Inspired by
 * Reacticx's Chroma Ring (React Native, Skia); this is the same idea for the web, in CSS only.
 */
export function ChromaRing({
  children,
  radius,
  borderWidth = 1.5,
  duration = 6,
  blur = 12,
  base = 'color-mix(in srgb, var(--primary-foreground) 30%, transparent)',
  colors = ['var(--primary-foreground)', 'color-mix(in srgb, var(--primary) 45%, var(--primary-foreground))', 'var(--primary)'],
  className,
}: ChromaRingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState<string>()

  // Read the child's own radius, so the ring can't drift from it.
  useLayoutEffect(() => {
    const child = ref.current?.querySelector<HTMLElement>(':scope > :not([data-slot^="chroma-ring-"])')
    if (child) setMeasured(getComputedStyle(child).borderTopLeftRadius)
  }, [])

  const style = {
    '--chroma-radius': radius ?? measured ?? 'var(--radius-xl)',
    '--chroma-width': `${borderWidth}px`,
    '--chroma-duration': `${duration}s`,
    '--chroma-blur': `${blur}px`,
    '--chroma-base': base,
    '--chroma-1': colors[0],
    '--chroma-2': colors[1],
    '--chroma-3': colors[2],
  } as CSSProperties

  return (
    <div ref={ref} data-slot="chroma-ring" style={style} className={cn('relative', className)}>
      {blur > 0 && (
        <span aria-hidden data-slot="chroma-ring-glow">
          <span data-slot="chroma-ring-glow-ring" />
        </span>
      )}
      <span aria-hidden data-slot="chroma-ring-base" />
      <span aria-hidden data-slot="chroma-ring-flow" />
      {children}
    </div>
  )
}
