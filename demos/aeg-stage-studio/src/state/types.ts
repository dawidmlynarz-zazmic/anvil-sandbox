export type TimeOfDay = 'daylight' | 'golden-hour' | 'night'
export type Crowd = 'half' | 'full'
export type StageView = 'front-of-house' | 'back-of-field' | 'livestream-cam'

export interface Venue {
  id: string
  name: string
  kind: string
  specs: { stageWidth: string; ledWall: string; rigging: string; model3d: string }
}

export interface SetlistMoment {
  number: number
  title: string
  intent: string
}

export interface Brief {
  venueId: string
  slot: { day: string; time: string; length: string; note: string }
  keywords: string[]
  referenceCount: number
  constraints: { budget: string; venueRules: string; noGo: string }
  moments: SetlistMoment[]
}

export interface BriefInput {
  description: string
  attachments?: string[]
}

export interface StillsRequest {
  round: number
  /** The project id, so concepts in different projects never share ids or images. */
  project?: string
  timeOfDay: TimeOfDay
  crowd: Crowd
  view: StageView
}

export interface Still {
  id: string
  round: number
  /** Concept letter, A–D. */
  concept: string
  title: string
  /** 2D fallback art, shown until (or instead of) the 3D render. */
  image: string
  /** What the 3D renderer draws for this concept. Missing on concepts saved before the 3D renderer existed. */
  spec?: StillSpec
  /** This concept's version (1 when first generated). Refine, regenerate and variations make the next one. */
  version?: number
  /** What produced this version, in words: “Sharper top edge”, “Regenerated”. */
  change?: string
  /** Earlier versions, oldest first. */
  history?: StillVersion[]
  /** The user said “not this direction”: kept, greyed out, and avoided by the next round. */
  dismissed?: boolean
  /** “More like this”: three candidates waiting to be picked, or still being made. */
  variants?: StillSpec[] | 'generating'
  /** Work in progress on this concept. */
  busy?: 'refining' | 'regenerating'
  /** Changes the user has noted but not applied yet; applying them makes the next version. */
  annotations?: Annotation[]
  /** This design has been reworked since it was first generated (drives the brief check). */
  reworked?: boolean
}

/** A change to make, pinned to a spot on the image (x, y: 0–100) or about the whole concept. */
export interface Annotation {
  number: number
  text: string
  x?: number
  y?: number
}

export interface StillVersion {
  version: number
  image: string
  spec?: StillSpec
  change?: string
  /** The annotations that produced the version after this one. */
  annotations?: Annotation[]
  reworked?: boolean
}

export type ConceptShape = 'arch' | 'monolith' | 'ribbons' | 'halo'

/** Visible design changes on top of a concept: what a rework or a variation actually alters in the render. */
export interface StageTweaks {
  /** Horizontal size of the centrepiece (1 = as designed). */
  width?: number
  /** Raises (+) or lowers (−) the centrepiece, in metres. */
  lift?: number
  palette?: 'warm' | 'gold' | 'cool' | 'white'
  /** Extra atmospheric haze, 0–1. */
  haze?: number
  /** LED and lamp intensity (1 = as designed). */
  brightness?: number
}

/** The 3D stage a concept shows. Mirrors the renderer's StageSpec without importing three.js into state. */
export interface StillSpec {
  concept: ConceptShape
  /** A second centrepiece, for a concept that combines two (e.g. an arch around a monolith). */
  with?: ConceptShape
  timeOfDay: TimeOfDay
  crowd: Crowd
  view: StageView
  seed: number
  tweaks?: StageTweaks
}

export interface Round {
  number: number
  note: string
  settings: Omit<StillsRequest, 'round'>
  stills: Still[]
  done: boolean
  /** The brief revision this round was generated from, so the app can tell when the brief has moved on. */
  briefRevision: number
}

/** draft → awaiting-artist (sent, no reply yet) → feedback (the artist commented) → approved. Request changes goes back to draft. */
export type ProjectStatus = 'draft' | 'awaiting-artist' | 'feedback' | 'approved'

export interface MotionRequest {
  stillId: string
  momentNumber: number
}

export interface MotionClip {
  id: string
  momentNumber: number
  title: string
  poster: string
  /** The same shot at night, for the "Compare night" view. */
  posterNight: string
  seconds: number
  cue: { lighting: string; led: string; camera: string }
  version: number
  /** Plain-language edits applied so far, oldest first. */
  edits: string[]
}

export type ClipSlot =
  | { status: 'ready'; clip: MotionClip }
  | { status: 'generating'; previous?: MotionClip }

export interface ChatTurn {
  id: number
  role: 'user' | 'assistant'
  text: string
  pending?: boolean
  thinking?: Thinking
  /** One-tap answers shown under this turn (only the latest turn's are offered). */
  suggestions?: string[]
  /** Shows the mood board and setlist the user attached to this turn. */
  attachments?: boolean
}

export interface StillComment {
  id: number
  stillId: string
  text: string
  /** The round the note was written in. Once a later round exists, the note has been used. */
  round: number
}

export const TIME_LABEL: Record<TimeOfDay, string> = {
  daylight: 'Daylight',
  'golden-hour': 'Golden hour',
  night: 'Night',
}
export const CROWD_LABEL: Record<Crowd, string> = { half: 'Half crowd', full: 'Full crowd' }
export const VIEW_LABEL: Record<StageView, string> = {
  'front-of-house': 'Front of house',
  'back-of-field': 'Back of field',
  'livestream-cam': 'Livestream cam',
}

export interface ToolCall {
  name: string
  summary: string
  input: string
  output?: string
  status: 'running' | 'done'
  seconds?: number
}

/** What the agent did to produce an answer, shown above it so the process is never a black box. */
export interface Thinking {
  title: string
  reasoning: string
  steps: string[]
  tools: ToolCall[]
  seconds?: number
}

/** A comment from the artist: pinned on a concept image, or on one song's motion clip. */
export interface ReviewComment {
  id: string
  number: number
  stillId: string
  target: { kind: 'concept'; x: number; y: number } | { kind: 'clip'; song: number }
  author: string
  time: string
  text: string
  resolved: boolean
  /** The round that took this comment on (Request changes), shown as “Addressed in round N”. */
  addressedIn?: number
}

/** One entry in the project's real history. Numbers count up from v1 as things happen. */
export interface Version {
  number: number
  summary: string
  author: string
  time: string
}

export type BriefSection = 'venue' | 'slot' | 'visual' | 'constraints' | 'moments'
