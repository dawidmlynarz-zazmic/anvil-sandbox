import type { Brief, ConceptShape, StillSpec } from '~/state/types'
import { lightAt, setTimes } from './light'
import { isCovered } from '~/mocks/venues'
import { venueChecks } from './venueCheck'

export interface CheckItem {
  label: string
  ok: boolean
  detail: string
}

type Checked = { spec: StillSpec; reworked?: boolean }

/** The brief and venue check on one image: the venue's limits with numbers (see venueCheck.ts), no-gos and budget. */
export function briefCheck(g: Checked, brief: Brief): CheckItem[] {
  return venueChecks(g.spec, brief, g.reworked).map((c) => ({ label: c.label, ok: c.status === 'pass', detail: c.detail + (c.fix && c.status !== 'pass' ? ` Try “${c.fix}”.` : '') }))
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
