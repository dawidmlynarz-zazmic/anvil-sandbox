export type StageId = 'discover' | 'plan' | 'stay' | 'after' | 'lodge'
export type Phase = 'P1' | 'P2' | 'P3'
export type MomentId = 'home' | 'app' | 'concierge' | 'charges' | 'staff' | 'forecast' | 'after'

/** The journey stages from slide 5 of the deck. */
export const STAGES: { id: StageId; label: string }[] = [
  { id: 'discover', label: 'Discover & book' },
  { id: 'plan', label: 'Plan' },
  { id: 'stay', label: 'Stay' },
  { id: 'after', label: 'After' },
  { id: 'lodge', label: 'Inside the lodge' },
]

export interface Moment {
  id: MomentId
  path: string
  stage: StageId
  side: 'guest' | 'staff'
  phase: Phase
  title: string
  /** What the presenter says here. */
  note: string
  /** The screen on the other side of the toggle. */
  counterpart: MomentId
}

/** The storyline, in order. "Next moment" walks this list. */
export const MOMENTS: Moment[] = [
  {
    id: 'home',
    path: '/discover',
    stage: 'discover',
    side: 'guest',
    phase: 'P2',
    title: 'Personalized homepage',
    note: 'The site knows the Martinez family and Mia’s birthday. The booking agent builds the trip, and the page follows.',
    counterpart: 'forecast',
  },
  {
    id: 'app',
    path: '/plan',
    stage: 'plan',
    side: 'guest',
    phase: 'P2',
    title: 'App booking with voice',
    note: 'In the app, the family plans by voice. The agent works inside the existing checkout, not instead of it.',
    counterpart: 'forecast',
  },
  {
    id: 'concierge',
    path: '/stay',
    stage: 'stay',
    side: 'guest',
    phase: 'P3',
    title: 'In-app concierge',
    note: 'On arrival day the concierge plans Saturday, answers questions and hands over to a person with context.',
    counterpart: 'staff',
  },
  {
    id: 'charges',
    path: '/stay/charges',
    stage: 'stay',
    side: 'guest',
    phase: 'P2',
    title: 'Charge explainer',
    note: 'A duplicate cabana charge. The agent explains the bill in plain words and files a refund request.',
    counterpart: 'staff',
  },
  {
    id: 'staff',
    path: '/lodge',
    stage: 'lodge',
    side: 'staff',
    phase: 'P2',
    title: 'Staff assistant',
    note: 'Front desk sees the same ticket, with sources and a limit check. Refund it, and the guest’s app updates.',
    counterpart: 'charges',
  },
  {
    id: 'forecast',
    path: '/lodge/forecast',
    stage: 'lodge',
    side: 'staff',
    phase: 'P3',
    title: 'Demand forecast',
    note: 'Operations sees the same weekend from the lodge’s side: a busy Saturday and three recommended actions.',
    counterpart: 'home',
  },
  {
    id: 'after',
    path: '/after',
    stage: 'after',
    side: 'guest',
    phase: 'P3',
    title: 'Post-stay loop',
    note: 'After the stay, a short check-in. The feedback reaches staff, and the return offer loops back to the homepage.',
    counterpart: 'staff',
  },
]

export const momentAt = (pathname: string) => MOMENTS.find((m) => m.path === pathname) ?? MOMENTS[0]
export const momentById = (id: MomentId) => MOMENTS.find((m) => m.id === id)!
