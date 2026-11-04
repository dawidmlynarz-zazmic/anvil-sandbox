import { HOTELS, fromPrice, type Hotel, type Room } from '~/mocks/hotels'
import type { Filters, Trip } from '~/state/types'
import { nightsBetween } from './format'

export const nightsOf = (trip: Trip) => (trip.checkIn && trip.checkOut ? nightsBetween(trip.checkIn, trip.checkOut) : (trip.nights ?? 0))

export const tripReady = (trip: Trip) => !!(trip.destination && trip.checkIn && trip.checkOut && trip.adults)

/** Total for the stay, in USD. */
export const roomTotal = (room: Room, trip: Trip) => room.night * Math.max(1, nightsOf(trip))

/** Rooms that sleep the party. */
export const roomsFor = (hotel: Hotel, trip: Trip) => hotel.rooms.filter((r) => r.sleeps >= (trip.adults ?? 1))

/** The cheapest room that fits the party and the budget, if any. */
export function bestFit(hotel: Hotel, trip: Trip): Room | undefined {
  return roomsFor(hotel, trip)
    .filter((r) => !trip.budget || roomTotal(r, trip) <= trip.budget)
    .sort((a, b) => a.night - b.night)[0]
}

export function visibleHotels(trip: Trip, filters: Filters, saved: string[] = []): Hotel[] {
  if (!trip.destination) return []
  const list = HOTELS.filter(
    (h) =>
      h.destination === trip.destination &&
      roomsFor(h, trip).length > 0 &&
      filters.amenities.every((a) => h.amenities.includes(a)) &&
      (!filters.maxNight || fromPrice(h) <= filters.maxNight) &&
      (!filters.savedOnly || saved.includes(h.id)),
  )
  if (filters.sort === 'price') return [...list].sort((a, b) => fromPrice(a) - fromPrice(b))
  if (filters.sort === 'rating') return [...list].sort((a, b) => b.rating - a.rating)
  return list
}
