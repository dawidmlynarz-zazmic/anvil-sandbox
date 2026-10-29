import { Navigate, Outlet, useParams } from 'react-router-dom'
import { MediaGallery } from '@anvil/components/agent/media-gallery'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, CarIcon, CoffeeIcon, MapPinIcon, SparklesIcon, UtensilsIcon, WavesIcon, WifiIcon, WaypointsIcon } from '@anvil/components/ui/icon'
import { RatingDisplay } from '@anvil/components/anvil/rating-display'
import { RoomRow } from '~/components/local/RoomRow/RoomRow'
import { addDays, longDate, plural, usd } from '~/lib/format'
import { nightsOf, roomTotal, tripReady } from '~/lib/search'
import { hotelById, hotelPhotos, type Amenity } from '~/mocks/hotels'
import { useStore } from '~/state/store'
import { TripSummaryBar } from '../trip/TripSummaryBar'
import { PageHeading } from './PageHeading'

const AMENITY_ICON: Record<Amenity, typeof WifiIcon> = {
  Pool: WavesIcon, Spa: SparklesIcon, Breakfast: CoffeeIcon, 'Sea view': MapPinIcon, 'Wi-Fi': WifiIcon, Restaurant: UtensilsIcon, Parking: CarIcon, 'Beach access': WaypointsIcon,
}

export function HotelDetailPage() {
  const { hotelId } = useParams()
  const { session, send } = useStore()
  const hotel = hotelById(hotelId)
  const { trip } = session
  if (!hotel) return <Navigate to="/hotels" replace />
  if (!tripReady(trip)) return <Navigate to="/hotels" replace />
  const nights = nightsOf(trip)
  const lowest = Math.min(...hotel.rooms.map((r) => r.night))

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Hotels', to: '/hotels' }, { label: hotel.name }]}
        title={hotel.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1"><Icon icon={MapPinIcon} size="xs" />{hotel.area}</span>
            <RatingDisplay value={hotel.rating} label={`${hotel.reviews.toLocaleString('en-US')} reviews`} />
            <span>From {usd(lowest)} a night · {usd(lowest * nights)} for {plural(nights, 'night')}</span>
          </span>
        }
      >
        <TripSummaryBar trip={trip} />
      </PageHeading>

      <MediaGallery layout="grid" title={hotel.name} items={hotelPhotos(hotel)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>About</CardTitle></CardHeader>
          <CardContent className="type-text-sm-normal text-muted-foreground">{hotel.about}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 type-text-sm-normal">
              {hotel.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2"><Icon icon={AMENITY_ICON[a]} size="xs" className="text-muted-foreground" />{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="rooms-h">
        <h2 id="rooms-h" className="type-heading-lg">Available rooms</h2>
        {hotel.rooms.map((room) => {
          const total = roomTotal(room, trip)
          const tooSmall = room.sleeps < (trip.adults ?? 1)
          return (
            <RoomRow
              key={room.id}
              room={room}
              nights={nights}
              total={total}
              tooSmall={tooSmall}
              overBudgetBy={trip.budget && total > trip.budget ? total - trip.budget : undefined}
              cancellation={room.freeCancelDays ? `Free cancellation until ${longDate(addDays(trip.checkIn!, -room.freeCancelDays))}` : 'Non-refundable'}
              action={
                <Button variant="outline" intent="neutral" disabled={tooSmall} onClick={() => void send(`Book the ${room.name} at ${hotel.name}`, { silent: true })}>
                  Book room
                </Button>
              }
            />
          )
        })}
        <Badge variant="outline" className="self-start">Prices include taxes. This demo shows sample rates.</Badge>
      </section>
      <Outlet />
    </div>
  )
}
