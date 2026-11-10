import { activityById, dates, money, rateOf, suiteById } from '~/data/fixtures'
import { art, suitePhotos } from '~/data/photos'
import { coveredBy, extraById, hasExtra } from '~/data/extras'
import type { DemoState, PlanItem } from '~/wiley/types'

// Journey 2's saved plan, read from the demo state: the suite and weekend the family chose, the rate if they picked
// one, and the things to do they added. The page, the preview sheet and Wiley all read it from here.

const WHEN: Record<string, { where: string; when: string; tag: string }> = {
  'cub-paw': { where: 'In the lodge · kiddie splash pad', when: 'Any day, with your water park passes', tag: 'Included' },
  zoo: { where: 'Near the lodge · hand-feed giraffes', when: 'Sunday morning', tag: 'Nearby' },
  garden: { where: 'Near the lodge · red rock trails', when: 'Any morning · free entry', tag: 'Free' },
  manitou: { where: 'Near the lodge · historic downtown', when: 'Half day', tag: 'Nearby' },
}

export function savedPlan(s: DemoState) {
  const suiteId = s.selected?.suite ?? s.expanded ?? 'pup-den-jr'
  const suite = suiteById(suiteId)
  const weekend = s.weekend === 'Mar 12 – 14' ? dates.j2b : dates.j2a
  const nights = weekend.nights
  const rate = s.selected ? rateOf(s.selected.suite, s.selected.rate) : null
  const things = ['cub-paw', ...s.ideas].map((id) => {
    const name = id === 'cub-paw' ? 'Cub Paw Pool' : (activityById(id)?.name ?? id)
    const w = WHEN[id] ?? { where: 'Near the lodge', when: 'Any day', tag: activityById(id)?.tag ?? '' }
    return { id, name, icon: art[id], ...w }
  })
  return {
    suite,
    photo: suitePhotos[suiteId]?.[0]?.src,
    weekend,
    nights,
    guests: '2 adults, 2 kids (3, 6)',
    rate,
    rateLine: rate
      ? `${rate.plan} · ${rate.member ? 'Voyagers Club rate' : 'Non-member rate'} · ${money(rate.price)} a night`
      : `From ${money(suite.from)} a night · rate not chosen yet`,
    total: rate ? money(rate.price * nights) : null,
    /** What the family added in the Trip Builder (passes, dining, late check-out). */
    extras: s.cart.map((c) => {
      const e = extraById(c.id)
      return { id: c.id, name: c.label, price: c.price ?? money(c.amount), icon: e?.icon, tone: e?.tone ?? ('lake' as const) }
    }),
    sample: !suite.real || (rate !== null && suite.id !== 'deluxe-queen' && rate.price !== suite.from),
    things,
  }
}

/**
 * Journey 1's weekend plan as the page shows it, read against the trip: what a pass covers says so, the birthday is
 * booked only with a package, dinner names the dining credit, and late check-out moves Sunday's check-out.
 */
export function j1Plan(s: DemoState): PlanItem[] {
  const pass = (id: string) => coveredBy(s, id)
  const birthday = s.cart.map((c) => extraById(c.id)).find((e) => e?.kind === 'birthday')
  const dining = s.cart.map((c) => extraById(c.id)).find((e) => e?.kind === 'dining' && e.id !== 'wolf-wakeup')
  const items = s.plan.map((p): PlanItem => {
    if (p.id === 'magiquest') {
      const by = pass('magiquest')
      if (by) return { ...p, sub: `In your ${by.name}`, status: 'Included' }
      if (hasExtra(s, 'magiquest')) return { ...p, sub: 'Game and wand', status: 'Added' }
      return { ...p, sub: 'In the lodge · not in your trip yet', status: 'Suggested' }
    }
    if (p.id === 'party') return birthday ? { ...p, title: `Mia’s ${birthday.name}`, sub: birthday.blurb.replace(/\.$/, ''), status: 'Booked' } : { ...p, sub: 'Add a birthday package', status: 'Suggested' }
    if (p.id === 'dinner' && dining) return { ...p, sub: `On your ${dining.name}`, status: 'Included' }
    if (p.id === 'checkout' && hasExtra(s, 'late-checkout')) return { ...p, time: '2:00 pm', title: 'Late check-out and head home', status: 'Added' }
    return p
  })
  if (hasExtra(s, 'wolf-wakeup')) {
    items.push({ id: 'breakfast', day: 'sat', time: '8:30', title: 'Wolf Wakeup Breakfast', sub: 'All you can eat', status: 'Added' })
  }
  if (hasExtra(s, 'wolf-pass')) {
    items.push({ id: 'ropes', day: 'sat', time: '3:00 pm', title: 'Howlers Peak Ropes Course', sub: 'In your Wolf Pass · 42in and up', status: 'Included' })
  }
  return withEdits(items, s)
}

const SLOT: Record<string, Pick<PlanItem, 'day' | 'time' | 'sub'>> = {
  zoo: { day: 'sun', time: '9:30', sub: 'Near the lodge · hand-feed giraffes' },
  garden: { day: 'sat', time: '4:00 pm', sub: 'Near the lodge · red rock trails, free' },
  manitou: { day: 'sat', time: '4:00 pm', sub: 'Near the lodge · historic downtown' },
  'wolf-center': { day: 'sun', time: '9:30', sub: 'About an hour away' },
  gorge: { day: 'sat', time: '3:00 pm', sub: 'Better for older kids' },
}

/**
 * Journey 2's weekend, laid out by day from what the family chose: the suite, the Trip Builder extras and the things to
 * do they saved. Times are planned, not reserved. With nothing saved for Sunday, Wiley suggests the zoo.
 */
export function j2Plan(s: DemoState): PlanItem[] {
  const suite = suiteById(s.selected?.suite ?? s.expanded ?? 'pup-den-jr').name
  const pass = s.cart.map((c) => extraById(c.id)).find((e) => e?.kind === 'pass')
  const dining = s.cart.map((c) => extraById(c.id)).find((e) => e?.group === 'credit')
  const breakfast = hasExtra(s, 'wolf-wakeup')
  const items: PlanItem[] = [
    { id: 'checkin', day: 'fri', time: '4:00 pm', title: 'Check in', sub: suite },
    { id: 'cub-paw', day: 'fri', time: '4:30 pm', title: 'Cub Paw Pool', sub: 'Water park · kiddie splash pad', status: 'Included' },
    { id: 'dinner', day: 'fri', time: '6:30 pm', title: 'Dinner at Hungry As A Wolf', sub: dining ? `Pizza and pasta · on your ${dining.name}` : 'Pizza and pasta in the lodge', status: dining ? 'Included' : undefined },
    { id: 'water', day: 'sat', time: '1:00 pm', title: 'Water park afternoon', sub: 'Fort Mackenzie and Whooping Hollow', status: 'Included' },
    { id: 'dance', day: 'sat', time: '7:30 pm', title: 'Family dance party', sub: 'In the lodge · free every night', status: 'Free' },
  ]
  if (breakfast) {
    items.push({ id: 'breakfast-sat', day: 'sat', time: '8:30', title: 'Wolf Wakeup Breakfast', sub: 'All you can eat', status: 'Added' })
    items.push({ id: 'breakfast-sun', day: 'sun', time: '8:00', title: 'Wolf Wakeup Breakfast', sub: 'All you can eat', status: 'Added' })
  }
  if (pass?.id === 'pup-pass') items.push({ id: 'bear', day: 'sat', time: '10:00', title: 'Build-A-Bear Workshop', sub: 'In your Pup Pass', status: 'Included' })
  else if (pass) items.push({ id: 'magiquest', day: 'sat', time: '10:00', title: 'MagiQuest', sub: `In your ${pass.name}`, status: 'Included' })
  const taken = new Set<string>()
  for (const id of s.ideas) {
    const a = activityById(id)
    const slot = SLOT[id]
    if (!a || !slot || taken.has(`${slot.day}${slot.time}`)) continue
    taken.add(`${slot.day}${slot.time}`)
    items.push({ id, title: a.name, ...slot, status: id === 'garden' ? 'Free' : 'Added' })
  }
  if (!items.some((p) => p.day === 'sun' && p.time === '9:30')) {
    items.push({ id: 'zoo', day: 'sun', time: '9:30', title: 'Cheyenne Mountain Zoo', sub: 'Near the lodge · hand-feed giraffes', status: 'Suggested' })
  }
  items.push(
    hasExtra(s, 'late-checkout')
      ? { id: 'checkout', day: 'sun', time: '2:00 pm', title: 'Late check-out and head home', sub: 'One more swim first', status: 'Added' }
      : { id: 'checkout', day: 'sun', time: '11:00', title: 'Check out and head home', sub: 'Water park passes last until closing' },
  )
  return withEdits(items, s)
}

/** Applies the family's own moves on top of the plan built from the trip, then orders it by day and time. */
function withEdits(items: PlanItem[], s: DemoState) {
  return sortPlan(items.map((p) => (s.planEdits[p.id] ? { ...p, ...s.planEdits[p.id], moved: true } : p)))
}

/** Lodge-set times (check-in, check-out) and booked items can't be moved. */
export const isLocked = (p: PlanItem) => p.id === 'checkin' || p.id === 'checkout' || p.status === 'Booked'

/** "10:00", "4:30 pm" → minutes after midnight. */
export function minutesOf(t: string) {
  const [h, m] = t.replace(/ pm$/, '').split(':').map(Number)
  return (t.endsWith('pm') && h !== 12 ? h + 12 : h) * 60 + (m || 0)
}

/** Minutes after midnight → the plan's format: "9:30" in the morning, "4:30 pm" from noon. */
export function timeOf(mins: number) {
  const h = Math.floor(mins / 60)
  const m = String(mins % 60).padStart(2, '0')
  return h >= 12 ? `${h === 12 ? 12 : h - 12}:${m} pm` : `${h}:${m}`
}

/**
 * The time an item gets when dropped between two others in a day: halfway, on the quarter hour; after the last one,
 * 90 minutes later; before the first, an hour earlier. Days run 7:00 to 21:00.
 */
export function slotBetween(prev?: PlanItem, next?: PlanItem) {
  const a = prev && minutesOf(prev.time)
  const b = next && minutesOf(next.time)
  let m = a !== undefined && b !== undefined ? Math.round((a + b) / 2 / 15) * 15 : a !== undefined ? a + 90 : b !== undefined ? b - 60 : 10 * 60
  if (a !== undefined && m <= a) m = a + 15
  return timeOf(Math.min(21 * 60, Math.max(7 * 60, m)))
}

function sortPlan(items: PlanItem[]) {
  const day = { fri: 0, sat: 1, sun: 2 }
  return items.sort((a, b) => day[a.day] - day[b.day] || minutesOf(a.time) - minutesOf(b.time))
}
