import type { ProjectState } from './project'
import type { BriefSection } from './types'

export type ReadinessKey = 'who' | BriefSection

export interface ReadinessItem {
  key: ReadinessKey
  label: string
  done: boolean
}

/**
 * What the brief still needs before round 1, as one list. The brief page, its footer, the progress rail and the
 * agent all read it, so they never disagree. Venue, slot and constraints count once shown (they have sensible
 * defaults); the visual direction and key moments need real content, because every concept and clip is built on them.
 */
export function briefReadiness(p: Pick<ProjectState, 'meta' | 'brief' | 'provenance' | 'setupStep'>) {
  const shown = (s: BriefSection) => p.provenance[s] !== 'pending'
  const items: ReadinessItem[] = [
    { key: 'who', label: 'Artist and event', done: p.setupStep > 0 || p.meta.artist !== 'New project' },
    { key: 'venue', label: 'Venue', done: shown('venue') },
    { key: 'slot', label: 'Performance time slot', done: shown('slot') },
    { key: 'visual', label: 'Visual direction', done: p.brief.keywords.length > 0 },
    { key: 'constraints', label: 'Constraints', done: shown('constraints') },
    { key: 'moments', label: 'Key moments', done: p.brief.moments.length > 0 },
  ]
  const left = items.filter((i) => !i.done)
  return { items, left, done: items.length - left.length, total: items.length, ready: left.length === 0 }
}
