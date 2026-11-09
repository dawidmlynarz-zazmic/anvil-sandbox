import type { Action, Beat, StepScript } from '../types'

// Journey 1: the Martinez family, signed in as Voyagers Club members, plans Mia's 7th birthday weekend.

const GUIDE = 'GWL Things To Do guide'

/** If the presenter jumps ahead, checkout still has a trip: Flexible at the Voyagers rate. */
const ensureRate: Action = { do: 'patch', fn: (s) => (s.selected ? {} : { selected: { suite: 'pup-den-jr', rate: 'flex-voy' } }) }

const goTo = (to: string): Beat => ({ type: 'effect', actions: [{ do: 'go', to }] })

const afterAddOn: Beat[] = [
  { type: 'agent', text: 'Party’s in! Want me to plan the rest of the weekend around it?' },
  {
    type: 'chips',
    style: 'ai',
    options: [
      { label: 'Plan our weekend', then: [goTo('j1/4')] },
      { label: 'Go to checkout', then: [goTo('j1/5')] },
    ],
  },
]

const afterNotNow: Beat[] = [
  { type: 'agent', text: 'No problem. Want me to plan the rest of the weekend?' },
  {
    type: 'chips',
    style: 'ai',
    options: [
      { label: 'Plan our weekend', then: [goTo('j1/4')] },
      { label: 'Go to checkout', then: [goTo('j1/5')] },
    ],
  },
]

const weekendSet: Beat[] = [
  { type: 'agent', text: 'Your weekend’s set. Ready to book?' },
  { type: 'chips', style: 'ai', options: [{ label: 'Go to checkout', then: [goTo('j1/5')] }] },
]

const addZoo: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToPlan', item: 'zoo' }, { do: 'toast', text: 'Added to your plan' }, { do: 'scrollTo', id: 'plan-zoo' }] },
  ...weekendSet,
]
const addGarden: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToPlan', item: 'garden' }, { do: 'toast', text: 'Added to your plan' }, { do: 'scrollTo', id: 'plan-garden' }] },
  ...weekendSet,
]

export const j1: Record<number, StepScript> = {
  1: {
    enter: [{ do: 'closeSheet' }],
    beats: [],
    voiceLine: 'Mia’s birthday weekend in March. Same suite as last time?',
    fallback: [{ label: 'Plan Mia’s birthday weekend', then: [goTo('j1/2')] }],
  },
  2: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'agent', text: 'Hey Martinez crew! What are we planning?', desktopOnly: true, delayMs: 700 },
      { type: 'user', text: 'Mia’s birthday weekend in March. Same suite as last time?', voice: true, reaction: 'thumbs up' },
      {
        type: 'effect',
        actions: [
          { do: 'setFilters', chips: ['Mar 12 – 14, 2027', '2 adults · 2 kids (7, 4)'] },
          { do: 'rank', order: ['pup-den-jr', 'deluxe-queen'], tag: { id: 'pup-den-jr', label: 'Your favorite' } },
          { do: 'highlight', id: 'pup-den-jr' },
          { do: 'openSheet', snap: 'half' },
          { do: 'scrollTo', id: 'suite-pup-den-jr' },
        ],
      },
      { type: 'agent', text: 'Seven is a big one! Your Junior Wolf Pup Den is open Fri Mar 12 to Sun Mar 14. It’s at the top.' },
    ],
    voiceLine: 'Show me the rates for that suite',
    rules: [[/rate|price|cost|book/i, [{ type: 'agent', text: 'Here are your Voyagers Club rates.' }, goTo('j1/3')]]],
    fallback: [{ label: 'Show me the rates', then: [goTo('j1/3')] }],
  },
  3: {
    enter: [{ do: 'expandRates', suite: 'pup-den-jr' }, { do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Flexible please. Can we make it a party?' },
      { type: 'effect', actions: [{ do: 'selectRate', suite: 'pup-den-jr', rate: 'Flexible' }, { do: 'scrollTo', id: 'rate-flex-voy' }] },
      {
        type: 'agent',
        text: 'Done: Flexible at your Voyagers rate, so you can cancel free until closer to the trip. Mia’s birthday is Saturday. Add the party package?',
      },
      { type: 'card', component: 'quote' },
      {
        type: 'chips',
        style: 'ai',
        options: [
          { label: 'Add birthday party package', then: [{ type: 'effect', actions: [{ do: 'addToCart', item: 'party' }] }, ...afterAddOn] },
          { label: 'Add MagiQuest', then: [{ type: 'effect', actions: [{ do: 'addToCart', item: 'magiquest' }] }, ...afterNotNow] },
          { label: 'Not now', then: afterNotNow },
        ],
      },
    ],
    path: ['Add birthday party package', 'Plan our weekend'],
    voiceLine: 'Add the birthday party',
    rules: [
      [/party|birthday/i, [{ type: 'effect', actions: [{ do: 'addToCart', item: 'party' }] }, ...afterAddOn]],
      [/checkout|pay|book/i, [goTo('j1/5')]],
    ],
    fallback: [
      { label: 'Add birthday party package', then: [{ type: 'effect', actions: [{ do: 'addToCart', item: 'party' }] }, ...afterAddOn] },
      { label: 'Plan our weekend', then: [goTo('j1/4')] },
    ],
  },
  4: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Anything for Sunday morning before we head home?', voice: 'mobile' },
      {
        type: 'agent',
        text: 'Cheyenne Mountain Zoo is a favorite near the lodge: kids can hand-feed giraffes and ride the carousel. Garden of the Gods is free if you’d rather walk the red rocks.',
        textMobile: 'Cheyenne Mountain Zoo is a favorite near the lodge: kids can hand-feed giraffes. Garden of the Gods is free.',
        source: GUIDE,
      },
      {
        type: 'chips',
        style: 'ai',
        options: [
          { label: 'Add the zoo to Sunday', then: addZoo },
          { label: 'Garden of the Gods instead', then: addGarden },
        ],
      },
    ],
    path: ['Add the zoo to Sunday', 'Go to checkout'],
    voiceLine: 'Add the zoo to Sunday',
    rules: [
      [/zoo|giraffe/i, addZoo],
      [/garden|rock|free/i, addGarden],
      [/checkout|pay|book/i, [goTo('j1/5')]],
    ],
    fallback: [
      { label: 'Add the zoo to Sunday', then: addZoo },
      { label: 'Go to checkout', then: [goTo('j1/5')] },
    ],
  },
  5: {
    enter: [{ do: 'closeSheet' }, ensureRate],
    beats: [],
    voiceLine: 'Is the party package refundable?',
    rules: [[/card|pay|apple/i, [{ type: 'agent', text: 'Payment happens on the page, with Apple Pay or your saved card. I never take card details in chat.' }]]],
    fallback: [{ label: 'Pay with Apple Pay', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'apple' }] }] }],
  },
  6: {
    enter: [{ do: 'closeSheet' }, ensureRate],
    beats: [],
    voiceLine: 'What time is check-in?',
    fallback: [{ label: 'Open in the Great Wolf app', then: [{ type: 'effect', actions: [{ do: 'end', card: 'companion' }] }] }],
  },
}
