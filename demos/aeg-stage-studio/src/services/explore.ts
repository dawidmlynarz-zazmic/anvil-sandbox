import { stageArt } from '~/mocks/art'
import { TIME_LABEL, VIEW_LABEL, type Generation, type GenSource, type ShowSet, type StageTweaks, type StageView, type StillSpec, type TimeOfDay } from '~/state/types'
import { hybridFrom, listing, SHAPE_WORDS, take, tweaksFrom } from './changes'
import { capitalise, conceptTitle, describeLook, describeTweaks, lowerFirst, SHAPES, SHAPE_SHORT } from './shapes'

// Mocked exploration. A batch is a few images for one key moment, planned from what you ask for: new directions,
// more like the open image, other camera angles, or other light. Before the set is locked, a batch may try any
// structure; after, every image keeps the set's structure and varies only the look (palette, haze, brightness).

export type BatchKind = 'directions' | 'more' | 'angles' | 'light'

/** A planned image, before it has an id and a number. */
export interface Draft {
  spec: StillSpec
  title: string
  caption: string
  source: GenSource
  /** The description the image was made from. */
  prompt?: string
  parentId?: string
  reworked?: boolean
}

export interface BatchContext {
  /** The light this moment plays in (from the brief's time slot). */
  light: TimeOfDay
  covered: boolean
  set: ShowSet | null
  /** This moment's generations so far. */
  existing: Generation[]
  /** The image the batch starts from (more, angles, light). */
  base?: Generation
  /** Words to apply to every image, e.g. the artist's comments. */
  notes?: string[]
  /**
   * Your description of the stage, for new directions. The preview reads the design it names (arch, monolith, ribbons,
   * halo, or two combined) and any size, height, colour, haze or brightness words; the pilot model reads all of it.
   */
  prompt?: string
}

/** Keeps the set's structure (shape, size, height) and whatever look the tweaks give. */
export function onSet(spec: StillSpec, set: ShowSet | null, tweaks: StageTweaks = spec.tweaks ?? {}): StillSpec {
  if (!set) return { ...spec, tweaks }
  return { ...spec, concept: set.concept, with: set.with, tweaks: { ...tweaks, width: set.width, lift: set.lift } }
}

/** Whether an image shows the locked set's structure. */
export const matchesSet = (spec: StillSpec, set: ShowSet | null) =>
  !set || (spec.concept === set.concept && spec.with === set.with && (spec.tweaks?.width ?? 1) === set.width && (spec.tweaks?.lift ?? 0) === set.lift)

const seedOf = (n: number, song: number) => (n * 37 + song * 101) % 997

/** Captions in a sentence, each quoted so multi-part ones stay readable: “warm light, in haze” and “gold light”. */
const quoted = (captions: string[]) => listing(captions.map((c) => `“${c.toLowerCase()}”`))

export const BATCH_LABEL: Record<BatchKind, string> = {
  directions: 'New directions',
  more: 'More like this',
  angles: 'Other angles',
  light: 'Other light',
}

/** What a batch will make, and the agent's one-line summary of it (which only claims what the images show). */
export function planBatch(kind: BatchKind, ctx: BatchContext): { drafts: Draft[]; summary: string } {
  const n = ctx.existing.length
  const base = ctx.base
  const { set } = ctx
  const prompt = ctx.prompt?.trim() ?? ''
  const notes = [prompt, ...(ctx.notes ?? [])].filter(Boolean).join('. ')
  const withNotes = (t: StageTweaks) => (notes ? tweaksFrom(notes, t).tweaks : t)
  const understood = prompt ? tweaksFrom(prompt).applied : []
  /** What the agent says about a description it could only partly show. */
  const unread = (shown: boolean) =>
    prompt && !shown ? ` This preview shows a design’s shape, size, colour, haze and brightness, so it can’t show the rest of “${prompt}”; in the pilot, Nano Banana Pro works from your words directly.` : ''
  const fresh = (spec: Omit<StillSpec, 'seed' | 'crowd' | 'view' | 'timeOfDay'> & Partial<StillSpec>, i: number): StillSpec => ({
    crowd: 'full',
    view: 'front-of-house',
    timeOfDay: ctx.light,
    seed: seedOf(n + i, 1),
    ...spec,
  })

  if (kind === 'directions') {
    if (set) {
      const drafts = [0, 1, 2, 3].map((i): Draft => {
        const spec = onSet(fresh({ concept: set.concept, with: set.with }, i), set, withNotes(take(n + i).tweaks))
        return { spec, title: set.title, caption: capitalise(describeLook(spec.tweaks) || 'original light'), source: prompt ? 'prompt' : 'directions', prompt: prompt || undefined }
      })
      return {
        drafts,
        summary: `Four new looks on the stage set${prompt ? ' from your description' : ''}: ${quoted(drafts.map((d) => d.caption))}. The structure stays as locked.${unread(understood.length > 0)}`,
      }
    }
    const dismissed = [...new Set(ctx.existing.filter((g) => g.dismissed).map((g) => g.spec.concept))]
    const allowed = SHAPES.filter((s) => !dismissed.includes(s))
    // A description that names a design (or two, combined) gets four takes on it; otherwise the open directions.
    const hybrid = prompt ? hybridFrom(prompt) : undefined
    const named = prompt ? SHAPES.filter((s) => SHAPE_WORDS[s].test(prompt)) : []
    const pool = hybrid ? [hybrid[0]] : named.length ? named : allowed.length ? allowed : SHAPES
    const first = n === 0
    const drafts = [0, 1, 2, 3].map((i): Draft => {
      const shape = pool[i % pool.length]!
      const second = hybrid?.[1]
      // The first batch shows each direction as designed; later ones (and repeats) vary them, so nothing repeats.
      // From a description, the variations skip the takes its words would cancel out (a warm note over a cool take).
      const variation = prompt ? (i === 0 ? {} : take(n + [0, 1, 3, 5][i]!).tweaks) : first && i < pool.length ? {} : take(n + i).tweaks
      const tweaks = withNotes(variation)
      const title = conceptTitle(shape, second)
      return { spec: fresh({ concept: shape, with: second, tweaks }, i), title, caption: describeTweaks(tweaks) ? `${title}, ${describeTweaks(tweaks)}` : title, source: prompt ? 'prompt' : 'directions', prompt: prompt || undefined }
    })
    const left = dismissed.length && allowed.length ? ` I left out the ${listing(dismissed.map((s) => SHAPE_SHORT[s]))} you set aside.` : ''
    if (prompt) {
      const designs = listing([...new Set(drafts.map((d) => lowerFirst(d.title)))])
      // Nothing in the description that the preview can draw: say so, and offer open directions instead.
      if (!hybrid && !named.length && !understood.length)
        return {
          drafts,
          summary: `This preview can’t draw “${prompt}”, so here are four open directions instead: ${designs}. In the pilot, Nano Banana Pro works from your words directly.`,
        }
      return {
        drafts,
        summary: `Four images from your description: ${designs}${understood.length ? `, with ${listing(understood)}` : ''}.${unread(true)}`,
      }
    }
    return {
      drafts,
      summary: `${first ? 'Four directions' : 'Four new directions'}: ${listing([...new Set(drafts.map((d) => lowerFirst(d.title)))])}.${left}`,
    }
  }

  if (!base) return { drafts: [], summary: 'Pick an image first.' }
  const code = `#${base.n}`

  if (kind === 'more') {
    const drafts = [0, 1, 2].map((i): Draft => {
      const tweaks = withNotes(take(n + i, base.spec.tweaks).tweaks)
      const spec = onSet({ ...base.spec, timeOfDay: ctx.light, seed: seedOf(n + i, 2) }, set, tweaks)
      const caption = capitalise((set ? describeLook(spec.tweaks) : describeTweaks(spec.tweaks)) || 'a new take')
      return { spec, title: set ? set.title : conceptTitle(spec.concept, spec.with), caption, source: 'more', parentId: base.id, reworked: base.reworked || !!notes }
    })
    return {
      drafts,
      summary: `Three more like ${code}: ${quoted(drafts.map((d) => d.caption))}.${set ? ' Each keeps the stage set’s structure.' : ''}${notes ? ` Each takes on the artist’s note: “${ctx.notes!.map((n) => n.replace(/[.!]+$/, '')).join('”, “')}”.` : ''}`,
    }
  }

  if (kind === 'angles') {
    const views = (Object.keys(VIEW_LABEL) as StageView[]).filter((v) => v !== base.spec.view)
    const drafts: Draft[] = [
      ...views.map((view, i): Draft => ({ spec: { ...base.spec, view, seed: seedOf(n + i, 3) }, title: base.title, caption: VIEW_LABEL[view], source: 'angles', parentId: base.id, reworked: base.reworked })),
      { spec: { ...base.spec, crowd: base.spec.crowd === 'full' ? 'half' : 'full' }, title: base.title, caption: `${VIEW_LABEL[base.spec.view]}, ${base.spec.crowd === 'full' ? 'half' : 'full'} crowd`, source: 'angles', parentId: base.id, reworked: base.reworked },
    ]
    return { drafts, summary: `${code} from three more places: ${quoted(drafts.map((d) => d.caption))}. The design is the same.` }
  }

  // Other light. Under a roof there's no daylight, so the agent varies the rig instead.
  const t = base.spec.tweaks ?? {}
  const drafts: Draft[] = ctx.covered
    ? [
        { tweaks: { ...t, brightness: 0.7 }, caption: 'Softer light' },
        { tweaks: { ...t, brightness: 1.35 }, caption: 'Brighter light' },
        { tweaks: { ...t, haze: Math.min(1, (t.haze ?? 0) + 0.5) }, caption: 'In haze' },
      ].map((x) => ({ spec: { ...base.spec, tweaks: x.tweaks }, title: base.title, caption: x.caption, source: 'light' as const, parentId: base.id, reworked: base.reworked }))
    : [
        ...(['daylight', 'golden-hour', 'night'] as TimeOfDay[])
          .filter((time) => time !== base.spec.timeOfDay)
          .map((time): Draft => ({ spec: { ...base.spec, timeOfDay: time }, title: base.title, caption: TIME_LABEL[time], source: 'light', parentId: base.id, reworked: base.reworked })),
        { spec: { ...base.spec, tweaks: { ...t, haze: Math.min(1, (t.haze ?? 0) + 0.5) } }, title: base.title, caption: `${TIME_LABEL[base.spec.timeOfDay]}, in haze`, source: 'light', parentId: base.id, reworked: base.reworked },
      ]
  return {
    drafts,
    summary: ctx.covered
      ? `${code} under three lighting states: ${quoted(drafts.map((d) => d.caption))}. There’s no daylight under a roof, so I varied the rig instead.`
      : `${code} in other light: ${quoted(drafts.map((d) => d.caption))}.`,
  }
}

/** The time now, for provenance: “14:05”. */
export const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/** Gives planned images their ids, numbers and fallback art. */
export function materialize(drafts: Draft[], at: { project: string; song: number; existing: Generation[]; author: Generation['author'] }): Generation[] {
  const n = Math.max(0, ...at.existing.map((g) => g.n))
  const batch = Math.max(0, ...at.existing.map((g) => g.batch)) + 1
  return drafts.map((d, i) => {
    const id = `${at.project}.${at.song}.${n + i + 1}`
    return {
      id,
      song: at.song,
      n: n + i + 1,
      batch,
      parentId: d.parentId,
      source: d.source,
      prompt: d.prompt,
      title: d.title,
      caption: d.caption,
      spec: d.spec,
      image: stageArt(id, d.spec.concept, d.spec.timeOfDay),
      author: at.author,
      reworked: d.reworked,
      at: stamp(),
    }
  })
}

/** How a batch is labelled on the contact sheet, from its first image. */
export function batchLabel(first: Generation, parent: Generation | undefined, set: ShowSet | null): string {
  const of = parent ? ` #${parent.n}` : ''
  switch (first.source) {
    case 'directions':
      return set && matchesSet(first.spec, set) ? 'New looks on the stage set' : 'New directions'
    case 'prompt':
      return `From your description: “${first.prompt ?? ''}”`
    case 'more':
      return `More like${of}`
    case 'angles':
      return `Other angles of${of}`
    case 'light':
      return `Other light for${of}`
    case 'edit':
      return `Your change to${of}`
    case 'take':
      return `Another take on${of}`
  }
}

/** The set taken from an image: its structure, named after it. */
export const setFrom = (gen: Generation): ShowSet => ({
  fromId: gen.id,
  concept: gen.spec.concept,
  with: gen.spec.with,
  width: gen.spec.tweaks?.width ?? 1,
  lift: gen.spec.tweaks?.lift ?? 0,
  title: gen.title,
})
