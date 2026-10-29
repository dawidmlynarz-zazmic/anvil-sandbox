import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { HeartIcon, Icon, MicIcon } from '@anvil/components/ui/icon'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@anvil/components/ui/sheet'
import { Logo } from '~/components/local/Logo/Logo'
import { TripContextCard } from '~/components/local/TripContextCard/TripContextCard'
import { TripPill } from '~/components/local/TripPill/TripPill'
import { TravelChat } from '~/features/chat/TravelChat'
import { TripEditDialog } from '~/features/trip/TripEditDialog'
import { dateRange, plural } from '~/lib/format'
import { nightsOf, roomTotal } from '~/lib/search'
import { destinationById, hotelById } from '~/mocks/hotels'
import { StoreProvider, useStore } from '~/state/store'

function Shell() {
  const { session, view, setView, send, reset, setFilters } = useStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [tripOpen, setTripOpen] = useState(false)
  const { trip } = session

  // A chosen room's total shows against the budget while its booking is open.
  const m = pathname.match(/^\/hotels\/([^/]+)\/book\/([^/]+)/)
  const room = m ? hotelById(m[1])?.rooms.find((r) => r.id === m[2]) : undefined
  const spend = room ? roomTotal(room, trip) : undefined

  // The trip as one pill, like a search bar: where, when, who. It opens the full trip to read and edit.
  const segments = [
    trip.destination ? { label: destinationById(trip.destination).name } : { label: 'Where to?', unset: true },
    trip.checkIn && trip.checkOut ? { label: dateRange(trip.checkIn, trip.checkOut).replace(/, \d{4}$/, '') } : { label: 'Dates', unset: true },
    trip.adults ? { label: plural(trip.adults, 'adult') } : { label: 'Travelers', unset: true },
  ]

  // One primary action per screen. Home has Search in the page, so the header's action is quiet there.
  const action =
    pathname === '/confirmed' ? (
      <Button onClick={reset}>Plan another trip</Button>
    ) : pathname === '/live' ? null : (
      <Button variant="outline" intent="neutral" onClick={() => void send('Start Live Mode', { silent: true })}><Icon icon={MicIcon} />Live Mode</Button>
    )

  return (
    <div className="flex h-svh min-h-0 flex-col bg-background text-foreground md:flex-row">
      {/* Phones: Chat and Trip are two views. */}
      <div role="tablist" aria-label="View" className="flex shrink-0 border-b md:hidden">
        {(['chat', 'canvas'] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            className="type-text-sm-medium flex-1 border-b-2 border-transparent py-3 text-muted-foreground aria-selected:border-primary aria-selected:text-foreground"
            onClick={() => setView(v)}
          >
            {v === 'chat' ? 'Chat' : 'Trip'}
          </button>
        ))}
      </div>

      <aside aria-label="Assistant" className={`min-h-0 flex-1 border-r md:w-[380px] md:flex-none md:shrink-0 ${view === 'chat' ? 'flex' : 'hidden'} md:flex`}>
        <TravelChat />
      </aside>

      <div className={`min-h-0 min-w-0 flex-1 flex-col ${view === 'canvas' ? 'flex' : 'hidden'} md:flex`}>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
          <Link to="/" aria-label="TravelPass home" className="rounded-sm outline-none focus-visible:focus-ring"><Logo /></Link>
          <div className="flex min-w-0 flex-1 justify-center">
            <TripPill segments={segments} onClick={() => setTripOpen(true)} className="hidden sm:inline-flex" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" intent="neutral" size="sm" className="sm:hidden" onClick={() => setTripOpen(true)}>Your trip</Button>
            <Button
              variant="outline"
              intent="neutral"
              size="icon-sm"
              shape="circle"
              className="relative"
              aria-label={`Saved stays${session.saved.length ? `, ${session.saved.length}` : ''}`}
              onClick={() => {
                if (!session.saved.length) return void send('Show my saved stays', { silent: true })
                setFilters({ ...session.filters, savedOnly: true })
                navigate('/hotels')
              }}
            >
              <Icon icon={HeartIcon} className={session.saved.length ? 'fill-current text-danger' : undefined} />
              {session.saved.length > 0 && <Badge size="xs" shape="pill" tone="brand" className="absolute -top-1 -right-1">{session.saved.length}</Badge>}
            </Button>
            {action}
          </div>
        </header>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col"><Outlet /></div>
        </main>
      </div>

      <Sheet open={tripOpen} onOpenChange={setTripOpen}>
        <SheetContent side="right">
          <SheetHeader><SheetTitle>Your trip</SheetTitle></SheetHeader>
          <div className="overflow-y-auto p-4">
            <TripContextCard
              trip={trip}
              nights={nightsOf(trip)}
              spend={spend}
              onEdit={() => { setTripOpen(false); setEditing(true) }}
              footer={trip.updatedAt ? `Updated ${new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(trip.updatedAt)}` : 'The assistant fills this in as you talk.'}
            />
          </div>
        </SheetContent>
      </Sheet>
      <TripEditDialog open={editing} onOpenChange={setEditing} />
    </div>
  )
}

export function AppShell() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
