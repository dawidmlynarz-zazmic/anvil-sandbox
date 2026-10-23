import type { Brief } from '~/state/types'

export const project = {
  organization: 'AEG Presents',
  artist: 'Marisol Vey',
  event: 'Coachella 2027',
  /** The brief was written nine days before the demo. */
  briefDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
}

export const initialBrief: Brief = {
  venueId: 'coachella-stage',
  slot: {
    day: 'Saturday',
    date: '2027-04-17',
    time: '7:10 pm',
    length: '75 min',
    note: 'Golden hour → night by song 12',
  },
  keywords: ['Desert modernism', 'Warm haze', 'Monolithic', 'Kinetic light'],
  referenceCount: 3,
  constraints: {
    budget: 'tier-2',
    venueRules: 'Sample: haze allowed, no pyro, curfew 11 pm',
    noGo: 'No strobe above 3 Hz; no religious imagery',
  },
}

export const moodBoard = ['mood-1', 'mood-2', 'mood-3']

export const budgetBands = [
  { value: 'tier-1', label: 'Tier 1 · [band]' },
  { value: 'tier-2', label: 'Tier 2 · [band]' },
  { value: 'tier-3', label: 'Tier 3 · [band]' },
]

import type { ChatTurn } from '~/state/types'

export const openingMessages: ChatTurn[] = [
  {
    id: 1,
    role: 'user',
    attachments: true,
    text: 'Desert-modernist stage for the Saturday sunset slot: warm, monolithic, with light that follows the sun down. The big moment is the crowd split in song 14.',
  },
  {
    id: 2,
    role: 'assistant',
    text: 'Thanks. I loaded the Coachella Stage specs and matched your slot to sunset, so the show runs from golden hour into night by song 12. I filled in the brief from your mood board and drafted four key moments from the setlist.',
  },
]
