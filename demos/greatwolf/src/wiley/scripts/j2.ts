import { money, rateOf, suiteById, type RateKey } from '~/data/fixtures'
import { guestsLong, oldest, partySize, shortDates, stayDays, youngest } from '~/state/stay'
import type { Beat, DemoState, Option, StepScript } from '../types'
import { onExtra, suggestNext, tripRules } from './trip'

// Journey 2: a first-time family, signed out. By default 2 adults with kids aged 3 and 6; when the family types or
// says their dates and guests in the hero, the stay follows them and Wiley's lines do too. Wiley never asks where.
// Every choice gets its own answer and its own change on the page; Next follows the `path` (the happy path).

const GUIDE = 'GWL Things To Do guide'
const WATER = 'Lodge water park guide'

/** The mobile sheet (a section; the desktop sidebar is an aside). Only it needs room for the questions. */
const sheetOnScreen = () => Boolean(document.querySelector('section[aria-label=Wiley]'))

const goTo = (to: string): Beat => ({ type: 'effect', actions: [{ do: 'go', to }] })
const say = (text: string | ((s: DemoState) => string), extra: Partial<Extract<Beat, { type: 'agent' }>> = {}): Beat => ({ ...extra, type: 'agent', text })
const chips = (...options: Option[]): Beat => ({ type: 'chips', style: 'ai', options })

export interface Answers {
  /** Missing when the family already gave dates (the question isn't asked). */
  weekend?: string
  priority: 'bunks' | 'view' | 'price'
}

// ── J2·2: suites ────────────────────────────────────────────────────────────────────────────────────────────────

/** The water park question names the youngest child's age when we know it. `key` keeps Next on the path. */
const waterParkFor = (s: DemoState): Option => {
  const y = youngest(s.stay)
  return { key: 'water', label: y !== null ? `Is the water park OK for a ${y}-year-old?` : 'What’s the water park like for kids?', then: [goTo('j2/3')] }
}
const waterPark: Option = { key: 'water', label: 'Is the water park OK for little ones?', then: [goTo('j2/3')] }
const waterChips: Beat = { type: 'chips', style: 'ai', options: (s) => [waterParkFor(s), compare, seeRates] }
const seeRates: Option = { label: 'See rates', then: [{ type: 'effect', actions: [{ do: 'expandRates', suite: 'pup-den-jr' }] }, goTo('j2/5')] }
const compare: Option = {
  label: 'Compare the top two',
  then: [
    say('Junior Wolf Pup Den sleeps 4, with bunk beds in a Northwoods-themed den and a balcony, from $119 a night. Deluxe Queen Suite sleeps 5, with two queen beds and a balcony or patio, from $109. Both include water park passes.', {
      textMobile: 'Pup Den: sleeps 4, bunks in a themed den, from $119. Deluxe Queen: sleeps 5, two queens, from $109. Both include water park passes.',
    }),
    { type: 'chips', style: 'ai', options: (s) => [waterParkFor(s), seeRates] },
  ],
}

const WEEKEND_START: Record<string, string> = { 'Mar 5 – 7': '2027-03-05', 'Mar 12 – 14': '2027-03-12', 'Cheapest one': '2027-03-05' }

/** The suite Wiley puts first: it has to sleep the whole family, then follow what matters most. */
function topFor(s: DemoState, priority: Answers['priority']) {
  const party = partySize(s.stay)
  const prefs = priority === 'price' ? ['deluxe-queen', 'pup-den-jr', 'kidcabin'] : ['pup-den-jr', 'kidcabin', 'deluxe-queen']
  return prefs.find((id) => suiteById(id).sleeps >= party) ?? 'kidcabin'
}

/** Ranks, tags and highlights for the family, and narrows to suites that sleep everyone. */
const rankFor =
  (priority: Answers['priority']) =>
  (s: DemoState): Partial<DemoState> => {
    const party = partySize(s.stay)
    const top = topFor(s, priority)
    const fits = ['pup-den-jr', 'deluxe-queen', 'kidcabin'].filter((id) => suiteById(id).sleeps >= party)
    const tag = priority === 'price' ? 'Lowest price' : top === 'kidcabin' ? `Wiley’s pick · sleeps all ${party}` : priority === 'view' ? 'Wiley’s pick · balcony for the family' : 'Wiley’s pick · bunks for the kids'
    return {
      ranked: [top, ...fits.filter((id) => id !== top)],
      tags: { ...s.tags, [top]: tag },
      highlight: top,
      filters: [`Sleeps ${party}+`, ...(priority === 'bunks' ? ['Bunk beds'] : priority === 'view' ? ['Balcony'] : [])],
      setByWiley: true,
      widened: false,
    }
  }

function ranked(a: Answers): Beat[] {
  return [
    {
      type: 'effect',
      actions: [
        { do: 'loadSuites', ms: 1100 },
        { do: 'patch', fn: (s) => ({ priority: a.priority, stay: { ...s.stay, start: a.weekend ? WEEKEND_START[a.weekend] : s.stay.start, by: 'wiley' } }) },
        { do: 'patch', fn: rankFor(a.priority) },
        { do: 'openSheet', snap: 'half' },
        { do: 'scrollTo', id: '@highlight' },
      ],
    },
    say(
      (s) => {
        const top = topFor(s, a.priority)
        const y = youngest(s.stay)
        const lead =
          top === 'deluxe-queen'
            ? 'Deluxe Queen Suite has the lowest starting rate and sleeps 5.'
            : top === 'kidcabin'
              ? `KidCabin Suite sleeps 6, with bunks in Wiley’s Clubhouse, so it fits all ${partySize(s.stay)} of you.`
              : a.priority === 'view'
                ? 'Junior Wolf Pup Den has a balcony and a themed den with bunks, and sleeps 4.'
                : 'Junior Wolf Pup Den is the best fit: bunks in a themed den, sleeps 4.'
        return `${lead} ${y !== null ? `Want to check the water park works for your ${y}-year-old?` : 'Want a look at the water park?'}`
      },
      {
        textMobile: (s) => {
          const top = topFor(s, a.priority)
          const y = youngest(s.stay)
          const name = top === 'deluxe-queen' ? 'Deluxe Queen has the lowest rate.' : top === 'kidcabin' ? 'KidCabin sleeps all of you.' : 'Junior Wolf Pup Den fits best: bunks in a themed den.'
          return `${name} ${y !== null ? `Water park OK for your ${y}-year-old?` : 'Look at the water park?'}`
        },
      },
    ),
    waterChips,
  ]
}

// ── J2·3: water park ────────────────────────────────────────────────────────────────────────────────────────────

const nearby: Option = { label: 'What else is nearby?', then: [goTo('j2/4')] }
const backToSuites: Option = { label: 'Back to suites', then: [goTo('j2/2')] }
const olderKid: Option = {
  key: 'older',
  label: 'And for our older one?',
  then: [
    { type: 'effect', actions: [{ do: 'spotlight', id: 'fort-mackenzie' }, { do: 'dim', ids: ['howlin-tornado'] }, { do: 'scrollTo', id: 'att-fort-mackenzie' }] },
    say('Fort Mackenzie, the water playground, is the next step up, and I moved the spotlight to it. Bigger slides like Howlin’ Tornado have height minimums, so check them on the day.', {
      textMobile: 'Fort Mackenzie, the water playground, is the next step up. I moved the spotlight to it.',
      source: WATER,
    }),
    chips(nearby, backToSuites),
  ],
}
const olderFor = (s: DemoState): Option[] => {
  const o = oldest(s.stay)
  return o !== null && o !== youngest(s.stay) ? [{ ...olderKid, label: `And for our ${o}-year-old?` }] : []
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
    say((s) => `Barr Trail is the Pikes Peak summit hike, for advanced hikers only. Not one for ${youngest(s.stay) !== null ? `a ${youngest(s.stay)}-year-old` : 'little kids'}.`, { source: GUIDE }),
    chips({ label: 'Add the zoo to our plan', then: addZoo }, { label: 'Add Garden of the Gods', then: addGarden }),
  ],
}

// ── J2·5: rates ─────────────────────────────────────────────────────────────────────────────────────────────────

const ratedSuite = (s: DemoState) => s.expanded ?? 'pup-den-jr'

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
        { do: 'scrollTo', id: 'trip-suite' },
        { do: 'patch', fn: (s) => (needsJoin(s) ? { sheet: 'join' } : {}) },
      ],
    },
    {
      type: 'agent',
      text: (s) => {
        if (needsJoin(s)) return 'That’s the Voyagers Club rate. Join for free and I’ll keep it for you.'
        const r = rateOf(ratedSuite(s), key)
        const terms = r.plan === 'Flexible' ? 'You can cancel for free until [date].' : 'Free changes and cancellation until [date].'
        return `${r.plan} ${member ? 'at your Voyagers Club rate' : 'as a guest'}: ${money(r.price)} a night. ${terms} Your suite is the start of your trip now.`
      },
    },
    // While the join sheet is open, Wiley waits; joining picks up from there (afterJoinWithRate).
    ...suggestNext(2).map((b) => ({ ...b, when: (s: DemoState) => !needsJoin(s) }) as Beat),
  ]
}

const standardMember: Option = { label: 'Standard', say: 'Standard, please', then: rateChosen('std-voy') }
const flexibleMember: Option = { label: 'Flexible', say: 'Flexible, please', then: rateChosen('flex-voy') }
const standardGuest: Option = { label: 'Standard as a guest', say: 'Standard as a guest, please', then: rateChosen('std-non') }
const flexibleGuest: Option = { label: 'Flexible as a guest', say: 'Flexible as a guest, please', then: rateChosen('flex-non') }

/** Played by the join sheet when the family had already picked a rate: it is kept, at the member price. */
export const afterJoinWithRate: Beat[] = [say('Welcome to Voyagers Club! I kept your choice, now at the member rate. Your suite is the start of your trip.'), ...suggestNext(2)]

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
    enter: [{ do: 'loadSuites', ms: 1300 }, { do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: (s) => s.tripText ?? 'A weekend in March with a 3 and 6 year old', voiceTag: (s) => s.tripVoice, reaction: 'wave' },
      {
        type: 'effect',
        actions: [
          { do: 'loadSuites', ms: 1500 },
          { do: 'setStay', stay: {} },
          { do: 'patch', fn: rankFor('bunks') },
        ],
      },
      say(
        (s) =>
          `${s.stayNote ? `${s.stayNote} ` : ''}Fun! ${s.stay.start ? `I set ${shortDates(s.stay)} for ${guestsLong(s.stay)} in the bar at the top. One quick question so I can narrow it down:` : 'Two quick questions so I can narrow it down:'}`,
        { textMobile: (s) => `${s.stayNote ? `${s.stayNote} ` : ''}Fun! ${s.stay.start ? `${shortDates(s.stay)} is set. One quick question:` : 'Two quick questions:'}` },
      ),
      // On a phone the sheet opens fully while Wiley asks; it settles back to half when the suites re-rank.
      { type: 'effect', actions: [{ do: 'patch', fn: (s) => (s.snap === 'half' && sheetOnScreen() ? { snap: 'full' } : {}) }] },
      { type: 'card', component: 'questions', then: (p) => ranked(p as Answers) },
    ],
    path: ['water'],
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
      { type: 'user', text: (s) => waterParkFor(s).label, voice: true },
      { type: 'effect', actions: [{ do: 'spotlight', id: 'cub-paw' }, { do: 'dim', ids: ['howlin-tornado'] }, { do: 'scrollTo', id: 'att-cub-paw' }] },
      say((s) => {
        const o = oldest(s.stay)
        const more = o !== null && o !== youngest(s.stay) ? ` Bigger slides have height minimums, so your ${o}-year-old gets more rides.` : ' Bigger slides have height minimums, so check them on the day.'
        return `Yes! Cub Paw Pool is a kiddie splash pad made for little ones, and I scrolled you to it.${more}`
      }, {
        textMobile: 'Yes! Cub Paw Pool is a splash pad made for little ones. I scrolled you to it.',
        source: WATER,
      }),
      { type: 'chips', style: 'ai', options: (s) => [nearby, ...olderFor(s), backToSuites] },
    ],
    path: ['What else is nearby?'],
    voiceLine: 'What else is nearby?',
    rules: [
      [/\d|six|older|big/i, olderKid.then],
      [/nearby|around|zoo|do/i, [goTo('j2/4')]],
      [/suite|room/i, [goTo('j2/2')]],
    ],
    fallback: [nearby, olderKid, backToSuites],
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
          label: 'Plan our last morning',
          then: [say((s) => `Zoo on ${stayDays(s.stay)[2].long} morning, then check-out at 11. Want it in your plan?`), chips({ label: 'Add the zoo to our plan', then: addZoo }, { label: 'Garden of the Gods instead', then: addGarden })],
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
      { type: 'user', text: (s) => `Book the ${suiteById(ratedSuite(s)).name.replace(/ Suite$/, '')} for ${(shortDates(s.stay) ?? 'our dates').replace(' – ', ' to ')}` },
      say('Good pick! Choose a rate on the page or here. Joining Voyagers Club is free and saves $4 a night; Flexible costs a bit more and lets you cancel later.', {
        textMobile: 'Good pick! Choose a rate, or join Voyagers Club free to save $4 a night.',
      }),
      chips(join, standardGuest, flexibleGuest),
    ],
    onRate: rateChosen,
    onExtra: onExtra(2),
    path: ['Join free and save', 'Standard', 'Add the Pup Pass', 'Add the Wolf Wakeup Breakfast', 'Not needed', 'Save my trip'],
    voiceLine: 'Standard as a guest',
    rules: [
      [/join|member|voyager|save/i, join.then],
      [/flex|cancel/i, rateChosen('flex-non')],
      [/guest|standard/i, rateChosen('std-non')],
      ...tripRules(2),
    ],
    fallback: [join, standardGuest, flexibleGuest],
  },
  6: {
    enter: [{ do: 'openSheet', snap: 'half' }],
    beats: [
      { type: 'user', text: 'Let me check with my partner first' },
      {
        type: 'agent',
        text: (s) => {
          const [, d2, d3] = stayDays(s.stay)
          const sat = s.cart.some((c) => c.id === 'pup-pass') ? `Build-A-Bear on ${d2.long} morning, ` : s.cart.some((c) => c.kind === 'pass') ? `MagiQuest on ${d2.long} morning, ` : ''
          const sun = s.ideas.includes('zoo') ? `the zoo on ${d3.long} at 9:30` : `the zoo as a suggestion for ${d3.long} morning`
          return `Of course! I laid your weekend out by day so it’s easy to show them: Cub Paw Pool when you arrive, ${sat}${sun}. Want me to text it to you? No account needed.`
        },
        textMobile: 'Of course! I laid your weekend out by day. Want me to text it to you? No account needed.',
      },
      { type: 'card', component: 'capture', then: () => planSent },
    ],
    voiceLine: 'Send it to my phone',
    path: ['Preview the plan'],
    rules: [
      [/preview|see|show/i, [{ type: 'effect', actions: [{ do: 'sheet', which: 'plan' }] }]],
      [/share|partner/i, share],
      [
        /zoo|sunday/i,
        [
          { type: 'effect', actions: [{ do: 'addToPlan', item: 'zoo' }, { do: 'patch', fn: () => ({ planDay: 'sun' }) }, { do: 'toast', text: 'Added to Sunday' }, { do: 'scrollTo', id: 'plan-zoo' }] },
          say('Done: Cheyenne Mountain Zoo is Sunday at 9:30, before check-out.', { source: GUIDE }),
        ],
      ],
    ],
    fallback: [{ label: 'Preview the plan', then: [{ type: 'effect', actions: [{ do: 'sheet', which: 'plan' }] }] }, { label: 'Share with my partner', then: share }],
  },
}

// What Wiley shows it is doing while it thinks, per step (the first reply of a turn shows up to three).
const THINKING: Record<number, string[]> = {
  1: ['Looking at Voyagers Club rates'],
  2: ['Reading your request', 'Checking dates at the lodge', 'Matching suites to your family'],
  3: ['Opening the lodge water park guide', 'Finding spots for little ones'],
  4: ['Checking the GWL Things To Do guide', 'Filtering for your kids’ ages', 'Adding it to your plan'],
  5: ['Pulling rates for your dates', 'Checking passes for your kids', 'Updating your trip'],
  6: ['Laying out your weekend by day', 'Saving your plan'],
}
for (const [step, phrases] of Object.entries(THINKING)) j2[Number(step)].thinking = phrases
