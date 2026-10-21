import { useEffect, useState } from 'react'
import type { StageSpec } from './StageScene'

/**
 * The 3D render of a stage, or undefined while it renders (show the fallback meanwhile). The renderer is loaded
 * on first use, so three.js stays out of the initial bundle.
 */
export function useStageImage(spec: StageSpec | undefined) {
  const key = spec ? `${spec.concept}|${spec.timeOfDay}|${spec.crowd}|${spec.view}|${spec.seed ?? 1}` : ''
  const [url, setUrl] = useState<string | undefined>()
  useEffect(() => {
    if (!spec) return
    let live = true
    void import('./renderStill').then(async (m) => {
      const cached = m.cachedStill(spec)
      if (cached) {
        if (live) setUrl(cached)
        return
      }
      setUrl(undefined)
      if (!m.canRender()) return
      const next = await m.renderStill(spec)
      if (live) setUrl(next)
    })
    return () => {
      live = false
    }
    // The key captures everything that changes the render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return url
}
