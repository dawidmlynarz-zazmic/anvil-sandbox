import type { Brief, ConceptShape, Still } from '~/state/types'
import { lightAt, setTimes } from './light'
import { isCovered } from '~/mocks/venues'

export interface CheckItem {
  label: string
  ok: boolean
  detail: string
}

// What the agent checks each concept against: the venue's limits, the artist's no-gos and the budget.
// Mocked: each direction has one known risk in its first design. A rework clears it, and so does a visible change
// that addresses it (a slimmer or raised monolith no longer blocks the screen).
const ISSUES: Partial<Record<ConceptShape, { label: string; detail: string }>> = {
  monolith: { label: 'Sightlines', detail: 'The monolith hides part of the screen from the back of the field.' },
  ribbons: { label: 'Artist no-gos', detail: 'The fastest LED chase could read as strobe. Keep it under 3 Hz.' },
  halo: { label: 'Rigging', detail: 'The halo’s load is close to the venue’s [rigging limit].' },
}

/** Older saved concepts have no spec: fall back to their slot letter. */
const LETTER_SHAPE: Record<string, ConceptShape> = { A: 'arch', B: 'monolith', C: 'ribbons', D: 'halo' }
const shapeOf = (still: Still): ConceptShape => still.spec?.concept ?? LETTER_SHAPE[still.concept] ?? 'arch'

function cleared(still: Still) {
  if (still.reworked) return true
  const t = still.spec?.tweaks
  return shapeOf(still) === 'monolith' && !!t && ((t.width ?? 1) < 1 || (t.lift ?? 0) > 0)
}

export function briefCheck(still: Still, brief: Brief): CheckItem[] {
  const issue = cleared(still) ? undefined : ISSUES[shapeOf(still)]
  const items: CheckItem[] = [
    { label: 'Rigging', ok: true, detail: 'Within the venue’s [rigging limit].' },
    { label: 'LED wall', ok: true, detail: 'Fits the venue’s [LED wall].' },
    { label: 'Sightlines', ok: true, detail: 'Clear from front of house and the back of the field.' },
    { label: 'Artist no-gos', ok: true, detail: `Respects: ${brief.constraints.noGo.split('\n')[0] || 'nothing listed yet'}.` },
    { label: 'Budget band', ok: true, detail: 'Buildable within the chosen band.' },
  ]
  return items.map((item) => (issue && item.label === issue.label ? { label: item.label, ok: false, detail: issue.detail } : item))
}

/** One line on why the agent made this concept, so it reads as a collaborator rather than a slot machine. */
export function rationale(still: Still, brief: Brief): string {
  const dark = isCovered(brief.venueId) || lightAt(setTimes(brief).start) === 'night'
  const lines: Record<ConceptShape, string> = {
    arch: 'Frames the artist and reads clearly from the back of the field.',
    monolith: `Strongest silhouette ${dark ? 'against the light show' : 'against the sunset'}; follows “monolithic”.`,
    ribbons: 'The most movement; comes alive after dark.',
    halo: 'Simple and iconic; strong for the livestream camera.',
  }
  const second = still.spec?.with
  return second ? `Combines two directions: ${lines[shapeOf(still)].charAt(0).toLowerCase()}${lines[shapeOf(still)].slice(1, -1)}, with the ${second} at its centre.` : lines[shapeOf(still)]
}
