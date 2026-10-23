import { SHOWS, FEE_RATE } from '~/mocks/shows'
import type { EventSummary, FindQuery, Hold, ResaleListing, SeatOption, SeatQuery, Show, ShowDate, Tier } from './types'

// The mock of the planned AXS tool layer (an MCP server): find events, show seats and prices, hold seats, hand off to
// checkout. Every screen and the scripted agent call only this, so the mock can be swapped for the real thing.
// Prices are all-in (face value plus fees), because that is how AXS shows them.

export interface AxsTools {
  findEvents(q: FindQuery): Promise<EventSummary[]>
  getSeats(dateId: string, q: SeatQuery): Promise<SeatOption[]>
  getResale(dateId: string, qty: number): Promise<ResaleListing[]>
  holdSeats(dateId: string, optionId: string, qty: number): Promise<Hold>
  /** Where "Continue on AXS" goes: the demo's labelled checkout stub. */
  checkoutUrl(holdId: string): string
}

/** Lets tests run without waiting. */
export const latency = { ms: 450 }
const wait = (extra = 0) => new Promise<void>((r) => setTimeout(r, latency.ms + extra))

export const HOLD_SECONDS = 600

// Prices move in 50p steps, like AXS's: £68.50, not £68.47.
const roundUp = (n: number) => Math.ceil(n * 2) / 2

interface Section {
  id: string
  label: string
  tier: Tier
  row: string
  distance: 1 | 2 | 3
  stepFree: boolean
  /** Block of seats left together. */
  free: number
  /** Price shape: 1 = the tier's price. */
  mult: number
  note: string
}

// One sample bowl for every show: the seat map in Phase 3 draws these same sections.
const SECTIONS: Section[] = [
  { id: 'floor-a', label: 'Floor A', tier: 'floor', row: 'F', distance: 1, stepFree: false, free: 4, mult: 1, note: 'Standing, near the stage' },
  { id: 'lower-112', label: 'Block 112', tier: 'lower', row: 'K', distance: 1, stepFree: false, free: 6, mult: 1.08, note: 'Side view, close to the stage' },
  { id: 'lower-118', label: 'Block 118', tier: 'lower', row: 'T', distance: 2, stepFree: true, free: 8, mult: 0.96, note: 'Step-free access' },
  { id: 'upper-402', label: 'Block 402', tier: 'upper', row: 'C', distance: 3, stepFree: true, free: 10, mult: 1, note: 'Upper tier, step-free access' },
  { id: 'upper-418', label: 'Block 418', tier: 'upper', row: 'H', distance: 3, stepFree: false, free: 2, mult: 0.92, note: 'Upper tier, a good price' },
]

const show = (id: string) => SHOWS.find((s) => s.id === id)
export const getShow = (id: string) => show(id)
export const findDate = (dateId: string): { show: Show; date: ShowDate } | undefined => {
  const s = show(dateId.split(':')[0])
  const date = s?.dates.find((x) => x.id === dateId)
  return s && date ? { show: s, date } : undefined
}

function options(s: Show, date: ShowDate, source: 'primary' | 'resale'): SeatOption[] {
  const limited = date.level === 'limited' ? 0.5 : 1
  return SECTIONS.map((sec) => {
    const face = roundUp(s.prices[sec.tier] * sec.mult * (source === 'resale' ? 1.25 : 1))
    const fee = roundUp(face * FEE_RATE)
    const free = Math.max(2, Math.floor(sec.free * limited))
    const start = 5 + (s.id.length % 7) * 2
    return {
      id: `${date.id}:${source === 'resale' ? 'r-' : ''}${sec.id}`,
      dateId: date.id,
      tier: sec.tier,
      section: sec.id,
      sectionLabel: sec.label,
      row: sec.row,
      seats: Array.from({ length: free }, (_, i) => start + i),
      face,
      fee,
      total: roundUp(face + fee),
      distance: sec.distance,
      stepFree: sec.stepFree,
      tags: [],
      note: sec.note,
      source,
    }
  })
}

function cheapestFor(s: Show, date: ShowDate, qty: number, maxPrice?: number) {
  const fits = options(s, date, 'primary').filter((o) => o.seats.length >= qty && (maxPrice === undefined || o.total <= maxPrice))
  return fits.length ? Math.min(...fits.map((o) => o.total)) : undefined
}

export const axsTools: AxsTools = {
  async findEvents(q) {
    await wait()
    const qty = q.qty ?? 2
    const text = q.query?.toLowerCase().trim()
    const out: EventSummary[] = []
    for (const s of SHOWS) {
      if (q.venue && !s.venue.toLowerCase().includes(q.venue.toLowerCase())) continue
      if (q.category && s.category !== q.category && !(q.category === 'sport' && s.category === 'wrestling')) continue
      if (text && !s.keywords.some((k) => text.includes(k) || k.includes(text)) && !s.title.toLowerCase().includes(text)) continue
      const dates = s.dates
        .filter((x) => (!q.from || x.date >= q.from) && (!q.to || x.date <= q.to))
        .flatMap((x) => {
          const fromPrice = cheapestFor(s, x, qty, q.maxPrice)
          return fromPrice === undefined ? [] : [{ id: x.id, date: x.date, time: x.time, doors: x.doors, level: x.level, fromPrice }]
        })
      if (!dates.length) continue
      out.push({
        showId: s.id,
        title: s.title,
        subtitle: s.subtitle,
        venue: s.venue,
        city: s.city,
        cover: s.cover,
        coverAlt: s.coverAlt,
        dates,
        fromPrice: Math.min(...dates.map((x) => x.fromPrice)),
        rankedForYou: !!q.interests?.some((i) => s.tags.includes(i)),
      })
    }
    // Soonest first. With a consented profile, shows that match it come first, still soonest first within each group.
    return out.sort(
      (a, b) =>
        Number(b.rankedForYou) - Number(a.rankedForYou) || a.dates[0].date.localeCompare(b.dates[0].date),
    )
  },

  async getSeats(dateId, q) {
    await wait(150)
    const found = findDate(dateId)
    if (!found) return []
    let list = options(found.show, found.date, 'primary').filter(
      (o) => o.seats.length >= q.qty && (q.maxPrice === undefined || o.total <= q.maxPrice),
    )
    if (q.filter === 'floor') list = list.filter((o) => o.tier === 'floor')
    if (q.filter === 'step-free') list = list.filter((o) => o.stepFree)
    if (q.filter === 'closer') list = list.filter((o) => o.distance <= 2)
    if (q.filter === 'cheaper') list = [...list].sort((a, b) => a.total - b.total).slice(0, 2)
    if (!list.length) return []
    const cheapest = [...list].sort((a, b) => a.total - b.total)[0]
    // Best value: the cheapest seat that is not in the back tier, when there is one; otherwise the cheapest.
    const value = [...list].filter((o) => o.distance < 3).sort((a, b) => a.total - b.total)[0] ?? cheapest
    const closest = [...list].sort((a, b) => a.distance - b.distance || a.total - b.total)[0]
    return list
      .map((o) => ({
        ...o,
        // "Closest" only means something when the options differ in distance.
        tags: [
          ...(o.id === value.id ? (['best-value'] as const) : []),
          ...(o.id === closest.id && list.some((x) => x.distance > closest.distance) ? (['closest'] as const) : []),
        ],
      }))
      .sort((a, b) => b.tags.length - a.tags.length || a.total - b.total)
  },

  async getResale(dateId, qty) {
    await wait()
    const found = findDate(dateId)
    if (!found) return []
    return options(found.show, found.date, 'resale')
      .filter((o) => o.seats.length >= qty)
      .slice(0, 3)
      .map((o) => ({ ...o, verified: true as const }))
  },

  async holdSeats(dateId, optionId, qty) {
    await wait(200)
    const found = findDate(dateId)
    if (!found) throw new Error('That date is no longer on sale.')
    const option = [...options(found.show, found.date, 'primary'), ...options(found.show, found.date, 'resale')].find((o) => o.id === optionId)
    if (!option || option.seats.length < qty) throw new Error('Those seats are gone.')
    return {
      holdId: `H${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      dateId,
      optionId,
      qty,
      expiresAt: Date.now() + HOLD_SECONDS * 1000,
      total: roundUp(option.total * qty),
    }
  },

  checkoutUrl: (holdId) => `/checkout/${holdId}`,
}

/** A seat option by id, for screens that were handed only the id. */
export function optionById(optionId: string): SeatOption | undefined {
  const dateId = optionId.split(':').slice(0, 2).join(':')
  const found = findDate(dateId)
  if (!found) return undefined
  return [...options(found.show, found.date, 'primary'), ...options(found.show, found.date, 'resale')].find((o) => o.id === optionId)
}

/** The lowest all-in price per ticket for a date, whatever the ask (for screens that only know the date). */
export function fromPrice(dateId: string): number {
  const found = findDate(dateId)
  if (!found) return 0
  return Math.min(...options(found.show, found.date, 'primary').map((o) => o.total))
}
