// The shapes the mock AXS tool layer returns. They mirror the planned MCP server (events, seats, resale, holds), so
// the screens are written against the real architecture and the mock can be swapped for it.

export type Availability = 'available' | 'limited' | 'unavailable'
export type Tier = 'floor' | 'lower' | 'upper'

export interface ShowDate {
  /** `<showId>:<yyyy-MM-dd>` */
  id: string
  date: string
  time: string
  doors: string
  level: Availability
}

export interface Show {
  id: string
  title: string
  subtitle?: string
  venue: string
  city: string
  category: 'music' | 'comedy' | 'sport' | 'wrestling' | 'live'
  keywords: string[]
  /** Interests a fan's consented profile can match (used only after they allow personalisation). */
  tags: string[]
  cover: string
  coverAlt: string
  dates: ShowDate[]
  /** Face value per ticket, by tier, before fees. Sample prices. */
  prices: Record<Tier, number>
}

export interface EventSummary {
  showId: string
  title: string
  subtitle?: string
  venue: string
  city: string
  cover: string
  coverAlt: string
  /** Dates that have seats for the ask (qty and budget). */
  dates: { id: string; date: string; time: string; doors: string; level: Availability; fromPrice: number }[]
  /** Lowest all-in price per ticket across the matching dates. */
  fromPrice: number
  rankedForYou: boolean
}

export interface SeatOption {
  id: string
  dateId: string
  tier: Tier
  section: string
  sectionLabel: string
  row: string
  seats: number[]
  /** Per ticket. */
  face: number
  fee: number
  total: number
  /** 1 (closest) to 3. */
  distance: 1 | 2 | 3
  stepFree: boolean
  tags: ('best-value' | 'closest')[]
  note: string
  source: 'primary' | 'resale'
}

export interface ResaleListing extends SeatOption {
  verified: true
}

export interface Hold {
  holdId: string
  dateId: string
  optionId: string
  qty: number
  /** Epoch ms. */
  expiresAt: number
  total: number
}

export interface FindQuery {
  query?: string
  venue?: string
  category?: Show['category']
  maxPrice?: number
  qty?: number
  /** Inclusive, yyyy-MM-dd. */
  from?: string
  to?: string
  /** Interests from a consented profile. Absent unless the fan allowed personalisation. */
  interests?: string[]
}

export interface SeatQuery {
  qty: number
  maxPrice?: number
  filter?: 'floor' | 'closer' | 'step-free' | 'cheaper'
}
