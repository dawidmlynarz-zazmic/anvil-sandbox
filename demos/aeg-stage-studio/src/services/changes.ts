import type { ConceptShape, StageTweaks } from '~/state/types'

// Mocked image editing. A described change is read for the handful of things the preview renderer can show (size,
// height, colour, haze, brightness) and applied for real, so the next version visibly does what was asked. The agent
// reports exactly which of those it applied; anything else it says it kept for the pilot model.

interface Rule {
  test: RegExp
  apply: (t: StageTweaks) => StageTweaks
  says: string
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const scale = (t: StageTweaks, by: number) => clamp((t.width ?? 1) * by, 0.55, 1.5)

const RULES: Rule[] = [
  { test: /\b(narrow(er)?|thinner|slimmer|smaller|less wide|lighter|airier|less boxy)\b/i, apply: (t) => ({ ...t, width: scale(t, 0.75) }), says: 'a narrower centrepiece' },
  { test: /\b(wider|broader|bigger|larger|more massive|heavier)\b/i, apply: (t) => ({ ...t, width: scale(t, 1.25) }), says: 'a wider centrepiece' },
  { test: /\b(higher|taller|raise[ds]?|lift(ed)?)\b/i, apply: (t) => ({ ...t, lift: clamp((t.lift ?? 0) + 3, -4, 8) }), says: 'the centrepiece raised' },
  { test: /\b(lower(ed)?|shorter)\b/i, apply: (t) => ({ ...t, lift: clamp((t.lift ?? 0) - 2.5, -4, 8) }), says: 'the centrepiece lowered' },
  { test: /\bgold(en)?\b/i, apply: (t) => ({ ...t, palette: 'gold' }), says: 'a gold palette' },
  { test: /\b(warm(er)?|amber|less pink|desert|sunset tones?)\b/i, apply: (t) => (t.palette === 'gold' ? t : { ...t, palette: 'warm' }), says: 'a warmer palette' },
  { test: /\b(cool(er)?|cold(er)?|blue|icy|ice)\b/i, apply: (t) => ({ ...t, palette: 'cool' }), says: 'a cooler palette' },
  { test: /\b(white|clean|neutral|monochrome)\b/i, apply: (t) => ({ ...t, palette: 'white' }), says: 'a white palette' },
  { test: /\b(haz(e|y|ier)|smok(e|y)|fog(gy)?|atmospher(e|ic))\b/i, apply: (t) => ({ ...t, haze: clamp((t.haze ?? 0) + 0.5, 0, 1) }), says: 'more haze' },
  { test: /\b(less|no)\s+(haze|smoke|fog)\b|\bclearer\b/i, apply: (t) => ({ ...t, haze: 0 }), says: 'clearer air' },
  { test: /\b(brighter|punchier|more light|glow(s|ing)?|bolder)\b/i, apply: (t) => ({ ...t, brightness: clamp((t.brightness ?? 1) * 1.35, 0.5, 1.8) }), says: 'brighter light' },
  { test: /\b(darker|dimmer|subtler|softer|less bright|moodier)\b/i, apply: (t) => ({ ...t, brightness: clamp((t.brightness ?? 1) * 0.7, 0.5, 1.8) }), says: 'softer light' },
]

/** Reads a described change for what the preview can show. `applied` lists those in words; empty when nothing matched. */
export function tweaksFrom(text: string, current: StageTweaks = {}): { tweaks: StageTweaks; applied: string[] } {
  let tweaks = { ...current }
  const applied: string[] = []
  // "less haze" must not also count as "more haze".
  const lessHaze = /\b(less|no)\s+(haze|smoke|fog)\b/i.test(text)
  for (const rule of RULES) {
    if (!rule.test.test(text)) continue
    if (rule.says === 'more haze' && lessHaze) continue
    tweaks = rule.apply(tweaks)
    if (!applied.includes(rule.says)) applied.push(rule.says)
  }
  return { tweaks, applied }
}

/** A list in words: "a, b and c". */
export const listing = (items: string[]) => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)

/** Distinct takes for Regenerate and "More like this", each with a caption that says what differs. */
const TAKES: { tweaks: StageTweaks; caption: string }[] = [
  { tweaks: { width: 0.8, palette: 'warm' }, caption: 'Slimmer, warm light' },
  { tweaks: { width: 1.2, lift: 2 }, caption: 'Wider and raised' },
  { tweaks: { palette: 'cool', haze: 0.5 }, caption: 'Cool light in haze' },
  { tweaks: { palette: 'gold', brightness: 1.3 }, caption: 'Gold, brighter' },
  { tweaks: { palette: 'white', width: 0.9 }, caption: 'White light, cleaner lines' },
  { tweaks: { lift: 3, haze: 0.4, brightness: 0.8 }, caption: 'Raised, moodier' },
]

/** The `n`th distinct take on a design, starting from its current changes. */
export function take(n: number, current: StageTweaks = {}): { tweaks: StageTweaks; caption: string } {
  const t = TAKES[((n % TAKES.length) + TAKES.length) % TAKES.length]!
  return { tweaks: { ...current, ...t.tweaks }, caption: t.caption }
}

/** The concept types the user can name, for "combine the arch with the monolith". */
export const SHAPE_WORDS: Record<ConceptShape, RegExp> = {
  arch: /\barch(es)?\b/i,
  monolith: /\bmonolith(s|ic)?\b/i,
  ribbons: /\bribbons?\b/i,
  halo: /\bhalo(s)?\b/i,
}

/** "Combine the arch with the monolith" → ['arch', 'monolith']. Undefined unless two concept types are named with a combining word. */
export function hybridFrom(text: string): [ConceptShape, ConceptShape] | undefined {
  if (!/\b(combine|merge|mix|blend|together|hybrid|meets)\b/i.test(text)) return undefined
  const named = (Object.keys(SHAPE_WORDS) as ConceptShape[])
    .map((shape) => ({ shape, at: text.search(SHAPE_WORDS[shape]) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
  return named.length >= 2 ? [named[0]!.shape, named[1]!.shape] : undefined
}
