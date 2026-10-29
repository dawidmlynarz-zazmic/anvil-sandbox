import { Badge } from '@anvil/components/ui/badge'
import { CalendarIcon, Icon, UsersIcon, WalletIcon } from '@anvil/components/ui/icon'
import { dateRange, plural, usd } from '~/lib/format'
import { nightsOf } from '~/lib/search'
import type { Trip } from '~/state/types'

/** The trip in one line above the stays. On wide screens the Trip panel says the same, so this is for narrower ones. */
export function TripSummaryBar({ trip }: { trip: Trip }) {
  if (!trip.checkIn || !trip.checkOut) return null
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-info-subtle px-3 py-2 xl:hidden" aria-label="Your trip">
      <Badge variant="outline"><Icon icon={CalendarIcon} />{dateRange(trip.checkIn, trip.checkOut)}</Badge>
      <Badge variant="outline">{plural(nightsOf(trip), 'night')}</Badge>
      {trip.adults ? <Badge variant="outline"><Icon icon={UsersIcon} />{plural(trip.adults, 'adult')}</Badge> : null}
      {trip.budget ? <Badge variant="outline"><Icon icon={WalletIcon} />{usd(trip.budget)}</Badge> : null}
    </div>
  )
}
