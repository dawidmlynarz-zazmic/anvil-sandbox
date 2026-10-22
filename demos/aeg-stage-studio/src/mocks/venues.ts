import type { Venue } from '~/state/types'

// Spec values are placeholders until real numbers are supplied.
const spec = { stageWidth: '[stage width]', ledWall: '[LED wall]', rigging: '[rigging limits]', model3d: '[3D model]' }

export const venues: (Venue & { event?: string; covered?: boolean })[] = [
  { id: 'coachella-stage', name: 'Coachella Stage', kind: 'Festival main stage', event: 'Coachella', specs: { ...spec, model3d: '3D model loaded' } },
  { id: 'sahara', name: 'Sahara', kind: 'Festival tent', event: 'Coachella', covered: true, specs: spec },
  { id: 'mojave', name: 'Mojave', kind: 'Festival tent', event: 'Coachella', covered: true, specs: spec },
  { id: 'mane-stage', name: 'Mane Stage', kind: 'Festival main stage', event: 'Stagecoach', specs: spec },
  { id: 'palomino', name: 'Palomino', kind: 'Festival tent', event: 'Stagecoach', covered: true, specs: spec },
  { id: 'crypto-arena', name: 'Crypto.com Arena', kind: 'Arena', covered: true, specs: spec },
  { id: 'the-o2', name: 'The O2', kind: 'Arena', covered: true, specs: spec },
]

/** Tents and arenas have a roof: no daylight on the stage, so it is always lit as at night. */
export const isCovered = (venueId: string) => !!venues.find((v) => v.id === venueId)?.covered

/** The stages to suggest for an event ("Stagecoach 2027" → its stages), or the first few when the event is unknown. */
export function venuesFor(event: string | undefined) {
  const matching = event ? venues.filter((v) => v.event && event.toLowerCase().includes(v.event.toLowerCase())) : []
  return matching.length ? matching : venues.slice(0, 3)
}
