import type { ReactNode } from 'react'
import { cn } from '@anvil/lib/utils'
import { Button } from '@anvil/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, PencilIcon } from '@anvil/components/ui/icon'
import { Progress } from '@anvil/components/ui/progress'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { dateRange, plural, usd } from '~/lib/format'
import { destinationById } from '~/mocks/hotels'
import type { Trip } from '~/state/types'

// ANVIL-CANDIDATE: the agent's working notes for the task, visible and editable. Closest Anvil option checked:
// Memory Manager (long-lived memories, with search and delete) and Task Brief (a brief the user writes). Neither
// shows live fields the agent fills in from the conversation. See docs/anvil-upgrade-candidates.md.

const Unset = () => <span className="font-normal text-muted-foreground">Not set yet</span>

export function TripContextCard({
  trip,
  nights,
  spend,
  onEdit,
  className,
  footer,
}: {
  trip: Trip
  nights: number
  /** A chosen stay's total, shown against the budget. */
  spend?: number
  onEdit: () => void
  className?: string
  footer?: ReactNode
}) {
  const share = trip.budget && spend ? Math.round((spend / trip.budget) * 100) : undefined
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Your trip</CardTitle>
        <CardDescription>What I’ve noted from our conversation. Change anything here.</CardDescription>
        <CardAction>
          <Button variant="outline" intent="neutral" size="sm" onClick={onEdit}>
            <Icon icon={PencilIcon} />
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <KeyValueList>
          <KeyValueRow label="Where">{trip.destination ? destinationById(trip.destination).name : <Unset />}</KeyValueRow>
          <KeyValueRow label="Dates">{trip.checkIn && trip.checkOut ? dateRange(trip.checkIn, trip.checkOut) : <Unset />}</KeyValueRow>
          <KeyValueRow label="Length">{nights ? plural(nights, 'night') : <Unset />}</KeyValueRow>
          <KeyValueRow label="Travelers">{trip.adults ? plural(trip.adults, 'adult') : <Unset />}</KeyValueRow>
          <KeyValueRow label="Budget">{trip.budget ? usd(trip.budget) : <Unset />}</KeyValueRow>
        </KeyValueList>
        {share !== undefined && spend !== undefined && trip.budget ? (
          <div className="flex flex-col gap-1.5">
            <Progress value={Math.min(100, share)} tone={share > 100 ? 'destructive' : 'success'} aria-label="Share of budget" />
            <p className="type-text-xs-normal text-muted-foreground">
              {share > 100 ? `${usd(spend - trip.budget)} over budget` : `${usd(spend)} of ${usd(trip.budget)} (${share}%)`}
            </p>
          </div>
        ) : null}
      </CardContent>
      {footer ? <CardFooter className="type-text-xs-normal text-muted-foreground">{footer}</CardFooter> : null}
    </Card>
  )
}
