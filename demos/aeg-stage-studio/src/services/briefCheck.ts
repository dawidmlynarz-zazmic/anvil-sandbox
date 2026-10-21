import type { Brief, Still } from '~/state/types'

export interface CheckItem {
  label: string
  ok: boolean
  detail: string
}

// What the agent checks each concept against: the venue's limits, the artist's no-gos and the budget.
// Mocked: some concepts' first designs have an issue, which any reworked version fixes.
const ISSUES: Record<string, { label: string; detail: string }> = {
  B: { label: 'Sightlines', detail: 'The monolith hides part of the screen from the back of the field.' },
  C: { label: 'Artist no-gos', detail: 'The fastest LED chase could read as strobe. Keep it under 3 Hz.' },
  D: { label: 'Rigging', detail: 'The halo’s load is close to the venue’s [rigging limit].' },
}

export function briefCheck(still: Still, brief: Brief): CheckItem[] {
  const issue = still.reworked ? undefined : ISSUES[still.concept]
  const items: CheckItem[] = [
    { label: 'Rigging', ok: true, detail: 'Within the venue’s [rigging limit].' },
    { label: 'LED wall', ok: true, detail: 'Fits the venue’s [LED wall].' },
    { label: 'Sightlines', ok: true, detail: 'Clear from front of house and the back of the field.' },
    { label: 'Artist no-gos', ok: true, detail: `Respects: ${brief.constraints.noGo.split('\n')[0]}.` },
    { label: 'Budget band', ok: true, detail: 'Buildable within the chosen band.' },
  ]
  return items.map((item) => (issue && item.label === issue.label ? { label: item.label, ok: false, detail: issue.detail } : item))
}

/** One line on why the agent made this concept, so it reads as a collaborator rather than a slot machine. */
export const RATIONALE: Record<string, string> = {
  A: 'Frames the artist and reads clearly from the back of the field.',
  B: 'Strongest silhouette against the sunset; follows “monolithic”.',
  C: 'The most movement; comes alive after dark.',
  D: 'Simple and iconic; strong for the livestream camera.',
}
