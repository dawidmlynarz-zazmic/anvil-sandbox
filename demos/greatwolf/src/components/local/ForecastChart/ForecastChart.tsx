import { cn } from '@anvil/lib/utils'
import type { Day } from '~/data/forecast'

interface Props {
  days: Day[]
  /** Index of the day to call out. */
  highlight?: number
  callout?: string
  className?: string
}

// ANVIL-CANDIDATE: a small occupancy chart (forecast bars over last year's ticks) with one call-out. Anvil has metric
// cards but no chart yet; built as plain SVG so the demo needs no chart library. A real build would likely use
// Recharts behind the same props. A data table follows for screen readers.
export function ForecastChart({ days, highlight, callout, className }: Props) {
  const w = 720
  const h = 240
  const pad = { l: 36, r: 8, t: 28, b: 28 }
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const slot = iw / days.length
  const bar = slot * 0.56
  const y = (v: number) => pad.t + ih - (v / 100) * ih

  return (
    <figure className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Forecast occupancy for the next 14 days, against last year" className="h-auto w-full">
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground" fontSize="10">{t}%</text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = pad.l + slot * i + (slot - bar) / 2
          const on = i === highlight
          return (
            <g key={d.label}>
              <rect x={x} y={y(d.forecast)} width={bar} height={y(0) - y(d.forecast)} rx="3" className={on ? 'fill-primary' : 'fill-primary/40'} />
              <line x1={x - 3} x2={x + bar + 3} y1={y(d.lastYear)} y2={y(d.lastYear)} className="stroke-foreground" strokeWidth="2" />
              <text x={x + bar / 2} y={h - 10} textAnchor="middle" className={on ? 'fill-foreground' : 'fill-muted-foreground'} fontSize="10" fontWeight={on ? 600 : 400}>{d.label}</text>
            </g>
          )
        })}
        {highlight !== undefined && callout && (
          <g>
            <rect x={Math.min(pad.l + slot * highlight - 60, w - pad.r - 168)} y="2" width="168" height="22" rx="6" className="fill-background-inverse" />
            <text x={Math.min(pad.l + slot * highlight - 60, w - pad.r - 168) + 84} y="17" textAnchor="middle" className="fill-foreground-inverse" fontSize="11" fontWeight="600">{callout}</text>
          </g>
        )}
      </svg>
      <figcaption className="type-text-xs-normal mt-1 flex items-center gap-4 text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-xs bg-primary/60" />Forecast occupancy</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 bg-foreground" />Same day last year</span>
      </figcaption>
      <table className="sr-only">
        <caption>Forecast and last year’s occupancy by day</caption>
        <thead><tr><th>Day</th><th>Forecast</th><th>Last year</th></tr></thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.label}><td>{d.label}</td><td>{d.forecast}%</td><td>{d.lastYear}%</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
