import { useEffect, useState } from 'react'
import type { StageSpec } from './StageScene'
import { specKey } from './specKey'
import { canRenderWebGL } from './webgl'

type Renderer = typeof import('./renderStill')

// Kept once loaded, so cached renders can be read synchronously on the first paint (no flash when switching steps).
let renderer: Renderer | undefined
const loadRenderer = () => import('./renderStill').then((m) => (renderer = m))

/** Starts loading the renderer early, so the first stills don't wait for three.js to download. */
export function preloadStageRenderer() {
  if (canRenderWebGL()) void loadRenderer()
}

/**
 * The 3D render of a stage, or undefined while it renders. The renderer is loaded on first use, so three.js stays out
 * of the initial bundle.
 */
export function useStageImage(spec: StageSpec | undefined) {
  const key = spec ? specKey(spec) : ''
  const cached = spec ? renderer?.cachedStill(spec) : undefined
  const [rendered, setRendered] = useState<{ key: string; url: string }>()
  useEffect(() => {
    if (!spec || cached || !canRenderWebGL()) return
    let live = true
    void loadRenderer()
      .then((m) => m.renderStill(spec))
      .then((url) => {
        if (live) setRendered({ key, url })
      })
    return () => {
      live = false
    }
    // The key captures everything that changes the render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return cached ?? (rendered?.key === key ? rendered.url : undefined)
}
