import type { ConceptShape, StageTweaks } from '~/state/types'

export const SHAPES: ConceptShape[] = ['arch', 'monolith', 'ribbons', 'halo']

export const SHAPE_TITLE: Record<ConceptShape, string> = {
  arch: 'Open-air arch',
  monolith: 'Stone monolith',
  ribbons: 'Kinetic LED ribbons',
  halo: 'Floating halo',
}

export const SHAPE_SHORT: Record<ConceptShape, string> = { arch: 'arch', monolith: 'monolith', ribbons: 'LED ribbons', halo: 'halo' }

/** "Open-air arch", or "Open-air arch with monolith" for a combined design. */
export const conceptTitle = (shape: ConceptShape, second?: ConceptShape) =>
  second && second !== shape ? `${SHAPE_TITLE[shape]} with ${SHAPE_SHORT[second]}` : SHAPE_TITLE[shape]

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

/** Only the look: palette, haze and brightness, in words. */
export const describeLook = (t: StageTweaks | undefined) =>
  describeTweaks(t && { palette: t.palette, haze: t.haze, brightness: t.brightness })

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Lowercases the first letter only, so a title reads mid-sentence and acronyms survive: “kinetic LED ribbons”. */
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
