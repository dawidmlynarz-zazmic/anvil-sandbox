import type { Brief } from '~/state/types'

export const project = {
  organization: 'AEG Presents',
  artist: '[Artist]',
  event: 'Coachella 2027',
  /** The brief was written nine days before the demo. */
  briefDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
}

export const initialBrief: Brief = {
  venueId: 'coachella-stage',
  slot: {
    day: 'Saturday',
    time: '7:40 pm',
    length: '75 min',
    note: 'Golden hour → night by song 9',
  },
  keywords: ['Desert modernism', 'Warm haze', 'Monolithic', 'Kinetic light'],
  referenceCount: 3,
  constraints: {
    budget: 'tier-2',
    venueRules: '[Venue rules: rigging weight, pyro, haze limits]',
    noGo: 'No strobe above 3 Hz; no religious imagery',
  },
  moments: [
    { number: 3, title: 'Opening reveal', intent: 'Slow build from silhouette' },
    { number: 7, title: 'Sunset drop', intent: 'LED wall peaks with the sun' },
    { number: 14, title: 'Crowd split', intent: 'Stage opens in two halves' },
    { number: 18, title: 'Finale', intent: 'Full-stage light wash' },
  ],
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
    text: 'Thanks. I loaded the Coachella Stage specs and matched your slot to sunset, so the show runs from golden hour into night by song 9. I filled in the brief from your mood board and setlist. Two quick answers would sharpen the concepts:',
    suggestions: ['Keep it symmetrical', 'Avoid red and green'],
  },
]
