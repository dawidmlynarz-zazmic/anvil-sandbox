import type { ProjectState } from './project'
import type { BriefSection } from './types'

export interface ReadinessItem {
  key: BriefSection
  label: string
  done: boolean
  /** Nice to have: the project can start without it. */
  optional?: boolean
}

/**
 * What the brief needs before round 1, as one list. The brief page, its cards, its footer, the progress rail and the
 * agent all read it, so they never disagree.
 * - Required: stage, time slot, visual direction and key moments (every concept and clip is built on them).
 * - Optional: constraints. The venue's rules load with the venue; the artist's no-gos are added when they have any.
 * Artist and event are project details, set when the project is created, not part of the brief.
 */
export function briefReadiness(p: Pick<ProjectState, 'brief' | 'provenance'>) {
  const shown = (s: BriefSection) => p.provenance[s] !== 'pending'
  const items: ReadinessItem[] = [
    { key: 'venue', label: 'Venue', done: shown('venue') },
    { key: 'slot', label: 'Performance time slot', done: shown('slot') },
    { key: 'visual', label: 'Visual direction', done: p.brief.keywords.length > 0 },
    { key: 'moments', label: 'Key moments', done: p.brief.moments.length > 0 },
    { key: 'constraints', label: 'Constraints', done: shown('constraints'), optional: true },
  ]
  const required = items.filter((i) => !i.optional)
  const left = required.filter((i) => !i.done)
  return { items, left, done: required.length - left.length, total: required.length, ready: left.length === 0 }
}
