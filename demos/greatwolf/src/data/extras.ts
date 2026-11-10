import { CakeIcon, ClockIcon, CroissantIcon, GiftIcon, PartyPopperIcon, TicketIcon, UtensilsIcon, WandSparklesIcon, type LucideIcon } from '@anvil/components/ui/icon'
import type { DemoState } from '~/wiley/types'

// What the Trip Builder sells, from greatwolf.com/colorado-springs as read on 2026-11-10 (docs/colorado-springs-offering.md).
// Names and inclusions are the lodge's own. Prices are the listed ones where the site lists them; otherwise
// `[price]`, and the item adds nothing to the total. `confidence: 'check'` marks what the site does not state for
// this lodge, so the page flags it instead of presenting it as confirmed.

export type ExtraKind = 'pass' | 'dining' | 'birthday' | 'experience'

export interface Extra {
  id: string
  kind: ExtraKind
  name: string
  /** How the family says it in the chat ("Add the Paw Pass"). */
  short?: string
  blurb: string
  includes?: string[]
  /** As the page shows it. */
  price: string
  /** Counted in the total; null when the lodge lists no price. */
  amount: number | null
  confidence: 'listed' | 'check'
  checkNote?: string
  /** What Wiley says about the open question, in a full sentence. */
  checkSay?: string
  /** Plan activities it covers, so the weekend plan can say "In your Paw Pass". */
  covers?: string[]
  icon: LucideIcon
  tone: 'lake' | 'forest' | 'dusk' | 'den'
  journeys?: (1 | 2)[]
  /** Only one per trip from a group: a new birthday package or dining credit replaces the old one. */
  group?: 'birthday' | 'credit'
}

export const SECTIONS: Record<ExtraKind, { title: string; sub: string; step: string }> = {
  pass: { title: 'Passes', sub: 'Water park passes come with your suite. Passes add the lodge attractions.', step: 'Passes' },
  birthday: { title: 'Birthday', sub: 'Booked with your stay. Prices are set by the lodge at booking.', step: 'Birthday' },
  dining: { title: 'Dining', sub: 'Nine places to eat in the lodge. Plans pay for themselves if you eat in.', step: 'Dining' },
  experience: { title: 'More for your stay', sub: 'Bookable extras that fit around your plan.', step: 'Extras' },
}

export const extras: Extra[] = [
  {
    id: 'paw-pass',
    kind: 'pass',
    name: 'Paw Pass',
    short: 'the Paw Pass',
    blurb: 'MagiQuest, a keepsake, treats and Northern Lights Arcade games.',
    price: '[price] per pass',
    amount: null,
    confidence: 'listed',
    covers: ['magiquest'],
    icon: WandSparklesIcon,
    tone: 'dusk',
  },
  {
    id: 'wolf-pass',
    kind: 'pass',
    name: 'Wolf Pass',
    short: 'the Wolf Pass',
    blurb: 'Top attractions and treats, for all ages. Includes MagiQuest and Howlers Peak Ropes Course.',
    price: '[price] per pass',
    amount: null,
    confidence: 'check',
    checkNote: 'Full list of attractions to confirm with the lodge',
    checkSay: 'The site doesn’t list everything it covers, so I flagged that.',
    covers: ['magiquest', 'ropes'],
    icon: TicketIcon,
    tone: 'lake',
  },
  {
    id: 'pup-pass',
    kind: 'pass',
    name: 'Pup Pass',
    short: 'the Pup Pass',
    blurb: 'Made for little ones: Build-A-Bear, treats, an arcade card and a souvenir.',
    price: '[price] per pass',
    amount: null,
    confidence: 'listed',
    icon: GiftIcon,
    tone: 'forest',
  },
  {
    id: 'birthday-bash',
    kind: 'birthday',
    name: 'Birthday Bash',
    short: 'the Birthday Bash',
    blurb: 'Pizza, cake, balloons and an arcade card.',
    price: '[price]',
    amount: null,
    confidence: 'listed',
    icon: PartyPopperIcon,
    tone: 'dusk',
    journeys: [1],
    group: 'birthday',
  },
  {
    id: 'birthday-fun',
    kind: 'birthday',
    name: 'Birthday Fun',
    short: 'Birthday Fun',
    blurb: 'Cake, balloons and a door decoration.',
    price: '[price]',
    amount: null,
    confidence: 'listed',
    icon: CakeIcon,
    tone: 'den',
    journeys: [1],
    group: 'birthday',
  },
  {
    id: 'gold-dining',
    kind: 'dining',
    name: 'Gold Dining Credit',
    short: 'the Gold Dining Credit',
    blurb: '$100 to spend on food in the lodge, for $85.',
    price: '$85',
    amount: 85,
    confidence: 'check',
    checkNote: 'Which restaurants take it: to confirm',
    checkSay: 'I couldn’t confirm which restaurants take it, so I flagged it for the lodge.',
    group: 'credit',
    icon: UtensilsIcon,
    tone: 'den',
  },
  {
    id: 'platinum-dining',
    kind: 'dining',
    name: 'Platinum Dining Credit',
    short: 'the Platinum Dining Credit',
    blurb: '$150 to spend on food in the lodge, for $120.',
    price: '$120',
    amount: 120,
    confidence: 'check',
    checkNote: 'Which restaurants take it: to confirm',
    checkSay: 'I couldn’t confirm which restaurants take it, so I flagged it for the lodge.',
    group: 'credit',
    icon: UtensilsIcon,
    tone: 'dusk',
  },
  {
    id: 'wolf-wakeup',
    kind: 'dining',
    name: 'Wolf Wakeup Breakfast',
    short: 'the Wolf Wakeup Breakfast',
    blurb: 'All-you-can-eat breakfast, per person per day.',
    price: '[price] per person',
    amount: null,
    confidence: 'check',
    checkNote: 'Where it’s served: to confirm',
    checkSay: 'I couldn’t find where it’s served, so I flagged it.',
    icon: CroissantIcon,
    tone: 'lake',
  },
  {
    id: 'magiquest',
    kind: 'experience',
    name: 'MagiQuest game and wand',
    short: 'MagiQuest',
    blurb: 'The lodge’s interactive quest. Keep the wand for next time.',
    price: '$34.99',
    amount: 34.99,
    confidence: 'listed',
    covers: ['magiquest'],
    icon: WandSparklesIcon,
    tone: 'forest',
  },
  {
    id: 'late-checkout',
    kind: 'experience',
    name: 'Late check-out to 2pm',
    short: 'late check-out',
    blurb: 'Check-out is 11am. Keep the suite until 2pm.',
    price: '[price]',
    amount: null,
    confidence: 'listed',
    icon: ClockIcon,
    tone: 'lake',
  },
]

export const extraById = (id: string) => extras.find((e) => e.id === id)

export const hasExtra = (s: DemoState, id: string) => s.cart.some((c) => c.id === id)

/** The pass in the trip that covers a plan activity, if any ("In your Paw Pass"). */
export function coveredBy(s: DemoState, activity: string) {
  return s.cart.map((c) => extraById(c.id)).find((e) => e?.kind === 'pass' && e.covers?.includes(activity))
}
