// Fixtures for the Journeys v2 prototype. `real` marks names and prices taken from greatwolf.com; everything else is a
// sample and shows a "sample" label in the UI. Nothing here invents March prices beyond the four rates in the build
// script, and no cancellation dates are invented: sample rates print `[date]`.

export const lodge = {
  name: 'Great Wolf Lodge',
  city: 'Colorado Springs, CO',
  address: '9494 Federal Drive',
  phone: '844.553.9653',
}

export type Tier = 'Standard' | 'Themed' | 'Premium'

export interface Suite {
  id: string
  name: string
  tier: Tier
  sleeps: number
  lead: string
  rest: string
  /** Room-variant dropdown, when the suite has one. */
  variant?: string
  /** Starting rate per night, in dollars. */
  from: number
  /** True when the name, description and starting rate come from the live site. */
  real: boolean
  photos: number
  bunks?: boolean
}

export const suites: Suite[] = [
  {
    id: 'deluxe-queen',
    name: 'Deluxe Queen Suite',
    tier: 'Standard',
    sleeps: 5,
    lead: 'Balcony/Patio, Mountain View',
    rest: ' suite featuring two queen beds as well as a living area.',
    variant: 'Balcony/Patio & View',
    from: 109,
    real: true,
    photos: 3,
  },
  {
    id: 'pup-den-jr',
    name: 'Junior Wolf Pup Den Suite',
    tier: 'Themed',
    sleeps: 4,
    lead: 'Balcony suite',
    rest: ' featuring a Northwoods-themed sleeping area.',
    from: 119,
    real: true,
    photos: 5,
    bunks: true,
  },
  {
    id: 'kidcabin',
    name: 'KidCabin Suite',
    tier: 'Themed',
    sleeps: 6,
    lead: 'Queen and bunk bed',
    rest: ', with Wiley’s Clubhouse sleeping area.',
    from: 189,
    real: false,
    photos: 4,
    bunks: true,
  },
]

export const suiteById = (id: string) => suites.find((s) => s.id === id)!

export type RateKey = 'std-voy' | 'flex-voy' | 'std-non' | 'flex-non'

export interface Rate {
  key: RateKey
  plan: 'Standard' | 'Flexible'
  member: boolean
  price: number
  policy: string
}

const REAL_POLICY = {
  std: 'Change and Cancel for free on or before November 9, 2026',
  flex: 'Risk Free Booking. Free cancellation on or before December 15, 2026',
}
const DATE_POLICY = {
  std: 'Change and Cancel for free on or before [date]',
  flex: 'Risk Free Booking. Free cancellation on or before [date]',
}

/** The four rates in the live order: Standard and Flexible for Voyagers Club, then for non-members. */
export function ratesFor(suiteId: string): Rate[] {
  const s = suiteById(suiteId)
  const p = suiteId === 'deluxe-queen' ? REAL_POLICY : DATE_POLICY
  const price =
    suiteId === 'deluxe-queen'
      ? [109, 115, 113, 118]
      : suiteId === 'pup-den-jr'
        ? [119, 125, 123, 128]
        : [s.from, s.from + 6, s.from + 4, s.from + 9]
  return [
    { key: 'std-voy', plan: 'Standard', member: true, price: price[0], policy: p.std },
    { key: 'flex-voy', plan: 'Flexible', member: true, price: price[1], policy: p.flex },
    { key: 'std-non', plan: 'Standard', member: false, price: price[2], policy: p.std },
    { key: 'flex-non', plan: 'Flexible', member: false, price: price[3], policy: p.flex },
  ]
}

export const rateOf = (suiteId: string, key: RateKey) => ratesFor(suiteId).find((r) => r.key === key)!


export type Fit = 'great' | 'free' | 'ok' | 'older' | 'no'

export interface Activity {
  id: string
  name: string
  where: 'lodge' | 'nearby'
  blurb: string
  tag: string
  fit: Fit
  source: string
}

const GUIDE = 'GWL Things To Do guide'

export const nearby: Activity[] = [
  { id: 'zoo', name: 'Cheyenne Mountain Zoo', where: 'nearby', blurb: 'Hand-feed giraffes, ride the carousel', tag: 'Great fit', fit: 'great', source: GUIDE },
  { id: 'garden', name: 'Garden of the Gods', where: 'nearby', blurb: 'Red rock trails, free entry', tag: 'Free', fit: 'free', source: GUIDE },
  { id: 'manitou', name: 'Manitou Springs', where: 'nearby', blurb: 'Historic downtown, galleries', tag: 'Nearby', fit: 'ok', source: GUIDE },
  { id: 'gorge', name: 'Royal Gorge Bridge & Park', where: 'nearby', blurb: 'Zip line and sky coaster, better for older kids', tag: 'Older kids', fit: 'older', source: GUIDE },
  { id: 'barr', name: 'Barr Trail', where: 'nearby', blurb: 'Pikes Peak summit hike, advanced hikers only', tag: 'Not for little kids', fit: 'no', source: GUIDE },
  { id: 'wolf-center', name: 'Colorado Wolf and Wildlife Center', where: 'nearby', blurb: 'About an hour away', tag: 'Nearby', fit: 'ok', source: GUIDE },
]

export const activityById = (id: string) => nearby.find((a) => a.id === id)

export const WATER = 'Lodge water park guide'

export interface Attraction {
  id: string
  name: string
  kind: string
  blurb?: string
}

/** The three water park cards Wiley points at; only Cub Paw Pool's description is given. The rest is listed by name. */
export const waterPark: Attraction[] = [
  { id: 'cub-paw', name: 'Cub Paw Pool', kind: 'Kiddie Splash Pad', blurb: 'Shallow water and small slides for the littlest swimmers.' },
  { id: 'fort-mackenzie', name: 'Fort Mackenzie', kind: 'Water Playground' },
  { id: 'howlin-tornado', name: 'Howlin’ Tornado', kind: 'Water Slide · height minimum' },
]

export const moreWaterPark = ['Whooping Hollow', 'Big Foot Pass', 'Slap Tail Pond', 'Chinook Cove', 'Totem Towers', 'Alberta Falls', 'Mountain Edge Raceway', 'Wolf Tail']

export const lodgeAttractions = ['MagiQuest', 'Ten Paw Alley', 'Rustic Ridge Climbing Wall', 'Oliver’s Mining Co.', 'Northern Lights Arcade', 'Howl in One Mini Golf', 'Howlers Peak Ropes Course', 'Build-A-Bear Workshop']

export const families = {
  martinez: {
    name: 'Martinez',
    lead: 'Carlos',
    kids: [
      { name: 'Mia', age: 7 },
      { name: 'Leo', age: 4 },
    ],
    favorite: 'pup-den-jr',
    card: 'Visa ending 0912',
  },
  guest: { adults: 2, kids: [3, 6] },
}

export const dates = {
  j1: { label: 'Mar 12 – 14, 2027', short: 'Mar 12 – 14', long: 'Fri Mar 12 – Sun Mar 14, 2027', nights: 2 },
  j2a: { label: 'Mar 5 – 7, 2027', short: 'Mar 5 – 7', long: 'Fri Mar 5 – Sun Mar 7, 2027', nights: 2 },
  j2b: { label: 'Mar 12 – 14, 2027', short: 'Mar 12 – 14', long: 'Fri Mar 12 – Sun Mar 14, 2027', nights: 2 },
}

export const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`
