import { shapeFor, type ArtShape } from '~/mocks/art'
import type { ReviewComment, SetlistMoment, Still } from '~/state/types'

// Example feedback the artist leaves on what was sent. It depends on the concept's shape, so each concept
// gets comments that make sense for it. A real build would load the artist's actual comments.
const ON_CONCEPT: Record<ArtShape, { x: number; y: number; text: string }[]> = {
  arch: [
    { x: 27, y: 36, text: 'Love the height. Can the left side of the arch feel a little lighter?' },
    { x: 62, y: 56, text: 'From front of house this edge blocks the sightline. Could the LED wall sit higher?' },
  ],
  monolith: [
    { x: 50, y: 30, text: 'The monolith is the right idea. Make the top edge sharper, less boxy.' },
    { x: 50, y: 70, text: 'Can the screen inside glow warmer during golden hour?' },
  ],
  ribbons: [
    { x: 30, y: 40, text: 'The ribbons feel busy. Try three instead of five.' },
    { x: 75, y: 55, text: 'Keep this curve, it matches the chorus.' },
  ],
  halo: [
    { x: 50, y: 25, text: 'The halo should sit higher so it reads from the back of the field.' },
    { x: 35, y: 80, text: 'Hide the riser under the halo, it distracts.' },
  ],
}

export function artistFeedback(concepts: Still[], moments: SetlistMoment[], clipSongs: number[]): Omit<ReviewComment, 'number'>[] {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const comments: Omit<ReviewComment, 'number'>[] = []
  concepts.forEach((still, i) => {
    // The concept's real type: a planned round can put any type in any slot.
    ON_CONCEPT[still.spec?.concept ?? shapeFor(still.concept)].forEach((c, j) =>
      comments.push({
        id: `${still.id}-c${j}`,
        stillId: still.id,
        target: { kind: 'concept', x: c.x, y: c.y },
        author: 'Artist',
        time,
        text: c.text,
        resolved: false,
      }),
    )
    // One comment on motion for the first concept, on its biggest moment if it has a clip.
    const song = clipSongs.includes(14) ? 14 : clipSongs[0]
    if (i === 0 && song) {
      const title = moments.find((m) => m.number === song)?.title ?? `song ${song}`
      comments.push({
        id: `${still.id}-m${song}`,
        stillId: still.id,
        target: { kind: 'clip', song },
        author: 'Artist',
        time,
        text: `${title}: it feels rushed. Hold the opening for two more beats before it moves.`,
        resolved: false,
      })
    }
  })
  return comments
}

/**
 * The artist's reply to a new design that took their earlier comments on: one note per concept, saying it's
 * resolved. Marked resolved, so it doesn't count as something left to do.
 */
export function artistPraise(concepts: Still[], addressed: number): Omit<ReviewComment, 'number'>[] {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return concepts.map((still) => ({
    id: `${still.id}-ok`,
    stillId: still.id,
    target: { kind: 'concept', x: 50, y: 45 },
    author: 'Artist',
    time,
    text: `Much closer. ${addressed > 1 ? `All ${addressed} of my notes` : 'My note'} landed. This is the one.`,
    resolved: true,
  }))
}
