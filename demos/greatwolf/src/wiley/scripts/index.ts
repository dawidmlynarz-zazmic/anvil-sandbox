import type { StepScript } from '../types'
import { j1 } from './j1'
import { j2 } from './j2'
import { j3 } from './j3'

export { afterJoinPickRate, afterJoinWithRate } from './j2'

/** Scripts keyed "journey.step", e.g. "1.3". */
export const scripts: Record<string, StepScript> = Object.fromEntries([
  ...Object.entries(j1).map(([k, v]) => [`1.${k}`, v] as const),
  ...Object.entries(j2).map(([k, v]) => [`2.${k}`, v] as const),
  ...Object.entries(j3).map(([k, v]) => [`3.${k}`, v] as const),
])
