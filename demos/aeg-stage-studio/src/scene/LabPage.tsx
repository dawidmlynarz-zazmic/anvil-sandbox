import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { StageScene, type Concept, type StageSpec } from './StageScene'
import { useStageImage } from './useStageImage'
import type { TimeOfDay } from '~/state/types'

// Dev-only page for judging the 3D stage renders: /lab?concept=monolith

const TIMES: TimeOfDay[] = ['daylight', 'golden-hour', 'night']

function Snapshot({ spec }: { spec: StageSpec }) {
  const url = useStageImage(spec)
  return url ? <img src={url} alt={spec.concept} className="aspect-video w-full rounded-xl object-cover" /> : <div className="bg-muted aspect-video rounded-xl" />
}

export function LabPage() {
  const concept = (new URLSearchParams(window.location.search).get('concept') ?? 'monolith') as Concept
  const params = new URLSearchParams(window.location.search)
  const view = (params.get('view') ?? 'front-of-house') as never
  const sun = params.get('sun')?.split(',').map(Number) as [number, number, number] | undefined
  const only = params.get('time') as TimeOfDay | null
  if (params.has('snapshots')) {
    const time = (only ?? 'night') as TimeOfDay
    return (
      <main className="bg-background text-foreground grid grid-cols-2 gap-2 p-2">
        {(['arch', 'monolith', 'ribbons', 'halo'] as Concept[]).map((c) => (
          <Snapshot key={c} spec={{ concept: c, timeOfDay: time, crowd: 'full', view, seed: 1 }} />
        ))}
      </main>
    )
  }
  return (
    <main className="bg-background text-foreground flex min-h-svh flex-col gap-4 p-6">
      <h1 className="type-heading-2xl">Stage lab · {concept}</h1>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {TIMES.filter((t) => !only || t === only).map((t) => (
          <figure key={t} className="flex flex-col gap-2">
            <div className="aspect-video overflow-hidden rounded-xl">
              <Canvas
                dpr={[1, 2]}
                gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
                camera={{ fov: 34, near: 0.5, far: 2000 }}
              >
                <Suspense fallback={null}>
                  <StageScene concept={concept} timeOfDay={t} crowd="full" view={view} sunOverride={sun} />
                </Suspense>
              </Canvas>
            </div>
            <figcaption className="text-muted-foreground type-text-xs-normal">{t}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
