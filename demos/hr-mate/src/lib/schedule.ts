import { NOW, addDays, dayKey, fmtDate, parseDay } from './dates'
import type { EventKey, Schedule } from '@/mocks/types'

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const EVENTS: Record<EventKey, string> = {
  new_hire_added: 'When a new hire is added',
  trial_review_submitted: 'When a trial review form is submitted',
  exit_date_set: 'When an exit date is set',
  form_submitted: 'When an employee submits a form',
}

export const TIMEZONES = ['Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Singapore']

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

const stripZero = (t: string) => t.replace(/^0/, '')

/** The sentence people read. Never a cron string. */
export function describeSchedule(s: Schedule, withTimezone = true): string {
  const tz = withTimezone ? `, ${s.timezone}` : ''
  const t = stripZero(s.time)
  switch (s.kind) {
    case 'once':
      return `Once on ${s.date ? fmtDate(s.date) : 'a chosen date'} at ${t}${tz}`
    case 'daily':
      return `Every day at ${t}${tz}`
    case 'weekdays':
      return `Every weekday at ${t}${tz}`
    case 'weekly':
      return `Every ${WEEKDAYS[s.weekday ?? 1]} at ${t}${tz}`
    case 'monthly':
      return `On the ${ordinal(s.dayOfMonth ?? 1)} of every month at ${t}${tz}`
    case 'event':
      return s.event ? EVENTS[s.event] : 'When something happens'
  }
}

/** Only used inside the "technical details" previews, so engineers can see what the scheduler would store. */
export function toCron(s: Schedule): string {
  const [h, m] = s.time.split(':').map(Number)
  switch (s.kind) {
    case 'daily':
      return `${m} ${h} * * *`
    case 'weekdays':
      return `${m} ${h} * * 1-5`
    case 'weekly':
      return `${m} ${h} * * ${s.weekday ?? 1}`
    case 'monthly':
      return `${m} ${h} ${s.dayOfMonth ?? 1} * *`
    case 'once': {
      const d = s.date ? parseDay(s.date) : NOW
      return `${m} ${h} ${d.getDate()} ${d.getMonth() + 1} *`
    }
    case 'event':
      return `on event: ${s.event ?? 'unspecified'}`
  }
}

/** The next time the schedule fires after "now" (null for event-based ones). */
export function nextRunAt(s: Schedule, from: Date = NOW): Date | null {
  if (s.kind === 'event') return null
  const [h, m] = s.time.split(':').map(Number)
  if (s.kind === 'once') {
    if (!s.date) return null
    const d = parseDay(s.date)
    d.setHours(h, m, 0, 0)
    return d > from ? d : null
  }
  for (let i = 0; i < 400; i++) {
    const d = addDays(from, i)
    d.setHours(h, m, 0, 0)
    if (d <= from) continue
    const dow = d.getDay()
    if (s.kind === 'weekdays' && (dow === 0 || dow === 6)) continue
    if (s.kind === 'weekly' && dow !== (s.weekday ?? 1)) continue
    if (s.kind === 'monthly' && d.getDate() !== (s.dayOfMonth ?? 1)) continue
    return d
  }
  return null
}

export const nextRunKey = (s: Schedule) => {
  const d = nextRunAt(s)
  return d ? dayKey(d) : null
}
