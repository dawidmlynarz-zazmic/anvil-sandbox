import type { Action, Beat, Option, StepScript } from '../types'

// Journey 1: the Martinez family, signed in as Voyagers Club members, plans Mia's 7th birthday weekend.
// Every choice gets its own answer and its own change on the page; Next follows the `path` (the happy path).

const GUIDE = 'GWL Things To Do guide'

/** If the presenter jumps ahead, checkout still has a trip: Flexible at the Voyagers rate. */
const ensureRate: Action = { do: 'patch', fn: (s) => (s.selected ? {} : { selected: { suite: 'pup-den-jr', rate: 'flex-voy' } }) }

const goTo = (to: string): Beat => ({ type: 'effect', actions: [{ do: 'go', to }] })
const say = (text: string, extra: Partial<Extract<Beat, { type: 'agent' }>> = {}): Beat => ({ ...extra, type: 'agent', text })
const chips = (...options: Option[]): Beat => ({ type: 'chips', style: 'ai', options })

// ── J1·2: which suite ───────────────────────────────────────────────────────────────────────────────────────────

const toRates = (suite: string): Beat[] => [{ type: 'effect', actions: [{ do: 'expandRates', suite }] }, goTo('j1/3')]

const favoriteRates: Option = { label: 'See the rates', then: toRates('pup-den-jr') }

const moreRoom: Option = {
  label: 'More room for the kids',
  then: [
    {
      type: 'effect',
      actions: [
        { do: 'rank', order: ['kidcabin', 'pup-den-jr', 'deluxe-queen'], tag: { id: 'kidcabin', label: 'More room · sleeps 6' } },
        { do: 'highlight', id: 'kidcabin' },
        { do: 'scrollTo', id: 'suite-kidcabin' },
      ],
    },
    say('KidCabin Suite sleeps 6, with a queen bed and a bunk bed in Wiley’s Clubhouse sleeping area. I moved it to the top. Its rates here are samples.'),
    chips(
      { label: 'See KidCabin rates', then: toRates('kidcabin') },
      { label: 'Keep our favorite', then: [{ type: 'effect', actions: [{ do: 'rank', order: ['pup-den-jr', 'deluxe-queen'] }, { do: 'highlight', id: 'pup-den-jr' }, { do: 'scrollTo', id: 'suite-pup-den-jr' }] }, say('Back to your Junior Wolf Pup Den.'), chips(favoriteRates)] },
    ),
  ],
}

const cheaper: Option = {
  label: 'Something cheaper',
  then: [
    {
      type: 'effect',
      actions: [
        { do: 'rank', order: ['deluxe-queen', 'pup-den-jr'], tag: { id: 'deluxe-queen', label: 'Lowest rate · from $109' } },
        { do: 'highlight', id: 'deluxe-queen' },
        { do: 'scrollTo', id: 'suite-deluxe-queen' },
      ],
    },
    say('Deluxe Queen Suite starts at $109 a night, $10 less than the Pup Den. It sleeps 5 with two queen beds and a balcony or patio, but no themed den for the kids.'),
    chips(
      { label: 'See Deluxe Queen rates', then: toRates('deluxe-queen') },
      { label: 'Keep the den', then: [{ type: 'effect', actions: [{ do: 'rank', order: ['pup-den-jr', 'deluxe-queen'] }, { do: 'highlight', id: 'pup-den-jr' }, { do: 'scrollTo', id: 'suite-pup-den-jr' }] }, say('Good call, the den is the fun part. Here are its rates.'), ...toRates('pup-den-jr')] },
    ),
  ],
}

// ── J1·3: rate and add-ons ──────────────────────────────────────────────────────────────────────────────────────

const nextStep = (text: string): Beat[] => [
  say(text),
  chips({ label: 'Plan our weekend', then: [goTo('j1/4')] }, { label: 'Go to checkout', then: [goTo('j1/5')] }),
]

const addParty: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToCart', item: 'party' }] },
  ...nextStep('Party’s in! Want me to plan the rest of the weekend around it?'),
]
const addMagiQuest: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToCart', item: 'magiquest' }] },
  ...nextStep('MagiQuest is in, like last time. Its price is still to be confirmed. Want me to plan the weekend around it?'),
]

const switchToStandard: Option = {
  label: 'Switch to Standard',
  then: [
    { type: 'effect', actions: [{ do: 'selectRate', suite: '@current', rate: 'Standard' }, { do: 'scrollTo', id: 'rate-std-voy' }] },
    say('Switched to Standard at your Voyagers rate. It’s $6 a night less; you can change or cancel for free until [date].'),
    chips({ label: 'Add birthday party package', then: addParty }, { label: 'Add MagiQuest', then: addMagiQuest }, { label: 'Not now', then: nextStep('No problem. Want me to plan the rest of the weekend?') }),
  ],
}

const rateDifference: Option = {
  label: 'What’s the difference?',
  then: [
    say('Both are your Voyagers Club rates. Standard is $6 a night less, with free changes and cancellation until [date]. Flexible is risk-free: free cancellation until [date], closer to the trip.'),
    chips({ label: 'Keep Flexible', then: [say('Flexible it is. Add the party package for Saturday?'), chips({ label: 'Add birthday party package', then: addParty }, { label: 'Not now', then: nextStep('No problem. Want me to plan the rest of the weekend?') })] }, switchToStandard),
  ],
}

// ── J1·4: the weekend plan ──────────────────────────────────────────────────────────────────────────────────────

const ready: Beat[] = [
  say('Your weekend’s set. Ready to book?'),
  chips(
    { label: 'Go to checkout', then: [goTo('j1/5')] },
    {
      label: 'Move MagiQuest to Friday',
      then: [
        {
          type: 'effect',
          actions: [
            { do: 'patch', fn: (s) => ({ plan: s.plan.map((p) => (p.id === 'magiquest' ? { ...p, day: 'fri', time: '7:30 pm' } : p)) }) },
            { do: 'toast', text: 'MagiQuest moved to Friday' },
            { do: 'scrollTo', id: 'plan-magiquest' },
          ],
        },
        {
          type: 'agent',
          text: (s) =>
            s.cart.some((c) => c.id === 'party')
              ? 'Moved: MagiQuest is Friday at 7:30 pm, so Saturday morning is free before the party.'
              : 'Moved: MagiQuest is Friday at 7:30 pm, so Saturday morning is free.',
        },
        chips({ label: 'Go to checkout', then: [goTo('j1/5')] }),
      ],
    },
  ),
]

const addZoo: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToPlan', item: 'zoo' }, { do: 'toast', text: 'Added to your plan' }, { do: 'scrollTo', id: 'plan-zoo' }] },
  ...ready,
]
const addGarden: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToPlan', item: 'garden' }, { do: 'toast', text: 'Swapped for Garden of the Gods' }, { do: 'scrollTo', id: 'plan-garden' }] },
  say('Swapped in Garden of the Gods for Sunday morning: red rock trails, and it’s free.', { source: GUIDE }),
  ...ready,
]
const keepFree: Beat[] = [
  {
    type: 'effect',
    actions: [{ do: 'patch', fn: (s) => ({ plan: s.plan.filter((p) => p.id !== 'zoo') }) }, { do: 'toast', text: 'Sunday morning is free' }],
  },
  say('Done. Sunday morning is free; check-out is at 12:00.'),
  ...ready,
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
      say('Hey Martinez crew! What are we planning?', { desktopOnly: true, delayMs: 700 }),
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
      say('Seven is a big one! Your Junior Wolf Pup Den is open Fri Mar 12 to Sun Mar 14. It’s at the top.'),
      chips(favoriteRates, moreRoom, cheaper),
    ],
    path: ['See the rates'],
    voiceLine: 'Show me the rates for that suite',
    rules: [
      [/room|bigger|six|6/i, moreRoom.then],
      [/cheap|price|less|budget/i, cheaper.then],
      [/rate|book/i, favoriteRates.then],
    ],
    fallback: [favoriteRates, moreRoom, cheaper],
  },
  3: {
    // Rates for the suite chosen on the suites page (the favorite unless the family picked another).
    enter: [{ do: 'patch', fn: (s) => (s.expanded ? {} : { expanded: 'pup-den-jr' }) }, { do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Flexible please. Can we make it a party?' },
      { type: 'effect', actions: [{ do: 'selectRate', suite: '@current', rate: 'Flexible' }, { do: 'scrollTo', id: 'rate-flex-voy' }] },
      say('Done: Flexible at your Voyagers rate, so you can cancel free until closer to the trip. Mia’s birthday is Saturday. Add the party package?'),
      { type: 'card', component: 'quote' },
      chips(
        { label: 'Add birthday party package', then: addParty },
        { label: 'Add MagiQuest', then: addMagiQuest },
        rateDifference,
        { label: 'Not now', then: nextStep('No problem. Want me to plan the rest of the weekend?') },
      ),
    ],
    path: ['Add birthday party package', 'Plan our weekend'],
    voiceLine: 'Add the birthday party',
    rules: [
      [/party|birthday/i, addParty],
      [/magi/i, addMagiQuest],
      [/standard|cheaper/i, switchToStandard.then],
      [/difference|flexible|cancel/i, rateDifference.then],
      [/checkout|pay|book/i, [goTo('j1/5')]],
    ],
    fallback: [
      { label: 'Add birthday party package', then: addParty },
      rateDifference,
      { label: 'Plan our weekend', then: [goTo('j1/4')] },
    ],
  },
  4: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Anything for Sunday morning before we head home?', voice: 'mobile' },
      say(
        'Cheyenne Mountain Zoo is a favorite near the lodge: kids can hand-feed giraffes and ride the carousel. Garden of the Gods is free if you’d rather walk the red rocks.',
        { textMobile: 'Cheyenne Mountain Zoo is a favorite near the lodge: kids can hand-feed giraffes. Garden of the Gods is free.', source: GUIDE },
      ),
      chips({ label: 'Add the zoo to Sunday', then: addZoo }, { label: 'Garden of the Gods instead', then: addGarden }, { label: 'Keep Sunday free', then: keepFree }),
    ],
    path: ['Add the zoo to Sunday', 'Go to checkout'],
    voiceLine: 'Add the zoo to Sunday',
    rules: [
      [/zoo|giraffe/i, addZoo],
      [/garden|rock/i, addGarden],
      [/free|nothing|relax|rest/i, keepFree],
      [/checkout|pay|book/i, [goTo('j1/5')]],
    ],
    fallback: [
      { label: 'Add the zoo to Sunday', then: addZoo },
      { label: 'Keep Sunday free', then: keepFree },
      { label: 'Go to checkout', then: [goTo('j1/5')] },
    ],
  },
  5: {
    enter: [{ do: 'closeSheet' }, ensureRate],
    beats: [],
    voiceLine: 'Is the party package refundable?',
    rules: [[/card|pay|apple/i, [say('Payment happens on the page, with Apple Pay or your saved card. I never take card details in chat.')]]],
    fallback: [{ label: 'Pay with Apple Pay', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'apple' }] }] }],
  },
  6: {
    enter: [{ do: 'closeSheet' }, ensureRate],
    beats: [],
    voiceLine: 'What time is check-in?',
    fallback: [{ label: 'Open in the Great Wolf app', then: [{ type: 'effect', actions: [{ do: 'end', card: 'companion' }] }] }],
  },
}
