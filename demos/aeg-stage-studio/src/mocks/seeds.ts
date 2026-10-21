import { artistFeedback } from '~/mocks/review'
import { initialBrief, openingMessages } from '~/mocks/project'
import { seedClip, stillsFor } from '~/services/generation'
import { clipKey, type ProjectState, type Settings } from '~/state/project'
import type { Brief, ChatTurn, ClipSlot, Round, Version } from '~/state/types'

// Three sample projects in different states, so the demo can jump to any point of the loop.
// Artist names are placeholders; venues are real AEG venues with placeholder specs.

const DAY = 86_400_000

function rounds(id: string, list: Settings[]): Round[] {
  return list.map((settings, i) => ({
    number: i + 1,
    note: i === 0 ? 'Opening round from the brief' : 'Changes requested by the artist',
    settings,
    stills: stillsFor({ round: i + 1, project: id, ...settings }),
    done: true,
    briefRevision: 1,
  }))
}

function clipsFor(stillIds: string[], brief: Brief): Record<string, ClipSlot> {
  return Object.fromEntries(
    stillIds.flatMap((stillId) => brief.moments.map((m) => [clipKey(stillId, m.number), { status: 'ready', clip: seedClip(stillId, m.number) } as ClipSlot])),
  )
}

const versions = (list: [string, string][]): Version[] =>
  list.map(([summary, author], i) => ({ number: i + 1, summary, author, time: `${9 + i}:${i % 2 ? '30' : '05'}` }))

const turns = (list: [ChatTurn['role'], string][], from: number): ChatTurn[] => list.map(([role, text], i) => ({ id: from + i, role, text }))

const base = (id: string, artist: string, event: string, brief: Brief, daysAgo: number): ProjectState => ({
  meta: { id, artist, event, createdAt: Date.now() - daysAgo * DAY, updatedAt: Date.now() - daysAgo * DAY * 0.1, briefDate: Date.now() - daysAgo * DAY },
  phase: 'loop',
  setupStep: 99,
  brief,
  briefRevision: 1,
  provenance: { venue: 'agent', slot: 'agent', visual: 'agent', constraints: 'agent', moments: 'agent' },
  rounds: [],
  selected: [],
  comments: [],
  feedback: [],
  motionStills: [],
  clips: {},
  motionFocus: null,
  messages: [],
  status: 'draft',
  review: [],
  versions: [],
  sentVersion: null,
  reached: 1,
})

const golden: Settings = { timeOfDay: 'golden-hour', crowd: 'full', view: 'front-of-house' }
const night: Settings = { timeOfDay: 'night', crowd: 'full', view: 'front-of-house' }
const nightCam: Settings = { timeOfDay: 'night', crowd: 'full', view: 'livestream-cam' }

/** In round 1: concepts are back, nothing chosen yet. The live demo starts here. */
function coachella(): ProjectState {
  const id = 'coachella'
  const p = base(id, '[Artist A]', 'Coachella 2027', initialBrief, 9)
  return {
    ...p,
    rounds: rounds(id, [golden]),
    messages: [
      ...openingMessages,
      ...turns([['assistant', 'Round 1 is ready: four concepts for golden hour, full crowd, front of house. B1 · Stone monolith follows your “monolithic” keyword most closely. Tick the ones you want to take forward, and leave a note on any concept to steer the next round.']], 3),
    ],
    versions: versions([['Round 1 · 4 concepts (golden hour, full crowd, front of house)', 'Stage agent']]),
  }
}

/** The artist has replied: comments are waiting in Review. */
function o2(): ProjectState {
  const id = 'o2'
  const brief: Brief = {
    ...initialBrief,
    venueId: 'the-o2',
    slot: { day: 'Friday', time: '9:00 pm', length: '90 min', note: 'Indoor arena, full dark' },
    keywords: ['Chrome', 'Cold neon', 'Brutalist'],
    moments: [
      { number: 2, title: 'Cold open', intent: 'Single white beam, then the wall lights up' },
      { number: 6, title: 'First drop', intent: 'Strobe-free pulse across the LED wall' },
      { number: 11, title: 'Ballad', intent: 'Everything dims to one warm spot' },
      { number: 15, title: 'Encore', intent: 'Ceiling rig lowers over the crowd' },
    ],
  }
  const p = base(id, '[Artist B]', 'The O2 residency 2027', brief, 16)
  const r = rounds(id, [night, nightCam])
  const chosen = r[1]!.stills[2]!
  const review = artistFeedback([chosen], brief.moments, brief.moments.map((m) => m.number)).map((c, i) => ({ ...c, number: i + 1, time: '10:40' }))
  return {
    ...p,
    rounds: r,
    selected: [chosen.id],
    motionStills: [chosen.id],
    clips: clipsFor([chosen.id], brief),
    status: 'feedback',
    review,
    sentVersion: 3,
    reached: 3,
    versions: versions([
      ['Round 1 · 4 concepts (night, full crowd, front of house)', 'Stage agent'],
      ['Round 2 · 4 concepts (night, full crowd, livestream cam)', 'Stage agent'],
      ['Sent to the artist · 1 concept, 4 clips', 'You'],
    ]),
    messages: turns(
      [
        ['user', 'Cold, industrial residency look for The O2. Chrome and neon, nothing warm until the ballad.'],
        ['assistant', 'Loaded The O2 specs. It’s indoors, so every concept is lit for full dark. I filled in the brief from your notes.'],
        ['assistant', 'Round 2 is ready. I used your note on C1 and switched to the livestream camera.'],
        ['assistant', 'Sent to the artist: 1 concept and 4 motion clips.'],
        ['assistant', `The artist replied with ${review.length} comments. Open Review to go through them, then approve or request changes.`],
      ],
      200,
    ),
  }
}

/** Approved: the handoff package is ready. */
function arena(): ProjectState {
  const id = 'arena'
  const brief: Brief = {
    ...initialBrief,
    venueId: 'crypto-arena',
    slot: { day: 'Thursday', time: '8:30 pm', length: '100 min', note: 'Indoor arena, full dark' },
    keywords: ['Monochrome', 'Halo', 'Minimal'],
    moments: [
      { number: 1, title: 'Entrance', intent: 'Halo descends as the artist walks on' },
      { number: 5, title: 'Title track', intent: 'Halo splits into rings' },
      { number: 9, title: 'Acoustic set', intent: 'Rings rise; one spot on the artist' },
      { number: 13, title: 'Finale', intent: 'Full white wash, halo flares' },
    ],
  }
  const p = base(id, '[Artist C]', 'Crypto.com Arena tour 2027', brief, 21)
  const r = rounds(id, [night, night, nightCam])
  const chosen = r[2]!.stills[3]!
  const review = artistFeedback([chosen], brief.moments, brief.moments.map((m) => m.number)).map((c, i) => ({
    ...c,
    number: i + 1,
    time: '16:20',
    resolved: i !== 1,
  }))
  return {
    ...p,
    rounds: r,
    selected: [chosen.id],
    motionStills: [chosen.id],
    clips: clipsFor([chosen.id], brief),
    status: 'approved',
    review,
    sentVersion: 6,
    reached: 3,
    versions: versions([
      ['Round 1 · 4 concepts (night)', 'Stage agent'],
      ['Round 2 · 4 concepts (night)', 'Stage agent'],
      ['Sent to the artist · 1 concept, 4 clips', 'You'],
      ['Changes requested · 2 comments taken into the next round', 'Artist'],
      ['Round 3 · 4 concepts (night, livestream cam)', 'Stage agent'],
      ['Sent to the artist · 1 concept, 4 clips', 'You'],
      ['Approved for production', 'You'],
    ]),
    messages: turns(
      [
        ['user', 'Minimal, monochrome arena show built around a single halo.'],
        ['assistant', 'Round 3 is ready. I applied the artist’s two comments: the halo sits higher and the riser is hidden.'],
        ['assistant', 'Approved. The handoff package is ready for production: 3 rounds from brief to approval. 1 comment was left open and is recorded in the decision log.'],
      ],
      300,
    ),
  }
}

export function seedProjects(): ProjectState[] {
  return [coachella(), o2(), arena()]
}
