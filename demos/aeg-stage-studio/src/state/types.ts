export type TimeOfDay = 'daylight' | 'golden-hour' | 'night'
export type Crowd = 'half' | 'full'
export type StageView = 'front-of-house' | 'back-of-field' | 'livestream-cam'

export interface Venue {
  id: string
  name: string
  /** “Arena”, “Festival main stage”, “Festival tent”. */
  kind: string
  /** The festival a stage belongs to (Coachella, Stagecoach…), for festival stages. */
  event?: string
  /** Tents and arenas have a roof: always lit as night. */
  covered?: boolean
  city: string
  /** Facts as AEG publishes them (aegworldwide.com). Missing where AEG doesn't publish them. */
  capacity?: string
  opened?: string
  about?: string
  /** Where the facts come from. */
  source: string
  /** Sample technical specs, labelled as samples until AEG supplies the real ones. */
  specs: { stageWidth: string; ledWall: string; rigging: string; model3d: string }
}

/** A key moment: one song where the stage does something memorable. The unit the show is designed in. */
export interface SetlistMoment {
  number: number
  title: string
  intent: string
}

export interface Brief {
  venueId: string
  /** `date` is the show day ("2027-04-17"); `day` is its weekday. */
  slot: { day: string; date?: string; time: string; length: string; note: string }
  keywords: string[]
  referenceCount: number
  constraints: { budget: string; venueRules: string; noGo: string }
}

export interface BriefInput {
  description: string
  attachments?: string[]
}

/** A change to make, pinned to a spot on the image (x, y: 0–100) or about the whole image. */
export interface Annotation {
  number: number
  text: string
  x?: number
  y?: number
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

/** The 3D stage an image shows. Mirrors the renderer's StageSpec without importing three.js into state. */
export interface StillSpec {
  concept: ConceptShape
  /** A second centrepiece, for a design that combines two (e.g. an arch around a monolith). */
  with?: ConceptShape
  timeOfDay: TimeOfDay
  crowd: Crowd
  view: StageView
  seed: number
  tweaks?: StageTweaks
}

/** What made a generation: a batch the agent explored, or one change to one image. */
export type GenSource = 'directions' | 'more' | 'angles' | 'light' | 'edit' | 'take'

/**
 * One image explored for a key moment. Generations are never replaced: a change makes a child (`parentId`), so the
 * whole exploration stays browsable, comparable and branchable.
 */
export interface Generation {
  id: string
  /** The key moment (song number) it was explored for. */
  song: number
  /** Running number within the moment: “#12”. */
  n: number
  /** Which batch it came in. Batches are the moment's rounds of exploration, newest last. */
  batch: number
  parentId?: string
  source: GenSource
  /** “Open-air arch”, or “Open-air arch with monolith”. */
  title: string
  /** What's different about it, in a few words: “Wider and raised”, “Back of field”. */
  caption: string
  spec: StillSpec
  /** 2D fallback art for browsers without WebGL. */
  image: string
  /** Who asked for it: the agent exploring, or you (a change, a batch you started). */
  author: 'agent' | 'you'
  /** Set aside: “not this direction”. Kept, greyed out, and left out of later batches. */
  dismissed?: boolean
  /** Changes noted on it, not yet applied; applying makes a child. */
  annotations?: Annotation[]
  /** Reworked from an earlier design: clears the brief check's first-design risk. */
  reworked?: boolean
  /** When it was made (clock time), for its provenance. */
  at?: string
}

export type AssetKind = 'angle' | 'light' | 'motion'

/**
 * One deliverable in a moment's asset kit, made from its look: the look from another camera position, in another light
 * state, or in motion with another camera move. Kits are what production and content teams build from.
 */
export interface Asset {
  id: string
  kind: AssetKind
  /** “Back of field”, “Night”, “Slow push-in”. */
  title: string
  /** What it shows, for stills (angles and light states). */
  spec?: StillSpec
  /** The clip, for motion variants. */
  clip?: MotionClip
  model: string
  prompt: string
  at: string
}

/** A moment's asset kit, built from one look. When the look changes, the kit is out of date until it's rebuilt. */
export interface Kit {
  lookId: string
  assets: Asset[]
}

/** The show's physical set: the structure every moment shares once it's locked. */
export interface ShowSet {
  /** The generation the set was taken from. */
  fromId: string
  concept: ConceptShape
  with?: ConceptShape
  /** Structure only: size and height. Palette, haze and brightness stay free per moment. */
  width: number
  lift: number
  title: string
}

/** draft → awaiting-artist (sent, no reply yet) → feedback (the artist commented) → approved. Request changes goes back to draft. */
export type ProjectStatus = 'draft' | 'awaiting-artist' | 'feedback' | 'approved'

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
  /** The camera move (0 crane up, 1 slow push-in, 2 locked wide). Defaults to the song's own. */
  move?: number
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
  /**
   * The brief's opening questions. On the agent's turn, `'ask'` shows the Clarifying Question card; on the user's turn,
   * the answers given (question id → chosen option, or null when skipped).
   */
  profile?: 'ask' | Record<string, string | null>
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

/** A comment from the artist on one key moment: pinned on its look, or on its clip. */
export interface ReviewComment {
  id: string
  number: number
  song: number
  /** The look it was written on. */
  genId: string
  target: { kind: 'look'; x: number; y: number } | { kind: 'clip' }
  author: string
  time: string
  text: string
  resolved: boolean
  /** Taken into changes (Request changes), shown as “Changes requested”. */
  addressed?: boolean
}

/** One entry in the project's real history. Numbers count up from v1 as things happen. */
export interface Version {
  number: number
  summary: string
  author: string
  time: string
}

export type BriefSection = 'venue' | 'slot' | 'visual' | 'constraints'
