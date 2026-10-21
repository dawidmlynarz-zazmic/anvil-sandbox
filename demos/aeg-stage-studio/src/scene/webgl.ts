let supported: boolean | undefined

/** True when the browser can draw the 3D stage. Without WebGL the app shows the 2D fallback art instead. */
export function canRenderWebGL() {
  if (supported === undefined) {
    try {
      const c = document.createElement('canvas')
      supported = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      supported = false
    }
  }
  return supported
}
