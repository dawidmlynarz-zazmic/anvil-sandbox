import { createRoot, extend, type ReconcilerRoot } from '@react-three/fiber'
import * as THREE from 'three'
import { StageScene, type StageSpec } from './StageScene'
import { specKey } from './specKey'

// One hidden WebGL canvas renders every concept still, one at a time, and hands back a JPEG data URL.
// Results are cached in memory for the session (not in sessionStorage: they're ~100 KB each and cheap to redo).

const WIDTH = 1280
const HEIGHT = 720
const cache = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()
let root: ReconcilerRoot<HTMLCanvasElement> | null = null
let canvas: HTMLCanvasElement | null = null
let queue: Promise<unknown> = Promise.resolve()

const tick = () => new Promise((r) => setTimeout(r, 0))

async function getRoot() {
  if (root) return root
  // <Canvas> registers three.js's classes for JSX automatically; a bare createRoot doesn't.
  extend(THREE as unknown as Parameters<typeof extend>[0])
  canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  root = createRoot(canvas)
  await root.configure({
    size: { width: WIDTH, height: HEIGHT, top: 0, left: 0 },
    dpr: 1,
    frameloop: 'never',
    gl: { antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping },
    camera: { fov: 34, near: 0.5, far: 2000 },
  })
  return root
}

async function draw(spec: StageSpec): Promise<string> {
  const r = await getRoot()
  const store = r.render(<StageScene {...spec} />)
  // React commits the scene asynchronously: wait until it's in, then let the instanced crowd place itself.
  const key = specKey(spec)
  for (let i = 0; i < 100; i++) {
    const scene = store.getState().scene
    if (scene.children.length > 5 && scene.userData.spec === key) break
    await new Promise((res) => setTimeout(res, 16))
  }
  await tick()
  // Render a few frames so post-processing settles.
  for (let i = 0; i < 4; i++) {
    store.getState().advance(performance.now())
    await tick()
  }
  return canvas!.toDataURL('image/jpeg', 0.86)
}

export function cachedStill(spec: StageSpec) {
  return cache.get(specKey(spec))
}

/** Renders a still (or returns the cached one). Calls are queued so the shared canvas renders one scene at a time. */
export function renderStill(spec: StageSpec): Promise<string> {
  const key = specKey(spec)
  const hit = cache.get(key)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(key)
  if (pending) return pending
  const job = queue.then(() => draw(spec)).then((url) => {
    cache.set(key, url)
    inflight.delete(key)
    return url
  })
  queue = job.catch(() => undefined)
  inflight.set(key, job)
  return job
}

