import { parseClock, parseLength } from '~/lib/time'
import { isCovered } from '~/mocks/venues'
import type { Brief, TimeOfDay } from '~/state/types'

// The light a set plays in, from the brief's time slot. Every concept and clip is lit from this, so the brief's
// promise holds: the slot decides the lighting.

/** Sunset, in minutes after midnight. A placeholder until the real date and venue are set. */
export const SUNSET = 19 * 60 + 14
/** Golden hour starts an hour before sunset; it reads as night 40 minutes after. */
const GOLDEN_FROM = SUNSET - 60
const NIGHT_FROM = SUNSET + 40
/** A typical festival song with changeover, used to place a song number inside the set. */
const SONG_MINUTES = 4

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

/** Roughly when a song plays, from its number and the set's length. */
function songMinute(brief: Brief, song: number) {
  const { start, end } = setTimes(brief)
  const songs = Math.max(Math.round((end - start) / SONG_MINUTES), song, 1)
  return start + ((song - 0.5) / songs) * (end - start)
}

/** The light a key moment plays in. */
export function momentLight(brief: Brief, song: number): TimeOfDay {
  return isCovered(brief.venueId) ? 'night' : lightAt(songMinute(brief, song))
}

/** The other light to compare a clip against, or undefined where there is no daylight (covered venues). */
export function compareLight(brief: Brief, main: TimeOfDay): TimeOfDay | undefined {
  if (isCovered(brief.venueId)) return undefined
  return main === 'night' ? 'golden-hour' : 'night'
}

/** The slot in a few words, for the brief and the agent: "Golden hour → night by song 9", "All after dark". */
export function slotNote(brief: Brief): string {
  if (isCovered(brief.venueId)) return 'Under a roof: lit as night throughout'
  const { start, end } = setTimes(brief)
  const first = lightAt(start)
  const last = lightAt(end)
  if (first === last) return first === 'night' ? 'All after dark' : first === 'daylight' ? 'All in daylight' : 'All in golden hour'
  // The first key moment (or song number) that falls in the last light.
  const songs = Math.max(Math.round((end - start) / SONG_MINUTES), 1)
  const turn = Array.from({ length: songs }, (_, i) => i + 1).find((n) => lightAt(songMinute(brief, n)) === last) ?? songs
  const label = { daylight: 'Daylight', 'golden-hour': 'Golden hour', night: 'night' }
  return `${label[first]} → ${last === 'night' ? 'night' : label[last].toLowerCase()} by song ${turn}`
}
