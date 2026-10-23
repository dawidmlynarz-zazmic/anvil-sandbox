import { matchesSet } from '~/services/explore'
import type { ProjectState } from './project'
import type { Generation } from './types'

type Show = Pick<ProjectState, 'generations' | 'looks' | 'set' | 'redo' | 'moments'>

export const genById = (p: Pick<ProjectState, 'generations'>, id: string | undefined) => (id ? p.generations.find((g) => g.id === id) : undefined)
export const gensFor = (p: Pick<ProjectState, 'generations'>, song: number) => p.generations.filter((g) => g.song === song)
export const lookFor = (p: Pick<ProjectState, 'generations' | 'looks'>, song: number) => genById(p, p.looks[song])

/** An image's ancestors, oldest first, then the image itself: “#2 → #7 → #12”. */
export function lineage(p: Pick<ProjectState, 'generations'>, gen: Generation): Generation[] {
  const chain: Generation[] = [gen]
  let parent = genById(p, gen.parentId)
  while (parent && chain.length < 20) {
    chain.unshift(parent)
    parent = genById(p, parent.parentId)
  }
  return chain
}

export type MomentStatus = 'not-started' | 'exploring' | 'chosen' | 'needs-changes' | 'off-set'

export const MOMENT_STATUS: Record<MomentStatus, { text: string; tone: 'neutral' | 'agent' | 'success' | 'warning' }> = {
  'not-started': { text: 'Not started', tone: 'neutral' },
  exploring: { text: 'Exploring', tone: 'agent' },
  chosen: { text: 'In motion', tone: 'success' },
  'needs-changes': { text: 'Artist asked for changes', tone: 'warning' },
  'off-set': { text: 'Doesn’t match the set', tone: 'warning' },
}

export function momentStatus(p: Show, song: number): MomentStatus {
  const look = lookFor(p, song)
  if (p.redo.includes(song)) return 'needs-changes'
  if (look && !matchesSet(look.spec, p.set)) return 'off-set'
  if (look) return 'chosen'
  return gensFor(p, song).length ? 'exploring' : 'not-started'
}

/** The image a moment page opens on: the newest when the artist asked for changes, else the look, else the newest. */
export function defaultFocus(p: Show, song: number): Generation | undefined {
  const all = gensFor(p, song)
  if (p.redo.includes(song)) return all.at(-1)
  return lookFor(p, song) ?? all.at(-1)
}

/** The next moment without a look, after `song` (wrapping round), or undefined when every moment has one. */
export function nextOpenMoment(p: Show, song?: number) {
  const open = p.moments.filter((m) => momentStatus(p, m.number) !== 'chosen')
  return open.find((m) => song === undefined || m.number > song) ?? open[0]
}

export type KitStatus = 'none' | 'building' | 'ready' | 'stale'

/** Where a moment's asset kit stands: not built, building, ready, or built from an earlier look. */
export function kitStatus(p: Pick<ProjectState, 'kits' | 'kitPending' | 'looks'>, song: number): KitStatus {
  const kit = p.kits[song]
  if (p.kitPending[song]) return 'building'
  if (!kit) return 'none'
  return kit.lookId === p.looks[song] ? 'ready' : 'stale'
}
