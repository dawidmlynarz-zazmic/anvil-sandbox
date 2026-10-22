// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#daylight-timeline
import { cn } from '@anvil/lib/utils'

export interface DaylightTimelineProps extends Omit<React.ComponentProps<'figure'>, 'children'> {
  /** Set start and end, in minutes after midnight. */
  start: number
  end: number
  /** Sunset, in minutes after midnight. */
  sunset: number
  /** The visible window of the day, in minutes after midnight. */
  from?: number
  to?: number
}

const PHASES = [
  { key: 'daylight', label: 'Daylight', surface: 'bg-info-subtle text-foreground' },
  { key: 'golden', label: 'Golden hour', surface: 'bg-warning-subtle text-foreground' },
  { key: 'dusk', label: 'Dusk', surface: 'bg-agent-subtle text-foreground' },
  { key: 'night', label: 'Night', surface: 'bg-background-inverse text-foreground-inverse' },
] as const

type Phase = (typeof PHASES)[number]['key']

export const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

/** Minutes spent in each phase of light between `start` and `end`. */
export function minutesPerPhase(start: number, end: number, sunset: number): Record<Phase, number> {
  const edges = { golden: sunset - 60, dusk: sunset, night: sunset + 40 }
  const overlap = (a: number, b: number) => Math.max(0, Math.min(end, b) - Math.max(start, a))
  return {
    daylight: overlap(-Infinity, edges.golden),
    golden: overlap(edges.golden, edges.dusk),
    dusk: overlap(edges.dusk, edges.night),
    night: overlap(edges.night, Infinity),
  }
}

/**
 * Where a set falls on the day's light. Top to bottom: the set, a light-level curve with the sunset marked,
 * the phases of the day, and the hours. A sentence underneath says it in words.
 */
export function DaylightTimeline({ start, end, sunset, from = 16 * 60, to = 23 * 60, className, ...props }: DaylightTimelineProps) {
  const pct = (t: number) => `${Math.min(100, Math.max(0, ((t - from) / (to - from)) * 100))}%`
  const width = (a: number, b: number) => `${Math.max(0, ((Math.min(b, to) - Math.max(a, from)) / (to - from)) * 100)}%`
  const bounds = [from, sunset - 60, sunset, sunset + 40, to]
  const nightStart = sunset + 40

  // Light falls from full to nothing between the start of the window and nightfall.
  const points = Array.from({ length: 41 }, (_, i) => {
    const t = from + ((to - from) * i) / 40
    const u = Math.min(1, Math.max(0, (t - from) / (nightStart - from)))
    const light = 0.5 * (1 + Math.cos(Math.PI * u))
    return `${(i / 40) * 100},${44 - light * 38}`
  })
  const line = `M${points.join(' L')}`

  const spent = minutesPerPhase(start, end, sunset)
  const startPhase = PHASES.find((_, i) => start >= bounds[i]! && start < bounds[i + 1]!) ?? PHASES[3]
  const endPhase = PHASES.find((_, i) => end > bounds[i]! && end <= bounds[i + 1]!) ?? PHASES[3]
  const parts = PHASES.filter((p) => spent[p.key] >= 1).map((p) => `${Math.round(spent[p.key])} min ${p.label.toLowerCase()}`)
  const phase = (p: (typeof PHASES)[number]) => (p.key === 'night' ? 'after dark' : `in ${p.label.toLowerCase()}`)
  const summary =
    startPhase === endPhase
      ? `Entirely ${phase(startPhase)}. ${parts.join(', ')}.`
      : `Starts ${phase(startPhase)} and ends ${phase(endPhase)}. ${parts.join(', ')}.`
  const hours = [16, 18, 20, 22].map((h) => h * 60)

  return (
    <figure className={cn('flex flex-col gap-2', className)} {...props}>
      <div role="img" aria-label={`${formatTime(start)} to ${formatTime(end)}. Sunset ${formatTime(sunset)}. ${summary}`} className="flex flex-col gap-1">
        {/* The set: a bar over its hours, labelled above it so the text never gets clipped */}
        <div className="relative h-9">
          <span
            className="text-primary dark:text-info-medium absolute top-0 whitespace-nowrap type-text-xs-medium"
            style={start > from + (to - from) * 0.55 ? { insetInlineEnd: `calc(100% - ${pct(end)})` } : { insetInlineStart: pct(start) }}
          >
            Your set · {formatTime(start)} – {formatTime(end)}
          </span>
          <span
            className="bg-primary absolute bottom-1 h-1.5 rounded-full"
            style={{ insetInlineStart: pct(start), width: width(start, end) }}
          />
        </div>
        {/* Light level */}
        <div className="relative h-14">
          <div
            className="bg-primary/10 absolute inset-y-0"
            style={{ insetInlineStart: pct(start), width: width(start, end) }}
          />
          <svg viewBox="0 0 100 48" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            <path d={`${line} L100,48 L0,48 Z`} className="fill-warning-subtle" />
            <path d={line} fill="none" className="stroke-warning-medium" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <span aria-hidden className="border-warning-medium absolute inset-y-0 border-s border-dashed" style={{ insetInlineStart: pct(sunset) }} />
          <span
            className="text-muted-foreground absolute top-0 ms-1 whitespace-nowrap type-text-2xs-medium"
            style={{ insetInlineStart: pct(sunset) }}
          >
            Sunset {formatTime(sunset)}
          </span>
        </div>
        {/* Phases of the day */}
        <div className="flex h-6 overflow-hidden rounded-md">
          {PHASES.map((p, i) => (
            <div
              key={p.key}
              className={cn('flex items-center justify-center truncate px-1 type-text-2xs-medium', p.surface)}
              style={{ width: width(bounds[i]!, bounds[i + 1]!) }}
            >
              {p.label}
            </div>
          ))}
        </div>
        {/* Hours */}
        <div className="text-muted-foreground relative h-4 type-text-2xs-normal" aria-hidden>
          {hours.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ insetInlineStart: pct(t) }}>
              {formatTime(t).replace(':00', '')}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="text-muted-foreground type-text-xs-normal">{summary}</figcaption>
    </figure>
  )
}
