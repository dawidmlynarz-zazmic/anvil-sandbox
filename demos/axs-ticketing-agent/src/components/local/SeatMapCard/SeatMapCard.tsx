// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#seat-map-card
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { cn } from '@anvil/lib/utils'

export interface SeatMapSection {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export interface SeatMapCardProps {
  title?: string
  /** What the highlighting means, e.g. "Highlighted: pairs under £80 each, all-in". */
  caption?: string
  sections: SeatMapSection[]
  /** Section ids that match the ask. Only these can be picked. */
  highlighted: string[]
  selected?: string
  onSelect?: (id: string) => void
  /** The stage's position label. */
  stage?: string
  /** The words for one section, for screen readers: "Block 118, from £95 each". */
  describe?: (id: string) => string
  className?: string
}

const WIDTH = 320
const HEIGHT = 232

/**
 * A seated venue as a simple plan: sections that match the ask are highlighted and pickable, the rest are quiet. The
 * options are always listed beside it (the map is never the only way in), so each section is a real button but the map
 * is a shortcut, not the form.
 */
export function SeatMapCard({
  title = 'Seat map',
  caption,
  sections,
  highlighted,
  selected,
  onSelect,
  stage = 'Stage',
  describe,
  className,
}: SeatMapCardProps) {
  return (
    <Card className={cn('w-full max-w-160 gap-3 rounded-xl py-4 shadow-sm', className)}>
      <CardHeader className="px-4">
        <CardTitle className="type-text-sm-semibold">{title}</CardTitle>
        {caption && <CardDescription>{caption}</CardDescription>}
      </CardHeader>
      <CardContent className="px-4">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label={title} className="h-auto w-full">
          <rect x={110} y={6} width={100} height={22} rx={4} className="fill-foreground" />
          <text x={160} y={21} textAnchor="middle" className="fill-background type-text-xs-medium">
            {stage}
          </text>
          {sections.map((s) => {
            const live = highlighted.includes(s.id)
            const on = selected === s.id
            const label = describe?.(s.id) ?? s.label
            const shape = (
              <>
                <rect
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  rx={6}
                  className={cn(
                    'transition-colors duration-(--duration-fast)',
                    on
                      ? 'fill-primary stroke-primary stroke-[1.5]'
                      : live
                        ? 'fill-primary/25 stroke-primary stroke-[1.5] hover:fill-primary/40'
                        : 'fill-background stroke-border stroke-1',
                  )}
                />
                <text
                  x={s.x + s.width / 2}
                  y={s.y + s.height / 2 + 4}
                  textAnchor="middle"
                  className={cn('type-text-xs-medium', on ? 'fill-primary-foreground' : live ? 'fill-foreground' : 'fill-muted-foreground')}
                >
                  {s.label}
                </text>
              </>
            )
            return live ? (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={label}
                className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-2 focus-visible:[&>rect]:stroke-ring"
                onClick={() => onSelect?.(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect?.(s.id)
                  }
                }}
              >
                {shape}
              </g>
            ) : (
              <g key={s.id} aria-hidden>
                {shape}
              </g>
            )
          })}
        </svg>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 type-text-xs-normal text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-sm border border-primary bg-primary/25" />
            Matches your ask
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-sm bg-primary" />
            Selected
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-sm border bg-background" />
            Other sections
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
