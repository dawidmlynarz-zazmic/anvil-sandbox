import { initialBrief } from '~/mocks/project'
import { venues } from '~/mocks/venues'
import { slotNote } from './light'
import type { Brief, BriefSection } from '~/state/types'

/** The agent's brief interview for a new project: one question per part of the brief. */
export const QUESTIONS: { section: BriefSection | 'who'; ask: string; suggestions: string[] }[] = [
  {
    section: 'who',
    ask: 'Let’s set up a new show. Who is the artist, and which event is it for?',
    suggestions: ['[Artist D] · Stagecoach 2027'],
  },
  // The venue suggestions are replaced with the named event's stages when the question is asked.
  { section: 'venue', ask: 'Which venue and stage?', suggestions: venues.slice(0, 3).map((v) => v.name) },
  {
    section: 'slot',
    ask: 'When do they play, and for how long? I’ll match the set to the light at that time.',
    suggestions: ['Saturday 7:10 pm, 75 min', 'Friday 9:00 pm, 90 min'],
  },
  {
    section: 'visual',
    ask: 'What should the stage feel like? Describe the look in a few words, or attach a mood board.',
    suggestions: ['Warm desert haze, monolithic, kinetic light'],
  },
  {
    section: 'constraints',
    ask: 'Is there anything the artist never wants to see, or venue rules I should respect?',
    suggestions: ['No strobe above 3 Hz', 'Nothing beyond the venue rules'],
  },
  {
    section: 'moments',
    ask: 'Which songs are the key moments, where the stage should do something memorable? List them like “3 Opening, 14 Crowd split”, or let me suggest some from the setlist.',
    suggestions: ['Suggest from the setlist'],
  },
]

export const DONE_TEXT =
  'The brief is ready. Check it in the middle, change anything you like, then start the project. I’ll generate the first four concepts straight away.'

const DAYS = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Turns one answer into a brief change. Returns what changed in words, for the agent's reply. */
export function applyAnswer(
  section: BriefSection | 'who',
  answer: string,
  brief: Brief,
): { patch?: Partial<Brief>; meta?: { artist: string; event: string }; summary: string } {
  const text = answer.trim()
  switch (section) {
    case 'who': {
      const [artist = text, event = 'New show'] = text.split(/\s*[·,]\s*|\s+at\s+|\s+for\s+/i)
      return { meta: { artist: artist.trim(), event: event.trim() }, summary: `Project set up for ${artist.trim()} · ${event.trim()}.` }
    }
    case 'venue': {
      const venue = venues.find((v) => text.toLowerCase().includes(v.name.toLowerCase().split(' ')[0]!.toLowerCase())) ?? venues[0]!
      return {
        patch: { venueId: venue.id },
        summary: `Venue: ${venue.name} (${venue.kind.toLowerCase()}). Its technical specs will come from AEG’s venue library; for now they show as placeholders.`,
      }
    }
    case 'slot': {
      const day = cap(DAYS.exec(text)?.[1]?.toLowerCase() ?? brief.slot.day)
      const time = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i.exec(text.replace(DAYS, ''))?.[1]?.trim() ?? brief.slot.time
      const length = /(\d+)\s*(?:min|minutes)/i.exec(text)?.[1]
      const slot = { ...brief.slot, day, time, length: length ? `${length} min` : brief.slot.length }
      const note = slotNote({ ...brief, slot })
      return { patch: { slot: { ...slot, note } }, summary: `Slot: ${slot.day}, ${slot.time}, ${slot.length}. ${note}, so I’ll light the concepts for that. The timeline in the brief shows it.` }
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
    case 'moments': {
      const listed = [...text.matchAll(/(\d{1,2})\s*[:\-–]?\s*([^,;\d]+)/g)].map((m) => ({
        number: Number(m[1]),
        title: cap(m[2]!.trim()),
        intent: 'No direction yet',
      }))
      const moments = listed.length ? listed.sort((a, b) => a.number - b.number) : initialBrief.moments
      return {
        patch: { moments },
        summary: listed.length
          ? `Key moments: ${moments.map((m) => `song ${m.number}`).join(', ')}.`
          : `I picked four key moments from the setlist: ${moments.map((m) => `${m.number} ${m.title}`).join(', ')}.`,
      }
    }
  }
}
