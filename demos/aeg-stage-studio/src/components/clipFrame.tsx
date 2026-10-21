import { lazy, Suspense } from 'react'
import { useStageImage } from '~/scene/useStageImage'
import { canRenderWebGL } from '~/scene/webgl'
import type { MotionClip, Still, TimeOfDay } from '~/state/types'

const LiveStage = lazy(() => import('~/scene/LiveStage'))

/** The light a key moment plays in: outdoors the first half at golden hour and the rest at night; indoors always night. */
export const momentTime = (momentIndex: number, moments: number, indoor = false): TimeOfDay =>
  indoor || momentIndex >= moments / 2 ? 'night' : 'golden-hour'

const LABEL: Record<TimeOfDay, string> = { daylight: 'Daylight', 'golden-hour': 'Golden hour', night: 'Night' }

/**
 * How a clip is drawn live: the concept's 3D stage at the light its song plays in (outdoors the first half of the
 * key moments at golden hour, the rest at night; indoors always night), with the camera move from its cue. A
 * plain-words edit slows it.
 */
export function clipFrame(still: Still | undefined, clip: MotionClip | undefined, momentIndex: number, moments: number, indoor = false) {
  if (!still?.spec || !clip || !canRenderWebGL()) return undefined
  const spec = still.spec
  // Indoor arenas are always dark; outdoors the set moves from golden hour into night.
  const main = momentTime(momentIndex, moments, indoor)
  const other: TimeOfDay = main === 'night' ? 'golden-hour' : 'night'
  const cue = clip.momentNumber % 3
  const pace = clip.edits.length ? 0.7 : 1
  return {
    labels: [LABEL[main], LABEL[other]] as [string, string],
    /** What "compare" switches to, or undefined indoors where there is no daylight to compare. */
    other: indoor ? undefined : LABEL[other],
    render: (t: number, variant: 'main' | 'compare') => (
      <Suspense fallback={null}>
        <LiveStage spec={{ ...spec, timeOfDay: variant === 'main' ? main : other }} t={t} cue={cue} pace={pace} />
      </Suspense>
    ),
  }
}

/** A key moment's thumbnail: the concept's 3D still in that song's light (undefined while it renders), or the clip's 2D poster without WebGL. */
// eslint-disable-next-line react-refresh/only-export-components
export function useMomentThumb(still: Still | undefined, momentIndex: number, moments: number, indoor: boolean, fallback?: string) {
  const spec = still?.spec ? { ...still.spec, timeOfDay: momentTime(momentIndex, moments, indoor) } : undefined
  const rendered = useStageImage(spec)
  return rendered ?? (spec && canRenderWebGL() ? undefined : fallback)
}
