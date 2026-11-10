import { extraById, hasExtra, type ExtraKind } from '~/data/extras'
import type { Beat, DemoState, Option } from '../types'

// Wiley in the Trip Builder: once the suite is chosen it suggests what comes next, one section at a time, in the
// order that fits the trip (Mia's birthday first in Journey 1; passes for little ones first in Journey 2). Every
// suggestion highlights the matching card on the page, and every add or remove, from a chip or from the page,
// changes the same cart. Facts come from greatwolf.com/colorado-springs; what the site doesn't say, Wiley says it
// couldn't confirm.

type J = 1 | 2

const ORDER: Record<J, ExtraKind[]> = { 1: ['birthday', 'pass', 'dining', 'experience'], 2: ['pass', 'dining', 'experience'] }

/** The extra Wiley recommends for each section. */
const PICK: Record<J, Partial<Record<ExtraKind, string>>> = {
  1: { birthday: 'birthday-bash', pass: 'paw-pass', dining: 'gold-dining', experience: 'late-checkout' },
  2: { pass: 'pup-pass', dining: 'wolf-wakeup', experience: 'late-checkout' },
}

const say = (text: string | ((s: DemoState) => string), extra: Partial<Extract<Beat, { type: 'agent' }>> = {}): Beat => ({ ...extra, type: 'agent', text })
const fx = (...actions: Extract<Beat, { type: 'effect' }>['actions']): Beat => ({ type: 'effect', actions })

/** The next section the family hasn't filled or turned down. */
export function nextKind(s: DemoState, j: J): ExtraKind | null {
  return ORDER[j].find((k) => !s.cart.some((c) => c.kind === k) && !s.skipped.includes(k)) ?? null
}

const PITCH: Record<J, Partial<Record<ExtraKind, (s: DemoState) => string>>> = {
  1: {
    birthday: () => 'Mia turns 7 on Saturday. The Birthday Bash is pizza, cake, balloons and an arcade card, booked with your stay. Birthday Fun is smaller: cake, balloons and a door decoration.',
    pass: () => 'Last time Mia and Leo did MagiQuest. The Paw Pass includes it, plus a keepsake, treats and arcade games. MagiQuest on its own is $34.99 for the game and wand.',
    dining: (s) =>
      `${hasExtra(s, 'birthday-bash') ? 'The Bash covers the party pizza, so that leaves dinners. Loose Moose Family Kitchen does breakfast and dinner.' : 'Loose Moose Family Kitchen does breakfast and dinner, and Hungry As A Wolf does pizza.'} The Gold Dining Credit gives you $100 to spend for $85. I couldn’t confirm which restaurants take it, so it’s flagged.`,
    experience: () => 'Check-out is 11am on Sunday, and your water park passes last until closing that day. Late check-out keeps the suite until 2pm, for one more swim and a change before the drive.',
  },
  2: {
    pass: () => 'Water park passes are already in your suite for all four of you. For a 3 and 6 year old, the Pup Pass is made for little ones: Build-A-Bear, treats, an arcade card and a souvenir. The Paw Pass has MagiQuest instead.',
    dining: () => 'With little ones, breakfast in the lodge saves a morning. The Wolf Wakeup Breakfast is all you can eat; I couldn’t find its price or where it’s served, so it’s flagged. Or the Gold Dining Credit: $100 to spend for $85.',
    experience: (s) =>
      `Check-out is 11am, and your water park passes last until closing that day.${s.ideas.includes('zoo') ? ' With the zoo on your plan,' : ''} Late check-out keeps the suite until 2pm, for one more swim and a change before the drive.`,
  },
}

const PITCH_MOBILE: Record<J, Partial<Record<ExtraKind, string>>> = {
  1: {
    birthday: 'Mia turns 7 on Saturday. The Birthday Bash is pizza, cake, balloons and an arcade card.',
    pass: 'Last time they did MagiQuest. The Paw Pass includes it, plus treats and arcade games.',
    dining: 'The Gold Dining Credit gives you $100 to spend for $85. Which restaurants take it is still to confirm.',
    experience: 'Check-out is 11am Sunday. Late check-out keeps the suite until 2pm.',
  },
  2: {
    pass: 'Water park passes come with your suite. For a 3 and 6 year old, the Pup Pass is made for little ones.',
    dining: 'Breakfast in the lodge saves a morning: the Wolf Wakeup Breakfast is all you can eat.',
    experience: 'Check-out is 11am. Late check-out keeps the suite until 2pm.',
  },
}

const DONE: Record<J, string> = {
  1: 'That’s your trip. Want me to fit it all into the weekend plan?',
  2: 'Your trip’s ready. Save it for later, or book now?',
}

function doneChips(j: J): Option[] {
  return j === 1
    ? [
        { label: 'Plan our weekend', then: [fx({ do: 'go', to: 'j1/4' })] },
        { label: 'Go to checkout', then: [fx({ do: 'go', to: 'j1/5' })] },
      ]
    : [
        // Says what J2·6 opens with, so the chat shows it once.
        { label: 'Save my trip', say: 'Let me check with my partner first', then: [fx({ do: 'go', to: 'j2/6' })] },
        { label: 'Go to checkout', then: [fx({ do: 'end', card: 'checkout' })] },
      ]
}

/** What Wiley says once something is in: what it covers, and anything the site doesn't confirm. */
export function addedLine(id: string, s: DemoState): string {
  const e = extraById(id)!
  const parts = [`Added ${e.short ?? e.name}.`]
  if (e.covers?.includes('magiquest') && s.journey === 1) parts.push('MagiQuest on Saturday morning is covered now; I marked it in your plan.')
  if (e.id === 'late-checkout') parts.push(s.journey === 1 ? 'Sunday’s check-out moved to 2pm in your plan.' : 'Check-out moves to 2pm.')
  if (e.kind === 'birthday' && s.journey === 1) parts.push('It’s on Saturday at 1pm in your plan.')
  if (e.amount === null) parts.push('The lodge doesn’t list its price, so it shows as [price] until booking.')
  if (e.checkSay) parts.push(e.checkSay)
  return parts.join(' ')
}

function addBeats(id: string, j: J): Beat[] {
  return [fx({ do: 'addToCart', item: id }, { do: 'highlight', id: `extra-${id}` }, { do: 'scrollTo', id: `extra-${id}` }), say((s) => addedLine(id, s), { thinking: ['Updating your trip'] }), ...suggestNext(j)]
}

function skipBeats(k: ExtraKind, j: J, line: string): Beat[] {
  return [fx({ do: 'patch', fn: (s) => ({ skipped: [...s.skipped, k] }) }), say(line, { thinking: ['Updating your trip'] }), ...suggestNext(j)]
}

/** Extra chips per section, beyond "Add" and "skip". */
function alternatives(k: ExtraKind, j: J): Option[] {
  if (k === 'birthday') return [{ label: 'Birthday Fun instead', then: addBeats('birthday-fun', j) }]
  if (k === 'pass') {
    return [
      j === 1 ? { label: 'Just MagiQuest', then: addBeats('magiquest', j) } : { label: 'Paw Pass instead', then: addBeats('paw-pass', j) },
      {
        label: 'Compare passes',
        then: [
          fx({ do: 'scrollTo', id: 'trip-pass' }),
          say('Paw Pass: MagiQuest, a keepsake, treats and arcade games. Wolf Pass: top attractions and treats for all ages, including MagiQuest and the ropes course. Pup Pass: Build-A-Bear, treats, an arcade card and a souvenir. The lodge doesn’t list their prices.', {
            textMobile: 'Paw Pass: MagiQuest and arcade. Wolf Pass: more attractions, ropes course too. Pup Pass: Build-A-Bear, for little ones.',
          }),
          {
            type: 'chips',
            style: 'ai',
            options: [
              { label: 'Add the Paw Pass', then: addBeats('paw-pass', j) },
              { label: 'Add the Wolf Pass', then: addBeats('wolf-pass', j) },
              { label: 'Add the Pup Pass', then: addBeats('pup-pass', j) },
            ],
          },
        ],
      },
    ]
  }
  if (k === 'dining') return [{ label: j === 1 ? 'Platinum instead' : 'Gold Dining Credit', then: addBeats(j === 1 ? 'platinum-dining' : 'gold-dining', j) }]
  return []
}

const SKIP: Record<ExtraKind, [string, string]> = {
  birthday: ['No birthday package', 'No problem. You can add one later, up to booking.'],
  pass: ['Skip passes', 'Sure. The water park is already included, and attractions can be paid for one at a time.'],
  dining: ['We’ll pay as we go', 'Got it. There’s mobile ordering in the Great Wolf app too.'],
  experience: ['Not needed', 'Okay, 11am check-out it is.'],
}

/** Wiley's next suggestion, read from the trip when it plays: highlight the card, pitch it, offer the choices. */
export function suggestNext(j: J): Beat[] {
  return [
    fx({ do: 'patch', fn: (s) => {
      const k = nextKind(s, j)
      return { highlight: k ? `extra-${PICK[j][k]}` : null }
    } }, { do: 'scrollTo', id: '@highlight' }),
    {
      type: 'agent',
      thinking: ['Checking what fits your trip'],
      text: (s) => {
        const k = nextKind(s, j)
        return k ? PITCH[j][k]!(s) : DONE[j]
      },
      textMobile: (s) => {
        const k = nextKind(s, j)
        return k ? PITCH_MOBILE[j][k]! : DONE[j]
      },
    },
    {
      type: 'chips',
      style: 'ai',
      options: (s) => {
        const k = nextKind(s, j)
        if (!k) return doneChips(j)
        const pick = extraById(PICK[j][k]!)!
        return [{ label: `Add ${pick.short ?? pick.name}`, then: addBeats(pick.id, j) }, ...alternatives(k, j), { label: SKIP[k][0], then: skipBeats(k, j, SKIP[k][1]) }]
      },
    },
  ]
}

/** An extra added or removed on the page: Wiley answers it, then picks up where the trip is. */
export function onExtra(j: J) {
  return (id: string, added: boolean): Beat[] => {
    const e = extraById(id)!
    if (added) return [fx({ do: 'highlight', id: `extra-${id}` }), say((s) => addedLine(id, s), { thinking: ['Updating your trip'] }), ...suggestNext(j)]
    return [
      fx({ do: 'patch', fn: (s) => ({ skipped: s.cart.some((c) => c.kind === e.kind) || s.skipped.includes(e.kind) ? s.skipped : [...s.skipped, e.kind] }) }),
      say((s) => {
        const back = e.covers?.includes('magiquest') && s.journey === 1 && !s.cart.some((c) => extraById(c.id)?.covers?.includes('magiquest'))
        return `Removed ${e.short ?? e.name}.${back ? ' MagiQuest is still in your plan, not covered now: it’s $34.99 on its own.' : ''}`
      }),
      ...suggestNext(j),
    ]
  }
}

/** Typed requests in the Trip Builder. */
export function tripRules(j: J): [RegExp, Beat[]][] {
  const jump = (k: ExtraKind): Beat[] => [fx({ do: 'patch', fn: (s) => ({ skipped: s.skipped.filter((x) => x !== k) }) }), fx({ do: 'scrollTo', id: `trip-${k}` }), ...addBeats(PICK[j][k]!, j)]
  const rules: [RegExp, Beat[]][] = [
    [/pup pass/i, addBeats('pup-pass', j)],
    [/wolf pass/i, addBeats('wolf-pass', j)],
    [/paw pass|pass/i, addBeats('paw-pass', j)],
    [/breakfast/i, addBeats('wolf-wakeup', j)],
    [/dining|dinner|eat|food/i, jump('dining')],
    [/late|check.?out/i, addBeats('late-checkout', j)],
  ]
  if (j === 1) rules.unshift([/birthday|party|bash|cake/i, jump('birthday')], [/magi/i, addBeats('magiquest', j)])
  return rules
}
