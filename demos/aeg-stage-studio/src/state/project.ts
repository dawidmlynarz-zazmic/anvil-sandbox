import { initialBrief } from '~/mocks/project'
import { seedClip } from '~/services/generation'
import type {
  Brief,
  BriefSection,
  ChatTurn,
  ClipSlot,
  ProjectStatus,
  ReviewComment,
  Round,
  Still,
  StillComment,
  StillsRequest,
  Version,
} from './types'

export type Settings = Omit<StillsRequest, 'round' | 'project'>

/** Clips are keyed by concept and song, so each selected concept has its own storyboard. */
export const clipKey = (stillId: string, song: number) => `${stillId}|${song}`

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

/** Everything about one project: its brief, its loop and its conversation. */
export interface ProjectState {
  meta: ProjectMeta
  /** setup: the agent is interviewing you for the brief. loop: Stills → Motion → Review → Handoff. */
  phase: 'setup' | 'loop'
  /** Which interview question the agent is on, during setup. */
  setupStep: number
  /** The opening questions (stage, time, look) have been answered or skipped. */
  profiled?: boolean
  brief: Brief
  briefRevision: number
  provenance: Record<BriefSection, Provenance>
  rounds: Round[]
  selected: string[]
  comments: StillComment[]
  feedback: string[]
  motionStills: string[]
  clips: Record<string, ClipSlot>
  motionFocus: { stillId: string; song: number } | null
  messages: ChatTurn[]
  status: ProjectStatus
  review: ReviewComment[]
  versions: Version[]
  sentVersion: number | null
  reached: number
  /** The artist's 1–5 rating at sign-off: “How close is this to your vision?” */
  artistRating?: number | null
  /** The one design approved for production. */
  approvedStill?: string | null
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
  | { type: 'round/start'; round: Round }
  | { type: 'round/still'; round: number; still: Still }
  | { type: 'round/done'; round: number }
  | { type: 'still/patch'; id: string; patch: Partial<Still> }
  | { type: 'round/view'; round: number; settings: Settings }
  | { type: 'still/select'; id: string }
  | { type: 'selection/set'; ids: string[] }
  | { type: 'approve/still'; id: string }
  | { type: 'export/done' }
  | { type: 'comment/set'; stillId: string; text: string; round: number; id: number }
  | { type: 'comment/remove'; stillId: string }
  | { type: 'feedback/add'; text: string }
  | { type: 'feedback/clear' }
  | { type: 'motion/start'; ids: string[]; songs: number[] }
  | { type: 'motion/focus'; stillId: string; song: number }
  | { type: 'clip/set'; key: string; slot: ClipSlot }
  | { type: 'chat/add'; turn: ChatTurn }
  | { type: 'chat/update'; id: number; patch: Partial<ChatTurn> }
  | { type: 'status/set'; status: ProjectStatus }
  | { type: 'review/set'; comments: ReviewComment[] }
  | { type: 'review/resolve'; id: string; resolved?: boolean }
  | { type: 'review/add'; comment: ReviewComment }
  | { type: 'rating/set'; rating: number | null }
  | { type: 'version/add'; summary: string; author: string; sent?: boolean }

const SECTION_OF: Record<keyof Brief, BriefSection> = {
  venueId: 'venue',
  slot: 'slot',
  keywords: 'visual',
  referenceCount: 'visual',
  constraints: 'constraints',
  moments: 'moments',
}

export const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const ALL_SECTIONS: BriefSection[] = ['venue', 'slot', 'visual', 'constraints', 'moments']

/** A blank project, ready for the agent's brief interview. */
export function newProject(id: string, opening: ChatTurn[], show?: { artist: string; event: string }): ProjectState {
  const now = Date.now()
  return {
    meta: { id, artist: show?.artist || 'New project', event: show?.event || 'Brief in progress', createdAt: now, updatedAt: now, briefDate: now },
    phase: 'setup',
    setupStep: 0,
    // A new project starts empty: no keywords, moments or no-gos until someone actually sets them.
    brief: { ...initialBrief, keywords: [], referenceCount: 0, moments: [], constraints: { ...initialBrief.constraints, noGo: '' } },
    briefRevision: 1,
    provenance: Object.fromEntries(ALL_SECTIONS.map((s) => [s, 'pending'])) as Record<BriefSection, Provenance>,
    rounds: [],
    selected: [],
    comments: [],
    feedback: [],
    motionStills: [],
    clips: {},
    motionFocus: null,
    messages: opening,
    status: 'draft',
    review: [],
    versions: [],
    sentVersion: null,
    reached: 0,
    artistRating: null,
  }
}

const mapRound = (state: ProjectState, number: number, fn: (r: Round) => Round): ProjectState => ({
  ...state,
  rounds: state.rounds.map((r) => (r.number === number ? fn(r) : r)),
})

function unlock(state: ProjectState, action: Action): number {
  if (action.type === 'round/start') return Math.max(state.reached, 1)
  if (action.type === 'motion/start') return Math.max(state.reached, 2)
  if (action.type === 'status/set' && action.status !== 'draft') return 3
  return state.reached
}

export function projectReducer(state: ProjectState, action: Action): ProjectState {
  const next = step(state, action)
  const reached = unlock(state, action)
  const touched = action.type === 'chat/update' || action.type === 'motion/focus' ? next.meta : { ...next.meta, updatedAt: Date.now() }
  return { ...next, reached, meta: touched }
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
    case 'round/start':
      return { ...state, rounds: [...state.rounds.filter((r) => r.number !== action.round.number), action.round] }
    case 'round/still':
      return mapRound(state, action.round, (r) => ({ ...r, stills: [...r.stills, action.still] }))
    case 'round/done':
      return mapRound(state, action.round, (r) => ({ ...r, done: true }))
    case 'still/patch':
      return {
        ...state,
        rounds: state.rounds.map((r) => ({ ...r, stills: r.stills.map((st) => (st.id === action.id ? { ...st, ...action.patch } : st)) })),
      }
    case 'round/view':
      // Same designs, seen differently: only the scene each concept is rendered in changes.
      return mapRound(state, action.round, (r) => ({
        ...r,
        settings: action.settings,
        stills: r.stills.map((st) => (st.spec ? { ...st, spec: { ...st.spec, ...action.settings } } : st)),
      }))
    case 'still/select':
      return {
        ...state,
        selected: state.selected.includes(action.id) ? state.selected.filter((id) => id !== action.id) : [...state.selected, action.id],
      }
    case 'comment/set': {
      const others = state.comments.filter((c) => c.stillId !== action.stillId)
      return { ...state, comments: [...others, { id: action.id, stillId: action.stillId, text: action.text, round: action.round }] }
    }
    case 'comment/remove':
      return { ...state, comments: state.comments.filter((c) => c.stillId !== action.stillId) }
    case 'feedback/add':
      return { ...state, feedback: [...state.feedback, action.text] }
    case 'feedback/clear':
      return { ...state, feedback: [] }
    case 'motion/start': {
      const clips = { ...state.clips }
      for (const id of action.ids) {
        if (action.songs.some((song) => clips[clipKey(id, song)])) continue
        // Every key moment but the last is already rendered on arrival; the last is still rendering.
        action.songs.forEach((song, i) => {
          clips[clipKey(id, song)] = i < action.songs.length - 1 ? { status: 'ready', clip: seedClip(id, song) } : { status: 'generating' }
        })
      }
      return { ...state, motionStills: action.ids, clips }
    }
    case 'motion/focus':
      return { ...state, motionFocus: { stillId: action.stillId, song: action.song } }
    case 'clip/set':
      return { ...state, clips: { ...state.clips, [action.key]: action.slot } }
    case 'chat/add':
      return { ...state, messages: [...state.messages, action.turn] }
    case 'chat/update':
      return { ...state, messages: state.messages.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)) }
    case 'status/set':
      return { ...state, status: action.status }
    case 'selection/set':
      return { ...state, selected: action.ids }
    case 'approve/still':
      return { ...state, approvedStill: action.id }
    case 'export/done':
      return { ...state, exported: true }
    case 'review/set':
      return { ...state, review: action.comments }
    case 'review/add':
      return { ...state, review: [...state.review, action.comment] }
    case 'rating/set':
      return { ...state, artistRating: action.rating }
    case 'review/resolve':
      return { ...state, review: state.review.map((c) => (c.id === action.id ? { ...c, resolved: action.resolved ?? !c.resolved } : c)) }
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

/** After a reload, anything that was mid-render can't finish: settle it so nothing spins forever. */
export function settle(state: ProjectState): ProjectState {
  const clips = Object.fromEntries(
    Object.entries(state.clips).flatMap(([k, c]) =>
      c.status === 'ready' ? [[k, c]] : c.previous ? [[k, { status: 'ready', clip: c.previous } as ClipSlot]] : [],
    ),
  )
  return {
    ...state,
    rounds: state.rounds.map((r) => ({ ...r, done: true })),
    clips,
    messages: state.messages.map((m) => (m.pending ? { ...m, pending: false, text: m.text || 'Interrupted by a reload.' } : m)),
  }
}

/** A short label for where a project stands, for the project list. */
export function projectStatusLabel(p: ProjectState): string {
  if (p.phase === 'setup') return 'Setting up the brief'
  if (p.status === 'approved') return 'Approved · handoff ready'
  if (p.status === 'feedback') return `Artist replied · ${p.review.filter((c) => !c.resolved).length} open`
  if (p.status === 'awaiting-artist') return 'Waiting for the artist'
  if (p.motionStills.length) return `Version ${p.versions.length} · in motion`
  if (p.rounds.length) return `Round ${p.rounds.length} · concepts`
  return 'Brief ready'
}

/** The step a project should open on: where its work currently is. */
export function currentStep(p: ProjectState): 'brief' | 'stills' | 'motion' | 'review' | 'handoff' {
  if (p.phase === 'setup') return 'brief'
  if (p.status === 'approved') return 'handoff'
  if (p.status === 'awaiting-artist' || p.status === 'feedback') return 'review'
  if (p.motionStills.length && p.sentVersion === null) return 'motion'
  return 'stills'
}
