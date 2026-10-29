import { Navigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { CircleCheckIcon } from '@anvil/components/ui/icon'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { dateRange, plural, usd } from '~/lib/format'
import { hotelById } from '~/mocks/hotels'
import { useStore } from '~/state/store'
import { PageHeading } from '../hotels/PageHeading'

export function ConfirmedPage() {
  const { session } = useStore()
  const b = session.booking
  const hotel = hotelById(b?.hotelId)
  const room = hotel?.rooms.find((r) => r.id === b?.roomId)
  if (!b || !hotel || !room) return <Navigate to="/" replace />
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeading crumbs={[{ label: 'Home', to: '/' }, { label: 'Confirmation' }]} title="You’re booked" />
      <Alert tone="success">
        <CircleCheckIcon />
        <AlertTitle>Confirmation {b.id}</AlertTitle>
        <AlertDescription>This is a demo: nothing was charged, and no email was sent.</AlertDescription>
      </Alert>
      <Card>
        <CardHeader><CardTitle>{hotel.name}, {hotel.area}</CardTitle></CardHeader>
        <CardContent>
          <KeyValueList>
            <KeyValueRow label="Room">{room.name}</KeyValueRow>
            <KeyValueRow label="Dates">{dateRange(b.checkIn, b.checkOut)}</KeyValueRow>
            <KeyValueRow label="Guests">{plural(b.adults, 'adult')}</KeyValueRow>
            <KeyValueRow label="Booked for">{b.guest.first} {b.guest.last}</KeyValueRow>
            <KeyValueRow label="Total" emphasis="strong">{usd(b.total)}</KeyValueRow>
          </KeyValueList>
        </CardContent>
      </Card>
    </div>
  )
}
