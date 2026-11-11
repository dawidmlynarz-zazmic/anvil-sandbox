import { suiteById, suites } from '~/data/fixtures'
import { includes, longDates, partySize, stayDays, youngest } from '~/state/stay'
import type { Beat, DemoState } from '../types'

// Wiley's answer when the family changes the stay in the Your stay bar. It says what changed on the page and nothing
// the page doesn't show: suites that now sleep too few are hidden, the trip and plan move to the new dates.

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function datesLine(s: DemoState) {
  const parts = [`Got it: ${longDates(s.stay)}.`]
  const [d1, , d3] = stayDays(s.stay)
  if (s.selected) {
    parts.push(`Your ${suiteById(s.selected.suite).name} and the rest of your trip moved to these dates.`)
    if (s.plan.length || s.ideas.length) parts.push(`Your plan now runs ${d1.long} to ${d3.long}.`)
  } else {
    const top = s.ranked.find((id) => suiteById(id).sleeps >= partySize(s.stay)) ?? suites.find((x) => x.sleeps >= partySize(s.stay))?.id
    parts.push(top ? `I checked the suites for those dates; ${suiteById(top).name} is still at the top.` : 'I checked the suites for those dates.')
  }
  if (s.journey === 1 && !includes(s.stay, '2027-03-13')) parts.push('Heads up: Mia’s birthday is Saturday, March 13, which isn’t in these dates.')
  return parts.join(' ')
}

function guestsLine(s: DemoState) {
  const party = partySize(s.stay)
  const parts = [`Got it: ${plural(s.stay.adults, 'adult', 'adults')}${s.stay.kids.length ? ` and ${plural(s.stay.kids.length, 'kid', 'kids')}` : ''}, ${party} in all.`]
  const tooSmall = suites.filter((x) => x.sleeps < party)
  if (tooSmall.length === suites.length) parts.push(`None of the suites here sleeps ${party}; the lodge’s largest sleep 8 and aren’t in this demo.`)
  else if (tooSmall.length) parts.push(`${tooSmall.map((x) => x.name).join(' and ')} ${tooSmall.length === 1 ? 'sleeps' : 'sleep'} fewer than ${party}, so I hid ${tooSmall.length === 1 ? 'it' : 'them'}.`)
  else parts.push('Every suite here fits you all.')
  if (s.selected && suiteById(s.selected.suite).sleeps < party) parts.push(`Your ${suiteById(s.selected.suite).name} sleeps ${suiteById(s.selected.suite).sleeps}, so you’ll need a bigger suite: KidCabin sleeps 6.`)
  const y = youngest(s.stay)
  if (y !== null && y < 3) parts.push('For your little one, Cub Paw Pool is the toddler pool.')
  if (s.stay.kids.some((a) => a < 0)) parts.push('Add the kids’ ages and I can suggest the right passes and pools.')
  return parts.join(' ')
}

/** What Wiley says about a change in the Your stay bar. */
export function stayReply(what: 'dates' | 'guests' | 'clear'): Beat[] {
  if (what === 'clear') return [{ type: 'agent', text: 'Dates cleared. Pick new ones in the Your stay bar at the top and I’ll check them.', thinking: ['Clearing your dates'] }]
  if (what === 'dates') return [{ type: 'agent', text: datesLine, thinking: ['Checking those dates'] }]
  return [{ type: 'agent', text: guestsLine, thinking: ['Checking suites for your group'] }]
}
