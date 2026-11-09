// The demo's "today": fixed, so the sample dates never go stale. Thursday 29 October 2026.
export const DEMO_TODAY = '2026-10-29'

const DAY_MS = 86_400_000

/** A calendar date ('2027-05-12') as a Date at noon UTC, so time zones never shift the day. */
export const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`)
export const toIso = (d: Date) => d.toISOString().slice(0, 10)
export const addDays = (iso: string, n: number) => toIso(new Date(toDate(iso).getTime() + n * DAY_MS))
export const nightsBetween = (from: string, to: string) => Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS)

const part = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...o }).format(toDate(iso))

/** "May 12, 2027". */
export const longDate = (iso: string) => part(iso, { month: 'short', day: 'numeric', year: 'numeric' })

/** "May 12–17, 2027", or "May 28 – Jun 2, 2027" across months. */
export function dateRange(from: string, to: string) {
  const sameMonth = part(from, { month: 'short' }) === part(to, { month: 'short' })
  const a = part(from, { month: 'short', day: 'numeric' })
  const b = sameMonth ? part(to, { day: 'numeric' }) : part(to, { month: 'short', day: 'numeric' })
  return `${a}${sameMonth ? '–' : ' – '}${b}, ${part(to, { year: 'numeric' })}`
}

/** "$1,600" (whole dollars). */
export const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "May 14" for check-in style labels, in `<input type="date">` terms: the ISO date itself. */
export const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
