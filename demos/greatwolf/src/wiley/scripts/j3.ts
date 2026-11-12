import { ROOM, staff } from '~/data/lodgeApp'
import type { Action, AppState, Beat, Option, StepScript } from '../types'

// Journey 3: the Martinez family's weekend from Journey 1, in the Great Wolf app. Wiley is there before, during and
// after the stay; a person from the lodge team joins the same thread when something needs one (a lost wristband, a
// late check-out, lost and found). Facts are from the lodge's pages (docs/colorado-springs-offering.md); Jordan, the
// suite number and the outcomes of the lodge team's replies are fictional.

const app = (set: Partial<AppState> | ((a: AppState) => Partial<AppState>)): Action => ({ do: 'app', set })
const remind = (...ids: string[]): Action => app((a) => ({ reminders: [...new Set([...a.reminders, ...ids])] }))

/** A person joins: Wiley's summary goes first, so the family never repeats themselves. */
const joins: Beat[] = [
  { type: 'note', text: 'Wiley shared this chat with the lodge team' },
  { type: 'wait', ms: 1400 },
  { type: 'note', text: `${staff.name} from ${staff.role} joined` },
  { type: 'effect', actions: [app({ team: 'live' })] },
]
const leaves: Beat[] = [
  { type: 'note', text: `${staff.name} left the chat. Wiley is here any time.` },
  { type: 'effect', actions: [app({ team: 'left' })] },
]

/** "Talk to a person", from the chat header or typed, on any step. */
export const toPerson: Beat[] = [
  { type: 'agent', text: 'Sure. I’ll bring in the lodge team. They’ll see this chat, so you won’t need to repeat anything.', thinking: ['Finding someone on the lodge team'] },
  ...joins,
  { type: 'agent', from: 'staff', text: `Hi Carlos, ${staff.name} from ${staff.role} here. How can I help?` },
]

const personRule: [RegExp, Beat[]] = [/person|human|someone|staff|front desk|real/i, toPerson]

export const orderAhead: Option = {
  label: 'Order from Hungry As A Wolf',
  then: [
    {
      type: 'agent',
      text: 'Hungry As A Wolf takes orders ahead in the app, for pickup. Ordering isn’t built in this demo; in the app I’d open the order for you and tell you when it’s ready.',
      thinking: ['Checking dining'],
    },
  ],
}
const orderRule: [RegExp, Beat[]] = [/order|pizza|food|hungry|dinner|eat/i, orderAhead.then]

// ── 1 · Two days before ──────────────────────────────────────────────────────────────────────────────────────────

export const pack: Option = {
  label: 'What should we pack?',
  then: [
    {
      type: 'agent',
      text: 'Swimsuits, flip-flops and something to wear over them in the halls. Skip towels, life jackets and wolf ears: the lodge has them, and the ears are free for kids 12 and under. The water park stays at 84°F all year. For Mia’s party, the Birthday Bash brings the pizza, cake and balloons.',
      thinking: ['Reading your booking', 'Checking what the lodge provides'],
    },
  ],
}

export const swimEarly: Option = {
  label: 'Can we swim before our suite is ready?',
  then: [
    {
      type: 'agent',
      text: 'Yes. Your passes work from when the water park opens on Friday, even before check-in at 4pm. Pack swimsuits in a day bag and you can head straight in.',
      thinking: ['Checking your passes'],
    },
  ],
}

export const checkIn: Option = {
  label: 'Check us in',
  then: [
    {
      type: 'card',
      component: 'checkin',
      then: (p) => {
        const arrival = (p as { arrival?: string })?.arrival ?? 'Around 1 pm'
        return [
          { type: 'effect', actions: [app({ checkedIn: true, arrival })] },
          {
            type: 'agent',
            text: `You’re checked in, arriving ${arrival.toLowerCase()}. On Friday, pick up your wristbands at a check-in kiosk or the Front Desk: they open your suite and pay for things around the lodge. Bring an ID and the card you booked with. I’ll message you here as soon as your suite is ready.`,
            thinking: ['Checking you in'],
          },
          { type: 'chips', style: 'ai', options: [pack, swimEarly] },
        ]
      },
    },
  ],
}

// ── 2 · Arrival ──────────────────────────────────────────────────────────────────────────────────────────────────

const showHome: Option = { label: 'Show today on Home', then: [{ type: 'effect', actions: [app({ tab: 'home', screen: null, sheet: false })] }] }

const arrived: Beat[] = [
  { type: 'effect', actions: [app({ phase: 'stay' })] },
  {
    type: 'agent',
    text: `Welcome to the lodge, Martinez pack! Suite ${ROOM} is ready: tap your wristband on the door. Here’s the rest of today from the weekend you planned.`,
    thinking: ['Reading your weekend plan'],
  },
  {
    type: 'card',
    component: 'today',
    then: () => [
      { type: 'effect', actions: [remind('dinner', 'story')] },
      { type: 'agent', text: 'Done. I’ll remind you 15 minutes before dinner and Epic Story Time. Tomorrow is Mia’s Birthday Bash at 1:00 pm.', thinking: ['Setting reminders'] },
      { type: 'chips', style: 'ai', options: [showHome] },
    ],
  },
]

// ── 3 · Picks that fit each kid ──────────────────────────────────────────────────────────────────────────────────

const toPark: Option = { label: 'Show us the water park', then: [{ type: 'effect', actions: [app({ sheet: false, tab: 'todo', screen: 'park', forPack: true })] }] }

const heights = (mia: number, leo: number, line: string): Beat[] => [
  { type: 'effect', actions: [app({ heights: { mia, leo } })] },
  { type: 'agent', text: line, thinking: ['Checking ride heights'] },
  { type: 'card', component: 'rides' },
  {
    type: 'agent',
    text: 'I’ve marked who fits on every ride and turned on “For your pack” in Things To Do. Life jackets are recommended under 48 inches, and they’re free in the water park.',
  },
  { type: 'chips', style: 'ai', options: [toPark] },
]

export const canTheyRide: Option = {
  label: 'Can Mia and Leo ride this?',
  then: [
    {
      type: 'agent',
      text: 'Alberta Falls is for riders 42 inches and up. How tall are Mia and Leo?',
      thinking: ['Checking Alberta Falls'],
    },
    {
      type: 'chips',
      style: 'answer',
      options: [
        { label: 'Mia 49 in, Leo 40 in', then: heights(49, 40, 'Then Mia can ride it with you, and Leo can’t yet: he’s 2 inches short. Here’s what each of them can ride:') },
        { label: 'Both over 42 in', then: heights(49, 43, 'Then both of them can ride it with you. Here’s the whole water park for them:') },
      ],
    },
  ],
}

// ── 4 · Handover ─────────────────────────────────────────────────────────────────────────────────────────────────

const afterWristband = (where: string): Beat[] => [
  { type: 'agent', from: 'staff', text: `You’re welcome! Happy birthday to Mia. I’ll leave you with Wiley; ask for a person here any time.` },
  ...leaves,
  {
    type: 'agent',
    text: `Leo’s new wristband is ${where}. Mia’s Birthday Bash starts at 1:00 pm. I’ve set a reminder for 12:45.`,
    thinking: ['Updating your day'],
  },
  { type: 'effect', actions: [remind('party')] },
]

// ── 5 · Check-out ────────────────────────────────────────────────────────────────────────────────────────────────

export const checkOut: Option = {
  label: 'Check us out',
  then: [
    { type: 'agent', text: 'Here’s your bill. Check it over, then check out here.', thinking: ['Getting your bill'] },
    {
      type: 'card',
      component: 'bill',
      then: () => [
        { type: 'effect', actions: [app({ checkedOut: true })] },
        {
          type: 'agent',
          text: (s) =>
            `You’re checked out, and the receipt is in your email. ${s.app.lateCheckout ? 'The suite is yours until 2:00 pm, and your' : 'Your'} wristbands still get you into the water park until it closes tonight. Have a great last swim!`,
          thinking: ['Checking you out'],
        },
      ],
    },
  ],
}

const lateCheckout: Option = {
  label: 'Can we keep the suite until 2?',
  then: [
    {
      type: 'agent',
      text: 'Late check-out until 2:00 pm is $49.99 (a sample price), when the lodge has the suite free. Only the lodge team can confirm it, so I’ll ask them.',
      thinking: ['Checking late check-out'],
    },
    ...joins,
    { type: 'agent', from: 'staff', text: `Morning, Carlos! Suite ${ROOM} is yours until 2:00 pm. I’ve added it to your bill.` },
    { type: 'effect', actions: [app({ lateCheckout: true })] },
    ...leaves,
    { type: 'chips', style: 'ai', options: [checkOut] },
  ],
}

// ── 6 · After the stay ───────────────────────────────────────────────────────────────────────────────────────────

export const nextBirthday: Option = {
  label: 'Plan Mia’s 8th',
  then: [
    { type: 'effect', actions: [app({ nextTrip: true, tab: 'home', sheet: false })] },
    {
      type: 'agent',
      text: 'Saved to Home: Mia’s 8th, Fri Mar 10 to Sun Mar 12, 2028. When you’re ready, I’ll check member rates for the same suite.',
      thinking: ['Looking at next March'],
    },
  ],
}

export const j3: Record<number, StepScript> = {
  1: {
    enter: [app({ phase: 'before', clock: 'Wed 6:10 PM', tab: 'home', screen: null, sheet: false, banner: null })],
    thinking: ['Reading your booking'],
    beats: [
      { type: 'wait', ms: 1800 },
      {
        type: 'effect',
        actions: [
          app({
            banner: {
              title: 'Wiley',
              body: 'Two days until Mia’s birthday weekend! Want me to check you in now?',
              to: { tab: 'chat' },
              then: [
                {
                  type: 'agent',
                  text: 'Hi Carlos! Mia’s birthday weekend starts Friday: Junior Wolf Pup Den Suite, March 12 to 14, with her Birthday Bash on Saturday at 1:00 pm. I can check you in now, so on Friday you only pick up your wristbands.',
                },
                { type: 'chips', style: 'ai', options: [checkIn, pack, swimEarly] },
              ],
            },
          }),
        ],
      },
    ],
    path: ['Check us in'],
    cardDefaults: { checkin: { arrival: 'Around 1 pm' } },
    voiceLine: 'What should we pack for the water park?',
    rules: [[/pack|bring/i, pack.then], [/early|before|swim/i, swimEarly.then], [/check.?in/i, checkIn.then], personRule, orderRule],
    fallback: [checkIn, pack, swimEarly],
  },
  2: {
    enter: [app({ phase: 'arrival', clock: 'Fri 3:40 PM', tab: 'home', screen: null, sheet: false, checkedIn: true, arrival: 'Around 1 pm' })],
    thinking: ['Reading your weekend plan'],
    beats: [
      { type: 'wait', ms: 1600 },
      { type: 'effect', actions: [app({ banner: { title: 'Your suite is ready', body: `Suite ${ROOM} is ready early. Tap your wristband on the door.`, to: { tab: 'chat' }, then: arrived } })] },
    ],
    path: ['Show today on Home'],
    cardDefaults: { today: { all: true } },
    voiceLine: 'What’s on for the kids tonight?',
    rules: [[/tonight|today|plan|kids/i, arrived.slice(1)], personRule, orderRule],
    fallback: [showHome],
  },
  3: {
    enter: [app({ phase: 'stay', clock: 'Fri 4:25 PM', tab: 'todo', screen: 'ride:alberta-falls', sheet: false, banner: null })],
    thinking: ['Checking ride heights'],
    beats: [
      { type: 'wait', ms: 1400 },
      { type: 'effect', actions: [app({ sheet: true })] },
      { type: 'user', text: 'Can Mia and Leo ride this?', voice: true },
      ...canTheyRide.then,
    ],
    path: ['Mia 49 in, Leo 40 in', 'Show us the water park'],
    voiceLine: 'Can Mia and Leo ride this?',
    rules: [[/ride|tall|height|slide/i, canTheyRide.then], personRule, orderRule],
    fallback: [canTheyRide, toPark],
  },
  4: {
    enter: [app({ phase: 'stay', clock: 'Sat 11:05 AM', tab: 'chat', screen: null, sheet: false, banner: null, team: 'off' })],
    thinking: ['Reading your request'],
    beats: [
      { type: 'wait', ms: 900 },
      { type: 'user', text: 'Leo lost his wristband somewhere in the water park', voice: true },
      {
        type: 'agent',
        text: 'Oh no. A wristband opens your suite and pays for things, so a person on the lodge team needs to turn it off and make a new one. I’m bringing them in with everything they need, so you won’t have to repeat it.',
        thinking: ['Reading your request', 'Finding someone on the lodge team'],
      },
      { type: 'card', component: 'handover', props: { title: 'Lost wristband', lines: [['Guest', 'Leo Martinez, 4'], ['Suite', ROOM], ['Last seen', 'Water park, this morning'], ['Needs', 'Turn off the old band, make a new one']] } },
      ...joins,
      {
        type: 'agent',
        from: 'staff',
        text: `Hi Carlos, I’m ${staff.name} from ${staff.role}. I’ve turned off Leo’s wristband, so nobody else can use it. A new one is ready at the Front Desk: bring your ID. If the old one turns up, I’ll let you know here.`,
      },
      {
        type: 'chips',
        style: 'answer',
        options: [
          { label: `Thanks, ${staff.name}!`, then: afterWristband('waiting at the Front Desk') },
          {
            label: 'Can it come to Mia’s party instead?',
            then: [
              { type: 'agent', from: 'staff', text: 'Of course. I’ll bring it to the party at 1:00 pm, and check your ID there.' },
              { type: 'user', text: `Perfect, thanks ${staff.name}!` },
              ...afterWristband('coming to the party'),
            ],
          },
        ],
      },
    ],
    path: [`Thanks, ${staff.name}!`],
    voiceLine: 'Leo lost his wristband somewhere in the water park',
    rules: [personRule, orderRule],
    fallback: [{ label: 'Talk to a person', then: toPerson }],
  },
  5: {
    enter: [app({ phase: 'checkout', clock: 'Sun 8:05 AM', tab: 'home', screen: null, sheet: false, team: 'off', banner: null })],
    thinking: ['Getting your bill'],
    beats: [
      { type: 'wait', ms: 1600 },
      {
        type: 'effect',
        actions: [
          app({
            banner: {
              title: 'Wiley',
              body: 'Good morning! Check-out is at 11:00. I can check you out from here.',
              to: { tab: 'chat' },
              then: [
                {
                  type: 'agent',
                  text: 'Good morning! Check-out is at 11:00. I can check you out from here, and your wristbands still get you into the water park until it closes tonight.',
                },
                { type: 'chips', style: 'ai', options: [checkOut, lateCheckout] },
              ],
            },
          }),
        ],
      },
    ],
    path: ['Check us out'],
    cardDefaults: { bill: { checkout: true } },
    voiceLine: 'Can we keep the suite until 2?',
    rules: [[/late|until|later|2/i, lateCheckout.then], [/check.?out|bill/i, checkOut.then], personRule, orderRule],
    fallback: [checkOut, lateCheckout],
  },
  6: {
    enter: [app({ phase: 'after', clock: 'Mon 7:30 PM', tab: 'home', screen: null, sheet: false, team: 'off', banner: null, checkedOut: true })],
    thinking: ['Checking lost and found'],
    beats: [
      { type: 'wait', ms: 1600 },
      { type: 'effect', actions: [app({ tab: 'chat' })] },
      { type: 'user', text: 'Leo left his stuffed wolf in the suite! The gray one in a red shirt.', voice: true },
      {
        type: 'agent',
        text: 'Oh no, poor wolf. I’ve sent a lost and found report to the lodge with your suite, your dates and what it looks like. They keep items for 30 days and email you updates; I’ll post them here too.',
        thinking: ['Reading your stay', 'Filing a lost and found report'],
      },
      { type: 'card', component: 'handover', props: { title: 'Lost and found', lines: [['Item', 'Stuffed wolf, gray, red shirt'], ['Suite', ROOM], ['Stay', 'Mar 12 – 14, 2027'], ['Send updates to', 'Email and this chat']] } },
      { type: 'effect', actions: [app({ lostReported: true })] },
      { type: 'wait', ms: 1600 },
      { type: 'note', text: `${staff.name} from ${staff.role} joined` },
      { type: 'effect', actions: [app({ team: 'live' })] },
      { type: 'agent', from: 'staff', text: `Good news, Carlos: housekeeping found a stuffed wolf in Suite ${ROOM}. It’s safe with us, and I’ll email you today about getting it home to Leo.` },
      { type: 'effect', actions: [app({ lostFound: true })] },
      ...leaves,
      { type: 'agent', text: 'Leo’s wolf is safe. While you’re here: how was your stay?', thinking: ['Updating your report'] },
      {
        type: 'card',
        component: 'rating',
        then: (p) => [
          { type: 'effect', actions: [app({ rating: (p as { value?: number })?.value ?? 5 })] },
          {
            type: 'agent',
            text: 'Thank you, I’ve passed that on to the lodge. Mia turns 8 next March. Want me to save the same weekend for her 8th?',
            thinking: ['Sharing your feedback'],
          },
          { type: 'chips', style: 'ai', options: [nextBirthday] },
        ],
      },
    ],
    path: ['Plan Mia’s 8th'],
    cardDefaults: { rating: { value: 5 } },
    voiceLine: 'Leo left his stuffed wolf in the suite! The gray one in a red shirt.',
    rules: [personRule, orderRule],
    fallback: [nextBirthday],
  },
}
