import { addDays, DEMO_TODAY, gbp, nextSaturday, showDateLine, spoken, toIso } from '~/lib/format'
import { SAMPLE_INTERESTS, SHOWS } from '~/mocks/shows'
import type { Action, AgentResult, Block, Chip, Criteria, Session, ToolStep, Turn } from '~/state/types'
import { axsTools, findDate, optionById, HOLD_SECONDS } from './axsTools'

// The scripted agent. No model: it reads a few words (how many, how much, when, which show), calls the same tool layer
// the real agent will, and answers in canned sentences. What it says always matches what the screen then shows, and
// it says so plainly when the demo can't do something.

let n = 0
const turn = (text: string, extra: Partial<Turn> = {}): Turn => ({
  id: `t${Date.now().toString(36)}${n++}`,
  role: 'agent',
  text,
  at: Date.now(),
  ...extra,
})

export const STARTERS = [
  'Two tickets for a big night out in London, under £80 each',
  'Anything live at The O2 next summer?',
  'Boxing at Wembley, 2 seats',
]

const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

export function parseAsk(text: string): Criteria {
  const t = text.toLowerCase()
  const c: Criteria = {}

  const digits = t.match(/(\d+)\s*(?:tickets?|seats?)\b/) ?? t.match(/\bfor\s+(\d+)\b/)
  const words = t.match(/\b(one|two|three|four|five|six)\s*(?:tickets?|seats?|of us)\b/)
  if (digits) c.qty = Number(digits[1])
  else if (words) c.qty = WORDS[words[1]]
  else if (/\b(pair|couple|two of us)\b/.test(t)) c.qty = 2
  else if (/\bjust me\b|\bone ticket\b/.test(t)) c.qty = 1
  if (c.qty !== undefined && (c.qty < 1 || c.qty > 6)) delete c.qty

  const price = t.match(/(?:under|below|less than|max(?:imum)?|up to|within)\s*£?\s*(\d+)/) ?? t.match(/£\s*(\d+)/)
  if (price) c.maxPrice = Number(price[1])

  if (/\bo2\b/.test(t)) c.venue = 'The O2'
  if (/wembley/.test(t)) c.venue = 'Wembley'

  if (/box|fight|sport/.test(t)) c.category = 'sport'
  else if (/wrestl/.test(t)) c.category = 'wrestling'
  else if (/\b(music|gig|concert|band|live)\b/.test(t) && !c.venue) c.category = 'music'

  const keywords = SHOWS.flatMap((s) => s.keywords.map((k) => ({ k, id: s.id }))).sort((a, b) => b.k.length - a.k.length)
  const generic = ['concert', 'sport', 'band', 'gig', 'rock', 'wembley', 'boxing', 'fight', 'electronic', 'synth', 'wrestling']
  const hit = keywords.find(({ k }) => !generic.includes(k) && new RegExp(`\\b${k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`).test(t))
  if (hit) c.query = hit.k

  const monthIdx = MONTHS.findIndex((m) => t.includes(m))
  const [ty, tm] = DEMO_TODAY.split('-').map(Number)
  if (/this saturday|on saturday|saturday night/.test(t)) {
    const sat = nextSaturday(DEMO_TODAY)
    Object.assign(c, { from: sat, to: sat, whenLabel: `this Saturday (${spoken(sat)})` })
  } else if (/this weekend/.test(t)) {
    const sat = nextSaturday(DEMO_TODAY)
    Object.assign(c, { from: sat, to: addDays(sat, 1), whenLabel: 'this weekend' })
  } else if (/next summer|this summer|\bsummer\b/.test(t)) {
    const y = tm > 8 ? ty + 1 : ty
    Object.assign(c, { from: `${y}-06-01`, to: `${y}-08-31`, whenLabel: 'next summer' })
  } else if (/next month/.test(t)) {
    const y = tm === 12 ? ty + 1 : ty
    const m = tm === 12 ? 1 : tm + 1
    const first = `${y}-${String(m).padStart(2, '0')}-01`
    Object.assign(c, { from: first, to: toIso(new Date(Date.UTC(y, m, 0, 12))), whenLabel: 'next month' })
  } else if (monthIdx >= 0) {
    const y = monthIdx + 1 >= tm ? ty : ty + 1
    const m = monthIdx + 1
    const first = `${y}-${String(m).padStart(2, '0')}-01`
    Object.assign(c, { from: first, to: toIso(new Date(Date.UTC(y, m, 0, 12))), whenLabel: `in ${MONTHS[monthIdx][0].toUpperCase()}${MONTHS[monthIdx].slice(1)} ${y}` })
  }
  if (Object.keys(c).length === 0 && /what'?s on|whats on|everything|anything|any shows?|all shows|surprise me|ideas/.test(t)) c.browse = true
  return c
}

const describe = (c: Criteria, qty: number) =>
  [`${qty} ${qty === 1 ? 'ticket' : 'tickets'}`, c.maxPrice ? `under ${gbp(c.maxPrice, true)} each` : null, c.whenLabel ?? null].filter(Boolean).join(', ')

const findTool = (c: Criteria, qty: number): ToolStep => ({
  name: 'findEvents',
  label: 'Searched AXS events',
  detail: ['London', c.venue, describe(c, qty)].filter(Boolean).join(' · '),
})

const chipsAfterResults = (c: Criteria): Chip[] => [
  ...(c.maxPrice ? [{ label: 'Show all prices', action: { type: 'relax', what: 'price' } as const }] : []),
  ...(c.from ? [{ label: 'Any date', action: { type: 'relax', what: 'date' } as const }] : []),
]

async function search(session: Session, criteria: Criteria): Promise<AgentResult> {
  const qty = criteria.qty ?? 2
  const interests = session.consent === 'allowed' ? SAMPLE_INTERESTS : undefined
  const q = { ...criteria, qty, interests }
  const shows = await axsTools.findEvents(q)
  const tools = [findTool(criteria, qty)]
  const patch = { criteria, selection: {} }

  if (!shows.length) {
    return {
      patch,
      turns: [
        turn(`I couldn't find sample shows for ${describe(criteria, qty)}. This demo only knows ${SHOWS.length} London shows.`, {
          tools,
          blocks: [{ kind: 'empty' }],
          chips: chipsAfterResults(criteria),
        }),
      ],
    }
  }

  // Only ask about personalisation when it would change what they see.
  let askConsent = false
  if (session.consent === 'unset') {
    const personal = await axsTools.findEvents({ ...criteria, qty, interests: SAMPLE_INTERESTS })
    askConsent = personal.map((s) => s.showId).join() !== shows.map((s) => s.showId).join()
  }

  const ranked = session.consent === 'allowed' && shows.some((s) => s.rankedForYou)
  const blocks: Block[] = [{ kind: 'shows', shows, qty, ranked }]
  if (askConsent) blocks.push({ kind: 'consent' })
  const text =
    shows.length === 1
      ? `I found one show for ${describe(criteria, qty)}. Prices include fees.`
      : `I found ${shows.length} shows for ${describe(criteria, qty)}. Prices include fees.`
  return { patch, turns: [turn(text, { tools, blocks, chips: chipsAfterResults(criteria) })] }
}

async function viewDates(session: Session, showId: string): Promise<AgentResult> {
  const c = session.criteria
  const qty = c.qty ?? 2
  const tool: ToolStep = { name: 'findEvents', label: 'Looked up dates', detail: SHOWS.find((s) => s.id === showId)?.title }
  const base = { ...c, query: undefined, venue: undefined, category: undefined }
  const found =
    (await axsTools.findEvents({ ...base, query: SHOWS.find((s) => s.id === showId)?.title, qty })).find((s) => s.showId === showId) ??
    (await axsTools.findEvents({ query: SHOWS.find((s) => s.id === showId)?.title, qty })).find((s) => s.showId === showId)
  if (!found) return { patch: {}, turns: [turn('That show is no longer in the demo.', { blocks: [{ kind: 'empty' }] })] }
  const patch = { selection: { showId } }
  if (found.dates.length === 1) {
    const only = found.dates[0]
    const next = await seatsFor(session, only.id, { ...patch.selection, dateId: only.id }, `${found.title} has one date: ${showDateLine(only.date, only.time)}.`)
    next.turns[0].tools = [tool, ...(next.turns[0].tools ?? [])]
    return next
  }
  return {
    patch,
    turns: [
      turn(`${found.title} plays ${found.venue} on ${found.dates.length} dates. Pick one. Prices are all-in, per ticket.`, {
        tools: [tool],
        blocks: [{ kind: 'dates', show: found, qty }],
      }),
    ],
  }
}

async function seatsFor(
  session: Session,
  dateId: string,
  selection: Session['selection'],
  lead?: string,
  filter?: 'floor' | 'closer' | 'step-free' | 'cheaper' | 'all',
): Promise<AgentResult> {
  const qty = session.criteria.qty
  const found = findDate(dateId)
  if (!found) return { patch: {}, turns: [turn('That date is no longer on sale.', { blocks: [{ kind: 'empty' }] })] }
  if (qty === undefined) {
    return {
      patch: { selection },
      turns: [turn(`${lead ? `${lead} ` : ''}How many tickets do you need?`, { blocks: [{ kind: 'quantity', dateId }] })],
    }
  }
  const max = session.criteria.maxPrice
  let options = filter === 'all' ? [] : await axsTools.getSeats(dateId, { qty, maxPrice: max, filter })
  let over = false
  // Nothing inside the budget: say so, and show what there is rather than an empty card.
  if (!options.length && max !== undefined) {
    options = await axsTools.getSeats(dateId, { qty, filter: filter === 'all' ? undefined : filter })
    over = options.length > 0
  }
  if (!options.length && filter === 'all') options = await axsTools.getSeats(dateId, { qty })
  const tools: ToolStep[] = [{ name: 'getSeats', label: 'Checked seats and prices', detail: `${found.show.title} · ${spoken(found.date.date)} · ${qty} together` }]
  if (!options.length) {
    return {
      patch: { selection },
      turns: [
        turn(
          filter && filter !== 'all'
            ? `There are no ${FILTER_WORDS[filter]} left for ${qty} together on that date.`
            : `There are no seats left for ${qty} together on that date.`,
          { tools, blocks: [{ kind: 'empty' }], chips: seatChips(true) },
        ),
      ],
    }
  }
  const best = options[0]
  const text = [
    lead,
    over
      ? filter && filter !== 'all'
        ? `There are no ${FILTER_WORDS[filter]} under ${gbp(max!, true)} each for ${qty} together, so these are the closest prices.`
        : `Nothing is under ${gbp(max!, true)} each for ${qty} together, so these are the closest prices.`
      : filter && filter !== 'all'
        ? `Here are the ${FILTER_WORDS[filter]} for ${qty} together.`
        : `Here are the best seats for ${qty} together${max ? ` under ${gbp(max, true)} each` : ''}.`,
    `${best.sectionLabel} is ${gbp(best.total)} each, all-in.`,
  ]
    .filter(Boolean)
    .join(' ')
  return {
    patch: { selection },
    turns: [turn(text, { tools, blocks: [{ kind: 'seats', dateId, qty, options, overBudget: over }], chips: seatChips(false) })],
  }
}

const FILTER_WORDS = { floor: 'floor seats', closer: 'seats closer to the stage', 'step-free': 'step-free seats', cheaper: 'cheaper seats' } as const

const seatChips = (relax: boolean): Chip[] =>
  relax
    ? [{ label: 'Show all seats', action: { type: 'refine', refine: 'all' } }]
    : [
        { label: 'Closer to the stage', action: { type: 'refine', refine: 'closer' } },
        { label: 'Step-free seats', action: { type: 'refine', refine: 'step-free' } },
        { label: 'Floor only', action: { type: 'refine', refine: 'floor' } },
        { label: 'Cheaper options', action: { type: 'refine', refine: 'cheaper' } },
      ]

const REFINE_WORDS: [RegExp, 'floor' | 'closer' | 'step-free' | 'cheaper'][] = [
  [/floor|standing/, 'floor'],
  [/closer|front|near/, 'closer'],
  [/step-?free|wheelchair|accessible|access/, 'step-free'],
  [/cheap|less|lower price|save/, 'cheaper'],
]

const SUPPORT_PERSON = /\b(person|human|agent|someone|speak|talk to|call me|support team)\b/
const SUPPORT_RULES = /\b(refund|refunds|cancel|cancelled|cancellation|transfer|resell|resale|can'?t make|lost my|help with my order)\b/

/** What a person would see if the fan asked for one: the same facts the fan already gave, so they don't repeat them. */
function handoffLines(session: Session): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = []
  const lastAsk = [...session.turns].reverse().find((t) => t.role === 'user')?.text
  if (lastAsk) lines.push({ label: 'Last message', value: lastAsk })
  const found = session.selection.dateId ? findDate(session.selection.dateId) : undefined
  if (found) lines.push({ label: 'Show', value: `${found.show.title}, ${showDateLine(found.date.date, found.date.time)}` })
  const option = session.hold ? optionById(session.hold.optionId) : undefined
  if (session.hold && option) {
    lines.push({ label: 'Seats', value: `${session.hold.qty} × ${option.sectionLabel}, row ${option.row}` })
    lines.push({ label: 'Hold', value: `${session.hold.holdId}, ${gbp(session.hold.total)} all-in` })
  }
  if (lines.length === 1) lines.push({ label: 'Search', value: describe(session.criteria, session.criteria.qty ?? 2) })
  return lines
}

const FALLBACK = turn(
  'I can search the sample London shows in this demo: say how many tickets, your budget and when, or name a show. Try one of these.',
)

/** What the agent says to a button press, as the user's own message in the thread. */
export function echo(action: Action, session: Session): string | undefined {
  switch (action.type) {
    case 'text':
      return action.text
    case 'view-dates':
      return `View dates for ${SHOWS.find((s) => s.id === action.showId)?.title}`
    case 'pick-date': {
      const f = findDate(action.dateId)
      return f ? showDateLine(f.date.date, f.date.time) : undefined
    }
    case 'set-qty':
      return `${action.qty} ${action.qty === 1 ? 'ticket' : 'tickets'}`
    case 'refine':
      return { floor: 'Floor only', closer: 'Closer to the stage', 'step-free': 'Step-free seats', cheaper: 'Cheaper options', all: 'Show all seats' }[action.refine]
    case 'pick-seats': {
      const o = optionById(action.optionId)
      return o ? `${o.sectionLabel}, row ${o.row}` : undefined
    }
    case 'consent':
      return action.allow ? 'Allow' : 'Not now'
    case 'hold':
      return `Hold ${session.criteria.qty ?? 2} seats`
    case 'relax':
      return action.what === 'price' ? 'Show all prices' : 'Any date'
    case 'support':
      return { rules: 'Refund and transfer rules', person: 'Talk to a person', send: 'Send summary' }[action.topic]
  }
}

export async function respond(action: Action, session: Session): Promise<AgentResult> {
  const c = session.criteria
  switch (action.type) {
    case 'text': {
      const lower = action.text.toLowerCase()
      if (SUPPORT_PERSON.test(lower)) return respond({ type: 'support', topic: 'person' }, session)
      if (SUPPORT_RULES.test(lower)) return respond({ type: 'support', topic: 'rules' }, session)
      if (session.selection.dateId) {
        const refine = REFINE_WORDS.find(([re]) => re.test(lower))?.[1]
        if (refine && !parseAsk(action.text).query) return respond({ type: 'refine', refine }, session)
      }
      const parsed = parseAsk(action.text)
      const asked = Object.keys(parsed).length > 0
      if (!asked) return { patch: {}, turns: [{ ...FALLBACK, chips: STARTERS.map((s) => ({ label: s, action: { type: 'text', text: s } as const })) }] }
      // A new ask replaces the old one, except the number of tickets, which carries over when it isn't repeated.
      const criteria: Criteria = { ...parsed, qty: parsed.qty ?? c.qty }
      if (criteria.qty === undefined && !criteria.query) {
        // No number of tickets yet: say what's on, then ask with a stepper rather than a row of chips.
        const found = await axsTools.findEvents({ ...criteria, qty: 1 })
        if (found.length) {
          const where = `${criteria.venue ? `at ${criteria.venue}` : 'in London'}${criteria.whenLabel ? ` ${criteria.whenLabel}` : ''}`
          return {
            patch: { criteria, selection: {} },
            turns: [
              turn(`${found.length === 1 ? 'There is 1 show' : `There are ${found.length} shows`} ${where}. How many tickets do you need?`, {
                tools: [{ name: 'findEvents', label: 'Checked what is on', detail: ['London', criteria.venue, criteria.whenLabel].filter(Boolean).join(' · ') }],
                blocks: [{ kind: 'quantity', subtitle: `${found.length === 1 ? '1 show' : `${found.length} shows`} ${where}`, price: Math.min(...found.map((x) => x.fromPrice)) }],
              }),
            ],
          }
        }
        return search(session, { ...criteria, qty: 2 })
      }
      if (criteria.query) {
        const show = SHOWS.find((s) => s.keywords.includes(criteria.query!))
        if (show) return viewDates({ ...session, criteria }, show.id).then((r) => ({ ...r, patch: { ...r.patch, criteria } }))
      }
      return search(session, criteria)
    }
    case 'set-qty': {
      const criteria = { ...c, qty: action.qty }
      if (session.selection.dateId) return seatsFor({ ...session, criteria }, session.selection.dateId, session.selection).then((r) => ({ ...r, patch: { ...r.patch, criteria } }))
      return search(session, criteria)
    }
    case 'relax': {
      const criteria = action.what === 'price' ? { ...c, maxPrice: undefined } : { ...c, from: undefined, to: undefined, whenLabel: undefined }
      return search(session, criteria)
    }
    case 'view-dates':
      return viewDates(session, action.showId)
    case 'pick-date':
      return seatsFor(session, action.dateId, { ...session.selection, dateId: action.dateId, optionId: undefined })
    case 'refine': {
      const dateId = session.selection.dateId
      if (!dateId) return { patch: {}, turns: [turn('Pick a show and a date first, then I can narrow the seats.')] }
      return seatsFor(session, dateId, session.selection, undefined, action.refine)
    }
    case 'pick-seats': {
      const option = optionById(action.optionId)
      if (!option) return { patch: {}, turns: [turn('Those seats are no longer listed.', { blocks: [{ kind: 'empty' }] })] }
      const qty = c.qty ?? 2
      return {
        patch: { selection: { ...session.selection, optionId: option.id } },
        turns: [
          turn(
            `I can hold ${qty} seats in ${option.sectionLabel}, row ${option.row}, for ${HOLD_SECONDS / 60} minutes. You pay on AXS, never here.`,
            { blocks: [{ kind: 'confirm-hold', option, qty }] },
          ),
        ],
      }
    }
    case 'hold': {
      const qty = c.qty ?? 2
      const option = optionById(action.optionId)
      const dateId = session.selection.dateId
      if (!option || !dateId) return { patch: {}, turns: [turn('I lost track of those seats. Pick them again.', { blocks: [{ kind: 'empty' }] })] }
      try {
        const hold = await axsTools.holdSeats(dateId, option.id, qty)
        return {
          patch: { hold },
          turns: [
            turn(`Seats held for ${HOLD_SECONDS / 60} minutes. Continue on AXS to pay.`, {
              tools: [{ name: 'holdSeats', label: 'Held your seats', detail: `${qty} × ${option.sectionLabel}, row ${option.row}` }],
              blocks: [{ kind: 'hold', hold, option }],
              chips: [{ label: 'Refund and transfer rules', action: { type: 'support', topic: 'rules' } }],
            }),
          ],
        }
      } catch (e) {
        return { patch: {}, turns: [turn(e instanceof Error ? e.message : 'I couldn’t hold those seats.', { blocks: [{ kind: 'empty' }] })] }
      }
    }
    case 'support': {
      if (action.topic === 'rules') {
        return {
          patch: {},
          turns: [
            turn(
              'Refunds, transfers and resale depend on the show, and the rules are on your order on AXS. [AXS refund, transfer and resale wording goes here.] I can hand this to a person with your details attached.',
              { chips: [{ label: 'Talk to a person', action: { type: 'support', topic: 'person' } }] },
            ),
          ],
        }
      }
      if (action.topic === 'person') {
        return {
          patch: {},
          turns: [turn('I can hand this to a person with what you have told me, so you don’t repeat it. This is what they would see.', { blocks: [{ kind: 'handoff', lines: handoffLines(session) }] })],
        }
      }
      return {
        patch: {},
        turns: [turn('In this preview nobody receives this: it isn’t connected to a team. In the real flow, a person would get the summary above, and you would not have to repeat it.')],
      }
    }
    case 'consent': {
      if (!action.allow) {
        return { patch: { consent: 'declined' }, turns: [turn('No problem. I’ll keep results in date order.')] }
      }
      const next = { ...session, consent: 'allowed' as const }
      const r = await search(next, c)
      r.turns[0].text = `Done. I’ve re-ordered the shows using a sample AXS history; in this preview that history is made up. ${r.turns[0].text}`
      return { patch: { ...r.patch, consent: 'allowed' }, turns: r.turns }
    }
  }
}
