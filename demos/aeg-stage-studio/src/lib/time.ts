/** "7:40 pm", "7pm", "19:40" → minutes after midnight. Falls back to the given default when it can't be read. */
export function parseClock(text: string, fallback: number) {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i.exec(text)
  if (!m) return fallback
  let hours = Number(m[1])
  const minutes = Number(m[2] ?? 0)
  const meridiem = m[3]?.toLowerCase()
  if (meridiem === 'pm' && hours < 12) hours += 12
  if (meridiem === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return fallback
  return hours * 60 + minutes
}

/** Minutes after midnight → "7:54 pm". */
export function formatClock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

/** "75 min", "90", "1.5 hours" → minutes. */
export function parseLength(text: string, fallback: number) {
  const m = /(\d+(?:\.\d+)?)/.exec(text)
  if (!m) return fallback
  const value = Number(m[1])
  return /h/i.test(text) && !/min/i.test(text) ? Math.round(value * 60) : value
}

// Show dates are calendar days ("2027-04-17"), handled in local time so they never shift across time zones.
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const fromISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

export const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** "Saturday 17 April 2027". */
export const formatShowDate = (iso: string) =>
  fromISODate(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "Saturday". */
export const weekdayOf = (iso: string) => fromISODate(iso).toLocaleDateString('en-GB', { weekday: 'long' })

/**
 * The first given weekday in the event's season: "Saturday" for "Stagecoach 2027" → a Saturday in late April 2027
 * (festival season). Without a year in the event, the next one from today.
 */
export function showDateFor(weekday: string, event: string) {
  const target = WEEKDAYS.indexOf(weekday.toLowerCase())
  const year = /\b(20\d\d)\b/.exec(event)?.[1]
  const date = year ? new Date(Number(year), 3, 19) : new Date()
  if (target < 0) return toISODate(date)
  while (date.getDay() !== target) date.setDate(date.getDate() + 1)
  return toISODate(date)
}
