import type { ConceptShape, StageTweaks, Still } from '~/state/types'
import { hybridFrom, listing, take, tweaksFrom } from './changes'

/** One concept in a planned round: what to draw, and why it's there (for the agent's message). */
export interface ConceptPlan {
  shape: ConceptShape
  with?: ConceptShape
  tweaks?: StageTweaks
  /** Carries a parent's fixes, so its brief check stays clear. */
  reworked?: boolean
  why: string
}

export const SHAPES: ConceptShape[] = ['arch', 'monolith', 'ribbons', 'halo']

export const SHAPE_TITLE: Record<ConceptShape, string> = {
  arch: 'Open-air arch',
  monolith: 'Stone monolith',
  ribbons: 'Kinetic LED ribbons',
  halo: 'Floating halo',
}

const SHORT: Record<ConceptShape, string> = { arch: 'arch', monolith: 'monolith', ribbons: 'LED ribbons', halo: 'halo' }

/** "Open-air arch", or "Open-air arch with monolith" for a combined concept. */
export const conceptTitle = (shape: ConceptShape, second?: ConceptShape) =>
  second && second !== shape ? `${SHAPE_TITLE[shape]} with ${SHORT[second]}` : SHAPE_TITLE[shape]

/** The visible changes on a design, in words: "slimmer, warm light". Empty when it's as first designed. */
export function describeTweaks(t: StageTweaks | undefined): string {
  if (!t) return ''
  const parts: string[] = []
  if ((t.width ?? 1) < 1) parts.push('slimmer')
  if ((t.width ?? 1) > 1) parts.push('wider')
  if ((t.lift ?? 0) > 0) parts.push('raised')
  if ((t.lift ?? 0) < 0) parts.push('lowered')
  if (t.palette) parts.push(`${t.palette} light`)
  if ((t.haze ?? 0) > 0) parts.push('in haze')
  if ((t.brightness ?? 1) > 1) parts.push('brighter')
  if ((t.brightness ?? 1) < 1) parts.push('softer light')
  return parts.join(', ')
}

const code = (st: Still) => st.title.split(' · ')[0]!

/**
 * The next round, built from what the user chose: a combined concept when the note asks for one, a take on each
 * selected concept (keeping its fixes, plus the note's changes), more takes to fill four, and nothing from a
 * direction the user set aside. `summary` says exactly that, so the agent never claims more than the round shows.
 */
export function planRound({
  round,
  parents,
  dismissed,
  notes,
}: {
  round: number
  parents: Still[]
  dismissed: ConceptShape[]
  notes: string[]
}): { plan: ConceptPlan[]; summary: string } {
  const text = notes.join('. ')
  const { applied } = tweaksFrom(text)
  const hybrid = hybridFrom(text)
  const withNotes = (t?: StageTweaks) => tweaksFrom(text, t ?? {}).tweaks
  const plan: ConceptPlan[] = []
  const lines: string[] = []
  const letter = (i: number) => `${'ABCD'[i]}${round}`

  if (hybrid) {
    plan.push({ shape: hybrid[0], with: hybrid[1], tweaks: withNotes(), why: 'hybrid' })
    lines.push(`${letter(plan.length - 1)} combines the ${SHORT[hybrid[0]]} and the ${SHORT[hybrid[1]]}`)
  }

  const usable = parents.filter((p) => p.spec).slice(0, 4 - plan.length)
  const built: string[] = []
  for (const p of usable) {
    plan.push({ shape: p.spec!.concept, with: p.spec!.with, tweaks: withNotes(p.spec!.tweaks), reworked: p.reworked, why: `builds on ${code(p)}` })
    built.push(`${letter(plan.length - 1)} builds on ${code(p)}`)
  }
  if (built.length) lines.push(listing(built))

  // Fill to four: more takes on the selection, or (with nothing selected) the directions not set aside.
  const takes: string[] = []
  let n = round
  while (plan.length < 4) {
    const parent = usable.length ? usable[(plan.length + n) % usable.length]! : undefined
    if (parent) {
      // Describe the take as it ends up, after the note's changes (a "warmer" note overrides a cool take).
      const tweaks = withNotes(take(n++, parent.spec!.tweaks).tweaks)
      plan.push({ shape: parent.spec!.concept, with: parent.spec!.with, tweaks, reworked: parent.reworked, why: 'take' })
      takes.push(`${letter(plan.length - 1)} is another take on ${code(parent)} (${describeTweaks(tweaks) || 'new proportions'})`)
      continue
    }
    const allowed = SHAPES.filter((s) => !dismissed.includes(s))
    const open = allowed.filter((s) => !plan.some((p) => p.shape === s))
    // Every direction is used or set aside: vary the allowed ones instead of bringing a set-aside one back.
    const pool = allowed.length ? allowed : SHAPES
    const shape = open[0] ?? pool[plan.length % pool.length]!
    plan.push({ shape, tweaks: open.length ? withNotes() : withNotes(take(n++).tweaks), why: 'fresh' })
  }
  if (takes.length) lines.push(listing(takes))
  if (!usable.length && !hybrid) lines.push('nothing was selected, so these are fresh directions')

  const dropped = dismissed.filter((s) => !plan.some((p) => p.shape === s || p.with === s))
  const parts = [
    lines.join('. '),
    applied.length ? `Every concept has ${listing(applied)}` : '',
    dropped.length ? `I left out the ${listing(dropped.map((s) => SHORT[s]))} you set aside` : '',
  ].filter(Boolean)
  const unshown = text && !applied.length && !hybrid ? ` I can't show “${notes.join('”, “')}” in this preview; the pilot model applies it.` : ''
  return { plan, summary: `${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('. ')}.${unshown}` }
}
