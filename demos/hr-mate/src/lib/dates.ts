// The demo runs on a fixed "today" so every screen agrees (and screenshots stay stable).
export const NOW = new Date('2026-11-12T09:30:00')
export const DAY = 86_400_000

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const parseDay = (s: string) => new Date(`${s}T12:00:00`)
export const addDays = (d: Date | string, n: number) => new Date(new Date(d).getTime() + n * DAY)
export const diffDays = (from: Date, to: Date) => Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY)

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const dateShortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

export const fmtDate = (d: Date | string) => dateFmt.format(typeof d === 'string' && d.length === 10 ? parseDay(d) : new Date(d))
export const fmtDateShort = (d: Date | string) => dateShortFmt.format(typeof d === 'string' && d.length === 10 ? parseDay(d) : new Date(d))
export const fmtDateTime = (d: Date | string) => `${fmtDate(d)}, ${timeFmt.format(new Date(d))}`

/** "today", "in 3 days", "2 days ago". For date-only values. */
export function relDay(value: Date | string): string {
  const d = typeof value === 'string' && value.length === 10 ? parseDay(value) : new Date(value)
  const n = diffDays(NOW, d)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  return n > 0 ? `in ${n} days` : `${-n} days ago`
}

/** "12 min ago", "3 hours ago", "in 2 days". For timestamps. */
export function relTime(value: Date | string): string {
  const d = new Date(value)
  const ms = d.getTime() - NOW.getTime()
  const abs = Math.abs(ms)
  const past = ms < 0
  const min = Math.round(abs / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return past ? `${min} min ago` : `in ${min} min`
  const h = Math.round(abs / 3_600_000)
  if (h < 24) return past ? `${h} ${h === 1 ? 'hour' : 'hours'} ago` : `in ${h} ${h === 1 ? 'hour' : 'hours'}`
  return relDay(d)
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
