import { lazy, Suspense } from 'react'
import { useStageImage } from '~/scene/useStageImage'
import { canRenderWebGL } from '~/scene/webgl'
import { compareLight, momentLight } from '~/services/light'
import { moveOf } from '~/services/generation'
import type { Brief, MotionClip, TimeOfDay } from '~/state/types'
import type { Pictured } from './StillImage'

const LiveStage = lazy(() => import('~/scene/LiveStage'))

const LABEL: Record<TimeOfDay, string> = { daylight: 'Daylight', 'golden-hour': 'Golden hour', night: 'Night' }

/**
 * How a clip is drawn live: the look's 3D stage in the light its song plays in (from the brief's time slot; covered
 * venues are always night), with the camera move from its cue. A plain-words edit slows it.
 */
export function clipFrame(look: Pictured | undefined, clip: MotionClip | undefined, brief: Brief, of: number) {
  if (!look || !clip || !canRenderWebGL()) return undefined
  const spec = look.spec
  const main = momentLight(brief, clip.momentNumber, of)
  const other = compareLight(brief, main)
  const cue = moveOf(clip)
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

/** A key moment's thumbnail (moment `song` of `of`): the look's 3D still in that moment's light (undefined while it renders), or 2D art without WebGL. */
// eslint-disable-next-line react-refresh/only-export-components
export function useMomentThumb(look: Pictured | undefined, brief: Brief, song: number, of: number, fallback?: string) {
  const spec = look ? { ...look.spec, timeOfDay: momentLight(brief, song, of) } : undefined
  const rendered = useStageImage(spec)
  return rendered ?? (spec && canRenderWebGL() ? undefined : (fallback ?? look?.image))
}
