import type { Venue } from '~/state/types'

// AEG venues and festival stages. City, capacity, year and description are as published on aegworldwide.com;
// festival stage names are the festivals' own. Technical specs are samples until AEG supplies the real ones.

const ARENA_SPEC = { stageWidth: '18 m (end stage)', ledWall: '16 × 9 m main wall', rigging: '60 t across 40 points', model3d: '3D model loaded' }
const MAIN_STAGE_SPEC = { stageWidth: '24 m', ledWall: '20 × 10 m main wall, two side screens', rigging: '40 t roof load', model3d: '3D model loaded' }
const TENT_SPEC = { stageWidth: '16 m', ledWall: '12 × 6 m', rigging: '15 t across 12 points', model3d: 'Not modelled yet' }

const AEG = 'aegworldwide.com'
const AEG_MUSIC = 'aegworldwide.com · Music (Goldenvoice festivals)'

export const venues: Venue[] = [
  {
    id: 'coachella-stage',
    name: 'Coachella Stage',
    kind: 'Festival main stage',
    event: 'Coachella',
    city: 'Indio, California',
    about: 'The main stage of “the iconic Coachella Valley Music & Arts Festival”, produced by Goldenvoice.',
    source: AEG_MUSIC,
    specs: MAIN_STAGE_SPEC,
  },
  { id: 'outdoor-theatre', name: 'Outdoor Theatre', kind: 'Festival stage', event: 'Coachella', city: 'Indio, California', source: AEG_MUSIC, specs: { ...MAIN_STAGE_SPEC, stageWidth: '20 m' } },
  { id: 'sahara', name: 'Sahara', kind: 'Festival tent', event: 'Coachella', covered: true, city: 'Indio, California', source: AEG_MUSIC, specs: TENT_SPEC },
  { id: 'mojave', name: 'Mojave', kind: 'Festival tent', event: 'Coachella', covered: true, city: 'Indio, California', source: AEG_MUSIC, specs: TENT_SPEC },
  { id: 'gobi', name: 'Gobi', kind: 'Festival tent', event: 'Coachella', covered: true, city: 'Indio, California', source: AEG_MUSIC, specs: TENT_SPEC },
  {
    id: 'mane-stage',
    name: 'Mane Stage',
    kind: 'Festival main stage',
    event: 'Stagecoach',
    city: 'Indio, California',
    about: 'The main stage of Stagecoach, Goldenvoice’s country music festival.',
    source: AEG_MUSIC,
    specs: MAIN_STAGE_SPEC,
  },
  { id: 'palomino', name: 'Palomino', kind: 'Festival tent', event: 'Stagecoach', covered: true, city: 'Indio, California', source: AEG_MUSIC, specs: TENT_SPEC },
  {
    id: 'great-oak',
    name: 'Great Oak Stage',
    kind: 'Festival main stage',
    event: 'British Summer Time',
    city: 'Hyde Park, London',
    about: 'The main stage of British Summer Time Hyde Park, presented by AEG Presents.',
    source: 'aegworldwide.com · Music (AEG Presents festivals)',
    specs: MAIN_STAGE_SPEC,
  },
  {
    id: 'crypto-arena',
    name: 'Crypto.com Arena',
    kind: 'Arena',
    covered: true,
    city: 'Los Angeles',
    capacity: '19,000',
    opened: '1999 (as STAPLES Center)',
    about: '“The world’s premier sports and entertainment center”, hosting over 250 events a year.',
    source: AEG,
    specs: ARENA_SPEC,
  },
  {
    id: 'the-o2',
    name: 'The O2',
    kind: 'Arena',
    covered: true,
    city: 'London',
    capacity: '20,000',
    opened: '2007',
    about: '“The world’s most popular music and entertainment venue”, with over 300 events a year.',
    source: AEG,
    specs: ARENA_SPEC,
  },
  {
    id: 't-mobile-arena',
    name: 'T-Mobile Arena',
    kind: 'Arena',
    covered: true,
    city: 'Las Vegas',
    capacity: '20,000',
    opened: '2016',
    about: '“A state-of-the-art, multipurpose event center from AEG and MGM Resorts International.”',
    source: AEG,
    specs: ARENA_SPEC,
  },
  {
    id: 'uber-arena',
    name: 'Uber Arena',
    kind: 'Arena',
    covered: true,
    city: 'Berlin',
    capacity: '17,000',
    opened: '2008',
    about: '“One of the most successful multipurpose arenas in Europe.”',
    source: AEG,
    specs: ARENA_SPEC,
  },
  {
    id: 'accor-arena',
    name: 'Accor Arena',
    kind: 'Arena',
    covered: true,
    city: 'Paris',
    capacity: '20,300',
    opened: '1984',
    about: '“Paris’ premier entertainment venue.”',
    source: AEG,
    specs: ARENA_SPEC,
  },
]

export const venueOf = (venueId: string) => venues.find((v) => v.id === venueId) ?? venues[0]!

/** Tents and arenas have a roof: no daylight on the stage, so it is always lit as at night. */
export const isCovered = (venueId: string) => !!venues.find((v) => v.id === venueId)?.covered

/** The stages to suggest for an event ("Stagecoach 2027" → its stages), or the arenas when the event isn't a festival. */
export function venuesFor(event: string | undefined) {
  const text = (event ?? '').toLowerCase()
  const festival = venues.filter((v) => v.event && text.includes(v.event.toLowerCase()))
  if (festival.length) return festival
  const arenas = venues.filter((v) => !v.event)
  // "The O2 residency" → The O2 (named by its distinctive word, not "the").
  const named = arenas.filter((v) => text.includes(v.name.toLowerCase().replace(/^the /, '').split(' ')[0]!))
  return named.length ? [...named, ...arenas.filter((v) => !named.includes(v))] : arenas
}
