import { formatClock, parseClock, parseLength } from '~/lib/time'
import { isCovered } from '~/mocks/venues'
import type { Brief, TimeOfDay } from '~/state/types'

// The light a set plays in, from the brief's time slot. Every concept and clip is lit from this, so the brief's
// promise holds: the slot decides the lighting.

/** Sunset, in minutes after midnight. A placeholder until the real date and venue are set. */
export const SUNSET = 19 * 60 + 14
/** Golden hour starts an hour before sunset; it reads as night 40 minutes after. */
const GOLDEN_FROM = SUNSET - 60
const NIGHT_FROM = SUNSET + 40

/** The light at a time of day, in minutes after midnight. */
export const lightAt = (minute: number): TimeOfDay => (minute < GOLDEN_FROM ? 'daylight' : minute < NIGHT_FROM ? 'golden-hour' : 'night')

/** The set's start and end, in minutes after midnight. */
export function setTimes(brief: Brief) {
  const start = parseClock(brief.slot.time, 19 * 60 + 40)
  return { start, end: start + parseLength(brief.slot.length, 75) }
}

/** The light the set opens in. Covered venues are always night. */
export function openingLight(brief: Brief): TimeOfDay {
  return isCovered(brief.venueId) ? 'night' : lightAt(setTimes(brief).start)
}

/**
 * Roughly when a key moment plays: the show's key moments are numbered 1, 2, 3… in setlist order and spread across
 * the set, so moment `n` of `of` plays a little after the start of its share of the set.
 */
function momentMinute(brief: Brief, n: number, of: number) {
  const { start, end } = setTimes(brief)
  const count = Math.max(of, n, 1)
  return start + ((n - 0.5) / count) * (end - start)
}

/** The light key moment `n` (of `of` key moments) plays in. */
export function momentLight(brief: Brief, n: number, of: number): TimeOfDay {
  return isCovered(brief.venueId) ? 'night' : lightAt(momentMinute(brief, n, of))
}

/** The other light to compare a clip against, or undefined where there is no daylight (covered venues). */
export function compareLight(brief: Brief, main: TimeOfDay): TimeOfDay | undefined {
  if (isCovered(brief.venueId)) return undefined
  return main === 'night' ? 'golden-hour' : 'night'
}

/** The slot in a few words, for the brief and the agent: "Golden hour → night from 7:54 pm", "All after dark". */
export function slotNote(brief: Brief): string {
  if (isCovered(brief.venueId)) return 'Under a roof: lit as night throughout'
  const { start, end } = setTimes(brief)
  const first = lightAt(start)
  const last = lightAt(end)
  if (first === last) return first === 'night' ? 'All after dark' : first === 'daylight' ? 'All in daylight' : 'All in golden hour'
  // When the last light arrives, as a clock time: the first minute of the set that's in it.
  const turn = Array.from({ length: end - start }, (_, i) => start + i).find((m) => lightAt(m) === last) ?? end
  const label = { daylight: 'Daylight', 'golden-hour': 'Golden hour', night: 'night' }
  return `${label[first]} → ${last === 'night' ? 'night' : label[last].toLowerCase()} from ${formatClock(turn)}`
}
