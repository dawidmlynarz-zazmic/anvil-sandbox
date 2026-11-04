import { useState } from 'react'
import { MapView } from '@anvil/components/agent/map-view'
import { ComparisonTable } from '@anvil/components/agent/comparison-table'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@anvil/components/ui/dialog'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@anvil/components/ui/dropdown-menu'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { BedDoubleIcon, ChevronDownIcon, HeartIcon, Icon } from '@anvil/components/ui/icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@anvil/components/ui/select'
import { StayCard } from '~/components/local/StayCard/StayCard'
import { dateRange, plural, usd } from '~/lib/format'
import { bestFit, nightsOf, roomTotal, roomsFor, tripReady, visibleHotels } from '~/lib/search'
import { destinationById, hotelById, hotelCover, scoreOf, type Amenity, type Hotel } from '~/mocks/hotels'
import { useStore } from '~/state/store'
import type { Filters, Trip } from '~/state/types'
import { PageHeading } from './PageHeading'

const SORT_LABEL: Record<Filters['sort'], string> = { recommended: 'Recommended', price: 'Lowest price', rating: 'Best rated' }
const AMENITIES: Amenity[] = ['Pool', 'Spa', 'Breakfast', 'Sea view', 'Wi-Fi', 'Restaurant', 'Parking', 'Beach access']
const PRICE_STEPS = [150, 250, 400]

/** The cheapest room that fits the group, and what it costs. */
function cheapestFor(h: Hotel, trip: Trip) {
  const room = [...roomsFor(h, trip)].sort((a, b) => a.night - b.night)[0]
  return room ? { room, night: room.night, total: roomTotal(room, trip) } : undefined
}

function perksOf(h: Hotel) {
  return [h.rooms.some((r) => r.freeCancelDays > 0) ? 'Free cancellation' : null, h.amenities.includes('Breakfast') ? 'Breakfast included' : null].filter(Boolean) as string[]
}

function CompareDialog() {
  const { session, setComparing, send } = useStore()
  const { trip } = session
  const picks = session.compare.map((id) => hotelById(id)).filter((h): h is Hotel => !!h)
  const open = session.comparing && picks.length >= 2
  const prices = picks.map((h) => cheapestFor(h, trip)?.night ?? Infinity)
  const scores = picks.map((h) => scoreOf(h))
  const bestPrice = prices.indexOf(Math.min(...prices))
  const bestScore = scores.indexOf(Math.max(...scores))
  const yes = (v: boolean) => (v ? 'Yes' : 'No')
  return (
    <Dialog open={open} onOpenChange={setComparing}>
      <DialogContent size="lg" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Compare stays</DialogTitle></DialogHeader>
        <DialogBody>
          <ComparisonTable
            caption="Comparison of the chosen stays"
            options={picks.map((h) => ({ id: h.id, name: h.name, media: <img src={hotelCover(h)} alt="" className="size-full object-cover" /> }))}
            rows={[
              { id: 'night', label: 'Per night', values: prices.map((n) => usd(n)), best: bestPrice },
              { id: 'total', label: 'Total', values: picks.map((h) => usd(cheapestFor(h, trip)?.total ?? 0)), best: bestPrice },
              { id: 'score', label: 'Guest score', values: scores.map((x) => x.toFixed(1)), best: bestScore },
              { id: 'stars', label: 'Hotel class', values: picks.map((h) => `${h.stars} stars`) },
              { id: 'cancel', label: 'Free cancellation', values: picks.map((h) => yes(h.rooms.some((r) => r.freeCancelDays > 0))) },
              { id: 'pool', label: 'Pool', values: picks.map((h) => yes(h.amenities.includes('Pool'))) },
              { id: 'breakfast', label: 'Breakfast', values: picks.map((h) => yes(h.amenities.includes('Breakfast'))) },
            ]}
            chooseLabel="View rooms"
            recommended={picks[bestPrice]?.id}
            onChoose={(id) => {
              setComparing(false)
              void send(`Open ${hotelById(id)!.name}`, { silent: true })
            }}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" intent="neutral" onClick={() => setComparing(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function HotelsPage() {
  const { session, send, setFilters, toggleSaved, toggleCompare, setComparing } = useStore()
  const { trip, filters } = session
  const [pin, setPin] = useState<string>()
  const crumbs = [{ label: 'Home', to: '/' }, { label: 'Hotels' }]

  if (!tripReady(trip)) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeading crumbs={crumbs} title="Hotels" />
        <EmptyState>
          <EmptyStateHeader>
            <EmptyStateMedia><Icon icon={BedDoubleIcon} /></EmptyStateMedia>
            <EmptyStateTitle>No stays to show yet</EmptyStateTitle>
            <EmptyStateDescription>Tell the assistant where, when and how many of you. Try “Hotels in Cinque Terre, May 12 to 17 for two”.</EmptyStateDescription>
          </EmptyStateHeader>
        </EmptyState>
      </div>
    )
  }

  const hotels = visibleHotels(trip, filters, session.saved)
  const dest = destinationById(trip.destination!)
  const nights = nightsOf(trip)
  const active = filters.amenities.length > 0 || !!filters.maxNight || !!filters.savedOnly
  const openHotel = (h: Hotel) => void send(`Open ${h.name}`, { silent: true })
  const selected = hotels.find((h) => h.id === pin)
  const selectedCost = selected && cheapestFor(selected, trip)

  return (
    <div className="flex flex-col gap-4">
      <PageHeading
        crumbs={crumbs}
        title={`Stays in ${dest.name}`}
        subtitle={`${dateRange(trip.checkIn!, trip.checkOut!)} · ${plural(nights, 'night')} · 1 room · ${plural(trip.adults!, 'adult')}${trip.budget ? ` · ${usd(trip.budget)} budget` : ''}`}
      />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        <Select value={filters.sort} onValueChange={(sort) => setFilters({ ...filters, sort: sort as Filters['sort'] })}>
          <SelectTrigger size="sm" aria-label="Sort stays" className="w-auto min-w-36">
            <SelectValue>{SORT_LABEL[filters.sort]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.maxNight ? String(filters.maxNight) : 'any'} onValueChange={(v) => setFilters({ ...filters, maxNight: v === 'any' ? undefined : Number(v) })}>
          <SelectTrigger size="sm" aria-label="Price per night" className="w-auto min-w-36">
            <SelectValue>{filters.maxNight ? `Under ${usd(filters.maxNight)} a night` : 'Price'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any price</SelectItem>
            {PRICE_STEPS.map((p) => <SelectItem key={p} value={String(p)}>Under {usd(p)} a night</SelectItem>)}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" intent="neutral" size="sm">
              Amenities{filters.amenities.length ? ` · ${filters.amenities.length}` : ''}
              <Icon icon={ChevronDownIcon} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {AMENITIES.map((a) => (
              <DropdownMenuCheckboxItem
                key={a}
                checked={filters.amenities.includes(a)}
                onCheckedChange={(on) => setFilters({ ...filters, amenities: on ? [...filters.amenities, a] : filters.amenities.filter((x) => x !== a) })}
              >
                {a}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" intent="neutral" size="sm" aria-pressed={!!filters.savedOnly} className={filters.savedOnly ? 'bg-accent' : undefined} onClick={() => setFilters({ ...filters, savedOnly: !filters.savedOnly })}>
          <Icon icon={HeartIcon} />
          Saved{session.saved.length ? ` · ${session.saved.length}` : ''}
        </Button>
        {active && <Button variant="ghost" intent="neutral" size="sm" onClick={() => setFilters({ sort: filters.sort, amenities: [] })}>Clear filters</Button>}
        <span className="ms-auto type-text-sm-normal text-muted-foreground" aria-live="polite">{plural(hotels.length, 'stay')}</span>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {hotels.length === 0 ? (
          <EmptyState>
            <EmptyStateHeader>
              <EmptyStateMedia><Icon icon={BedDoubleIcon} /></EmptyStateMedia>
              <EmptyStateTitle>No stay matches</EmptyStateTitle>
              <EmptyStateDescription>{active ? 'Try removing a filter.' : 'Nothing is available for these dates.'}</EmptyStateDescription>
            </EmptyStateHeader>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {hotels.map((h) => {
              const cost = cheapestFor(h, trip)
              if (!cost) return null
              const fit = trip.budget ? (bestFit(h, trip) ? 'within' : 'over') : undefined
              return (
                <li key={h.id}>
                  <StayCard
                    hotel={h}
                    score={scoreOf(h)}
                    media={<img src={hotelCover(h)} alt="" className="size-full object-cover" />}
                    night={cost.night}
                    total={cost.total}
                    perks={perksOf(h)}
                    fit={fit}
                    saved={session.saved.includes(h.id)}
                    compared={session.compare.includes(h.id)}
                    active={pin === h.id}
                    onSave={() => toggleSaved(h.id)}
                    onCompare={() => toggleCompare(h.id)}
                    onOpen={() => openHotel(h)}
                  />
                </li>
              )
            })}
          </ul>
        )}
        <div className="hidden h-[34rem] xl:sticky xl:top-0 xl:block">
          <MapView
            className="h-full"
            pins={hotels.map((h) => ({ id: h.id, x: h.map.x, y: h.map.y, label: usd(cheapestFor(h, trip)?.night ?? 0) }))}
            selected={pin}
            onSelectPin={setPin}
            preview={
              selected && selectedCost
                ? { media: <img src={hotelCover(selected)} alt="" className="size-full object-cover" />, title: selected.name, meta: `${selected.area} · ${scoreOf(selected).toFixed(1)}`, price: `${usd(selectedCost.night)} a night`, actionLabel: 'View rooms', onAction: () => openHotel(selected) }
                : undefined
            }
          />
        </div>
      </div>

      {session.compare.length >= 2 && !session.comparing && (
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3 shadow-elevation-modal" role="region" aria-label="Compare">
          <span className="type-text-sm-medium">{plural(session.compare.length, 'stay')} picked to compare</span>
          <span className="flex gap-2">
            <Badge variant="outline">Up to 3</Badge>
            <Button size="sm" onClick={() => setComparing(true)}>Compare</Button>
          </span>
        </div>
      )}
      <CompareDialog />
      <p className="type-text-xs-normal text-muted-foreground">Prices are totals for your dates, before taxes and fees. Sample stays for a demo.</p>
    </div>
  )
}
