import { artistFeedback } from '~/mocks/review'
import { initialBrief, openingMessages } from '~/mocks/project'
import { isCovered } from '~/mocks/venues'
import { materialize, planBatch, setFrom, type BatchKind } from '~/services/explore'
import { clipFor } from '~/services/generation'
import { planKit } from '~/services/kit'
import { draftMoments } from '~/services/interview'
import { momentLight } from '~/services/light'
import { clipKey, type ProjectState } from '~/state/project'
import type { Brief, ChatTurn, ClipSlot, SetlistMoment, Version } from '~/state/types'

// Three sample projects at different points, so the demo can jump to any part of the loop.
// Artist names are fictional; venues are real AEG venues with sample specs.

const DAY = 86_400_000

const versions = (list: [string, string][]): Version[] =>
  list.map(([summary, author], i) => ({ number: i + 1, summary, author, time: `${9 + i}:${i % 2 ? '30' : '05'}` }))

const turns = (list: [ChatTurn['role'], string][], from: number): ChatTurn[] => list.map(([role, text], i) => ({ id: from + i, role, text }))

const base = (id: string, artist: string, event: string, brief: Brief, moments: SetlistMoment[], daysAgo: number): ProjectState => ({
  meta: { id, artist, event, createdAt: Date.now() - daysAgo * DAY, updatedAt: Date.now() - daysAgo * DAY * 0.1, briefDate: Date.now() - daysAgo * DAY },
  phase: 'loop',
  setupStep: 99,
  profiled: true,
  brief,
  briefRevision: 1,
  provenance: { venue: 'agent', slot: 'agent', visual: 'agent', constraints: 'agent' },
  moments,
  generations: [],
  looks: {},
  set: null,
  pending: {},
  clips: {},
  kits: {},
  kitPending: {},
  focus: null,
  messages: [],
  status: 'draft',
  review: [],
  redo: [],
  versions: [],
  sentVersion: null,
  artistRating: null,
})

/** Explores one batch for a moment, the same way the agent does live (synchronously, for seeding). */
function explore(p: ProjectState, song: number, kind: BatchKind, baseN?: number) {
  const existing = p.generations.filter((g) => g.song === song)
  const { drafts } = planBatch(kind, {
    light: momentLight(p.brief, song, p.moments.length),
    covered: isCovered(p.brief.venueId),
    set: p.set,
    existing,
    base: baseN ? existing.find((g) => g.n === baseN) : undefined,
  })
  // New directions are the agent exploring; “more like” a pick is someone asking.
  p.generations.push(...materialize(drafts, { project: p.meta.id, song, existing, author: kind === 'more' ? 'you' : 'agent' }))
}

const gen = (p: ProjectState, song: number, n: number) => p.generations.find((g) => g.song === song && g.n === n)!

/** Chooses a look for a moment, with its clip already rendered. */
function choose(p: ProjectState, song: number, n: number) {
  const look = gen(p, song, n)
  p.looks[song] = look.id
  p.clips[clipKey(look.id, song)] = { status: 'ready', clip: clipFor(look, song) } as ClipSlot
}

/** A moment's asset kit, built from its look. */
function kit(p: ProjectState, song: number) {
  const look = p.generations.find((g) => g.id === p.looks[song])!
  const assets = planKit(look, song, p.moments.length, p.brief, isCovered(p.brief.venueId), song % 3).map((a, i) => ({ ...a, id: `${look.id}.kit.${i + 1}`, at: '11:20' }))
  p.kits[song] = { lookId: look.id, assets }
}

/** Exploring the first moment: two batches in, nothing chosen yet. The live demo starts here. */
function coachella(): ProjectState {
  const p = base('coachella', 'Marisol Vey', 'Coachella 2027', initialBrief, draftMoments(initialBrief), 9)
  explore(p, 1, 'directions')
  explore(p, 1, 'more', 2)
  return {
    ...p,
    messages: [
      ...openingMessages,
      ...turns(
        [
          ['assistant', 'Four directions for song 1 · Opening reveal: open-air arch, stone monolith, kinetic LED ribbons and floating halo.'],
          ['user', 'More like the monolith.'],
          ['assistant', 'Three more like #2 for song 1. Open the one you like and put it into motion.'],
        ],
        3,
      ),
    ],
    versions: versions([
      ['Song 1 · New directions (4 images)', 'Stage agent'],
      ['Song 1 · More like #2 (3 images)', 'You'],
    ]),
  }
}

/** The artist has replied: comments on two moments are waiting in Review. */
function o2(): ProjectState {
  const brief: Brief = {
    ...initialBrief,
    venueId: 'the-o2',
    slot: { day: 'Friday', date: '2027-06-11', time: '9:00 pm', length: '90 min', note: 'Under a roof: lit as night throughout' },
    keywords: ['Chrome', 'Cold neon', 'Brutalist'],
  }
  const p = base('o2', 'The Velvet Static', 'The O2 residency 2027', brief, draftMoments(brief), 16)
  explore(p, 1, 'directions')
  explore(p, 1, 'more', 3)
  choose(p, 1, 6)
  p.set = setFrom(gen(p, 1, 6))
  for (const song of [2, 3, 4]) {
    explore(p, song, 'directions')
    choose(p, song, song === 3 ? 3 : 2)
  }
  for (const m of p.moments) kit(p, m.number)
  const looks = p.moments.map((moment) => ({ moment, look: p.generations.find((g) => g.id === p.looks[moment.number])! }))
  const review = artistFeedback(looks).map((c, i) => ({ ...c, number: i + 1, time: '10:40' }))
  return {
    ...p,
    status: 'feedback',
    review,
    sentVersion: 4,
    versions: versions([
      ['Song 1 · New directions, then more like #3', 'Stage agent'],
      ['Stage set locked from song 1, #6 · Kinetic LED ribbons', 'You'],
      ['All 4 songs put into motion', 'You'],
      ['Sent to the artist · 4 songs, 4 clips', 'You'],
    ]),
    messages: turns(
      [
        ['user', 'Cold, industrial residency look for The O2. Chrome and neon, nothing warm until the ballad.'],
        ['assistant', 'Loaded The O2. It’s under a roof, so every song is lit as night. I drafted four key moments from the setlist.'],
        ['assistant', 'You locked the stage set from song 1, image #6: kinetic LED ribbons. New looks for the other songs keep that structure.'],
        ['assistant', 'Sent the show to the artist: 4 songs, each with its look and clip.'],
        ['assistant', `The artist replied with ${review.length} comments. Open Review to go through them, then approve the show or request changes.`],
      ],
      200,
    ),
  }
}

/** Approved: the handoff package is ready. */
function arena(): ProjectState {
  const brief: Brief = {
    ...initialBrief,
    venueId: 'crypto-arena',
    slot: { day: 'Thursday', date: '2027-09-16', time: '8:30 pm', length: '100 min', note: 'Under a roof: lit as night throughout' },
    keywords: ['Monochrome', 'Halo', 'Minimal'],
  }
  const moments: SetlistMoment[] = [
    { number: 1, title: 'Entrance', intent: 'Halo descends as the artist walks on' },
    { number: 2, title: 'Title track', intent: 'Halo splits into rings' },
    { number: 3, title: 'Acoustic set', intent: 'Rings rise; one spot on the artist' },
    { number: 4, title: 'Finale', intent: 'Full white wash, halo flares' },
  ]
  const p = base('arena', 'Ren Halloway', 'Crypto.com Arena tour 2027', brief, moments, 21)
  explore(p, 1, 'directions')
  explore(p, 1, 'more', 4)
  choose(p, 1, 5)
  p.set = setFrom(gen(p, 1, 5))
  for (const song of [2, 3, 4]) {
    explore(p, song, 'directions')
    choose(p, song, song === 3 ? 1 : 4)
  }
  for (const m of moments) kit(p, m.number)
  const looks = moments.map((moment) => ({ moment, look: p.generations.find((g) => g.id === p.looks[moment.number])! }))
  const review = artistFeedback(looks).map((c, i) => ({ ...c, number: i + 1, time: '16:20', resolved: i !== 1 }))
  return {
    ...p,
    status: 'approved',
    review,
    artistRating: 4,
    sentVersion: 6,
    versions: versions([
      ['Song 1 · New directions, then more like #4', 'Stage agent'],
      ['Stage set locked from song 1, #5 · Floating halo', 'You'],
      ['All 4 songs put into motion', 'You'],
      ['Sent to the artist · 4 songs, 4 clips', 'You'],
      ['Changes requested · 1 song', 'You'],
      ['Sent to the artist · 4 songs, 4 clips', 'You'],
      ['Show approved by the artist · rated 4/5', 'Artist'],
    ]),
    messages: turns(
      [
        ['user', 'Minimal, monochrome arena show built around a single halo.'],
        ['assistant', 'Song 4 has a new look that takes on the artist’s comment: brighter, in haze.'],
        ['assistant', 'The artist approved the show and rated it 4/5. The handoff package is ready: 4 songs, each with its look and clip. 1 comment was left open and is in the decision log.'],
      ],
      300,
    ),
  }
}

export function seedProjects(): ProjectState[] {
  return [coachella(), o2(), arena()]
}
