import { DEMO_TODAY, MONTHS, addDays, dateRange, plural, toDate, toIso, usd } from '~/lib/format'
import { bestFit, nightsOf, roomTotal, roomsFor, tripReady, visibleHotels } from '~/lib/search'
import {
  DESTINATIONS, HOTELS, destinationById, hotelById,
  type Amenity, type DestinationId, type Hotel, type Room,
} from '~/mocks/hotels'
import type { AgentResult, Chip, Guest, Session, Trip, Turn } from '~/state/types'

// The scripted agent. No model: it reads what you type (or click) and drives the screen the same way the real agent
// will drive the canvas. What it says always matches what the screen then shows, and it says so plainly when the
// preview can't do something.

let n = 0
const turn = (text: string, extra: Partial<Turn> = {}): Turn => ({
  id: `t${Date.now().toString(36)}${n++}`,
  role: 'agent',
  text,
  at: Date.now(),
  ...extra,
})

export const STARTERS = [
  { title: 'Five days in May for two, about $3,000', note: 'Start from the trip, I’ll suggest where', say: 'We want five days in May for two, about $3,000. We love food and coastal towns.' },
  { title: 'Hotels in Cinque Terre, May 12 to 17', note: 'Dates and place in one go', say: 'Hotels in Cinque Terre from May 12 to 17 for two' },
  { title: 'Show me photos of the Amalfi Coast', note: 'See the area before you choose', say: 'Show me photos of the Amalfi Coast' },
]

export const HELP_CHIPS: Chip[] = [
  { label: 'Cheapest first', say: 'Show the cheapest first' },
  { label: 'With a pool', say: 'Only hotels with a pool' },
  { label: 'Photos of the area', say: 'Show me photos of the area' },
]

export interface Ctx {
  session: Session
  /** The current route, below the app's base ("/hotels/marea-alta"). */
  path: string
}

const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
const monthIndex = (m: string) => MONTHS.findIndex((x) => x.startsWith(m.slice(0, 3)))

/** The next time month `m` (0-11) day `d` comes round from the demo's today. */
function nextDate(m: number, d: number) {
  const [ty, tm, td] = DEMO_TODAY.split('-').map(Number)
  const year = m + 1 > tm || (m + 1 === tm && d >= td) ? ty : ty + 1
  return toIso(new Date(Date.UTC(year, m, d, 12)))
}

interface Parsed {
  update: Partial<Trip>
  /** A per-night price cap ("under $250 a night"). */
  maxNight?: number
  /** A month with no days ("in May"). */
  month?: number
  found: string[]
}

export function parseTrip(text: string): Parsed {
  const t = text.toLowerCase()
  const update: Partial<Trip> = {}
  const found: string[] = []
  let maxNight: number | undefined
  let month: number | undefined

  if (/amalfi|positano|ravello|praiano/.test(t)) update.destination = 'amalfi'
  else if (/cinque|monterosso|manarola|corniglia|vernazza|riomaggiore/.test(t)) update.destination = 'cinque-terre'
  if (update.destination) found.push('destination')

  const digits = t.match(/\b(\d+)\s*(?:adults?|people|travell?ers?|guests?|of us)\b/) ?? t.match(/\bfor\s+(\d)\b(?!\s*(?:nights?|days?))/)
  const words = t.match(/\b(?:for|party of|family of)\s+(one|two|three|four|five|six)\b(?!\s+(?:nights?|days?))/) ?? t.match(/\b(one|two|three|four|five|six)\s+(?:adults?|people|of us|travell?ers?)\b/)
  if (digits) update.adults = Number(digits[1])
  else if (words) update.adults = WORDS[words[1]]
  else if (/\b(couple|partner|my wife|my husband|the two of us)\b/.test(t)) update.adults = 2
  else if (/\b(just me|solo|alone|by myself)\b/.test(t)) update.adults = 1
  if (update.adults !== undefined && (update.adults < 1 || update.adults > 6)) delete update.adults
  if (update.adults) found.push('travelers')

  const perNight = t.match(/(?:under|below|max(?:imum)?|up to|less than|around|about)?\s*\$\s*([\d,]+)\s*(?:a|per|\/|each)\s*night/)
  if (perNight) maxNight = Number(perNight[1].replace(/,/g, ''))
  else {
    const b = t.match(/\$\s*([\d,.]+)\s*(k)?/) ?? t.match(/budget\s*(?:of|is)?\s*([\d,]+)\s*(k)?/) ?? t.match(/\b([\d,]{4,})\s*(?:dollars|usd)\b/)
    if (b) {
      const v = Number(b[1].replace(/,/g, '')) * (b[2] ? 1000 : 1)
      if (v >= 100) {
        update.budget = v
        found.push('budget')
      }
    }
  }

  const nightsM = t.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:nights?|days?)\b/)
  const nights = nightsM ? (WORDS[nightsM[1]] ?? (Number(nightsM[1]) || { seven: 7, eight: 8, nine: 9, ten: 10 }[nightsM[1]])) : undefined

  const range =
    t.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:-|–|to|until|through|and)\\s*(?:${MONTH_RE}\\s+)?(\\d{1,2})\\b`)) 
  const rangeDayFirst = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:-|–|to|until|through)\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}\\b`))
  const single = t.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`))
  if (range) {
    const m1 = monthIndex(range[1])
    const m2 = range[3] ? monthIndex(range[3]) : m1
    const checkIn = nextDate(m1, Number(range[2]))
    let checkOut = nextDate(m2, Number(range[4]))
    if (checkOut <= checkIn) checkOut = toIso(new Date(Date.UTC(Number(checkIn.slice(0, 4)) + (m2 < m1 ? 1 : 0), m2, Number(range[4]), 12)))
    Object.assign(update, { checkIn, checkOut })
  } else if (rangeDayFirst) {
    const m = monthIndex(rangeDayFirst[3])
    Object.assign(update, { checkIn: nextDate(m, Number(rangeDayFirst[1])), checkOut: nextDate(m, Number(rangeDayFirst[2])) })
  } else if (single && nights) {
    const checkIn = nextDate(monthIndex(single[1]), Number(single[2]))
    Object.assign(update, { checkIn, checkOut: addDays(checkIn, nights) })
  } else {
    const mo = t.match(new RegExp(`\\b(?:in|during|for|of|early|late|mid|next)\\s+${MONTH_RE}\\b`))
    if (mo) month = monthIndex(mo[1])
  }
  if (update.checkIn) {
    found.push('dates')
    update.nights = undefined
  } else if (nights && /\b(days?|nights?)\b/.test(t) && nights <= 21) {
    update.nights = nights
  }
  return { update, maxNight, month, found }
}

const AMENITY_WORDS: [RegExp, Amenity][] = [
  [/\bpool\b/, 'Pool'], [/\bspa\b/, 'Spa'], [/breakfast/, 'Breakfast'], [/sea ?view|view of the sea|ocean view/, 'Sea view'],
  [/parking/, 'Parking'], [/wi-?fi|internet/, 'Wi-Fi'], [/restaurant/, 'Restaurant'], [/beach/, 'Beach access'],
]
const ORDINALS: [RegExp, number][] = [[/\b(first|1st|number one|top)\b/, 0], [/\b(second|2nd)\b/, 1], [/\b(third|3rd)\b/, 2], [/\b(fourth|4th)\b/, 3]]

function findHotel(t: string, ctx: Ctx): Hotel | undefined {
  const byName = HOTELS.find((h) => t.includes(h.name.toLowerCase()) || t.includes(h.name.toLowerCase().replace(/^(the|casa|villa|hotel|albergo)\s+/, '')) || t.includes(h.area.toLowerCase().split(' ')[0] + ' ' + 'hotel'))
  if (byName) return byName
  const list = visibleHotels(ctx.session.trip, ctx.session.filters, ctx.session.saved)
  if (/\blast\b/.test(t) && /hotel|stay|one|option|details/.test(t)) return list[list.length - 1]
  const ord = ORDINALS.find(([re]) => re.test(t))
  if (ord && /hotel|stay|one|option|details|view|open|show/.test(t)) return list[ord[1]]
  return undefined
}

function findRoom(t: string, hotel: Hotel, trip: Trip): Room | undefined {
  const exact = hotel.rooms.find((r) => r.name.toLowerCase().split(' ').some((w) => w.length > 4 && t.includes(w)) && t.includes(r.name.toLowerCase().split(' ')[0]))
  if (exact) return exact
  const fits = roomsFor(hotel, trip).length ? roomsFor(hotel, trip) : hotel.rooms
  if (/cheapest|lowest|cheap|basic|standard/.test(t)) return [...fits].sort((a, b) => a.night - b.night)[0]
  if (/priciest|most expensive|best room|top room/.test(t)) return [...fits].sort((a, b) => b.night - a.night)[0]
  if (/\bsuite\b/.test(t)) return hotel.rooms.find((r) => /suite/i.test(r.name))
  return undefined
}

const routeOf = (path: string) => {
  const m = path.match(/^\/hotels\/([^/]+)(?:\/book\/([^/]+))?/)
  return { hotelId: m?.[1], roomId: m?.[2], onHotels: path === '/hotels', onBooking: !!m?.[2], onHome: path === '/', live: path === '/live' }
}

const describeTrip = (trip: Trip) =>
  [
    trip.destination ? destinationById(trip.destination).name : null,
    trip.checkIn && trip.checkOut ? dateRange(trip.checkIn, trip.checkOut) : [trip.nights ? plural(trip.nights, 'night') : null, trip.month !== undefined ? `in ${MONTHS[trip.month][0].toUpperCase()}${MONTHS[trip.month].slice(1)}` : null].filter(Boolean).join(' ') || null,
    trip.adults ? plural(trip.adults, 'traveler') : null,
    trip.budget ? `${usd(trip.budget)} budget` : null,
  ].filter(Boolean).join(', ')

const monthChips = (trip: Trip): Chip[] => {
  const nights = trip.nights ?? 5
  const m = trip.month ?? 4
  return [12, 19].map((d) => {
    const a = nextDate(m, d)
    const b = addDays(a, nights)
    return { label: dateRange(a, b).replace(/, \d{4}$/, ''), say: `${MONTHS[m].slice(0, 3)} ${d} to ${toDate(b).getUTCDate()}` }
  })
}

/** What the trip still lacks, asked one thing at a time. */
function askNext(trip: Trip, intro: string, text: string): AgentResult | null {
  const tools = intro ? [intro] : undefined
  if (!trip.destination)
    return {
      turns: [
        turn(`${text}Where to? This demo knows two coastal areas. Pick one, or name it.`, {
          tools,
          chips: DESTINATIONS.map((d) => ({ label: d.name, say: d.name })),
        }),
      ],
    }
  if (!trip.checkIn || !trip.checkOut)
    return {
      turns: [turn(`${text}Which dates? Give me check-in and check-out, like “May 12 to 17”.`, { tools, chips: monthChips(trip) })],
    }
  if (!trip.adults)
    return {
      turns: [turn(`${text}How many travelers?`, { tools, chips: [1, 2, 3, 4].map((a) => ({ label: plural(a, 'traveler'), say: `${a} travelers` })) })],
    }
  return null
}

function fitNote(trip: Trip, hotels: Hotel[]) {
  if (!trip.budget) return ''
  const ok = hotels.filter((h) => bestFit(h, trip))
  if (ok.length === hotels.length) return `Every stay has a room within your ${usd(trip.budget)} budget.`
  if (!ok.length) return `None has a room within your ${usd(trip.budget)} budget for these dates. The cheapest stay is ${usd(Math.min(...hotels.map((h) => roomTotal(h.rooms.slice().sort((a, b) => a.night - b.night)[0], trip))))}.`
  return `${ok.length} of ${hotels.length} have a room within your ${usd(trip.budget)} budget. The others are marked over budget.`
}

export function respond(input: string, ctx: Ctx): AgentResult {
  const text = input.trim()
  const t = text.toLowerCase()
  const { session } = ctx
  const here = routeOf(ctx.path)
  const parsed = parseTrip(text)

  // --- Starting over.
  if (/\b(start over|reset|clear (?:everything|it all)|new trip)\b/.test(t))
    return { turns: [turn('Cleared. Tell me about the trip you have in mind.')], patch: { trip: {}, filters: { sort: 'recommended', amenities: [] }, draft: {}, booking: undefined, live: 'off' }, navigate: '/' }

  // --- Live Mode.
  if (/\b(live mode|go live|start live|voice mode|talk to you)\b/.test(t))
    return {
      turns: [turn('Opening Live Mode. This preview simulates the microphone, so you pick what to “say”. Everything you say or type stays in this one conversation.')],
      patch: { live: 'asking' },
      navigate: '/live',
    }

  // --- Booking: guest details, confirm, cancel.
  if (here.onBooking) {
    const draft: Partial<Guest> = { ...session.draft }
    const name = text.match(/(?:my name is|i['’]m|i am|name[:\s]+|book (?:it )?(?:for|under))\s+([A-Za-zÀ-ÿ'’-]+)\s+([A-Za-zÀ-ÿ'’-]+)/i)
    const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    const phone = text.match(/\+?\d[\d\s().-]{7,}\d/)
    if (name) Object.assign(draft, { first: name[1], last: name[2] })
    if (email) draft.email = email[0]
    if (phone) draft.phone = phone[0].trim()
    const filled = name || email || phone
    const hotel = hotelById(here.hotelId)!
    const room = hotel.rooms.find((r) => r.id === here.roomId)!
    const missing = [!draft.first && 'first name', !draft.last && 'last name', !draft.email && 'email', !draft.phone && 'phone'].filter(Boolean) as string[]

    if (/\b(cancel|never mind|close this|go back|back to the room)\b/.test(t))
      return { turns: [turn(`Closed the booking. Nothing was reserved. Back on ${hotel.name}.`)], navigate: `/hotels/${hotel.id}` }

    if (/\b(confirm|book now|complete|place (?:the|my) booking|go ahead|yes)\b/.test(t) && !filled) {
      if (missing.length) return { turns: [turn(`I can’t confirm yet. I still need your ${missing.join(', ')}. Type them here or fill them in on the page.`)] }
      const { checkIn, checkOut, adults } = session.trip
      const total = roomTotal(room, session.trip)
      const id = `TP-${(hotel.seed * 7919 + room.night * 31 + toDate(checkIn!).getUTCDate() * 101).toString(36).toUpperCase().padStart(5, '0').slice(-5)}`
      return {
        turns: [turn(`Booked. Your confirmation number is ${id}. This is a demo, so nothing was charged and no email was sent.`, { tools: ['Reserved the room (simulated)'] })],
        patch: { booking: { id, hotelId: hotel.id, roomId: room.id, guest: draft as Guest, checkIn: checkIn!, checkOut: checkOut!, adults: adults!, total }, draft: {} },
        navigate: '/confirmed',
      }
    }
    if (filled)
      return {
        turns: [turn(missing.length ? `Got it. I filled in what you gave me. Still missing: ${missing.join(', ')}.` : 'All the guest details are in. Say “confirm” or press Confirm booking when you’re ready.', { tools: ['Filled in guest details'] })],
        patch: { draft },
      }
  }

  // --- Saving and comparing stays.
  const named = HOTELS.filter((h) => t.includes(h.name.toLowerCase()))
  if (/\b(show|open|see)\b.*\b(saved|favou?rites|hearts?)\b|\bmy saved\b/.test(t)) {
    if (!session.saved.length) return { turns: [turn('You haven’t saved a stay yet. Press the heart on a card, or say “save the first hotel”.')] }
    return {
      turns: [turn(`Showing your ${plural(session.saved.length, 'saved stay')}.`, { tools: ['Updated the list'], chips: [{ label: 'Show all stays', say: 'Clear filters' }] })],
      patch: { filters: { ...session.filters, savedOnly: true } },
      navigate: '/hotels',
    }
  }
  if (/\b(save|favou?rite|heart|pin)\b/.test(t) && !/\bsaved\b/.test(t)) {
    const target = named[0] ?? findHotel(t, ctx) ?? hotelById(here.hotelId)
    if (!target) return { turns: [turn('Which stay should I save? Name it, or say “save the first hotel”.')] }
    const on = !session.saved.includes(target.id)
    return { turns: [turn(on ? `Saved ${target.name}. Say “show my saved stays” to see them.` : `Removed ${target.name} from your saved stays.`)], patch: { saved: on ? [...session.saved, target.id] : session.saved.filter((x) => x !== target.id) } }
  }
  if (/\bcompare\b/.test(t)) {
    const list = visibleHotels(session.trip, session.filters, session.saved)
    const picks = (named.length >= 2 ? named : list.slice(0, 2)).slice(0, 3)
    if (picks.length < 2) return { turns: [turn('I need at least two stays to compare. Ask me for hotels first.')] }
    return {
      turns: [turn(`Comparing ${picks.map((h) => h.name).join(' and ')}. The best value in each row is marked.`, { tools: ['Compared stays'] })],
      patch: { compare: picks.map((h) => h.id), comparing: true },
      navigate: '/hotels',
    }
  }

  // --- Photos.
  if (/\b(photos?|pictures?|images?|videos?|what does .* look like)\b/.test(t)) {
    const hotel = findHotel(t, ctx) ?? hotelById(here.hotelId)
    const dest: DestinationId | undefined = parsed.update.destination ?? session.trip.destination
    if (hotel && !/(area|town|coast|village|region)/.test(t))
      return { turns: [turn(`Here are photos of ${hotel.name}. These are illustrations in the demo.`, { tools: ['Found photos'], blocks: [{ kind: 'photos', target: { hotelId: hotel.id } }] })] }
    if (dest)
      return {
        turns: [turn(`Here’s ${destinationById(dest).name}. I’ve opened the photos on the page. These are illustrations in the demo.`, { tools: ['Found photos'], blocks: [{ kind: 'photos', target: { destination: dest } }] })],
        patch: { trip: { ...session.trip, destination: dest, updatedAt: Date.now() } },
        navigate: `/photos/${dest}`,
      }
    return { turns: [turn('Photos of where? I have the Amalfi Coast and Cinque Terre.', { chips: DESTINATIONS.map((d) => ({ label: `${d.name} photos`, say: `Show me photos of ${d.name}` })) })] }
  }

  // --- Sorting and filtering the list. Checked first: “only hotels with a pool, cheapest first” is not “open the first hotel”.
  const amenities = AMENITY_WORDS.filter(([re]) => re.test(t)).map(([, a]) => a)
  const sortPrice = /\b(cheap(?:est)?|lowest price|by price|price low|affordable)\b/.test(t)
  const sortRating = /\b(best[- ]rated|highest[- ]rated|top[- ]rated|by rating|best reviews)\b/.test(t)
  const clear = /\b(clear|remove|reset) (?:the )?(?:filters?|sort)\b|\bshow all\b/.test(t)
  const filterIntent = (amenities.length > 0 && /(only|with|has|have|need|want|filter|show|must)/.test(t)) || sortPrice || sortRating || clear || (parsed.maxNight && !parsed.found.length)
  // --- Opening a stay or booking a room (by name, position or button).
  const hotel = findHotel(t, ctx)
  const wantsBook = /\b(book|reserve)\b/.test(t)
  const explicitOpen = /\b(open|view|details|go to|take me|look at)\b/.test(t)
  if (wantsBook || (hotel && (!filterIntent || explicitOpen))) {
    const target = hotel ?? hotelById(here.hotelId)
    if (!target) return { turns: [turn('Which hotel? Open one from the list first, or name it.', { chips: [{ label: 'Show the hotels', say: 'Show me the hotels' }] })] }
    if (!tripReady(session.trip)) {
      const ask = askNext({ ...session.trip, ...parsed.update }, '', 'I need a few trip details before I can show rooms. ')
      if (ask) return { ...ask, patch: { trip: { ...session.trip, ...parsed.update, updatedAt: Date.now() } } }
    }
    const trip = session.trip
    if (wantsBook) {
      const r = findRoom(t, target, trip)
      if (!r)
        return {
          turns: [turn(`Which room at ${target.name}?`, { chips: roomsFor(target, trip).map((x) => ({ label: `${x.name}, ${usd(x.night)}`, say: `Book the ${x.name} at ${target.name}` })) })],
          navigate: `/hotels/${target.id}`,
        }
      if (r.sleeps < (trip.adults ?? 1))
        return { turns: [turn(`The ${r.name} sleeps ${r.sleeps}, and you’re ${trip.adults}. I’ve left the rooms that fit your group on the page.`)], navigate: `/hotels/${target.id}` }
      const total = roomTotal(r, trip)
      const over = trip.budget && total > trip.budget ? ` That’s ${usd(total - trip.budget)} over your budget, so check it before you confirm.` : ''
      return {
        turns: [turn(`Opening the booking details for the ${r.name} at ${target.name}: ${dateRange(trip.checkIn!, trip.checkOut!)}, ${plural(nightsOf(trip), 'night')}, ${usd(total)} in total.${over} Fill in the guest details, or type your name, email and phone here.`, { tools: ['Opened booking details'] })],
        navigate: `/hotels/${target.id}/book/${r.id}`,
      }
    }
    const best = bestFit(target, trip)
    const lowest = Math.min(...roomsFor(target, trip).map((r) => r.night))
    return {
      turns: [turn(`Here’s ${target.name} in ${target.area}. Rooms for your group start at ${usd(lowest)} a night, ${usd(lowest * nightsOf(trip))} for the stay.${trip.budget && !best ? ` Nothing here fits your ${usd(trip.budget)} budget.` : ''} Say which room to book.`, { tools: ['Opened hotel details'] })],
      navigate: `/hotels/${target.id}`,
    }
  }

  // --- Back / home.
  if (/\b(go back|back to (?:the )?(?:list|results|hotels)|all hotels|home page|start page)\b/.test(t) && !/(filters?)/.test(t)) {
    if (here.hotelId && tripReady(session.trip)) return { turns: [turn('Back to the hotel list.')], navigate: '/hotels' }
    return { turns: [turn('Back to the start.')], navigate: '/' }
  }

  // --- Sorting and filtering the list.
  if (filterIntent) {
    if (!tripReady(session.trip)) {
      const ask = askNext(session.trip, '', 'Happy to filter, but there’s nothing to filter yet. ')
      if (ask) return ask
    }
    const f = clear
      ? { sort: 'recommended' as const, amenities: [], savedOnly: undefined }
      : {
          sort: sortPrice ? ('price' as const) : sortRating ? ('rating' as const) : session.filters.sort,
          amenities: [...new Set([...session.filters.amenities, ...amenities])],
          maxNight: parsed.maxNight ?? session.filters.maxNight,
        }
    const filters = { ...session.filters, ...f, ...(clear ? { maxNight: undefined } : {}) }
    const list = visibleHotels(session.trip, filters, session.saved)
    const bits = [
      filters.sort === 'price' ? 'cheapest first' : filters.sort === 'rating' ? 'best rated first' : null,
      filters.amenities.length ? `with ${filters.amenities.map((a) => a.toLowerCase()).join(' and ')}` : null,
      filters.maxNight ? `under ${usd(filters.maxNight)} a night` : null,
    ].filter(Boolean)
    return {
      turns: [
        turn(
          clear ? `Filters cleared. ${plural(list.length, 'stay')} in ${destinationById(session.trip.destination!).name}.` : list.length ? `Showing ${plural(list.length, 'stay')} ${bits.join(', ')}.` : `No stay matches ${bits.join(', ')} in ${destinationById(session.trip.destination!).name}. Try clearing a filter.`,
          { tools: ['Updated the list'], chips: !list.length || clear ? [{ label: 'Clear filters', say: 'Clear filters' }] : undefined },
        ),
      ],
      patch: { filters },
      navigate: '/hotels',
    }
  }

  // --- Trip details: save what was said, then ask for the next thing or show the stays.
  const hasUpdate = Object.keys(parsed.update).length > 0 || parsed.month !== undefined
  const wantsList = /\b(hotels?|stays?|where (?:can|should) we stay|options|show me|find)\b/.test(t)
  if (hasUpdate || wantsList) {
    const trip: Trip = { ...session.trip, ...parsed.update, updatedAt: Date.now() }
    if (parsed.month !== undefined) trip.month = parsed.month
    if (trip.checkIn) trip.month = undefined
    // A new place or new dates reset the filters so the list isn't left empty.
    const patch = { trip, ...(parsed.update.destination || parsed.update.checkIn ? { filters: { sort: 'recommended' as const, amenities: [] } } : {}) }
    const saved = parsed.found.length || parsed.month !== undefined || parsed.update.nights ? 'Updated trip details' : ''
    const said = hasUpdate && saved ? `Saved: ${describeTrip(trip) || 'your note'}. ` : ''
    const food = /food|eat|cooking|wine|coast|sea|beach/.test(t) && !trip.destination ? 'For food and coastal towns I’d look at the Amalfi Coast or Cinque Terre. ' : ''
    const ask = askNext(trip, saved, `${said}${food}`)
    if (ask) return { ...ask, patch }
    const hotels = visibleHotels(trip, patch.filters ?? session.filters, session.saved)
    return {
      turns: [
        turn(
          `Here are ${plural(hotels.length, 'stay')} in ${destinationById(trip.destination!).name} for ${dateRange(trip.checkIn!, trip.checkOut!)}, ${plural(trip.adults!, 'traveler')}. ${fitNote(trip, hotels)} ${
            trip.budget ? `How do you want to use your ${usd(trip.budget)}?` : 'Do you have a budget in mind?'
          } Prices are totals for your dates, before taxes and fees, and these are sample stays.`.replace(/\s+/g, ' '),
          {
            tools: saved ? [saved, 'Searched stays'] : ['Searched stays'],
            chips: trip.budget
              ? [
                  { label: 'Best value', say: 'Cheapest first' },
                  { label: 'One splurge stay', say: 'Best rated first' },
                  { label: 'With a pool', say: 'Only hotels with a pool' },
                ]
              : [
                  { label: 'Under $150 a night', say: 'Under $150 a night' },
                  { label: 'Under $300 a night', say: 'Under $300 a night' },
                  { label: 'No limit', say: 'Clear filters' },
                ],
          },
        ),
      ],
      patch,
      navigate: '/hotels',
    }
  }

  // --- Small talk and anything else.
  if (/^(hi|hello|hey|help|what can you do)\b/.test(t) || t.includes('help'))
    return {
      turns: [turn('I plan the trip with you and drive the page as we talk. Try “hotels in Cinque Terre, May 12 to 17 for two”, “only with a pool”, “open the first hotel”, “book the cheapest room” or “show photos”.')],
    }
  return {
    turns: [
      turn('I can’t do that in this preview. I can set trip details, show and filter hotels, open a hotel, book a room, show photos or start Live Mode.', {
        chips: tripReady(session.trip) ? HELP_CHIPS : DESTINATIONS.map((d) => ({ label: d.name, say: `Hotels in ${d.name}` })),
      }),
    ],
  }
}
