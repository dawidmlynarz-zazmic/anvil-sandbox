import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Alert, AlertDescription } from '@anvil/components/ui/alert'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@anvil/components/ui/dialog'
import { InfoIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { longDate, plural, usd } from '~/lib/format'
import { nightsOf, roomTotal, tripReady } from '~/lib/search'
import { hotelById } from '~/mocks/hotels'
import { useStore } from '~/state/store'
import type { Guest } from '~/state/types'

const FIELDS: { key: keyof Guest; label: string; type?: string; auto: string }[] = [
  { key: 'first', label: 'First name', auto: 'given-name' },
  { key: 'last', label: 'Last name', auto: 'family-name' },
  { key: 'email', label: 'Email', type: 'email', auto: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel', auto: 'tel' },
]

/** A route of its own (/hotels/:id/book/:room), so Back closes it and a link opens it. */
export function BookingDialog() {
  const { hotelId, roomId } = useParams()
  const { session, setDraft, send } = useStore()
  const [tried, setTried] = useState(false)
  const hotel = hotelById(hotelId)
  const room = hotel?.rooms.find((r) => r.id === roomId)
  const { trip, draft } = session
  if (!hotel || !room || !tripReady(trip)) return <Navigate to="/hotels" replace />
  const total = roomTotal(room, trip)
  const invalid = (k: keyof Guest) => tried && !(draft[k] ?? '').trim()

  // Not modal: the chat beside it stays usable, so the guest can type their details to the assistant.
  return (
    <Dialog modal={false} open onOpenChange={(open) => !open && void send('Cancel the booking', { silent: true })}>
      <DialogContent data-booking className="md:left-[calc(50%+190px)]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Complete your booking</DialogTitle>
          <DialogDescription>{room.name} at {hotel.name}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="booking-form"
            className="flex flex-col gap-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              setTried(true)
              void send('Confirm the booking', { silent: true })
            }}
          >
            <KeyValueList>
              <KeyValueRow label="Check-in">{longDate(trip.checkIn!)}</KeyValueRow>
              <KeyValueRow label="Check-out">{longDate(trip.checkOut!)}</KeyValueRow>
              <KeyValueRow label="Guests">{plural(trip.adults!, 'adult')}</KeyValueRow>
              <KeyValueRow label="Nights">{nightsOf(trip)}</KeyValueRow>
              <KeyValueRow label="Total" emphasis="strong">{usd(total)}</KeyValueRow>
            </KeyValueList>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <Input
                  key={f.key}
                  id={`guest-${f.key}`}
                  label={f.label}
                  type={f.type}
                  autoComplete={f.auto}
                  required
                  value={draft[f.key] ?? ''}
                  aria-invalid={invalid(f.key) || undefined}
                  hint={invalid(f.key) ? `Enter your ${f.label.toLowerCase()}.` : undefined}
                  onChange={(e) => setDraft({ [f.key]: e.target.value })}
                />
              ))}
            </div>
            <Alert tone="info" size="sm">
              <InfoIcon />
              <AlertDescription>Payment is not part of this preview. Nothing is charged, and no card details are collected.</AlertDescription>
            </Alert>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" intent="neutral" onClick={() => void send('Cancel the booking', { silent: true })}>Cancel</Button>
          <Button type="submit" form="booking-form">Confirm booking · {usd(total)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
