import type { ReactNode } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Icon, MaximizeIcon, UsersIcon } from '@anvil/components/ui/icon'
import { Price } from '@anvil/components/anvil/price'
import { cn } from '@anvil/lib/utils'
import { plural, usd } from '~/lib/format'
import type { Room } from '~/mocks/hotels'

// ANVIL-CANDIDATE: a bookable option row (name, facts, scarcity, price per night and total, policy, action).
// Closest Anvil option checked: Offer Card (horizontal), which is built around a poster, not a rate row; Item has no
// price column. See docs/anvil-upgrade-candidates.md.

export function RoomRow({
  room,
  nights,
  total,
  cancellation,
  overBudgetBy,
  tooSmall,
  action,
  className,
}: {
  room: Room
  nights: number
  total: number
  cancellation: ReactNode
  /** Set when the stay costs more than the budget. */
  overBudgetBy?: number
  /** The room sleeps fewer people than the group. */
  tooSmall?: boolean
  action: ReactNode
  className?: string
}) {
  const scarce = room.left <= 3
  return (
    <article className={cn('flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center', tooSmall && 'opacity-75', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="type-text-base-semibold">{room.name}</h3>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 type-text-sm-normal text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Icon icon={UsersIcon} size="xs" />Sleeps {room.sleeps}</span>
          <span className="inline-flex items-center gap-1.5"><Icon icon={MaximizeIcon} size="xs" />{room.sizeM2} m²</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {scarce && <Badge tone="warning" variant="subtle">{room.left === 1 ? 'Last room' : `${plural(room.left, 'room')} left`}</Badge>}
          {!scarce && <Badge variant="subtle">{plural(room.left, 'room')} left</Badge>}
          {tooSmall && <Badge tone="destructive" variant="subtle">Too small for your group</Badge>}
          {overBudgetBy ? <Badge tone="destructive" variant="subtle">{usd(overBudgetBy)} over budget</Badge> : null}
          {room.features.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}
        </div>
        <p className="type-text-xs-normal text-muted-foreground">{cancellation}</p>
      </div>
      <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <div className="flex flex-col sm:items-end">
          <span className="flex items-baseline gap-1"><Price current={usd(room.night)} size="default" /><span className="type-text-xs-normal text-muted-foreground">a night</span></span>
          <span className="type-text-sm-normal text-muted-foreground">{usd(total)} for {plural(nights, 'night')}</span>
        </div>
        {action}
      </div>
    </article>
  )
}
