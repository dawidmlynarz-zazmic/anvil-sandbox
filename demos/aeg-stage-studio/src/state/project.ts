import { initialBrief } from '~/mocks/project'
import type {
  Brief,
  BriefSection,
  ChatTurn,
  ClipSlot,
  Generation,
  Handoff,
  SetlistMoment,
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
  /** When the brief was written; drives "days to handoff". */
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
  /** setup: the agent is interviewing you for the brief. loop: the show and its handoff. */
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
  /** Batches being made, per moment. */
  pending: Record<number, Pending | undefined>
  clips: Record<string, ClipSlot>
  /** The image open on a moment page, so the chat changes that one. */
  focus: { song: number; genId: string } | null
  messages: ChatTurn[]
  versions: Version[]
  /** The latest handoff for production, or null before the first one. */
  handoff: Handoff | null
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
  | { type: 'focus/set'; song: number; genId: string }
  | { type: 'clip/set'; key: string; slot: ClipSlot }
  | { type: 'chat/add'; turn: ChatTurn }
  | { type: 'chat/update'; id: number; patch: Partial<ChatTurn> }
  | { type: 'handoff/set'; handoff: Handoff }
  | { type: 'export/done' }
  | { type: 'version/add'; summary: string; author: string }

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
    pending: {},
    clips: {},
    focus: null,
    messages: opening,
    versions: [],
    handoff: null,
  }
}

/** Actions that don't count as working on the project (for "updated 5 min ago"). */
const QUIET = new Set<Action['type']>(['chat/update', 'focus/set', 'pending/set'])

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
      return { ...state, looks: { ...state.looks, [action.song]: action.id } }
    case 'focus/set':
      return { ...state, focus: { song: action.song, genId: action.genId } }
    case 'clip/set':
      return { ...state, clips: { ...state.clips, [action.key]: action.slot } }
    case 'chat/add':
      return { ...state, messages: [...state.messages, action.turn] }
    case 'chat/update':
      return { ...state, messages: state.messages.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)) }
    case 'handoff/set':
      return { ...state, handoff: action.handoff }
    case 'export/done':
      return state.handoff ? { ...state, handoff: { ...state.handoff, exported: true } } : state
    case 'version/add': {
      const number = state.versions.length + 1
      return {
        ...state,
        versions: [...state.versions, { number, summary: action.summary, author: action.author, time: clock() }],
      }
    }
  }
}

/**
 * Removes a key moment and renumbers the ones after it, so the show always reads 1, 2, 3… Everything keyed by a
 * moment's number (its images, look, clips) moves with it.
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
    clips: Object.fromEntries(
      Object.entries(state.clips).flatMap(([key, slot]) => {
        const [genId, n] = key.split('|')
        return Number(n) === song ? [] : [[clipKey(genId!, to(Number(n))), slot.status === 'ready' ? { ...slot, clip: { ...slot.clip, momentNumber: to(slot.clip.momentNumber) } } : slot]]
      }),
    ),
    focus: state.focus && state.focus.song !== song ? { ...state.focus, song: to(state.focus.song) } : null,
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
    clips,
    messages: state.messages.map((m) => (m.pending ? { ...m, pending: false, text: m.text || 'Interrupted by a reload.' } : m)),
  }
}

/** How many moments have a look. */
export const looksChosen = (p: Pick<ProjectState, 'moments' | 'looks'>) => p.moments.filter((m) => p.looks[m.number]).length

/** A short label for where a project stands, for the project list. */
export function projectStatusLabel(p: ProjectState): string {
  if (p.phase === 'setup') return 'Writing the brief'
  if (p.handoff) return `Handed off · v${p.handoff.version}`
  return `${looksChosen(p)} of ${p.moments.length} songs in motion`
}

/** The page a project should open on: where its work currently is. */
export function currentStep(p: ProjectState): 'brief' | 'show' | 'handoff' {
  if (p.phase === 'setup') return 'brief'
  if (p.handoff) return 'handoff'
  return 'show'
}

/** In progress or handed off: the badge next to a project's name. */
export const STATUS_BADGE = {
  progress: { tone: 'warning', text: 'In progress' },
  handedOff: { tone: 'success', text: 'Handed off' },
} as const

export const statusBadge = (p: Pick<ProjectState, 'handoff'>) => STATUS_BADGE[p.handoff ? 'handedOff' : 'progress']

/** Every song has a look: the show can be handed off. */
export const showComplete = (p: Pick<ProjectState, 'moments' | 'looks'>) => p.moments.length > 0 && looksChosen(p) === p.moments.length

/** The show has changed since its last handoff: a song added, removed or renamed, a new look, or a new clip version. */
export function handoffOutOfDate(p: Pick<ProjectState, 'handoff' | 'moments' | 'looks' | 'clips'>): boolean {
  const h = p.handoff
  if (!h) return false
  if (h.songs.length !== p.moments.length) return true
  return h.songs.some((s, i) => {
    const m = p.moments[i]!
    const slot = p.clips[clipKey(s.lookId, m.number)]
    const clip = slot?.status === 'ready' ? slot.clip : undefined
    return m.number !== s.moment.number || m.title !== s.moment.title || p.looks[m.number] !== s.lookId || clip?.version !== s.clip?.version || clip?.edits.length !== s.clip?.edits.length
  })
}
