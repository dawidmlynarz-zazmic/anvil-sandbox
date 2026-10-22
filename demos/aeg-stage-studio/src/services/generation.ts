import { stageArt, type ArtShape } from '~/mocks/art'
import { initialBrief } from '~/mocks/project'
import { conceptTitle, SHAPES, type ConceptPlan } from './rounds'
import type {
  Brief,
  BriefInput,
  MotionClip,
  MotionRequest,
  Still,
  StillsRequest,
} from '~/state/types'

// Mocked adapter. The signatures match the plan so Agent Platform calls can replace it without touching the UI.
export interface GenerationService {
  draftBrief(input: BriefInput): Promise<Brief>
  generateStills(req: StillsRequest, plan?: ConceptPlan[]): AsyncIterable<Still> // yields one at a time
  generateMotion(req: MotionRequest): Promise<MotionClip>
  editMotion(clipId: string, instruction: string): Promise<MotionClip>
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const between = (min: number, max: number) => min + Math.random() * (max - min)

const CONCEPTS: { letter: string; title: string; shape: ArtShape }[] = [
  { letter: 'A', title: 'Open-air arch', shape: 'arch' },
  { letter: 'B', title: 'Stone monolith', shape: 'monolith' },
  { letter: 'C', title: 'Kinetic LED ribbons', shape: 'ribbons' },
  { letter: 'D', title: 'Floating halo', shape: 'halo' },
]

const CUES = [
  { lighting: 'Low amber wash, rising to white on the downbeat', led: 'Slow desert horizon, dust particles', camera: 'Crane up from pit, 6 s' },
  { lighting: 'Backlight sweep, magenta to deep blue', led: 'Sun disc setting behind the monolith', camera: 'Slow push-in on the artist' },
  { lighting: 'Split-colour halves, mirrored', led: 'Two panels drifting apart', camera: 'Locked wide, front of house' },
]

const clipFor = (stillId: string, momentNumber: number, version = 1, edits: string[] = []): MotionClip => {
  const concept = CONCEPTS.find((c) => stillId.endsWith(c.letter)) ?? CONCEPTS[1]!
  const seed = `${stillId}-${momentNumber}-${version}`
  return {
    id: `clip-${stillId}-${momentNumber}-${version}`,
    momentNumber,
    title: `Song ${momentNumber}`,
    poster: stageArt(seed, concept.shape, 'golden-hour'),
    posterNight: stageArt(seed, concept.shape, 'night'),
    seconds: 8,
    cue: CUES[momentNumber % CUES.length]!,
    version,
    edits,
  }
}

/**
 * A round's four concepts, synchronously. Without a plan they are the four starting directions; with one (built from
 * the user's selection, see planRound) each slot draws what the plan says. `project` keeps ids distinct between projects.
 */
export function stillsFor(req: StillsRequest, plan?: ConceptPlan[]): Still[] {
  const prefix = req.project ? `${req.project}.` : ''
  // Rounds and projects vary the render slightly (proportions, crowd), so round 2's B is a new take on B.
  const seed = [...`${prefix}${req.round}`].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % 997
  const slots: ConceptPlan[] = plan ?? SHAPES.map((shape) => ({ shape, why: 'fresh' }))
  return CONCEPTS.map((concept, i) => {
    const slot = slots[i] ?? { shape: concept.shape as ConceptPlan['shape'], why: 'fresh' }
    return {
      id: `${prefix}r${req.round}-${concept.letter}`,
      round: req.round,
      concept: concept.letter,
      title: `${concept.letter}${req.round} · ${conceptTitle(slot.shape, slot.with)}`,
      image: stageArt(
        `${prefix}r${req.round}-${concept.letter}-${req.timeOfDay}-${req.view}`,
        slot.shape,
        req.timeOfDay,
        req.crowd === 'full' ? 1.4 : 0.7,
      ),
      spec: { concept: slot.shape, with: slot.with, tweaks: slot.tweaks, timeOfDay: req.timeOfDay, crowd: req.crowd, view: req.view, seed },
      reworked: slot.reworked,
    }
  })
}

/** A clip that is already rendered when the user arrives at Motion. Synchronous, so state can be seeded. */
export const seedClip = (stillId: string, momentNumber: number) => clipFor(stillId, momentNumber)

export const generation: GenerationService = {
  async draftBrief(input) {
    await sleep(between(1500, 2500))
    const extra = input.description.trim().split(/\s+/).slice(0, 2).join(' ')
    return {
      ...initialBrief,
      keywords: extra ? [...initialBrief.keywords, extra] : initialBrief.keywords,
    }
  },

  async *generateStills(req, plan) {
    await sleep(between(1200, 1800))
    for (const still of stillsFor(req, plan)) {
      yield still
      await sleep(between(400, 900))
    }
  },

  async generateMotion(req) {
    await sleep(between(2000, 3500))
    return clipFor(req.stillId, req.momentNumber)
  },

  async editMotion(clipId, instruction) {
    await sleep(between(2000, 3500))
    const [, stillId = 'r1-B', moment = '14', version = '1'] = /^clip-(.+)-(\d+)-(\d+)$/.exec(clipId) ?? []
    return clipFor(stillId, Number(moment), Number(version) + 1, [instruction])
  },
}
