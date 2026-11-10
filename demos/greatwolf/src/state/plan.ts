import { activityById, dates, money, rateOf, suiteById } from '~/data/fixtures'
import { art, suitePhotos } from '~/data/photos'
import type { DemoState } from '~/wiley/types'

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
    sample: !suite.real || (rate !== null && suite.id !== 'deluxe-queen' && rate.price !== suite.from),
    things,
  }
}
