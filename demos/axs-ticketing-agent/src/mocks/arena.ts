/** The sample bowl every show uses: section shapes in a 320 × 250 box. Ids match the sections `axsTools` sells. */
export interface ArenaSection {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  tier: 'floor' | 'lower' | 'upper'
}

export const ARENA: ArenaSection[] = [
  { id: 'floor-a', label: 'Floor A', x: 100, y: 42, width: 120, height: 42, tier: 'floor' },
  { id: 'floor-b', label: 'Floor B', x: 100, y: 88, width: 120, height: 42, tier: 'floor' },
  { id: 'lower-112', label: '112', x: 40, y: 42, width: 54, height: 88, tier: 'lower' },
  { id: 'lower-118', label: '118', x: 226, y: 42, width: 54, height: 88, tier: 'lower' },
  { id: 'lower-114', label: '114', x: 100, y: 136, width: 120, height: 34, tier: 'lower' },
  { id: 'upper-402', label: '402', x: 70, y: 180, width: 180, height: 40, tier: 'upper' },
  { id: 'upper-418', label: '418', x: 8, y: 180, width: 56, height: 40, tier: 'upper' },
  { id: 'upper-406', label: '406', x: 256, y: 180, width: 56, height: 40, tier: 'upper' },
]
