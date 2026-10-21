import type { TimeOfDay } from '~/state/types'

// Neutral generated placeholder art (gradients and abstract stage shapes). No real artist or venue imagery.
// Colour here is image content, not UI styling.
const SKY: Record<TimeOfDay, [string, string, string]> = {
  daylight: ['#9ec5f0', '#d6e8fb', '#e9eef4'],
  'golden-hour': ['#3b2a5c', '#e0764a', '#f6c177'],
  night: ['#050818', '#141b4d', '#3a2a7a'],
}

const ACCENTS = ['#f6c177', '#7dd3fc', '#f472b6', '#a3e635', '#c4b5fd', '#fb923c']

function hash(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return Math.abs(h)
}

export type ArtShape = 'arch' | 'monolith' | 'ribbons' | 'halo'

export function stageArt(seed: string, shape: ArtShape, time: TimeOfDay = 'golden-hour', crowd = 1) {
  const h = hash(seed)
  const [a, b, c] = SKY[time]
  const accent = ACCENTS[h % ACCENTS.length]!
  const glow = time === 'daylight' ? 0.15 : 0.55
  const shapes: Record<ArtShape, string> = {
    arch: `<path d="M120 330 V190 Q320 40 520 190 V330" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/><path d="M170 330 V215 Q320 105 470 215 V330" fill="none" stroke="${accent}" stroke-opacity=".5" stroke-width="6"/>`,
    monolith: `<rect x="250" y="70" width="140" height="260" rx="6" fill="#0b0d14" fill-opacity=".85"/><rect x="262" y="82" width="116" height="236" rx="3" fill="${accent}" fill-opacity="${glow}"/>`,
    ribbons: [0, 1, 2, 3, 4]
      .map(
        (i) =>
          `<path d="M60 ${120 + i * 32} C 200 ${40 + i * 30}, 440 ${230 - i * 18}, 580 ${110 + i * 30}" fill="none" stroke="${accent}" stroke-opacity="${0.9 - i * 0.14}" stroke-width="${10 - i}" stroke-linecap="round"/>`,
      )
      .join(''),
    halo: `<circle cx="320" cy="150" r="96" fill="none" stroke="${accent}" stroke-width="16"/><circle cx="320" cy="150" r="124" fill="none" stroke="${accent}" stroke-opacity=".35" stroke-width="5"/><rect x="170" y="318" width="300" height="12" rx="6" fill="#0b0d14" fill-opacity=".7"/>`,
  }
  const dots = Array.from({ length: Math.round(46 * crowd) }, (_, i) => {
    const x = 20 + ((i * 53 + h) % 600)
    const y = 340 + ((i * 29 + h) % 30)
    return `<circle cx="${x}" cy="${y}" r="${5 + (i % 3)}" fill="#05060a" fill-opacity=".8"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/>${shapes[shape]}<rect y="330" width="640" height="70" fill="#07080d" fill-opacity=".9"/>${dots}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** A flat gradient tile for mood-board thumbnails. */
export function moodArt(seed: string) {
  const h = hash(seed)
  const c1 = ACCENTS[h % ACCENTS.length]!
  const c2 = ACCENTS[(h >> 3) % ACCENTS.length]!
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Which stage shape a concept letter draws (A–D), so other views of a concept look like the same concept. */
export const shapeFor = (letter: string): ArtShape => ({ A: 'arch', B: 'monolith', C: 'ribbons', D: 'halo' })[letter] as ArtShape ?? 'monolith'
