import type { Venue, VenueLimits } from '~/state/types'

// AEG venues and festival stages. City, capacity, year and description are as published on aegworldwide.com;
// festival stage names are the festivals' own. Technical limits are samples (plausible, not real) until AEG supplies
// the venue library; the app labels them as samples wherever they appear. Only the Coachella Stage has a 3D model.

const ARENA: VenueLimits = { stageWidth: 18, trim: 22, rigging: 60, led: [16, 9] }
const MAIN_STAGE: VenueLimits = { stageWidth: 24, trim: 18, rigging: 30, led: [20, 10], gusts: 13 }
const TENT: VenueLimits = { stageWidth: 16, trim: 12, rigging: 15, led: [12, 6] }

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
    limits: MAIN_STAGE,
    modelled: true,
  },
  { id: 'outdoor-theatre', name: 'Outdoor Theatre', kind: 'Festival stage', event: 'Coachella', city: 'Indio, California', source: AEG_MUSIC, limits: { ...MAIN_STAGE, stageWidth: 20, trim: 16, rigging: 24 }, modelled: false },
  { id: 'sahara', name: 'Sahara', kind: 'Festival tent', event: 'Coachella', covered: true, city: 'Indio, California', source: AEG_MUSIC, limits: TENT, modelled: false },
  { id: 'mojave', name: 'Mojave', kind: 'Festival tent', event: 'Coachella', covered: true, city: 'Indio, California', source: AEG_MUSIC, limits: TENT, modelled: false },
  { id: 'gobi', name: 'Gobi', kind: 'Festival tent', event: 'Coachella', covered: true, city: 'Indio, California', source: AEG_MUSIC, limits: TENT, modelled: false },
  {
    id: 'mane-stage',
    name: 'Mane Stage',
    kind: 'Festival main stage',
    event: 'Stagecoach',
    city: 'Indio, California',
    about: 'The main stage of Stagecoach, Goldenvoice’s country music festival.',
    source: AEG_MUSIC,
    limits: MAIN_STAGE,
    modelled: false,
  },
  { id: 'palomino', name: 'Palomino', kind: 'Festival tent', event: 'Stagecoach', covered: true, city: 'Indio, California', source: AEG_MUSIC, limits: TENT, modelled: false },
  {
    id: 'great-oak',
    name: 'Great Oak Stage',
    kind: 'Festival main stage',
    event: 'British Summer Time',
    city: 'Hyde Park, London',
    about: 'The main stage of British Summer Time Hyde Park, presented by AEG Presents.',
    source: 'aegworldwide.com · Music (AEG Presents festivals)',
    limits: { ...MAIN_STAGE, gusts: 11 },
    modelled: false,
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
    limits: ARENA,
    modelled: false,
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
    limits: ARENA,
    modelled: false,
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
    limits: ARENA,
    modelled: false,
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
    limits: ARENA,
    modelled: false,
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
    limits: ARENA,
    modelled: false,
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
