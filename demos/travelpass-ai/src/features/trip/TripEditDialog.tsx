import { useId, useState } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@anvil/components/ui/dialog'
import { Input } from '@anvil/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@anvil/components/ui/select'
import { DEMO_TODAY, addDays } from '~/lib/format'
import { DESTINATIONS, type DestinationId } from '~/mocks/hotels'
import { useStore } from '~/state/store'

/** Edits the trip by hand. The agent hears about it, so the chat and the page stay in step. */
export function TripEditDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { session, editTrip } = useStore()
  const { trip } = session
  const [destination, setDestination] = useState<string>('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState('')
  const [budget, setBudget] = useState('')
  const formId = useId()
  const datesOk = !checkIn || !checkOut || checkOut > checkIn

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!datesOk) return
    editTrip({
      destination: (destination || undefined) as DestinationId | undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      adults: adults ? Math.min(6, Math.max(1, Number(adults))) : undefined,
      budget: budget ? Number(budget) : undefined,
      nights: undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDestination(trip.destination ?? '')
          setCheckIn(trip.checkIn ?? '')
          setCheckOut(trip.checkOut ?? '')
          setAdults(trip.adults ? String(trip.adults) : '')
          setBudget(trip.budget ? String(trip.budget) : '')
        }
        onOpenChange(next)
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit your trip</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form id={formId} className="flex flex-col gap-4" onSubmit={save}>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger label="Where" id="trip-where">
                <SelectValue placeholder="Choose a place" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATIONS.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="trip-in" type="date" label="Check-in" min={DEMO_TODAY} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              <Input
                id="trip-out"
                type="date"
                label="Check-out"
                min={checkIn ? addDays(checkIn, 1) : DEMO_TODAY}
                value={checkOut}
                aria-invalid={!datesOk || undefined}
                hint={datesOk ? undefined : 'Check-out has to be after check-in.'}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="trip-adults" type="number" inputMode="numeric" min={1} max={6} label="Adults" value={adults} onChange={(e) => setAdults(e.target.value)} />
              <Input id="trip-budget" type="number" inputMode="numeric" min={0} step={100} label="Budget in US dollars" placeholder="Optional" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" intent="neutral">Cancel</Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={!datesOk}>Save trip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
