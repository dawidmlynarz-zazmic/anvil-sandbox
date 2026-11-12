import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { fmtDateTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Run } from '@/mocks/types'
import { RUN_META } from './StatusBadge'

const BG = { succeeded: 'bg-success', failed: 'bg-destructive-soft', waiting: 'bg-info', skipped: 'bg-muted-foreground/50' } as const

/** The most recent runs, oldest to newest. Each block has a tooltip; the legend spells out the statuses. */
export function RunStrip({ runs, limit = 20 }: { runs: Run[]; limit?: number }) {
  const list = runs.slice(0, limit).reverse()
  if (!list.length) return <p className="text-muted-foreground text-[13px]">No runs yet.</p>
  return (
    <ul className="flex gap-1" aria-label="Recent runs, oldest to newest">
      {list.map((r) => (
        <li key={r.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} role="img" aria-label={`${RUN_META[r.status].label}, ${fmtDateTime(r.startedAt)}`} className={cn('block h-5 w-2.5 rounded-sm', BG[r.status])} />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{RUN_META[r.status].label}</p>
              <p>{fmtDateTime(r.startedAt)}</p>
              <p className="opacity-80">{r.summary}</p>
            </TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  )
}
