import type { EventSummary, Hold, SeatOption } from '~/services/types'

export interface Criteria {
  qty?: number
  /** All-in, per ticket, in pounds. */
  maxPrice?: number
  query?: string
  venue?: string
  category?: 'music' | 'comedy' | 'sport' | 'wrestling' | 'live'
  from?: string
  to?: string
  /** What the fan said about when ("this Saturday"), for the agent to repeat back. */
  whenLabel?: string
  /** The ask was open-ended ("what's on?"): no filter, but still a search. */
  browse?: boolean
}

export type Consent = 'unset' | 'allowed' | 'declined'

export interface Selection {
  showId?: string
  dateId?: string
  optionId?: string
}

/** Everything a button or chip in the thread can do. The scripted agent answers each one. */
export type Action =
  | { type: 'text'; text: string }
  | { type: 'view-dates'; showId: string }
  | { type: 'pick-date'; dateId: string }
  | { type: 'set-qty'; qty: number }
  | { type: 'refine'; refine: 'floor' | 'closer' | 'step-free' | 'cheaper' | 'all' }
  | { type: 'pick-seats'; optionId: string }
  | { type: 'consent'; allow: boolean }
  | { type: 'hold'; optionId: string }
  | { type: 'relax'; what: 'price' | 'date' }
  /** Questions about refunds and transfers, and handing over to a person. */
  | { type: 'support'; topic: 'rules' | 'person' | 'send' }

export interface Chip {
  label: string
  action: Action
}

export interface ToolStep {
  /** The tool-layer call this stands for. */
  name: 'findEvents' | 'getSeats' | 'getResale' | 'holdSeats'
  label: string
  detail?: string
}

export type Block =
  | { kind: 'shows'; shows: EventSummary[]; qty: number; ranked: boolean }
  | { kind: 'consent' }
  | { kind: 'dates'; show: EventSummary; qty: number }
  /** Asked for a date (`dateId`) or before any search (`subtitle`, `price`: the lowest all-in price per ticket). */
  | { kind: 'quantity'; dateId?: string; subtitle?: string; price?: number }
  | { kind: 'seats'; dateId: string; qty: number; options: SeatOption[]; overBudget: boolean }
  | { kind: 'confirm-hold'; option: SeatOption; qty: number }
  | { kind: 'hold'; hold: Hold; option: SeatOption }
  /** What a person would see, so the fan doesn't repeat it. */
  | { kind: 'handoff'; lines: { label: string; value: string }[] }
  | { kind: 'empty' }

export interface Turn {
  id: string
  role: 'user' | 'agent'
  text: string
  tools?: ToolStep[]
  blocks?: Block[]
  chips?: Chip[]
  at: number
}

export interface Session {
  turns: Turn[]
  criteria: Criteria
  consent: Consent
  selection: Selection
  hold?: Hold
}

export type SessionPatch = Partial<Pick<Session, 'criteria' | 'consent' | 'selection' | 'hold'>>

export interface AgentResult {
  turns: Turn[]
  patch: SessionPatch
}
