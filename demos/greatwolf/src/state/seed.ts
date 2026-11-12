import type { AppState, DemoState, Journey, PlanItem } from '~/wiley/types'

const J1_PLAN: PlanItem[] = [
  { id: 'water', day: 'fri', time: '3:00 pm', title: 'Water park', sub: 'Passes included' },
  { id: 'dinner', day: 'fri', time: '6:30 pm', title: 'Dinner at Loose Moose Family Kitchen', sub: 'In the lodge' },
  { id: 'magiquest', day: 'sat', time: '10:00', title: 'MagiQuest', sub: 'In the lodge' },
  { id: 'party', day: 'sat', time: '1:00 pm', title: 'Mia’s birthday', sub: 'At the lodge' },
  { id: 'golf', day: 'sat', time: '4:00 pm', title: 'Howl in One Mini Golf', sub: 'In the lodge' },
  { id: 'dance', day: 'sat', time: '7:30 pm', title: 'Family dance party', sub: 'In the lodge · free every night' },
  { id: 'zoo', day: 'sun', time: '9:30', title: 'Cheyenne Mountain Zoo', sub: 'Near the lodge · hand-feed giraffes', status: 'Suggested' },
  { id: 'checkout', day: 'sun', time: '11:00', title: 'Check out and head home' },
]

export const APP_START: AppState = {
  phase: 'before',
  clock: 'Wed 6:10 PM',
  tab: 'home',
  screen: null,
  sheet: false,
  banner: null,
  checkedIn: false,
  arrival: null,
  reminders: [],
  team: 'off',
  heights: null,
  forPack: false,
  cake: false,
  lateCheckout: false,
  checkedOut: false,
  lostReported: false,
  lostFound: false,
  rating: null,
  nextTrip: false,
}

export function seed(journey: Journey): DemoState {
  // Journey 3 picks up after Journey 1: the Martinez family's weekend is booked with a Birthday Bash and Paw Passes.
  const booked = journey === 3
  return {
    journey,
    signedIn: journey !== 2,
    filters: [],
    setByWiley: false,
    widened: false,
    ranked: [],
    tags: {},
    highlight: null,
    dim: [],
    spotlight: null,
    expanded: null,
    selected: booked ? { suite: 'pup-den-jr', rate: 'std-voy' } : null,
    cart: booked
      ? [
          { id: 'birthday-bash', label: 'Birthday Bash', amount: 129.99, price: '$129.99*', kind: 'birthday' },
          { id: 'paw-pass', label: 'Paw Pass ×2', amount: 129.98, price: '$129.98*', kind: 'pass' },
        ]
      : [],
    plan: journey === 2 ? [] : J1_PLAN,
    ideas: [],
    // J1: the Martinez family's favorite weekend. J2: no dates until the family gives them.
    stay: journey !== 2 ? { start: '2027-03-12', adults: 2, kids: [7, 4], by: null } : { start: null, adults: 2, kids: [3, 6], by: null },
    stayNote: null,
    priority: null,
    toast: null,
    open: false,
    snap: 'half',
    sheet: null,
    planSaved: false,
    planCount: 0,
    tripText: null,
    tripVoice: false,
    loadingSuites: false,
    planDay: null,
    skipped: [],
    planEdits: {},
    app: APP_START,
  }
}
