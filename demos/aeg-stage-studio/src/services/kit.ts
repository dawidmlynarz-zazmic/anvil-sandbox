import { TIME_LABEL, VIEW_LABEL, type Asset, type Brief, type Generation, type StageView, type TimeOfDay } from '~/state/types'
import { clipFor, MOVE_TITLE } from './generation'
import { momentLight } from './light'
import { lowerFirst } from './shapes'

// Mocked asset kits. From a moment's look, the agent makes what production and content teams build from: the look from
// the other camera positions, in the other light states, and in motion with the other camera moves. Everything here is
// rendered for real by the preview; what it can't render (LED wall loops, performer stand-ins) is listed as coming with
// the pilot models, never faked.

export type PlannedAsset = Omit<Asset, 'id' | 'at'>

/** What the kit holds, in order: angles, light states, motion variants. */
export function planKit(look: Generation, song: number, moments: number, brief: Brief, covered: boolean, mainMove: number): PlannedAsset[] {
  const of = `#${look.n} (${lowerFirst(look.title)}, ${look.caption.toLowerCase()})`
  const views = (Object.keys(VIEW_LABEL) as StageView[]).filter((v) => v !== look.spec.view)
  const angles: PlannedAsset[] = views.map((view) => ({
    kind: 'angle',
    title: VIEW_LABEL[view],
    spec: { ...look.spec, view },
    model: 'Nano Banana Pro',
    prompt: `${of}, seen from ${VIEW_LABEL[view].toLowerCase()}. Keep the design, light and crowd exactly the same.`,
  }))
  const t = look.spec.tweaks ?? {}
  const light = momentLight(brief, song, moments)
  const lights: PlannedAsset[] = covered
    ? [
        { title: 'Dimmed (house lights down)', tweaks: { ...t, brightness: 0.6 } },
        { title: 'Full intensity', tweaks: { ...t, brightness: 1.5 } },
        { title: 'Haze heavy', tweaks: { ...t, haze: Math.min(1, (t.haze ?? 0) + 0.6) } },
      ].map((x) => ({
        kind: 'light' as const,
        title: x.title,
        spec: { ...look.spec, tweaks: x.tweaks },
        model: 'Nano Banana Pro',
        prompt: `${of}, lighting state: ${x.title.toLowerCase()}. Keep the design and camera the same.`,
      }))
    : (['daylight', 'golden-hour', 'night'] as TimeOfDay[])
        .filter((time) => time !== light)
        .map((time) => ({
          kind: 'light' as const,
          title: TIME_LABEL[time],
          spec: { ...look.spec, timeOfDay: time },
          model: 'Nano Banana Pro',
          prompt: `${of}, at ${TIME_LABEL[time].toLowerCase()}, for a slot that runs late or early. Keep the design and camera the same.`,
        }))
  const motion: PlannedAsset[] = [0, 1, 2]
    .filter((m) => m !== mainMove)
    .map((move) => ({
      kind: 'motion',
      title: MOVE_TITLE[move]!,
      clip: { ...clipFor(look, song, 1, [], move), title: MOVE_TITLE[move]! },
      model: 'Veo 3.1',
      prompt: `${of} in motion for song ${song}: ${MOVE_TITLE[move]!.toLowerCase()}, 8 seconds, 16:9, no strobe above 3 Hz.`,
    }))
  return [...angles, ...lights, ...motion]
}

/** What the pilot adds to every kit that this preview can't render. */
export const PILOT_ONLY = [
  { title: 'LED wall loop', detail: 'The wall content on its own, as a seamless loop for the media server (Veo 3.1).' },
  { title: 'Performer stand-ins', detail: 'The look with stand-ins for the artist and dancers, for blocking and camera plans (Nano Banana Pro).' },
]

export const KIT_LABEL: Record<Asset['kind'], string> = { angle: 'Angles', light: 'Light states', motion: 'Motion variants' }
