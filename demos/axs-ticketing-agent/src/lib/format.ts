// The demo's "today": fixed, so "this Saturday" and the sample dates never go stale. Friday 23 October 2026.
export const DEMO_TODAY = '2026-10-23'

const DAY_MS = 86_400_000

/** A calendar date ('2027-07-03') as a Date at noon UTC, so time zones never shift the day. */
export const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`)
export const toIso = (d: Date) => d.toISOString().slice(0, 10)
export const addDays = (iso: string, n: number) => toIso(new Date(toDate(iso).getTime() + n * DAY_MS))
/** 0 = Sunday … 6 = Saturday. */
export const weekday = (iso: string) => toDate(iso).getUTCDay()

/** The next Saturday on or after `iso`. */
export function nextSaturday(iso: string) {
  return addDays(iso, (6 - weekday(iso) + 7) % 7)
}

const part = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...o }).format(toDate(iso))

/** AXS's date line: "WED FEB 10, 2027 - 6:30 PM" (the time is optional). */
export function showDateLine(iso: string, time?: string) {
  const line = `${part(iso, { weekday: 'short' })} ${part(iso, { month: 'short' })} ${part(iso, { day: 'numeric' })}, ${part(iso, { year: 'numeric' })}`
  return (time ? `${line} - ${clock(time)}` : line).toUpperCase()
}

/** '18:30' → '6:30 PM'. */
export function clock(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** "Saturday 3 July" for the agent's sentences. */
export const spoken = (iso: string) => `${part(iso, { weekday: 'long' })} ${part(iso, { day: 'numeric' })} ${part(iso, { month: 'long' })}`

/** Pounds: £68.50, or £80 when `whole`. */
export function gbp(n: number, whole = false) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: whole || Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/** 0 → "0:00", 600 → "10:00". */
export const mmss = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
