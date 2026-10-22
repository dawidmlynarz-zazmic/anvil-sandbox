import type { StageTweaks } from '~/state/types'

/** The parts of a stage spec that change the picture. Kept free of three.js so state and hooks can use it. */
interface KeyedSpec {
  concept: string
  with?: string
  timeOfDay: string
  crowd: string
  view: string
  seed?: number
  tweaks?: StageTweaks
}

const tweakKey = (t?: StageTweaks) =>
  t ? [t.width ?? 1, t.lift ?? 0, t.palette ?? '-', t.haze ?? 0, t.brightness ?? 1].join(',') : ''

/** One key per distinct picture: renders are cached under it, and the renderer waits until the scene shows it. */
export const specKey = (s: KeyedSpec) =>
  `${s.concept}${s.with ? `+${s.with}` : ''}|${s.timeOfDay}|${s.crowd}|${s.view}|${s.seed ?? 1}|${tweakKey(s.tweaks)}`
