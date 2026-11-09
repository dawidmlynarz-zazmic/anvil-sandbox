import { photo, type ScenicKind } from '~/lib/scenic'

// Fictional stays on purpose: no real hotels, no real review counts. Everything here is stable, so a reload never
// changes a rating or a price.

export type DestinationId = 'amalfi' | 'cinque-terre'
export type Amenity = 'Pool' | 'Spa' | 'Breakfast' | 'Sea view' | 'Wi-Fi' | 'Restaurant' | 'Parking' | 'Beach access'

export interface Destination {
  id: DestinationId
  name: string
  region: string
  blurb: string
  hue: number
}

export interface Room {
  id: string
  name: string
  sleeps: number
  sizeM2: number
  /** Rooms left for the chosen dates. */
  left: number
  features: string[]
  /** USD per night. */
  night: number
  /** Days before check-in that cancelling is free; 0 means non-refundable. */
  freeCancelDays: number
}

export interface Hotel {
  id: string
  destination: DestinationId
  name: string
  area: string
  /** Out of 5. */
  rating: number
  reviews: number
  summary: string
  about: string
  amenities: Amenity[]
  rooms: Room[]
  hue: number
  seed: number
  /** Hotel class, 1 to 5. */
  stars: number
  /** One line on why guests like it ("Guests loved…"). */
  why: string
  /** Where it sits on the schematic map, as a percentage of the frame. */
  map: { x: number; y: number }
}

/** Out of 10, as on the results cards. */
export const scoreOf = (h: Hotel) => Math.round(h.rating * 20) / 10
export const scoreLabel = (score: number) => (score >= 9 ? 'Superb' : score >= 8.5 ? 'Excellent' : score >= 8 ? 'Very good' : 'Good')

export const DESTINATIONS: Destination[] = [
  { id: 'amalfi', name: 'Amalfi Coast', region: 'Campania, Italy', blurb: 'Cliffside towns, lemon terraces and long lunches by the sea.', hue: 24 },
  { id: 'cinque-terre', name: 'Cinque Terre', region: 'Liguria, Italy', blurb: 'Five pastel villages linked by sea paths and slow trains.', hue: 8 },
]

export const destinationById = (id: DestinationId) => DESTINATIONS.find((d) => d.id === id)!

const room = (id: string, name: string, sleeps: number, sizeM2: number, left: number, night: number, freeCancelDays: number, features: string[]): Room => ({
  id, name, sleeps, sizeM2, left, night, freeCancelDays, features,
})

export const HOTELS: Hotel[] = [
  {
    id: 'marea-alta', destination: 'amalfi', name: 'Marea Alta Resort', area: 'Positano', rating: 4.8, reviews: 1243, hue: 24, seed: 3, stars: 5, why: 'Guests loved the cliff-edge pool and the sea views.', map: { x: 28, y: 62 },
    summary: 'Terraced rooms above the beach, with a cliff-edge pool and a spa.',
    about: 'Whitewashed terraces step down to the water. Breakfast is served on the lemon-tree deck, and the spa uses local citrus oils. A short, steep walk from the beach, with a shuttle for the return.',
    amenities: ['Pool', 'Spa', 'Breakfast', 'Sea view', 'Wi-Fi', 'Restaurant', 'Beach access'],
    rooms: [
      room('deluxe', 'Deluxe Garden View', 2, 32, 8, 320, 7, ['King bed', 'Garden terrace', 'Rain shower']),
      room('executive', 'Executive Suite', 3, 42, 3, 480, 7, ['Sea view', 'Lounge area', 'Bath tub']),
      room('presidential', 'Presidential Suite', 4, 78, 1, 850, 14, ['Private terrace', 'Two bedrooms', 'Butler service']),
    ],
  },
  {
    id: 'terrazza-limoni', destination: 'amalfi', name: 'Terrazza dei Limoni', area: 'Ravello', rating: 4.7, reviews: 862, hue: 44, seed: 7, stars: 4, why: 'Guests loved the quiet setting and the garden restaurant.', map: { x: 62, y: 36 },
    summary: 'A quiet hillside house with a restaurant on the terrace.',
    about: 'High above the coast in Ravello, with long views and cooler evenings. The restaurant cooks from the hotel’s own garden. Free parking on site.',
    amenities: ['Sea view', 'Breakfast', 'Restaurant', 'Wi-Fi', 'Parking'],
    rooms: [
      room('terrace', 'Terrace Double', 2, 28, 5, 245, 5, ['Queen bed', 'Terrace']),
      room('junior', 'Junior Suite', 3, 38, 2, 360, 5, ['Sea view', 'Sitting area']),
    ],
  },
  {
    id: 'casa-scalinata', destination: 'amalfi', name: 'Casa Scalinata', area: 'Amalfi town', rating: 4.5, reviews: 531, hue: 18, seed: 11, stars: 3, why: 'Guests loved the central location and friendly hosts.', map: { x: 56, y: 66 },
    summary: 'A small, friendly house steps from the harbour and the cathedral.',
    about: 'Twelve rooms in an old townhouse, a two-minute walk from the harbour. Simple, clean and central, with a breakfast room that opens onto the lane.',
    amenities: ['Breakfast', 'Wi-Fi', 'Beach access'],
    rooms: [
      room('classic', 'Classic Double', 2, 22, 6, 175, 3, ['Double bed', 'Courtyard view']),
      room('superior', 'Superior Sea View', 2, 26, 1, 230, 3, ['Queen bed', 'Sea view']),
    ],
  },
  {
    id: 'villa-cielo', destination: 'amalfi', name: 'Villa Cielo', area: 'Praiano', rating: 4.9, reviews: 407, hue: 340, seed: 19, stars: 5, why: 'Guests loved the private plunge pools and the service.', map: { x: 38, y: 74 },
    summary: 'Ten suites on the cliff, each with its own plunge pool.',
    about: 'A private villa turned boutique hotel. Every suite has a plunge pool and a sea view. Dinner is a set menu, served late.',
    amenities: ['Pool', 'Spa', 'Sea view', 'Restaurant', 'Parking', 'Wi-Fi'],
    rooms: [
      room('cliff', 'Cliff Room', 2, 36, 4, 560, 14, ['Sea view', 'Plunge pool']),
      room('pool-suite', 'Pool Suite', 3, 52, 2, 780, 14, ['Private pool', 'Outdoor shower']),
    ],
  },
  {
    id: 'punta-corniglia', destination: 'cinque-terre', name: 'Punta Corniglia Inn', area: 'Corniglia', rating: 4.6, reviews: 389, hue: 8, seed: 23, stars: 3, why: 'Guests loved the vineyard views and the breakfast.', map: { x: 30, y: 52 },
    summary: 'Simple rooms above the vineyards, on the village’s only hilltop.',
    about: 'A family-run inn among the terraced vines. Breakfast uses local honey and focaccia. The path to the other villages starts at the door.',
    amenities: ['Breakfast', 'Wi-Fi', 'Sea view'],
    rooms: [
      room('vineyard', 'Vineyard Double', 2, 24, 4, 190, 5, ['Double bed', 'Vineyard view']),
      room('family', 'Family Room', 4, 34, 2, 280, 5, ['Two beds', 'Terrace']),
    ],
  },
  {
    id: 'albergo-vigna', destination: 'cinque-terre', name: 'Albergo della Vigna', area: 'Monterosso', rating: 4.7, reviews: 674, hue: 52, seed: 29, stars: 4, why: 'Guests loved being steps from the beach.', map: { x: 70, y: 44 },
    summary: 'Beach-side rooms, a small pool and a restaurant with a sea-path view.',
    about: 'The only village with a proper beach. The hotel sits behind it, with a small pool, a garden and a restaurant open for dinner.',
    amenities: ['Pool', 'Beach access', 'Restaurant', 'Breakfast', 'Wi-Fi'],
    rooms: [
      room('garden', 'Garden Double', 2, 27, 7, 265, 7, ['Queen bed', 'Garden']),
      room('sea', 'Sea Suite', 3, 40, 3, 410, 7, ['Sea view', 'Balcony']),
    ],
  },
  {
    id: 'casa-pescatori', destination: 'cinque-terre', name: 'Casa dei Pescatori', area: 'Manarola', rating: 4.8, reviews: 298, hue: 200, seed: 31, stars: 4, why: 'Guests loved the harbour views from every window.', map: { x: 50, y: 66 },
    summary: 'Six rooms over the old fishing harbour, with sea views from every window.',
    about: 'A restored fishermen’s house over the harbour. Rooms are small and bright, and the terrace is the best seat at sunset.',
    amenities: ['Sea view', 'Breakfast', 'Wi-Fi'],
    rooms: [
      room('harbour', 'Harbour Room', 2, 21, 3, 310, 7, ['Sea view', 'Double bed']),
      room('loft', 'Loft Suite', 3, 33, 1, 450, 7, ['Sea view', 'Loft bed', 'Terrace']),
    ],
  },
]

export const hotelById = (id?: string) => HOTELS.find((h) => h.id === id)
export const hotelsIn = (d: DestinationId) => HOTELS.filter((h) => h.destination === d)
export const fromPrice = (h: Hotel) => Math.min(...h.rooms.map((r) => r.night))

const KINDS: ScenicKind[] = ['coast', 'terrace', 'room', 'pool', 'village']
const KIND_LABEL: Record<ScenicKind, string> = {
  coast: 'The coastline',
  terrace: 'The terrace',
  room: 'A guest room',
  pool: 'The pool',
  village: 'The village',
}

/** The hero image for a stay. */
export const hotelCover = (h: Hotel) => photo('coast', h.seed, h.hue)

/** A stay's photo set. */
export const hotelPhotos = (h: Hotel) =>
  KINDS.map((k, i) => ({ src: photo(k, h.seed + i, h.hue), alt: `${KIND_LABEL[k]} at ${h.name}` }))

/** The area's photo set. */
export const destinationPhotos = (d: Destination) =>
  (['coast', 'village', 'terrace', 'coast', 'village', 'pool'] as ScenicKind[]).map((k, i) => ({
    src: photo(k, d.hue + i * 5, d.hue),
    alt: `${d.name}: ${i % 2 ? 'a village on the hillside' : 'the coastline'}, view ${i + 1}`,
  }))

export const destinationCover = (d: Destination) => photo('coast', d.hue, d.hue)
