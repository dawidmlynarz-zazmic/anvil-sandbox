import type { Venue } from '~/state/types'

// Spec values are placeholders until real numbers are supplied.
const spec = { stageWidth: '[stage width]', ledWall: '[LED wall]', rigging: '[rigging limits]', model3d: '[3D model]' }

/** Arenas are indoors: no daylight, so motion is always shown at night. */
export const INDOOR = new Set(['crypto-arena', 'the-o2'])

export const venues: Venue[] = [
  { id: 'coachella-stage', name: 'Coachella Stage', kind: 'Festival main stage', specs: { ...spec, model3d: '3D model loaded' } },
  { id: 'sahara', name: 'Sahara', kind: 'Festival tent', specs: spec },
  { id: 'mojave', name: 'Mojave', kind: 'Festival tent', specs: spec },
  { id: 'crypto-arena', name: 'Crypto.com Arena', kind: 'Arena', specs: spec },
  { id: 'the-o2', name: 'The O2', kind: 'Arena', specs: spec },
]
