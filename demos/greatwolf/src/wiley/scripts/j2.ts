import type { Beat, StepScript } from '../types'

// Journey 2: a first-time family, signed out, with kids aged 3 and 6. The lodge is the context; Wiley never asks where.

const GUIDE = 'GWL Things To Do guide'
const WATER = 'Lodge water park guide'

const goTo = (to: string): Beat => ({ type: 'effect', actions: [{ do: 'go', to }] })

export interface Answers {
  weekend: string
  priority: 'bunks' | 'view' | 'price'
}

function ranked(a: Answers): Beat[] {
  const cheap = a.priority === 'price'
  const top = cheap ? 'deluxe-queen' : 'pup-den-jr'
  const tag = cheap ? 'Lowest price' : a.priority === 'view' ? 'Wiley’s pick · balcony for the family' : 'Wiley’s pick · bunks for the kids'
  const weekendChip = a.weekend === 'Cheapest one' ? 'Cheapest March weekend' : a.weekend
  return [
    {
      type: 'effect',
      actions: [
        { do: 'patch', fn: () => ({ weekend: a.weekend === 'Mar 12 – 14' ? 'Mar 12 – 14' : 'Mar 5 – 7', priority: a.priority }) },
        { do: 'setFilters', chips: [weekendChip, '2 adults · 2 kids (3, 6)', 'Sleeps 4+'] },
        { do: 'rank', order: cheap ? ['deluxe-queen', 'pup-den-jr'] : ['pup-den-jr', 'deluxe-queen'], tag: { id: top, label: tag } },
        { do: 'highlight', id: top },
        { do: 'openSheet', snap: 'half' },
        { do: 'scrollTo', id: `suite-${top}` },
      ],
    },
    {
      type: 'agent',
      text: cheap
        ? 'Deluxe Queen Suite has the lowest starting rate and sleeps 5. Junior Wolf Pup Den is next, with bunks in a themed den. Want to check the water park works for your 3-year-old?'
        : 'Junior Wolf Pup Den is the best fit: bunks in a themed den, sleeps 4. Want to check the water park works for your 3-year-old?',
      textMobile: cheap ? 'Deluxe Queen has the lowest rate. Water park OK for your 3-year-old?' : 'Junior Wolf Pup Den fits best: bunks in a themed den. Check the water park for your 3-year-old?',
    },
    {
      type: 'chips',
      style: 'ai',
      options: [
        { label: 'Is the water park OK for a 3-year-old?', then: [goTo('j2/3')] },
        { label: 'See rates', then: [{ type: 'effect', actions: [{ do: 'expandRates', suite: 'pup-den-jr' }] }, goTo('j2/5')] },
      ],
    },
  ]
}

const toRates: Beat[] = [
  { type: 'agent', text: 'Want to lock in the suite?' },
  { type: 'chips', style: 'ai', options: [{ label: 'See rates for Junior Wolf Pup Den', then: [goTo('j2/5')] }] },
]

const addZoo: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToPlan', item: 'zoo' }, { do: 'toast', text: 'Added to your plan' }] },
  ...toRates,
]

/** After a rate is chosen, as a guest or a new member. Also played by the Voyagers join sheet. */
export const afterRate: Beat[] = [
  { type: 'agent', text: 'All set to check out. Or save it for later?' },
  {
    type: 'chips',
    style: 'ai',
    options: [
      { label: 'Go to checkout', then: [{ type: 'effect', actions: [{ do: 'end', card: 'checkout' }] }] },
      { label: 'Not ready yet', then: [goTo('j2/6')] },
    ],
  },
]

const planSent: Beat[] = [
  { type: 'effect', actions: [{ do: 'toast', text: 'Plan sent' }, { do: 'patch', fn: () => ({ planSaved: true }) }] },
  { type: 'agent', text: 'Sent! The link brings back this page and our chat.' },
]

export const j2: Record<number, StepScript> = {
  1: {
    enter: [{ do: 'closeSheet' }],
    beats: [],
    voiceLine: 'A weekend in March with a 3 and 6 year old',
    fallback: [{ label: 'Suite for my family vacation', then: [goTo('j2/2')] }],
  },
  2: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'A weekend in March with a 3 and 6 year old', reaction: 'wave' },
      {
        type: 'effect',
        actions: [
          { do: 'setFilters', chips: ['March weekends', '2 adults · 2 kids (3, 6)', 'Sleeps 4+'] },
          { do: 'rank', order: ['pup-den-jr', 'deluxe-queen'], tag: { id: 'pup-den-jr', label: 'Wiley’s pick · bunks for the kids' } },
          { do: 'highlight', id: 'pup-den-jr' },
        ],
      },
      { type: 'agent', text: 'Fun! Two quick questions so I can narrow it down:', textMobile: 'Fun! Which weekend?' },
      { type: 'card', component: 'questions', then: (p) => ranked(p as Answers) },
    ],
    path: ['Is the water park OK for a 3-year-old?'],
    voiceLine: 'Bunk beds for the kids',
    rules: [[/rate|price|book/i, [goTo('j2/5')]]],
    fallback: [
      { label: 'Is the water park OK for a 3-year-old?', then: [goTo('j2/3')] },
      { label: 'See rates', then: [goTo('j2/5')] },
    ],
  },
  3: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Is the water park OK for a 3-year-old?', voice: true },
      {
        type: 'effect',
        actions: [
          { do: 'spotlight', id: 'cub-paw' },
          { do: 'dim', ids: ['howlin-tornado'] },
          { do: 'scrollTo', id: 'att-cub-paw' },
        ],
      },
      {
        type: 'agent',
        text: 'Yes! Cub Paw Pool is a kiddie splash pad made for little ones, and I scrolled you to it. Bigger slides have height minimums, so your 6-year-old gets more rides.',
        textMobile: 'Yes! Cub Paw Pool is a splash pad made for little ones. I scrolled you to it.',
        source: WATER,
      },
      {
        type: 'chips',
        style: 'ai',
        options: [
          { label: 'What else is nearby?', then: [goTo('j2/4')] },
          { label: 'Back to suites', then: [goTo('j2/2')] },
        ],
      },
    ],
    path: ['What else is nearby?'],
    voiceLine: 'What else is nearby?',
    rules: [
      [/nearby|around|zoo|do/i, [goTo('j2/4')]],
      [/suite|room/i, [goTo('j2/2')]],
    ],
    fallback: [
      { label: 'What else is nearby?', then: [goTo('j2/4')] },
      { label: 'Back to suites', then: [goTo('j2/2')] },
    ],
  },
  4: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'What can we do nearby with little kids?' },
      { type: 'effect', actions: [{ do: 'highlight', id: 'nearby' }, { do: 'scrollTo', id: 'act-zoo' }] },
      {
        type: 'agent',
        text: 'Three easy wins near the lodge: Cheyenne Mountain Zoo, Garden of the Gods (free) and Manitou Springs. I highlighted them. Barr Trail is for advanced hikers, so I’d skip it.',
        textMobile: 'Three easy wins near the lodge, highlighted: the zoo, Garden of the Gods (free) and Manitou Springs.',
        source: GUIDE,
      },
      {
        type: 'chips',
        style: 'ai',
        options: [
          { label: 'Add the zoo to our plan', then: addZoo },
          {
            label: 'Plan our Sunday',
            then: [
              { type: 'agent', text: 'Zoo in the morning, check out at noon. Want it in your plan?' },
              { type: 'chips', style: 'ai', options: [{ label: 'Add the zoo to our plan', then: addZoo }] },
            ],
          },
        ],
      },
    ],
    path: ['Add the zoo to our plan', 'See rates for Junior Wolf Pup Den'],
    voiceLine: 'Add the zoo to our plan',
    rules: [
      [/zoo|giraffe/i, addZoo],
      [/garden/i, [{ type: 'effect', actions: [{ do: 'addToPlan', item: 'garden' }, { do: 'toast', text: 'Added to your plan' }] }, ...toRates]],
      [/rate|book|suite/i, [goTo('j2/5')]],
    ],
    fallback: [
      { label: 'Add the zoo to our plan', then: addZoo },
      { label: 'See rates for Junior Wolf Pup Den', then: [goTo('j2/5')] },
    ],
  },
  5: {
    enter: [{ do: 'expandRates', suite: 'pup-den-jr' }, { do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Book the Wolf Pup Den for Mar 5 to 7' },
      {
        type: 'agent',
        text: 'Good pick! Joining Voyagers Club is free, saves $4 a night, and I’ll remember your plan. Or book as a guest, no account needed. Flexible costs a bit more and lets you cancel later.',
        textMobile: 'Good pick! Joining Voyagers Club is free and saves $4 a night. Or book as a guest.',
      },
      {
        type: 'chips',
        style: 'ai',
        options: [
          { label: 'Join free and save', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'join' }] }] },
          {
            label: 'Book as guest',
            then: [{ type: 'effect', actions: [{ do: 'selectRate', suite: 'pup-den-jr', rate: 'std-non' }, { do: 'scrollTo', id: 'rate-std-non' }] }, ...afterRate],
          },
        ],
      },
    ],
    path: ['Join free and save', 'Not ready yet'],
    voiceLine: 'Book as a guest',
    rules: [
      [/join|member|voyager|save/i, [{ type: 'effect', actions: [{ do: 'sheet', which: 'join' }] }]],
      [/guest/i, [{ type: 'effect', actions: [{ do: 'selectRate', suite: 'pup-den-jr', rate: 'std-non' }] }, ...afterRate]],
    ],
    fallback: [
      { label: 'Join free and save', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'join' }] }] },
      { label: 'Book as guest', then: [{ type: 'effect', actions: [{ do: 'selectRate', suite: 'pup-den-jr', rate: 'std-non' }] }, ...afterRate] },
    ],
  },
  6: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Let me check with my partner first' },
      { type: 'agent', text: 'Of course! Want me to text this plan to you? No account needed.' },
      { type: 'card', component: 'capture', then: () => planSent },
    ],
    voiceLine: 'Send it to my phone',
    rules: [[/share|partner/i, [{ type: 'effect', actions: [{ do: 'sheet', which: 'share' }] }]]],
    fallback: [{ label: 'Share with my partner', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'share' }] }] }],
  },
}
