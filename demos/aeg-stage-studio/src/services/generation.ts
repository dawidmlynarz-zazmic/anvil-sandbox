import { stageArt } from '~/mocks/art'
import { initialBrief } from '~/mocks/project'
import type { Brief, BriefInput, Generation, MotionClip } from '~/state/types'

// Mocked adapter. The signatures match the plan so Agent Platform calls can replace it without touching the UI.
export interface GenerationService {
  draftBrief(input: BriefInput): Promise<Brief>
  /** Renders one image for a planned generation (Nano Banana Pro in the pilot). */
  renderImage(gen: Generation): Promise<Generation>
  generateMotion(look: Generation, song: number): Promise<MotionClip>
  editMotion(look: Generation, clip: MotionClip, instruction: string): Promise<MotionClip>
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const between = (min: number, max: number) => min + Math.random() * (max - min)

const CUES = [
  { lighting: 'Low wash, rising to full white on the downbeat', led: 'A slow horizon of light, drifting particles', camera: 'Crane up from the pit, 6 s' },
  { lighting: 'Backlight sweep, colour fading to deep blue', led: 'A disc of light rising behind the centrepiece', camera: 'Slow push-in on the artist' },
  { lighting: 'Split-colour halves, mirrored', led: 'Two panels drifting apart', camera: 'Locked wide, front of house' },
]

/** The camera moves, in the renderer's order (StageScene MOVES). */
export const MOVE_TITLE = ['Crane up from the pit', 'Slow push-in', 'Locked wide'] as const

/** A song's own camera move, unless a variant asks for another. */
export const moveOf = (clip: MotionClip) => clip.move ?? clip.momentNumber % CUES.length

/** A key moment's eight-second clip of its look. Synchronous, so state can be seeded with it. */
export function clipFor(look: Generation, song: number, version = 1, edits: string[] = [], move?: number): MotionClip {
  const seed = `${look.id}-${song}-${version}${move === undefined ? '' : `-m${move}`}`
  return {
    id: `clip-${seed}`,
    momentNumber: song,
    title: `Song ${song}`,
    poster: stageArt(seed, look.spec.concept, look.spec.timeOfDay),
    posterNight: stageArt(seed, look.spec.concept, 'night'),
    seconds: 8,
    cue: CUES[move ?? song % CUES.length]!,
    version,
    edits,
    move,
  }
}

export const generation: GenerationService = {
  async draftBrief(input) {
    await sleep(between(1500, 2500))
    const extra = input.description.trim().split(/\s+/).slice(0, 2).join(' ')
    return { ...initialBrief, keywords: extra ? [...initialBrief.keywords, extra] : initialBrief.keywords }
  },

  async renderImage(gen) {
    await sleep(between(400, 900))
    return gen
  },

  async generateMotion(look, song) {
    await sleep(between(2000, 3500))
    return clipFor(look, song)
  },

  async editMotion(look, clip, instruction) {
    await sleep(between(2000, 3500))
    return clipFor(look, clip.momentNumber, clip.version + 1, [...clip.edits, instruction], clip.move)
  },
}
