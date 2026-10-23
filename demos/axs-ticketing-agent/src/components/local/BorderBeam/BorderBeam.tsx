// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#border-beam
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@anvil/lib/utils'
import './border-beam.css'

export interface BorderBeamProps {
  /** The field the beam runs around. It keeps its own stroke; the beam sits flush on top of that stroke. */
  children: ReactNode
  /** Corner radius, as a CSS value. By default it is read from the field, so the beam always follows its corners. */
  radius?: string
  /** Thickness of the lit border, in px. */
  borderWidth?: number
  /** Seconds for one trip round the border. */
  duration?: number
  /** Length of the beam along the border, in px. */
  beamLength?: number
  /** Blur of the glow, in px. 0 turns the glow off. */
  glow?: number
  /** Strength of a faint ring under the beam, in percent. 0 (the default) leaves the field's own stroke as the base. */
  ambient?: number
  /** Any CSS colour. Defaults to the primary (brand) colour, so it follows the theme. */
  color?: string
  className?: string
}

/**
 * A beam of light travelling round a field's border, for a field at rest. It moves at a constant speed along the edge,
 * follows the field's corner radius, stops while the field is focused or has text, and holds still under reduced
 * motion. Purely decorative: `aria-hidden`, no pointer events. Inspired by Reacticx's Border Beam (React Native, Skia);
 * this is the same effect for the web, in CSS only.
 */
export function BorderBeam({
  children,
  radius,
  borderWidth = 2,
  duration = 4,
  beamLength = 200,
  glow = 10,
  ambient = 0,
  color = 'var(--primary)',
  className,
}: BorderBeamProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState<string>()

  // Read the field's own radius, so the beam can't drift from it.
  useLayoutEffect(() => {
    const field = ref.current?.querySelector<HTMLElement>(':scope > :not([data-slot^="border-beam-"])')
    if (field) setMeasured(getComputedStyle(field).borderTopLeftRadius)
  }, [])

  const style = {
    '--beam-radius': radius ?? measured ?? 'var(--radius-xl)',
    '--beam-width': `${borderWidth}px`,
    '--beam-duration': `${duration}s`,
    '--beam-length': `${beamLength}px`,
    '--beam-glow': `${glow}px`,
    '--beam-ambient': `${ambient}%`,
    '--beam-color': color,
  } as CSSProperties

  return (
    <div ref={ref} data-slot="border-beam" style={style} className={cn(className)}>
      {glow > 0 && (
        <span aria-hidden data-slot="border-beam-glow">
          <span data-slot="border-beam-glow-ring" />
        </span>
      )}
      <span aria-hidden data-slot="border-beam-ring" />
      {children}
    </div>
  )
}
