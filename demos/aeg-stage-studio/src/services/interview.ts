import { venues, venuesFor, isCovered } from '~/mocks/venues'
import { lightAt, setTimes, slotNote } from './light'
import { formatShowDate, showDateFor, weekdayOf } from '~/lib/time'
import type { Brief, BriefSection, SetlistMoment } from '~/state/types'

// A new project's brief, in two parts.
// 1. The opening card (Anvil Clarifying Question): three choices that set up most of the brief at once. Each has a
//    sensible default the agent suggests if you skip it.
// 2. Then, in the chat, the artist's no-gos (optional).
// Key moments aren't part of the brief: they're the show itself. The agent drafts them from the setlist when you build
// the show, and you shape them on the show board.
// Artist and event are project details, set when the project is created. The show date, budget band and venue rules
// are filled in by the agent and editable in the brief.

export interface ProfileQuestion {
  id: 'venue' | 'slot' | 'visual'
  title: string
  /** `select`: a dropdown (long lists, like every stage). `options`: a few choices to click. */
  kind: 'select' | 'options'
  options: { value: string; label: string }[]
  /** Also lets you type your own answer (options only). */
  allowOther?: boolean
}

/** Roughly when the set plays; the agent turns it into a start time and length you can change in the brief. */
export const SLOT_TIMES: Record<string, { text: string; label: string }> = {
  daytime: { text: 'Saturday 4:30 pm, 60 min', label: 'Daytime' },
  sunset: { text: 'Saturday 7:10 pm, 75 min', label: 'Sunset into dark' },
  'after-dark': { text: 'Saturday 9:00 pm, 90 min', label: 'After dark' },
}

/** The opening questions for an event: the stage (every stage, the event's own first), roughly when, and the look. */
export function profileQuestions(event: string): ProfileQuestion[] {
  const own = venuesFor(event)
  const ordered = [...own, ...venues.filter((v) => !own.includes(v))]
  return [
    {
      id: 'venue',
      title: 'Which stage?',
      kind: 'select',
      options: ordered.map((v) => ({ value: v.name, label: `${v.name} · ${v.event ? `${v.event} ${v.kind.toLowerCase()}` : `${v.kind.toLowerCase()}, ${v.city}`}` })),
    },
    {
      id: 'slot',
      title: 'Roughly when do they play?',
      kind: 'options',
      options: ['sunset', 'after-dark', 'daytime'].map((value) => ({ value, label: SLOT_TIMES[value]!.label })),
    },
    {
      id: 'visual',
      title: 'What should the stage feel like?',
      kind: 'options',
      allowOther: true,
      options: [
        { value: 'Warm desert haze, monolithic, kinetic light', label: 'Warm desert haze, monolithic, kinetic light' },
        { value: 'Neon, chrome, high energy', label: 'Neon and chrome, high energy' },
        { value: 'Minimal, monochrome, single beam', label: 'Minimal and monochrome, a single beam' },
      ],
    },
  ]
}

/** The questions with any typed-in answer added as an option, so the answer summary can show it. */
export function answeredQuestions(event: string, answers: Record<string, string | null>) {
  return profileQuestions(event).map((q) => {
    const a = answers[q.id]
    return a && !q.options.some((o) => o.value === a) ? { ...q, options: [...q.options, { value: a, label: a }] } : q
  })
}

/** The questions asked one at a time in the chat, after the opening card. */
export const QUESTIONS: { section: BriefSection; ask: string; suggestions: string[]; optional?: boolean }[] = [
  {
    section: 'constraints',
    optional: true,
    ask: 'One more, optional: is there anything the artist never wants to see? I’ve already loaded the venue’s rules.',
    suggestions: ['No strobe above 3 Hz', 'Nothing beyond the venue rules'],
  },
]

export const DONE_TEXT =
  'The brief is ready. Check it in the middle and change anything you like, then generate the show. I’ll draft the key moments from the setlist and start on the first one.'

const DAYS = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Turns one answer into a brief change. Returns what changed in words, for the agent's reply. */
export function applyAnswer(
  section: BriefSection,
  answer: string,
  brief: Brief,
  /** The event named earlier ("Stagecoach 2027"), to place a weekday on a real date. */
  event = '',
): { patch?: Partial<Brief>; meta?: { artist: string; event: string }; summary: string } {
  const text = answer.trim()
  switch (section) {
    case 'venue': {
      const lower = text.toLowerCase()
      const venue =
        venues.find((v) => lower.includes(v.name.toLowerCase())) ??
        venues.find((v) => lower.includes(v.name.toLowerCase().replace(/^the /, '').split(' ')[0]!)) ??
        venues[0]!
      return {
        patch: { venueId: venue.id },
        summary: `Venue: ${venue.name}, ${venue.city}${venue.capacity ? ` (capacity ${venue.capacity})` : ''}. Its technical specs are samples until AEG’s venue library is connected.`,
      }
    }
    case 'slot': {
      const named = DAYS.exec(text)?.[1]
      const date = named ? showDateFor(named, event) : brief.slot.date
      const day = date ? weekdayOf(date) : cap(brief.slot.day)
      const time = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i.exec(text.replace(DAYS, ''))?.[1]?.trim() ?? brief.slot.time
      const length = /(\d+)\s*(?:min|minutes)/i.exec(text)?.[1]
      const slot = { ...brief.slot, day, date, time, length: length ? `${length} min` : brief.slot.length }
      const note = slotNote({ ...brief, slot })
      return {
        patch: { slot: { ...slot, note } },
        summary: `Slot: ${date ? formatShowDate(date) : day}, ${slot.time}, ${slot.length}. ${note}, so I’ll light every song for that. Change the date or time in the brief if it’s not right.`,
      }
    }
    case 'visual': {
      const keywords = text.split(/,|\band\b/).map((k) => cap(k.trim())).filter(Boolean).slice(0, 5)
      const said = keywords.join(', ').toLowerCase()
      return { patch: { keywords }, summary: `Visual direction: ${said.charAt(0).toUpperCase()}${said.slice(1)}.` }
    }
    case 'constraints': {
      const none = /^(nothing|none|no thanks)/i.test(text)
      const constraints = { ...brief.constraints, noGo: none ? brief.constraints.noGo : text }
      return { patch: { constraints }, summary: none ? 'No extra no-gos. I kept the venue rules.' : `Added to the no-go list: ${text}.` }
    }
  }
}

const OPEN_AIR: SetlistMoment[] = [
  { number: 1, title: 'Opening reveal', intent: 'Slow build from silhouette' },
  { number: 2, title: 'Sunset drop', intent: 'LED wall peaks with the sun' },
  { number: 3, title: 'Crowd split', intent: 'Stage opens in two halves' },
  { number: 4, title: 'Finale', intent: 'Full-stage light wash' },
]

const AFTER_DARK: SetlistMoment[] = [
  { number: 1, title: 'Cold open', intent: 'Single white beam, then the wall lights up' },
  { number: 2, title: 'First drop', intent: 'Strobe-free pulse across the LED wall' },
  { number: 3, title: 'Ballad', intent: 'Everything dims to one warm spot' },
  { number: 4, title: 'Encore', intent: 'The rig lowers over the crowd' },
]

/** Key moments the agent drafts from the setlist (mocked): sunset moments for an open-air set that sees the sun go down. */
export function draftMoments(brief: Brief): SetlistMoment[] {
  const sunset = !isCovered(brief.venueId) && lightAt(setTimes(brief).start) !== 'night'
  return sunset ? OPEN_AIR : AFTER_DARK
}
