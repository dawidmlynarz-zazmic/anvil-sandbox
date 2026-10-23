import type { ConceptShape, Generation, ReviewComment, SetlistMoment } from '~/state/types'

// Example feedback the artist leaves on the show. It depends on each look's shape, so the comments make sense for
// what's on screen. Comments on a look are about the look (light, haze, colour), which the set allows to change. A real build would load the artist's actual comments.
const ON_LOOK: Record<ConceptShape, { x: number; y: number; text: string }> = {
  arch: { x: 27, y: 36, text: 'Love the arch. Can it glow warmer here, more amber?' },
  monolith: { x: 50, y: 30, text: 'The monolith is right. The screen inside should glow warmer.' },
  ribbons: { x: 30, y: 40, text: 'The ribbons feel busy here. Softer light, fewer colours.' },
  halo: { x: 50, y: 25, text: 'The halo needs more haze around it, it looks too clean.' },
}

const ON_LOOK_LIGHT = { x: 62, y: 56, text: 'This moment should feel bigger. Brighter, more haze.' }

type Out = Omit<ReviewComment, 'number'>

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/**
 * The artist's reply to a show: one comment on the first moment's look, one on the biggest moment's look, and one on
 * that moment's clip (unless you already reworked the clip, then a reaction to the edit).
 */
export function artistFeedback(looks: { moment: SetlistMoment; look: Generation }[], editedSongs: number[] = []): Out[] {
  if (!looks.length) return []
  const time = now()
  const first = looks[0]!
  const big = looks.find((l) => /split|drop|encore|title/i.test(l.moment.title)) ?? looks.at(-1)!
  const out: Out[] = [
    { id: `c-${first.look.id}`, song: first.moment.number, genId: first.look.id, target: { kind: 'look', x: ON_LOOK[first.look.spec.concept].x, y: ON_LOOK[first.look.spec.concept].y }, author: 'Artist', time, text: ON_LOOK[first.look.spec.concept].text, resolved: false },
  ]
  if (big !== first) out.push({ id: `c-${big.look.id}`, song: big.moment.number, genId: big.look.id, target: { kind: 'look', x: ON_LOOK_LIGHT.x, y: ON_LOOK_LIGHT.y }, author: 'Artist', time, text: ON_LOOK_LIGHT.text, resolved: false })
  out.push({
    id: `m-${big.look.id}`,
    song: big.moment.number,
    genId: big.look.id,
    target: { kind: 'clip' },
    author: 'Artist',
    time,
    text: editedSongs.includes(big.moment.number) ? `${big.moment.title}: the pacing works now. Keep this one.` : `${big.moment.title}: the clip feels rushed. Hold the opening for two more beats before it moves.`,
    resolved: false,
  })
  return out
}

/** The artist's reply to new looks that took their comments on: one note per reworked moment, already resolved. */
export function artistPraise(looks: { moment: SetlistMoment; look: Generation }[]): Out[] {
  const time = now()
  return looks.map(({ moment, look }) => ({
    id: `ok-${look.id}`,
    song: moment.number,
    genId: look.id,
    target: { kind: 'look', x: 50, y: 45 },
    author: 'Artist',
    time,
    text: `${moment.title}: much closer. My note landed.`,
    resolved: true,
  }))
}
