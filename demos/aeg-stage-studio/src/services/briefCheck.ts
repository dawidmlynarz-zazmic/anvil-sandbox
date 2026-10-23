import type { Brief, ConceptShape, StillSpec } from '~/state/types'
import { lightAt, setTimes } from './light'
import { isCovered, venueOf } from '~/mocks/venues'

export interface CheckItem {
  label: string
  ok: boolean
  detail: string
}

type Checked = { spec: StillSpec; reworked?: boolean }

// What the agent checks each image against: the venue's limits, the artist's no-gos and the budget.
// Mocked: each direction has one known risk in its first design. A rework clears it, and so does a visible change
// that addresses it (a slimmer or raised monolith no longer blocks the screen).
const ISSUES: Partial<Record<ConceptShape, { label: string; detail: string }>> = {
  monolith: { label: 'Sightlines', detail: 'The monolith hides part of the screen from the back of the field.' },
  ribbons: { label: 'Artist no-gos', detail: 'The fastest LED chase could read as strobe. Keep it under 3 Hz.' },
  halo: { label: 'Rigging', detail: 'The halo’s load is close to the venue’s rigging limit (sample spec).' },
}

function cleared(g: Checked) {
  if (g.reworked) return true
  const t = g.spec.tweaks
  return g.spec.concept === 'monolith' && !!t && ((t.width ?? 1) < 1 || (t.lift ?? 0) > 0)
}

export function briefCheck(g: Checked, brief: Brief): CheckItem[] {
  const issue = cleared(g) ? undefined : ISSUES[g.spec.concept]
  const venue = venueOf(brief.venueId)
  const items: CheckItem[] = [
    { label: 'Rigging', ok: true, detail: `Within ${venue.name}’s rigging limit (sample spec: ${venue.specs.rigging}).` },
    { label: 'LED wall', ok: true, detail: `Fits the LED wall (sample spec: ${venue.specs.ledWall}).` },
    { label: 'Sightlines', ok: true, detail: 'Clear from front of house and the back of the room.' },
    { label: 'Artist no-gos', ok: true, detail: `Respects: ${brief.constraints.noGo.split('\n')[0] || 'nothing listed yet'}.` },
    { label: 'Budget band', ok: true, detail: 'Buildable within the chosen band.' },
  ]
  return items.map((item) => (issue && item.label === issue.label ? { label: item.label, ok: false, detail: issue.detail } : item))
}

/** One line on why the agent made this image, so it reads as a collaborator rather than a slot machine. */
export function rationale(g: Checked, brief: Brief): string {
  const dark = isCovered(brief.venueId) || lightAt(setTimes(brief).start) === 'night'
  const lines: Record<ConceptShape, string> = {
    arch: 'Frames the artist and reads clearly from the back of the room.',
    monolith: `Strongest silhouette ${dark ? 'against the light show' : 'against the sunset'}.`,
    ribbons: 'The most movement; comes alive after dark.',
    halo: 'Simple and iconic; strong for the livestream camera.',
  }
  const line = lines[g.spec.concept]
  const second = g.spec.with
  return second ? `Combines two directions: ${line.charAt(0).toLowerCase()}${line.slice(1, -1)}, with the ${second} at its centre.` : line
}
