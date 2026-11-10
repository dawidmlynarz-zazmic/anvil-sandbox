import { money, rateOf, suiteById, type RateKey } from '~/data/fixtures'
import type { Beat, DemoState, Option, StepScript } from '../types'

// Journey 2: a first-time family, signed out, with kids aged 3 and 6. The lodge is the context; Wiley never asks where.
// Every choice gets its own answer and its own change on the page; Next follows the `path` (the happy path).

const GUIDE = 'GWL Things To Do guide'
const WATER = 'Lodge water park guide'

const goTo = (to: string): Beat => ({ type: 'effect', actions: [{ do: 'go', to }] })
const say = (text: string, extra: Partial<Extract<Beat, { type: 'agent' }>> = {}): Beat => ({ ...extra, type: 'agent', text })
const chips = (...options: Option[]): Beat => ({ type: 'chips', style: 'ai', options })

export interface Answers {
  weekend: string
  priority: 'bunks' | 'view' | 'price'
}

// ── J2·2: suites ────────────────────────────────────────────────────────────────────────────────────────────────

const waterPark: Option = { label: 'Is the water park OK for a 3-year-old?', then: [goTo('j2/3')] }
const seeRates: Option = { label: 'See rates', then: [{ type: 'effect', actions: [{ do: 'expandRates', suite: 'pup-den-jr' }] }, goTo('j2/5')] }
const compare: Option = {
  label: 'Compare the top two',
  then: [
    say('Junior Wolf Pup Den sleeps 4, with bunk beds in a Northwoods-themed den and a balcony, from $119 a night. Deluxe Queen Suite sleeps 5, with two queen beds and a balcony or patio, from $109. Both include water park passes.', {
      textMobile: 'Pup Den: sleeps 4, bunks in a themed den, from $119. Deluxe Queen: sleeps 5, two queens, from $109. Both include water park passes.',
    }),
    chips(waterPark, seeRates),
  ],
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
    say(
      cheap
        ? 'Deluxe Queen Suite has the lowest starting rate and sleeps 5. Junior Wolf Pup Den is next, with bunks in a themed den. Want to check the water park works for your 3-year-old?'
        : a.priority === 'view'
          ? 'Junior Wolf Pup Den has a balcony and a themed den with bunks, and sleeps 4. Want to check the water park works for your 3-year-old?'
          : 'Junior Wolf Pup Den is the best fit: bunks in a themed den, sleeps 4. Want to check the water park works for your 3-year-old?',
      {
        textMobile: cheap
          ? 'Deluxe Queen has the lowest rate. Water park OK for your 3-year-old?'
          : 'Junior Wolf Pup Den fits best: bunks in a themed den. Check the water park for your 3-year-old?',
      },
    ),
    chips(waterPark, compare, seeRates),
  ]
}

// ── J2·3: water park ────────────────────────────────────────────────────────────────────────────────────────────

const nearby: Option = { label: 'What else is nearby?', then: [goTo('j2/4')] }
const backToSuites: Option = { label: 'Back to suites', then: [goTo('j2/2')] }
const sixYearOld: Option = {
  label: 'And for our 6-year-old?',
  then: [
    { type: 'effect', actions: [{ do: 'spotlight', id: 'fort-mackenzie' }, { do: 'dim', ids: ['howlin-tornado'] }, { do: 'scrollTo', id: 'att-fort-mackenzie' }] },
    say('Fort Mackenzie, the water playground, is the next step up, and I moved the spotlight to it. Bigger slides like Howlin’ Tornado have height minimums, so check them on the day.', {
      textMobile: 'Fort Mackenzie, the water playground, is the next step up. I moved the spotlight to it.',
      source: WATER,
    }),
    chips(nearby, backToSuites),
  ],
}

// ── J2·4: things to do ──────────────────────────────────────────────────────────────────────────────────────────

const lockIn: Beat[] = [say('Want to lock in the suite?'), chips({ label: 'See rates for Junior Wolf Pup Den', then: [{ type: 'effect', actions: [{ do: 'expandRates', suite: 'pup-den-jr' }] }, goTo('j2/5')] })]

const addZoo: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToPlan', item: 'zoo' }, { do: 'toast', text: 'Added to your plan' }, { do: 'scrollTo', id: 'act-zoo' }] },
  ...lockIn,
]
const addGarden: Beat[] = [
  { type: 'effect', actions: [{ do: 'addToPlan', item: 'garden' }, { do: 'toast', text: 'Added to your plan' }, { do: 'scrollTo', id: 'act-garden' }] },
  say('Garden of the Gods is in: red rock trails, and entry is free.', { source: GUIDE }),
  ...lockIn,
]
const whyNotBarr: Option = {
  label: 'Why skip Barr Trail?',
  then: [
    { type: 'effect', actions: [{ do: 'scrollTo', id: 'act-barr' }] },
    say('Barr Trail is the Pikes Peak summit hike, for advanced hikers only. Not one for a 3-year-old.', { source: GUIDE }),
    chips({ label: 'Add the zoo to our plan', then: addZoo }, { label: 'Add Garden of the Gods', then: addGarden }),
  ],
}

// ── J2·5: rates ─────────────────────────────────────────────────────────────────────────────────────────────────

const ratedSuite = (s: DemoState) => s.expanded ?? 'pup-den-jr'

/** After a rate is chosen, as a guest or a new member. */
const afterRateOptions: Option[] = [
  { label: 'Go to checkout', then: [{ type: 'effect', actions: [{ do: 'end', card: 'checkout' }] }] },
  { label: 'Not ready yet', then: [goTo('j2/6')] },
]

const join: Option = { label: 'Join free and save', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'join' }] }] }

/** A rate chosen in the chat or with a card's Select. A member rate picked while signed out opens the join sheet. */
const rateChosen = (key: RateKey): Beat[] => {
  const member = key.endsWith('voy')
  const needsJoin = (s: DemoState) => member && !s.signedIn
  return [
    {
      type: 'effect',
      actions: [
        { do: 'selectRate', suite: '@current', rate: key },
        { do: 'scrollTo', id: `rate-${key}` },
        { do: 'patch', fn: (s) => (needsJoin(s) ? { sheet: 'join' } : {}) },
      ],
    },
    {
      type: 'agent',
      text: (s) => {
        if (needsJoin(s)) return 'That’s the Voyagers Club rate. Join for free and I’ll keep it for you.'
        const r = rateOf(ratedSuite(s), key)
        const terms = r.plan === 'Flexible' ? 'You can cancel for free until [date].' : 'Free changes and cancellation until [date].'
        return `${r.plan} ${member ? 'at your Voyagers Club rate' : 'as a guest'}: ${money(r.price)} a night. ${terms}`
      },
    },
    {
      type: 'chips',
      style: 'ai',
      options: (s) => (needsJoin(s) ? [] : s.signedIn ? afterRateOptions : [...afterRateOptions, { ...join, label: 'Join free and save $4 a night' }]),
    },
  ]
}

const standardMember: Option = { label: 'Standard', say: 'Standard, please', then: rateChosen('std-voy') }
const flexibleMember: Option = { label: 'Flexible', say: 'Flexible, please', then: rateChosen('flex-voy') }
const standardGuest: Option = { label: 'Standard as a guest', say: 'Standard as a guest, please', then: rateChosen('std-non') }
const flexibleGuest: Option = { label: 'Flexible as a guest', say: 'Flexible as a guest, please', then: rateChosen('flex-non') }

/** Played by the join sheet when the family had already picked a rate: it is kept, at the member price. */
export const afterJoinWithRate: Beat[] = [say('Welcome to Voyagers Club! I kept your choice, now at the member rate.'), chips(...afterRateOptions)]

/** Played by the join sheet when no rate was picked yet: Wiley asks instead of choosing for them. */
export const afterJoinPickRate: Beat[] = [say('Welcome to Voyagers Club! Your member rates are showing. Which one would you like?'), chips(standardMember, flexibleMember)]

// ── J2·6: save the plan ─────────────────────────────────────────────────────────────────────────────────────────

const share: Beat[] = [{ type: 'effect', actions: [{ do: 'sheet', which: 'share' }] }, say('Opened your share options. Pick how to send it.')]

const planSent: Beat[] = [
  { type: 'effect', actions: [{ do: 'toast', text: 'Plan sent' }, { do: 'patch', fn: () => ({ planSaved: true }) }] },
  say('Sent! The link brings back this plan and our chat. Want to see what it shows?'),
  chips(
    { label: 'Preview the plan', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'plan' }] }] },
    { label: 'Share with my partner too', then: share },
    { label: 'Book it now', then: [{ type: 'effect', actions: [{ do: 'end', card: 'checkout' }] }] },
  ),
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
      { type: 'user', text: (s) => s.tripText ?? 'A weekend in March with a 3 and 6 year old', reaction: 'wave' },
      {
        type: 'effect',
        actions: [
          { do: 'setFilters', chips: ['March weekends', '2 adults · 2 kids (3, 6)', 'Sleeps 4+'] },
          { do: 'rank', order: ['pup-den-jr', 'deluxe-queen'], tag: { id: 'pup-den-jr', label: 'Wiley’s pick · bunks for the kids' } },
          { do: 'highlight', id: 'pup-den-jr' },
        ],
      },
      say('Fun! Two quick questions so I can narrow it down:', { textMobile: 'Fun! Which weekend?' }),
      { type: 'card', component: 'questions', then: (p) => ranked(p as Answers) },
    ],
    path: ['Is the water park OK for a 3-year-old?'],
    voiceLine: 'Bunk beds for the kids',
    rules: [
      [/compare|differ/i, compare.then],
      [/water|pool|slide/i, [goTo('j2/3')]],
      [/rate|price|book/i, seeRates.then],
    ],
    fallback: [waterPark, compare, seeRates],
  },
  3: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Is the water park OK for a 3-year-old?', voice: true },
      { type: 'effect', actions: [{ do: 'spotlight', id: 'cub-paw' }, { do: 'dim', ids: ['howlin-tornado'] }, { do: 'scrollTo', id: 'att-cub-paw' }] },
      say('Yes! Cub Paw Pool is a kiddie splash pad made for little ones, and I scrolled you to it. Bigger slides have height minimums, so your 6-year-old gets more rides.', {
        textMobile: 'Yes! Cub Paw Pool is a splash pad made for little ones. I scrolled you to it.',
        source: WATER,
      }),
      chips(nearby, sixYearOld, backToSuites),
    ],
    path: ['What else is nearby?'],
    voiceLine: 'What else is nearby?',
    rules: [
      [/6|six|older|big/i, sixYearOld.then],
      [/nearby|around|zoo|do/i, [goTo('j2/4')]],
      [/suite|room/i, [goTo('j2/2')]],
    ],
    fallback: [nearby, sixYearOld, backToSuites],
  },
  4: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'What can we do nearby with little kids?' },
      { type: 'effect', actions: [{ do: 'highlight', id: 'nearby' }, { do: 'scrollTo', id: 'act-zoo' }] },
      say('Three easy wins near the lodge: Cheyenne Mountain Zoo, Garden of the Gods (free) and Manitou Springs. I highlighted them. Barr Trail is for advanced hikers, so I’d skip it.', {
        textMobile: 'Three easy wins near the lodge, highlighted: the zoo, Garden of the Gods (free) and Manitou Springs.',
        source: GUIDE,
      }),
      chips(
        { label: 'Add the zoo to our plan', then: addZoo },
        { label: 'Add Garden of the Gods', then: addGarden },
        {
          label: 'Plan our Sunday',
          then: [say('Zoo in the morning, check out at noon. Want it in your plan?'), chips({ label: 'Add the zoo to our plan', then: addZoo }, { label: 'Garden of the Gods instead', then: addGarden })],
        },
        whyNotBarr,
      ),
    ],
    path: ['Add the zoo to our plan', 'See rates for Junior Wolf Pup Den'],
    voiceLine: 'Add the zoo to our plan',
    rules: [
      [/zoo|giraffe/i, addZoo],
      [/garden|free/i, addGarden],
      [/barr|hike/i, whyNotBarr.then],
      [/rate|book|suite/i, [goTo('j2/5')]],
    ],
    fallback: [
      { label: 'Add the zoo to our plan', then: addZoo },
      { label: 'Add Garden of the Gods', then: addGarden },
      { label: 'See rates for Junior Wolf Pup Den', then: [goTo('j2/5')] },
    ],
  },
  5: {
    // Rates for the suite chosen on the suites page. Nothing is selected for the family.
    enter: [{ do: 'patch', fn: (s) => (s.expanded ? {} : { expanded: 'pup-den-jr' }) }, { do: 'openSheet', snap: 'half' }],
    beats: [
      // Names the suite and the weekend the family picked.
      { type: 'user', text: (s) => `Book the ${suiteById(ratedSuite(s)).name.replace(/ Suite$/, '')} for ${s.weekend.replace(' – ', ' to ')}` },
      say('Good pick! Choose a rate on the page or here. Joining Voyagers Club is free and saves $4 a night; Flexible costs a bit more and lets you cancel later.', {
        textMobile: 'Good pick! Choose a rate, or join Voyagers Club free to save $4 a night.',
      }),
      chips(join, standardGuest, flexibleGuest),
    ],
    onRate: rateChosen,
    path: ['Join free and save', 'Standard', 'Not ready yet'],
    voiceLine: 'Standard as a guest',
    rules: [
      [/join|member|voyager|save/i, join.then],
      [/flex|cancel/i, rateChosen('flex-non')],
      [/guest|standard/i, rateChosen('std-non')],
    ],
    fallback: [join, standardGuest, flexibleGuest],
  },
  6: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Let me check with my partner first' },
      say('Of course! Want me to text this plan to you? No account needed.'),
      { type: 'card', component: 'capture', then: () => planSent },
    ],
    voiceLine: 'Send it to my phone',
    path: ['Preview the plan'],
    rules: [
      [/preview|see|show/i, [{ type: 'effect', actions: [{ do: 'sheet', which: 'plan' }] }]],
      [/share|partner/i, share],
    ],
    fallback: [{ label: 'Preview the plan', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'plan' }] }] }, { label: 'Share with my partner', then: share }],
  },
}
