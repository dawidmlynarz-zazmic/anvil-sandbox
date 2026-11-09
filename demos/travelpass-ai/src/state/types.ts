import type { DestinationId } from '~/mocks/hotels'

export interface Trip {
  destination?: DestinationId
  checkIn?: string
  checkOut?: string
  adults?: number
  /** How long they want to stay, when the dates aren't set yet. */
  nights?: number
  /** A month with no days yet (0-11), so the date suggestions fit it. */
  month?: number
  /** Whole-trip budget in USD. */
  budget?: number
  updatedAt?: number
}

export type Amenity = import('~/mocks/hotels').Amenity

export interface Filters {
  sort: 'recommended' | 'price' | 'rating'
  amenities: Amenity[]
  maxNight?: number
  savedOnly?: boolean
}

export interface Chip {
  label: string
  /** Sent to the agent as if typed. */
  say: string
}

export type Block = { kind: 'photos'; target: { hotelId: string } | { destination: DestinationId } }

export interface Turn {
  id: string
  role: 'user' | 'agent'
  text: string
  at: number
  /** What the agent did, as short log lines ("Updated trip details"). */
  tools?: string[]
  blocks?: Block[]
  chips?: Chip[]
}

export interface Guest {
  first: string
  last: string
  email: string
  phone: string
}

export interface Booking {
  id: string
  hotelId: string
  roomId: string
  guest: Guest
  checkIn: string
  checkOut: string
  adults: number
  total: number
}

export interface Session {
  turns: Turn[]
  trip: Trip
  filters: Filters
  /** The guest details typed so far, in the booking dialog or to the agent. */
  draft: Partial<Guest>
  /** Saved stays (the heart). */
  saved: string[]
  /** Stays picked for comparing (up to three). */
  compare: string[]
  /** The comparison is open. */
  comparing: boolean
  /** Set once a booking is confirmed. */
  booking?: Booking
  live: 'off' | 'asking' | 'listening' | 'muted'
}

export interface AgentResult {
  turns: Turn[]
  patch?: Partial<Session>
  /** Where the canvas should go (a route below the app's base). */
  navigate?: string
}
