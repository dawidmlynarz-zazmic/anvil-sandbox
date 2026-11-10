import type { RateKey } from '~/data/fixtures'

export type Snap = 'peek' | 'half' | 'full'
export type DeviceMode = 'auto' | 'mobile' | 'desktop'
export type Journey = 1 | 2

export interface PlanItem {
  id: string
  day: 'fri' | 'sat' | 'sun'
  time: string
  title: string
  sub?: string
  status?: 'Added' | 'Booked' | 'Included' | 'Suggested' | 'Free'
}

export interface CartLine {
  id: string
  label: string
  amount: number
  /** Trip Builder section the line belongs to. */
  kind?: 'pass' | 'dining' | 'birthday' | 'experience'
  /** The price as shown when it is a sample (starred, "$129.98*"): the lodge lists none. */
  price?: string
  /** True right after it was added, so the quote can tag it "Just added". */
  fresh?: boolean
}

/** Everything the page reads. Wiley changes it through actions; the person changes it by tapping the page. */
export interface DemoState {
  journey: Journey
  signedIn: boolean
  /** The chips under the suites heading. Empty means Wiley has not filtered anything (or the person undid it). */
  filters: string[]
  setByWiley: boolean
  /** The person removed one of Wiley's filter chips: show every suite again. */
  widened: boolean
  ranked: string[]
  tags: Record<string, string>
  highlight: string | null
  dim: string[]
  spotlight: string | null
  expanded: string | null
  selected: { suite: string; rate: RateKey } | null
  cart: CartLine[]
  plan: PlanItem[]
  /** Journey 2: activity ids saved to the plan. */
  ideas: string[]
  weekend: string
  priority: 'bunks' | 'view' | 'price' | null
  toast: string | null
  open: boolean
  snap: Snap
  /** Journey 2: the Voyagers join sheet, the share sheet; Journey 1: the Apple Pay sheet. */
  sheet: null | 'join' | 'share' | 'apple' | 'plan'
  planSaved: boolean
  /** Journey 1: the weekend-plan day Wiley last pointed at; the mobile day tabs follow it. */
  planDay: 'fri' | 'sat' | 'sun' | null
  /** Journey 2: what the visitor typed in the hero's trip field, if they wrote their own request. */
  tripText: string | null
  /** Journey 2: the hero request was spoken (the chat tags it as voice). */
  tripVoice: boolean
  /** The suites list is loading (skeletons show). */
  loadingSuites: boolean
  /** Trip Builder sections the family said no to; Wiley stops suggesting them. */
  skipped: ('pass' | 'dining' | 'birthday' | 'experience')[]
  /** The plan counter on the Ask Wiley pill. */
  planCount: number
}

export type Action =
  | { do: 'setFilters'; chips: string[] }
  | { do: 'rank'; order: string[]; tag?: { id: string; label: string } }
  | { do: 'highlight'; id: string | null }
  | { do: 'dim'; ids: string[] }
  | { do: 'spotlight'; id: string | null }
  | { do: 'scrollTo'; id: string }
  | { do: 'expandRates'; suite: string | null }
  | { do: 'selectRate'; suite: string | '@current'; rate: RateKey | 'Standard' | 'Flexible' }
  | { do: 'addToCart'; item: string }
  | { do: 'removeFromCart'; item: string }
  | { do: 'addToPlan'; item: string }
  | { do: 'go'; to: string }
  | { do: 'toast'; text: string }
  | { do: 'openSheet'; snap: Snap }
  | { do: 'closeSheet' }
  | { do: 'signIn' }
  | { do: 'sheet'; which: DemoState['sheet'] }
  | { do: 'patch'; fn: (s: DemoState) => Partial<DemoState> }
  | { do: 'end'; card: 'checkout' | 'companion' | 'plan' }
  /** Show the suites' loading skeletons for `ms`, as if the list were being fetched. */
  | { do: 'loadSuites'; ms: number }

export interface Option {
  label: string
  /** What shows as the person's bubble. Defaults to the label. */
  say?: string
  then: Beat[]
}

export type CardKind = 'quote' | 'questions' | 'capture'

export type Beat =
  /** `text` can read the demo state, e.g. to say the weekend the family picked. */
  | {
      type: 'user'
      text: string | ((s: DemoState) => string)
      voice?: boolean | 'mobile'
      /** Tag the message as voice without playing the listening state again (it already played elsewhere). */
      voiceTag?: (s: DemoState) => boolean
      reaction?: string
    }
  | {
      type: 'agent'
      text: string | ((s: DemoState) => string)
      textMobile?: string | ((s: DemoState) => string)
      source?: string
      delayMs?: number
      desktopOnly?: boolean
      /** What Wiley shows it is doing before it answers. Defaults to the step's `thinking`. */
      thinking?: string[]
      when?: (s: DemoState) => boolean
    }
  /** `options` can read the demo state, e.g. not to offer the party once it is booked. An empty list shows nothing. */
  | { type: 'chips'; style: 'answer' | 'ai'; options: Option[] | ((s: DemoState) => Option[]); when?: (s: DemoState) => boolean }
  | { type: 'card'; component: CardKind; props?: Record<string, unknown>; then?: (payload: unknown) => Beat[] }
  | { type: 'effect'; actions: Action[]; when?: (s: DemoState) => boolean }

export interface Msg {
  id: number
  role: 'user' | 'agent'
  text?: string
  textMobile?: string
  voice?: boolean
  reaction?: string
  source?: string
  /** 0–1 while the reply streams in; absent once it is complete. */
  reveal?: number
  chips?: { style: 'answer' | 'ai'; options: Option[] }
  card?: { component: CardKind; props?: Record<string, unknown>; then?: (payload: unknown) => Beat[]; done?: boolean; answer?: unknown }
}

export interface StepScript {
  /** Page state to set when the step opens (before Wiley speaks). */
  enter?: Action[]
  beats: Beat[]
  /** Chip labels the presenter's Next tap picks, in order, when the person hasn't clicked through. */
  path?: string[]
  /** What the mic "hears" when tapped on this step. */
  voiceLine?: string
  /** Typed words that get a scripted answer. */
  rules?: [RegExp, Beat[]][]
  /** Offered when nothing matches. */
  fallback: Option[]
  /** What Wiley says it is doing while it thinks on this step, in order (the first two or three show). */
  thinking?: string[]
  /** A rate picked on the page (a rate card's Select). The chat answers it like the matching chip. */
  onRate?: (key: RateKey) => Beat[]
  /** An extra added or removed on the Trip Builder page. The chat answers it like the matching chip. */
  onExtra?: (id: string, added: boolean) => Beat[]
}
