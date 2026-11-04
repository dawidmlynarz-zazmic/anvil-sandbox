import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RecId } from '~/data/forecast'
import { inventory, type SuiteId } from '~/data/inventory'
import { stay } from '~/data/family'

const KEY = 'gwl-journey:session'

export interface Trip {
  season: 'spring' | 'summer'
  suite: SuiteId
  nights: 2 | 3
  dining: boolean
  booked: boolean
}

export type TicketStatus = 'none' | 'requested' | 'resolved'

/** Everything the guest and staff screens share. A refund on the staff side changes the guest's ticket. */
export interface Session {
  trip: Trip
  ticket: TicketStatus
  /** Cabana the guest asked about on the phone. */
  cabanaConfirmed: boolean
  sensory: boolean
  partyMoved: boolean
  feedback?: { rating: number; text: string }
  offerAccepted: boolean
  decisions: Partial<Record<RecId, 'accepted' | 'dismissed'>>
}

export const seed = (): Session => ({
  trip: { season: 'spring', suite: 'wolf-den', nights: 2, dining: false, booked: false },
  ticket: 'none',
  cabanaConfirmed: false,
  sensory: false,
  partyMoved: false,
  offerAccepted: false,
  decisions: {},
})

function load(): Session {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return { ...seed(), ...(JSON.parse(raw) as Session) }
  } catch {
    // No storage, or something else in it: start from the seed.
  }
  return seed()
}

interface Api {
  session: Session
  patch: (p: Partial<Session>) => void
  editTrip: (p: Partial<Trip>) => void
  reset: () => void
}

const Ctx = createContext<Api | null>(null)

/** Demo state lives in sessionStorage behind this one store: a reload keeps the demo where it was. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(load)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(session))
    } catch {
      // Without storage the demo still runs; it won't survive a reload.
    }
  }, [session])

  const patch = useCallback((p: Partial<Session>) => setSession((s) => ({ ...s, ...p })), [])
  const editTrip = useCallback((p: Partial<Trip>) => setSession((s) => ({ ...s, trip: { ...s.trip, ...p } })), [])
  const reset = useCallback(() => {
    setSession(seed())
    navigate('/discover')
  }, [navigate])

  const api = useMemo(() => ({ session, patch, editTrip, reset }), [session, patch, editTrip, reset])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside StoreProvider')
  return v
}

export interface QuoteLine {
  id: string
  label: string
  detail?: string
  amount: number
}

/** The itemized trip. The homepage cards, the booking agent and the app all read this one list. */
export function quoteOf(trip: Trip): { lines: QuoteLine[]; total: number } {
  const suite = inventory.suites[trip.suite]
  const dates = trip.season === 'summer' ? stay.summer : trip.nights === 3 ? stay.springLong : stay.spring
  const lines: QuoteLine[] = [
    { id: 'suite', label: suite.name, detail: `${trip.nights} nights, ${dates.short}`, amount: suite.nightly * trip.nights },
  ]
  if (trip.season === 'spring') lines.push({ id: 'party', label: inventory.party.name, detail: 'Saturday, Mar 13', amount: inventory.party.price })
  lines.push({ id: 'cabana', label: 'Cabana', detail: trip.season === 'summer' ? 'Saturday, 1–3 pm' : inventory.cabana.slot, amount: inventory.cabana.price })
  if (trip.dining) lines.push({ id: 'dining', label: inventory.dining.name, amount: inventory.dining.price })
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) }
}

export function datesOf(trip: Trip) {
  return trip.season === 'summer' ? stay.summer : trip.nights === 3 ? stay.springLong : stay.spring
}
