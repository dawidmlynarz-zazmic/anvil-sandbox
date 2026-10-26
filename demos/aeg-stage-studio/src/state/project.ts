import { initialBrief } from '~/mocks/project'
import type {
  Brief,
  BriefSection,
  ChatTurn,
  ClipSlot,
  Asset,
  Generation,
  Kit,
  ProjectStatus,
  ReviewComment,
  SetlistMoment,
  ShowSet,
  Version,
} from './types'

/** Clips are keyed by look and song: a new look for a moment gets its own clip. */
export const clipKey = (genId: string, song: number) => `${genId}|${song}`

export interface ProjectMeta {
  id: string
  /** The artist, e.g. "Marisol Vey" (fictional names in this demo). */
  artist: string
  /** The event, e.g. "Coachella 2027". */
  event: string
  createdAt: number
  updatedAt: number
  /** When the brief was written; drives "days to approval". */
  briefDate: number
}

/** Who set a brief section. `pending`: not shown yet. `blank`: shown in the form, still at its default. */
export type Provenance = 'agent' | 'you' | 'pending' | 'blank'

/** Work the agent is doing on one moment: shown as placeholders on its contact sheet. */
export interface Pending {
  label: string
  /** Images still to come. */
  count: number
  /** The batch they'll land in. */
  batch: number
  /** The image being changed, for a single change (not a batch). */
  of?: string
}

/** Everything about one project: its brief, its show and its conversation. */
export interface ProjectState {
  meta: ProjectMeta
  /** setup: the agent is interviewing you for the brief. loop: the show, review and handoff. */
  phase: 'setup' | 'loop'
  /** Which interview question the agent is on, during setup. */
  setupStep: number
  /** The opening questions (stage, time, look) have been answered or skipped. */
  profiled?: boolean
  brief: Brief
  briefRevision: number
  provenance: Record<BriefSection, Provenance>
  /** The key moments, in setlist order: the show is designed one moment at a time. */
  moments: SetlistMoment[]
  /** Every image explored, for every moment. Nothing is ever replaced. */
  generations: Generation[]
  /** Each moment's chosen look: song → generation id. */
  looks: Record<number, string>
  /** The structure every moment shares, once locked. */
  set: ShowSet | null
  /** Batches being made, per moment. */
  pending: Record<number, Pending | undefined>
  clips: Record<string, ClipSlot>
  /** Each moment's asset kit, built from its look. */
  kits: Record<number, Kit>
  /** Kits being built: song → assets still to come. */
  kitPending: Record<number, number | undefined>
  /** The image open on a moment page, so the chat changes that one. */
  focus: { song: number; genId: string } | null
  messages: ChatTurn[]
  status: ProjectStatus
  review: ReviewComment[]
  /** Moments the artist asked to change, until they get a new look. */
  redo: number[]
  versions: Version[]
  sentVersion: number | null
  /** The artist's 1–5 rating at sign-off: “How close is this to your vision?” */
  artistRating?: number | null
  /** The handoff package has gone to the production team. */
  exported?: boolean
}

export type Action =
  | { type: 'meta/patch'; patch: Partial<ProjectMeta> }
  | { type: 'phase/set'; phase: ProjectState['phase'] }
  | { type: 'setup/step'; step: number }
  | { type: 'setup/profiled' }
  | { type: 'brief/patch'; patch: Partial<Brief>; source: 'agent' | 'you' }
  | { type: 'brief/reveal'; sections: BriefSection[] }
  | { type: 'moments/set'; moments: SetlistMoment[] }
  | { type: 'moments/remove'; song: number }
  | { type: 'gen/add'; gen: Generation }
  | { type: 'gen/patch'; id: string; patch: Partial<Generation> }
  | { type: 'pending/set'; song: number; pending: Pending | undefined }
  | { type: 'look/set'; song: number; id: string }
  | { type: 'set/lock'; set: ShowSet | null }
  | { type: 'focus/set'; song: number; genId: string }
  | { type: 'clip/set'; key: string; slot: ClipSlot }
  | { type: 'kit/start'; song: number; lookId: string; count: number }
  | { type: 'kit/asset'; song: number; asset: Asset }
  | { type: 'kit/done'; song: number }
  | { type: 'chat/add'; turn: ChatTurn }
  | { type: 'chat/update'; id: number; patch: Partial<ChatTurn> }
  | { type: 'status/set'; status: ProjectStatus }
  | { type: 'review/set'; comments: ReviewComment[] }
  | { type: 'review/resolve'; id: string; resolved?: boolean }
  | { type: 'review/add'; comment: ReviewComment }
  | { type: 'redo/set'; songs: number[] }
  | { type: 'rating/set'; rating: number | null }
  | { type: 'export/done' }
  | { type: 'version/add'; summary: string; author: string; sent?: boolean }

const SECTION_OF: Record<keyof Brief, BriefSection> = {
  venueId: 'venue',
  slot: 'slot',
  keywords: 'visual',
  referenceCount: 'visual',
  constraints: 'constraints',
}

export const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const ALL_SECTIONS: BriefSection[] = ['venue', 'slot', 'visual', 'constraints']

/** A blank project, ready for the agent's brief interview. */
export function newProject(id: string, opening: ChatTurn[], show?: { artist: string; event: string }): ProjectState {
  const now = Date.now()
  return {
    meta: { id, artist: show?.artist || 'New project', event: show?.event || 'Brief in progress', createdAt: now, updatedAt: now, briefDate: now },
    phase: 'setup',
    setupStep: 0,
    // A new project starts empty: no keywords or no-gos until someone actually sets them.
    brief: { ...initialBrief, keywords: [], referenceCount: 0, constraints: { ...initialBrief.constraints, noGo: '' } },
    briefRevision: 1,
    provenance: Object.fromEntries(ALL_SECTIONS.map((s) => [s, 'pending'])) as Record<BriefSection, Provenance>,
    moments: [],
    generations: [],
    looks: {},
    set: null,
    pending: {},
    clips: {},
    kits: {},
    kitPending: {},
    focus: null,
    messages: opening,
    status: 'draft',
    review: [],
    redo: [],
    versions: [],
    sentVersion: null,
    artistRating: null,
  }
}

/** Actions that don't count as working on the project (for "updated 5 min ago"). */
const QUIET = new Set<Action['type']>(['chat/update', 'focus/set', 'pending/set', 'kit/done'])

export function projectReducer(state: ProjectState, action: Action): ProjectState {
  const next = step(state, action)
  return QUIET.has(action.type) ? next : { ...next, meta: { ...next.meta, updatedAt: Date.now() } }
}

function step(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'meta/patch':
      return { ...state, meta: { ...state.meta, ...action.patch } }
    case 'phase/set':
      return { ...state, phase: action.phase }
    case 'setup/step':
      return { ...state, setupStep: action.step }
    case 'setup/profiled':
      return { ...state, profiled: true }
    case 'brief/patch': {
      const provenance = { ...state.provenance }
      for (const key of Object.keys(action.patch) as (keyof Brief)[]) provenance[SECTION_OF[key]] = action.source
      return { ...state, brief: { ...state.brief, ...action.patch }, briefRevision: state.briefRevision + 1, provenance }
    }
    case 'brief/reveal': {
      const provenance = { ...state.provenance }
      for (const s of action.sections) if (provenance[s] === 'pending') provenance[s] = 'blank'
      return { ...state, provenance }
    }
    case 'moments/set':
      return { ...state, moments: [...action.moments].sort((a, b) => a.number - b.number) }
    case 'moments/remove':
      return removeMoment(state, action.song)
    case 'gen/add':
      return { ...state, generations: [...state.generations, action.gen] }
    case 'gen/patch':
      return { ...state, generations: state.generations.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)) }
    case 'pending/set':
      return { ...state, pending: { ...state.pending, [action.song]: action.pending } }
    case 'look/set':
      return { ...state, looks: { ...state.looks, [action.song]: action.id }, redo: state.redo.filter((s) => s !== action.song) }
    case 'set/lock':
      return { ...state, set: action.set }
    case 'focus/set':
      return { ...state, focus: { song: action.song, genId: action.genId } }
    case 'clip/set':
      return { ...state, clips: { ...state.clips, [action.key]: action.slot } }
    case 'kit/start':
      return {
        ...state,
        kits: { ...state.kits, [action.song]: { lookId: action.lookId, assets: [] } },
        kitPending: { ...state.kitPending, [action.song]: action.count },
      }
    case 'kit/asset': {
      const kit = state.kits[action.song]
      if (!kit) return state
      const left = state.kitPending[action.song]
      return {
        ...state,
        kits: { ...state.kits, [action.song]: { ...kit, assets: [...kit.assets, action.asset] } },
        kitPending: { ...state.kitPending, [action.song]: left ? left - 1 : undefined },
      }
    }
    case 'kit/done':
      return { ...state, kitPending: { ...state.kitPending, [action.song]: undefined } }
    case 'chat/add':
      return { ...state, messages: [...state.messages, action.turn] }
    case 'chat/update':
      return { ...state, messages: state.messages.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)) }
    case 'status/set':
      return { ...state, status: action.status }
    case 'review/set':
      return { ...state, review: action.comments }
    case 'review/add':
      return { ...state, review: [...state.review, action.comment] }
    case 'review/resolve':
      return { ...state, review: state.review.map((c) => (c.id === action.id ? { ...c, resolved: action.resolved ?? !c.resolved } : c)) }
    case 'redo/set':
      return { ...state, redo: action.songs }
    case 'rating/set':
      return { ...state, artistRating: action.rating }
    case 'export/done':
      return { ...state, exported: true }
    case 'version/add': {
      const number = state.versions.length + 1
      return {
        ...state,
        versions: [...state.versions, { number, summary: action.summary, author: action.author, time: clock() }],
        sentVersion: action.sent ? number : state.sentVersion,
      }
    }
  }
}

/**
 * Removes a key moment and renumbers the ones after it, so the show always reads 1, 2, 3… Everything keyed by a
 * moment's number (its images, look, kit, clips, comments) moves with it.
 */
function removeMoment(state: ProjectState, song: number): ProjectState {
  const to = (n: number) => (n > song ? n - 1 : n)
  const rekey = <T,>(record: Record<number, T>) =>
    Object.fromEntries(Object.entries(record).flatMap(([k, v]) => (Number(k) === song ? [] : [[to(Number(k)), v]]))) as Record<number, T>
  return {
    ...state,
    moments: state.moments.filter((m) => m.number !== song).map((m) => ({ ...m, number: to(m.number) })),
    generations: state.generations.filter((g) => g.song !== song).map((g) => ({ ...g, song: to(g.song) })),
    looks: rekey(state.looks),
    pending: rekey(state.pending),
    kits: rekey(state.kits),
    kitPending: rekey(state.kitPending),
    clips: Object.fromEntries(
      Object.entries(state.clips).flatMap(([key, slot]) => {
        const [genId, n] = key.split('|')
        return Number(n) === song ? [] : [[clipKey(genId!, to(Number(n))), slot.status === 'ready' ? { ...slot, clip: { ...slot.clip, momentNumber: to(slot.clip.momentNumber) } } : slot]]
      }),
    ),
    focus: state.focus && state.focus.song !== song ? { ...state.focus, song: to(state.focus.song) } : null,
    review: state.review.filter((c) => c.song !== song).map((c) => ({ ...c, song: to(c.song) })),
    redo: state.redo.filter((n) => n !== song).map(to),
  }
}

/** After a reload, anything that was mid-render can't finish: settle it so nothing spins forever. */
export function settle(state: ProjectState): ProjectState {
  const clips = Object.fromEntries(
    Object.entries(state.clips).flatMap(([k, c]) =>
      c.status === 'ready' ? [[k, c]] : c.previous ? [[k, { status: 'ready', clip: c.previous } as ClipSlot]] : [],
    ),
  )
  return {
    ...state,
    pending: {},
    kitPending: {},
    clips,
    messages: state.messages.map((m) => (m.pending ? { ...m, pending: false, text: m.text || 'Interrupted by a reload.' } : m)),
  }
}

/** How many moments have a look. */
export const looksChosen = (p: Pick<ProjectState, 'moments' | 'looks'>) => p.moments.filter((m) => p.looks[m.number]).length

/** A short label for where a project stands, for the project list. */
export function projectStatusLabel(p: ProjectState): string {
  if (p.phase === 'setup') return 'Writing the brief'
  if (p.status === 'approved') return 'Approved · ready to hand off'
  if (p.status === 'feedback') return `Artist replied · ${p.review.filter((c) => !c.resolved).length} comments open`
  if (p.status === 'awaiting-artist') return 'With the artist'
  return `${looksChosen(p)} of ${p.moments.length} songs in motion`
}

/** The step a project should open on: where its work currently is. */
export function currentStep(p: ProjectState): 'brief' | 'show' | 'review' | 'handoff' {
  if (p.phase === 'setup') return 'brief'
  if (p.status === 'approved') return 'handoff'
  if (p.status === 'awaiting-artist' || p.status === 'feedback') return 'review'
  return 'show'
}

/** In progress, in review or approved: the badge next to a project's name. */
export const STATUS_BADGE = {
  progress: { tone: 'warning', text: 'In progress' },
  review: { tone: 'agent', text: 'In review' },
  approved: { tone: 'success', text: 'Approved' },
} as const

export const statusBadge = (status: ProjectStatus) =>
  STATUS_BADGE[status === 'approved' ? 'approved' : status === 'awaiting-artist' || status === 'feedback' ? 'review' : 'progress']
