import { Button } from '@anvil/components/ui/button'
import { Icon, SearchIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'

// ANVIL-CANDIDATE: the search summary in the page header: where, when, who, as one pill that opens the full trip.
// Closest Anvil option checked: Button group and Toolbar (no segmented summary), Combobox (a picker, not a summary).
// See docs/anvil-upgrade-candidates.md.

export interface TripPillSegment {
  label: string
  /** Shown muted when the value isn't set yet. */
  unset?: boolean
}

export function TripPill({ segments, onClick, className }: { segments: TripPillSegment[]; onClick: () => void; className?: string }) {
  return (
    <Button variant="outline" intent="neutral" shape="pill" className={cn('h-10 max-w-full gap-0 px-1', className)} onClick={onClick} aria-label={`Your trip: ${segments.map((s) => s.label).join(', ')}. Edit`}>
      {segments.map((s, i) => (
        <span key={i} className={cn('truncate px-3 type-text-sm-medium', i > 0 && 'border-l', s.unset && 'font-normal text-muted-foreground')}>
          {s.label}
        </span>
      ))}
      <span className="mr-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Icon icon={SearchIcon} size="xs" />
      </span>
    </Button>
  )
}
