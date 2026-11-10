import type { DemoState, Journey, PlanItem } from '~/wiley/types'

const J1_PLAN: PlanItem[] = [
  { id: 'water', day: 'fri', time: '3:00 pm', title: 'Water park', sub: 'Passes included' },
  { id: 'dinner', day: 'fri', time: '6:30 pm', title: 'Dinner at the lodge', sub: 'Dining' },
  { id: 'magiquest', day: 'sat', time: '10:00', title: 'MagiQuest', sub: 'In the lodge', status: 'Added' },
  { id: 'party', day: 'sat', time: '1:00 pm', title: 'Mia’s birthday party', sub: 'Party package', status: 'Booked' },
  { id: 'golf', day: 'sat', time: '4:00 pm', title: 'Howl in One Mini Golf', sub: 'In the lodge' },
  { id: 'dance', day: 'sat', time: '7:30 pm', title: 'Family dance party', sub: 'In the lodge · included' },
  { id: 'zoo', day: 'sun', time: '9:30', title: 'Cheyenne Mountain Zoo', sub: 'Near the lodge · hand-feed giraffes', status: 'Suggested' },
  { id: 'checkout', day: 'sun', time: '12:00', title: 'Check out and head home' },
]

export function seed(journey: Journey): DemoState {
  return {
    journey,
    signedIn: journey === 1,
    filters: [],
    setByWiley: false,
    widened: false,
    ranked: [],
    tags: {},
    highlight: null,
    dim: [],
    spotlight: null,
    expanded: null,
    selected: null,
    cart: [],
    plan: journey === 1 ? J1_PLAN : [],
    ideas: [],
    weekend: 'Mar 5 – 7',
    priority: null,
    toast: null,
    open: false,
    snap: 'half',
    sheet: null,
    planSaved: false,
    planCount: 0,
    tripText: null,
    planDay: null,
  }
}
