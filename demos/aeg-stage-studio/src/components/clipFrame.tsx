import { lazy, Suspense } from 'react'
import { useStageImage } from '~/scene/useStageImage'
import { canRenderWebGL } from '~/scene/webgl'
import { compareLight, momentLight } from '~/services/light'
import type { Brief, MotionClip, Still, TimeOfDay } from '~/state/types'

const LiveStage = lazy(() => import('~/scene/LiveStage'))

const LABEL: Record<TimeOfDay, string> = { daylight: 'Daylight', 'golden-hour': 'Golden hour', night: 'Night' }

/**
 * How a clip is drawn live: the concept's 3D stage in the light its song plays in (from the brief's time slot;
 * covered venues are always night), with the camera move from its cue. A plain-words edit slows it.
 */
export function clipFrame(still: Still | undefined, clip: MotionClip | undefined, brief: Brief) {
  if (!still?.spec || !clip || !canRenderWebGL()) return undefined
  const spec = still.spec
  const main = momentLight(brief, clip.momentNumber)
  const other = compareLight(brief, main)
  const cue = clip.momentNumber % 3
  const pace = clip.edits.length ? 0.7 : 1
  return {
    labels: [LABEL[main], LABEL[other ?? main]] as [string, string],
    /** What "compare" switches to, or undefined under a roof, where there is no daylight to compare. */
    other: other && LABEL[other],
    render: (t: number, variant: 'main' | 'compare') => (
      <Suspense fallback={null}>
        <LiveStage spec={{ ...spec, timeOfDay: variant === 'main' || !other ? main : other }} t={t} cue={cue} pace={pace} />
      </Suspense>
    ),
  }
}

/** A key moment's thumbnail: the concept's 3D still in that song's light (undefined while it renders), or the clip's 2D poster without WebGL. */
// eslint-disable-next-line react-refresh/only-export-components
export function useMomentThumb(still: Still | undefined, brief: Brief, song: number, fallback?: string) {
  const spec = still?.spec ? { ...still.spec, timeOfDay: momentLight(brief, song) } : undefined
  const rendered = useStageImage(spec)
  return rendered ?? (spec && canRenderWebGL() ? undefined : fallback)
}
