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
  const order = (t: string) => {
    const [h, m] = t.replace(/ pm$/, '').split(':').map(Number)
    return (t.endsWith('pm') && h !== 12 ? h + 12 : h) * 60 + (m || 0)
  }
  const day = { fri: 0, sat: 1, sun: 2 }
  return items.sort((a, b) => day[a.day] - day[b.day] || order(a.time) - order(b.time))
}
