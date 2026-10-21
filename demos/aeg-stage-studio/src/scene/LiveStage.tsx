import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { StageScene, type StageSpec } from './StageScene'

/** A live render of the stage for the Motion player: the scene animates as the clip's time changes. */
export default function LiveStage({ spec, t, cue, pace }: { spec: StageSpec; t: number; cue: number; pace: number }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ fov: 34, near: 0.5, far: 2000 }}
      className="absolute! inset-0"
    >
      <StageScene {...spec} motion={{ t, cue, pace }} />
    </Canvas>
  )
}
