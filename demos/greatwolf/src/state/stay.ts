// The stay: check-in date, adults and children's ages. Every page, the weekend plan and Wiley read it from here, so
// changing it in the Your stay bar (or typing it in the J2 hero) changes it everywhere. The demo plans two-night
// stays; plan days keep the keys 'fri' | 'sat' | 'sun' as first, second and third day, and their names follow the dates.

export type DayKey = 'fri' | 'sat' | 'sun'

export interface Stay {
  /** Check-in, 'YYYY-MM-DD'; null when the family cleared the dates. */
  start: string | null
  adults: number
  /** One age per child; -1 when the family didn't say. */
  kids: number[]
  /** Who set it last, for the bar's tag. */
  by: 'wiley' | 'you' | null
}

export const NIGHTS = 2
/** Bookable window in the demo. */
export const FIRST_DAY = '2027-03-01'
export const LAST_DAY = '2027-04-30'

export const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', o)

/** The three days of the stay, first to last, with their real names. */
export function stayDays(stay: Stay) {
  const start = toDate(stay.start ?? '2027-03-05')
  return (['fri', 'sat', 'sun'] as const).map((key, i) => {
    const d = addDays(start, i)
    return { key, label: fmt(d, { weekday: 'short' }), long: fmt(d, { weekday: 'long' }), iso: toIso(d), date: fmt(d, { month: 'short', day: 'numeric' }) }
  })
}

/** "Mar 12 – 14", "Mar 30 – Apr 1"; null without dates. */
export function shortDates(stay: Stay) {
  if (!stay.start) return null
  const a = toDate(stay.start)
  const b = addDays(a, NIGHTS)
  const sameMonth = a.getMonth() === b.getMonth()
  return `${fmt(a, { month: 'short', day: 'numeric' })} – ${sameMonth ? b.getDate() : fmt(b, { month: 'short', day: 'numeric' })}`
}

/** "Fri Mar 12 – Sun Mar 14, 2027". */
export function longDates(stay: Stay) {
  if (!stay.start) return 'Dates not set'
  const a = toDate(stay.start)
  const b = addDays(a, NIGHTS)
  const day = (d: Date) => `${fmt(d, { weekday: 'short' })} ${fmt(d, { month: 'short', day: 'numeric' })}`
  return `${day(a)} – ${day(b)}, ${b.getFullYear()}`
}

export const partySize = (stay: Stay) => stay.adults + stay.kids.length

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "2 adults, 2 kids (3, 6)". */
export function guestsLong(stay: Stay) {
  const known = stay.kids.filter((a) => a >= 0)
  // Ages show only when we know them all: "3 kids (2)" would read as if there were one age for three.
  const kids = stay.kids.length ? `, ${plural(stay.kids.length, 'kid', 'kids')}${known.length === stay.kids.length ? ` (${known.join(', ')})` : ''}` : ''
  return `${plural(stay.adults, 'adult', 'adults')}${kids}`
}

/** "2 adults · 2 kids". */
export function guestsShort(stay: Stay) {
  return stay.kids.length ? `${plural(stay.adults, 'adult', 'adults')} · ${plural(stay.kids.length, 'kid', 'kids')}` : plural(stay.adults, 'adult', 'adults')
}

/** How Wiley names the children: "a 3 and 6 year old", "a 2-year-old", "your 3 kids". */
export function kidsPhrase(stay: Stay) {
  const k = [...stay.kids].sort((a, b) => a - b)
  const an = (n: number) => ([8, 11, 18].includes(n) ? 'an' : 'a')
  if (k.length === 0) return 'your group'
  if (k.some((a) => a < 0)) return k.length === 1 ? 'your little one' : `your ${k.length} kids`
  if (k.length === 1) return `${an(k[0])} ${k[0]}-year-old`
  if (k.length === 2) return `${an(k[0])} ${k[0]} and ${k[1]} year old`
  return `your ${k.length} kids`
}

/** The youngest child's age, for "Is the water park OK for a 3-year-old?". */
const ages = (stay: Stay) => stay.kids.filter((a) => a >= 0)
export const youngest = (stay: Stay) => (ages(stay).length ? Math.min(...ages(stay)) : null)
export const oldest = (stay: Stay) => (ages(stay).length ? Math.max(...ages(stay)) : null)

/** Whether a date falls inside the stay (Mia's birthday check). */
export const includes = (stay: Stay, iso: string) => stayDays(stay).some((d) => d.iso === iso)

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }
const num = (w: string) => (/^\d+$/.test(w) ? Number(w) : (WORDS[w.toLowerCase()] ?? NaN))

/**
 * Reads dates and guests from a typed or spoken request: "march 6-8, 2 adults 1 child 2 years old", "A weekend in
 * March with a 3 and 6 year old". Returns only what it found, plus the nights asked for when that isn't two.
 */
export function parseStay(text: string): { stay: Partial<Stay>; month?: string; nightsAsked?: number } {
  const t = text.toLowerCase()
  const out: Partial<Stay> = {}
  let month: string | undefined
  let nightsAsked: number | undefined

  const range = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})(?:st|nd|rd|th)?\s*(?:-|–|to|through|until)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(\d{1,2})\b/.exec(t)
  if (range) {
    const m1 = MONTHS.indexOf(range[1])
    const m2 = range[3] ? MONTHS.indexOf(range[3]) : m1
    // The next one from today (Nov 2026): Jan to Oct is 2027.
    const year = (m: number) => (m >= 10 ? 2026 : 2027)
    const a = new Date(year(m1), m1, Number(range[2]))
    const b = new Date(year(m2), m2, Number(range[4]))
    const nights = Math.round((b.getTime() - a.getTime()) / 86400000)
    if (nights > 0 && nights !== NIGHTS) nightsAsked = nights
    const iso = toIso(a)
    out.start = iso < FIRST_DAY ? FIRST_DAY : iso > LAST_DAY ? LAST_DAY : iso
  } else {
    const m = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/.exec(t)
    if (m) month = m[1][0].toUpperCase() + m[1].slice(1)
  }

  const adults = /\b(\d+|one|two|three|four|five|six)\s+(?:adults?|grown[- ]?ups?|parents)\b/.exec(t)
  if (adults) out.adults = num(adults[1])
  else if (/\b(?:my|our)\s+(?:wife|husband|partner)\b|\bwe two\b|\bcouple\b/.test(t)) out.adults = 2

  // Ages: "3 and 6 year old", "2 years old", "kids aged 4, 7", "a 5-year-old".
  const ages: number[] = []
  const agesRe = /((?:\d{1,2}\s*(?:,|and|&)\s*)*\d{1,2})\s*(?:-|\s)?(?:years?|yrs?|y\.?o\.?)(?:[- ]old)?/g
  for (const m of t.matchAll(agesRe)) ages.push(...(m[1].match(/\d{1,2}/g) ?? []).map(Number))
  const aged = /\baged?\s+((?:\d{1,2}\s*(?:,|and|&)\s*)*\d{1,2})/.exec(t)
  if (!ages.length && aged) ages.push(...(aged[1].match(/\d{1,2}/g) ?? []).map(Number))
  const kidCount = /\b(\d+|one|two|three|four|five|six|a)\s+(?:kids?|child(?:ren)?|boys?|girls?|toddlers?|babies|baby)\b/.exec(t)
  const count = kidCount ? num(kidCount[1]) : NaN
  if (ages.length) {
    const kids = ages.filter((a) => a < 18)
    // "2 kids aged 3" names one age for two kids: repeat the last one.
    while (!Number.isNaN(count) && kids.length < count) kids.push(kids[kids.length - 1])
    out.kids = kids
  } else if (!Number.isNaN(count)) {
    out.kids = Array.from({ length: count }, () => -1)
  }
  if (out.kids && out.adults === undefined) out.adults = 2
  return { stay: out, month, nightsAsked }
}
