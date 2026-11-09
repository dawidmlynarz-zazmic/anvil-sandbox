// Stand-in photography. The demo ships no client images, so each "photo" is drawn here from a seed: a coastline, a
// terrace, a room, a pool or a village. Swap `photo()` for real URLs when the client supplies them.

export type ScenicKind = 'coast' | 'village' | 'terrace' | 'room' | 'pool'

function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${s}% ${l}%)`
const PASTELS = [38, 18, 52, 8, 28, 200]

function houses(r: () => number, hue: number, x0: number, x1: number, base: number, rows: number) {
  let out = ''
  for (let row = 0; row < rows; row++) {
    let x = x0 + r() * 20
    const y = base - row * 46
    while (x < x1) {
      const w = 40 + r() * 38
      const h = 34 + r() * 22
      const c = PASTELS[Math.floor(r() * PASTELS.length)]
      out += `<rect x="${x.toFixed(0)}" y="${(y - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${hsl(c, 55, 78 - row * 3)}"/>`
      out += `<rect x="${(x + w * 0.2).toFixed(0)}" y="${(y - h * 0.7).toFixed(0)}" width="${(w * 0.18).toFixed(0)}" height="${(h * 0.3).toFixed(0)}" fill="${hsl(hue, 30, 30)}" opacity=".55"/>`
      x += w + 3 + r() * 6
    }
  }
  return out
}

function sceneBody(kind: ScenicKind, hue: number, r: () => number) {
  const sea = `<rect y="300" width="800" height="260" fill="url(#sea)"/>`
  const sun = `<circle cx="${560 + r() * 120}" cy="${110 + r() * 40}" r="46" fill="${hsl(40, 95, 88)}" opacity=".9"/>`
  const cliff = `<path d="M0 560V230Q120 180 230 250T400 330L360 560Z" fill="${hsl(hue + 100, 22, 48)}"/><path d="M800 560V300Q690 260 610 330T500 380L540 560Z" fill="${hsl(hue + 100, 20, 42)}"/>`
  if (kind === 'coast') return sun + sea + cliff + houses(r, hue, 30, 330, 330, 3)
  if (kind === 'village') return sun + `<rect width="800" height="560" fill="${hsl(hue + 100, 20, 55)}"/>` + houses(r, hue, 0, 800, 520, 8)
  if (kind === 'terrace')
    return (
      sun + sea + cliff +
      `<rect y="400" width="800" height="160" fill="${hsl(30, 35, 62)}"/><rect x="0" y="380" width="800" height="14" fill="${hsl(30, 30, 42)}"/>` +
      [90, 270, 450, 630].map((x) => `<rect x="${x}" y="150" width="22" height="240" fill="${hsl(30, 25, 90)}"/><path d="M${x - 70} 150Q${x + 11} 60 ${x + 92} 150" fill="none" stroke="${hsl(30, 25, 90)}" stroke-width="18"/>`).join('') +
      `<circle cx="400" cy="470" r="46" fill="${hsl(30, 30, 90)}"/><rect x="392" y="470" width="16" height="60" fill="${hsl(30, 20, 40)}"/>`
    )
  if (kind === 'pool')
    return (
      sun + sea +
      `<rect y="380" width="800" height="180" fill="${hsl(35, 40, 80)}"/><rect x="90" y="410" width="620" height="120" rx="14" fill="${hsl(190, 75, 62)}"/>` +
      [140, 260, 380, 500].map((x) => `<path d="M${x} 450q30 -14 60 0t60 0" stroke="${hsl(190, 80, 85)}" stroke-width="5" fill="none"/>`).join('') +
      [60, 700].map((x) => `<rect x="${x}" y="400" width="60" height="18" rx="6" fill="${hsl(hue, 70, 92)}"/>`).join('')
    )
  return (
    `<rect width="800" height="560" fill="${hsl(35, 40, 90)}"/><rect x="480" y="90" width="260" height="280" fill="url(#sea)"/><rect x="480" y="90" width="260" height="280" fill="none" stroke="${hsl(30, 20, 40)}" stroke-width="14"/>` +
    `<rect x="60" y="300" width="400" height="140" rx="14" fill="${hsl(hue, 45, 72)}"/><rect x="60" y="260" width="400" height="60" rx="14" fill="${hsl(hue, 40, 86)}"/>` +
    `<rect y="470" width="800" height="90" fill="${hsl(30, 30, 70)}"/>`
  )
}

/** A drawn scene as a data URI (so it works as an `<img>` source and in the gallery). */
export function photo(kind: ScenicKind, seed: number, hue = 24): string {
  const r = rng(seed * 97 + kind.length * 13)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(hue + 170, 65, 70)}"/><stop offset="1" stop-color="${hsl(hue, 80, 90)}"/></linearGradient>` +
    `<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(196, 62, 58)}"/><stop offset="1" stop-color="${hsl(206, 70, 38)}"/></linearGradient></defs>` +
    `<rect width="800" height="560" fill="url(#sky)"/>${sceneBody(kind, hue, r)}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
