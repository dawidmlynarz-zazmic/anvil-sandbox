import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { SpotLight, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import type { Crowd, StageView, TimeOfDay } from '~/state/types'

// A small, fully procedural festival stage. Scene content, not UI: colours here describe light and materials.

export type Concept = 'arch' | 'monolith' | 'ribbons' | 'halo'

export interface StageSpec {
  concept: Concept
  timeOfDay: TimeOfDay
  crowd: Crowd
  view: StageView
  /** Seeds small variations between rounds. */
  seed?: number
  /** Lab only: override the sun position. */
  sunOverride?: [number, number, number]
  /** Post-processing (bloom, grain, vignette, tone mapping). On by default. */
  postFx?: boolean
  /** Motion: the clip's position in seconds, which camera move (0 crane up · 1 push-in · 2 locked wide) and its pace. */
  motion?: { t: number; cue: number; pace: number }
}

interface Look {
  sky: 'day' | 'golden' | 'night'
  /** Sky gradient: zenith, horizon, and the glow around the sun. */
  skyTop: string
  skyHorizon: string
  sunGlow: string
  glowSize: number
  sun: [number, number, number]
  fog: string
  fogNear: number
  fogFar: number
  hemi: number
  hemiSky: string
  hemiGround: string
  sunLight: number
  sunColor: string
  ground: string
  led: number
  beams: number
  beamColors: [string, string]
  phones: boolean
  exposure: number
}

const LOOKS: Record<TimeOfDay, Look> = {
  daylight: {
    sky: 'day',
    skyTop: '#3d7fd1',
    skyHorizon: '#cfe2f3',
    sunGlow: '#fff6e0',
    glowSize: 0.15,
    sun: [250, 700, 450],
    fog: '#b9cce0',
    fogNear: 160,
    fogFar: 900,
    hemi: 1.8,
    hemiSky: '#dfe9f5',
    hemiGround: '#6b5a44',
    sunLight: 4,
    sunColor: '#fff4e0',
    ground: '#7a6a4f',
    led: 0.75,
    beams: 0,
    beamColors: ['#ffffff', '#ffffff'],
    phones: false,
    exposure: 1.1,
  },
  'golden-hour': {
    sky: 'golden',
    skyTop: '#4a4f86',
    skyHorizon: '#ff9a52',
    sunGlow: '#ffd27a',
    glowSize: 0.6,
    sun: [-110, 3, -300],
    fog: '#b9744e',
    fogNear: 120,
    fogFar: 620,
    hemi: 1.1,
    hemiSky: '#ff9a5c',
    hemiGround: '#2e1f17',
    sunLight: 4,
    sunColor: '#ff8a3d',
    ground: '#4f3a2a',
    led: 1.1,
    beams: 0.45,
    beamColors: ['#ffc27a', '#ff7a59'],
    phones: false,
    exposure: 0.8,
  },
  night: {
    sky: 'night',
    skyTop: '#03040b',
    skyHorizon: '#121838',
    sunGlow: '#000000',
    glowSize: 0,
    sun: [0, -10, -100],
    fog: '#0b0f22',
    fogNear: 40,
    fogFar: 240,
    hemi: 0.2,
    hemiSky: '#2a3570',
    hemiGround: '#05060b',
    sunLight: 0.25,
    sunColor: '#8fa6ff',
    ground: '#17171d',
    led: 2.2,
    beams: 1,
    beamColors: ['#ff4fd8', '#4fd6ff'],
    phones: true,
    exposure: 1,
  },
}

const VIEWS: Record<StageView, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  'front-of-house': { position: [0, 9, 72], target: [0, 11, -4], fov: 30 },
  'back-of-field': { position: [14, 13, 140], target: [0, 12, -4], fov: 24 },
  'livestream-cam': { position: [-17, 2.2, 12], target: [0, 14, -6], fov: 50 },
}

/** Deterministic pseudo-random numbers, so a concept looks the same every time it's rendered. */
function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** The LED wall content: a setting sun over gradient bands, painted once into a texture. */
function useLedTexture(time: TimeOfDay) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 512
    const g = c.getContext('2d')!
    const sky = g.createLinearGradient(0, 0, 0, 512)
    if (time === 'night') {
      sky.addColorStop(0, '#2b0a5a')
      sky.addColorStop(0.55, '#c0127e')
      sky.addColorStop(1, '#ff6a3d')
    } else {
      sky.addColorStop(0, '#ff8a3d')
      sky.addColorStop(0.6, '#ffc76b')
      sky.addColorStop(1, '#fff1c9')
    }
    g.fillStyle = sky
    g.fillRect(0, 0, 256, 512)
    g.fillStyle = time === 'night' ? '#ffd1a1' : '#fffaf0'
    g.beginPath()
    g.arc(128, 330, 70, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(0,0,0,0.25)'
    for (let y = 300; y < 512; y += 18) g.fillRect(0, y, 256, 6)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [time])
}

/** A large dome: a vertical gradient from horizon to zenith plus a soft glow towards the sun. Ignores fog. */
function GradientSky({ top, horizon, glow, glowSize, sun }: { top: string; horizon: string; glow: string; glowSize: number; sun: [number, number, number] }) {
  const uniforms = useMemo(
    () => ({
      top: { value: new THREE.Color(top) },
      horizon: { value: new THREE.Color(horizon) },
      glow: { value: new THREE.Color(glow) },
      glowSize: { value: glowSize },
      sunDir: { value: new THREE.Vector3(...sun).normalize() },
    }),
    [top, horizon, glow, glowSize, sun],
  )
  return (
    <mesh scale={1200} renderOrder={-1}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={`varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; uniform float glowSize; uniform vec3 sunDir; varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, 0.0, 1.0);
            vec3 col = mix(horizon, top, pow(h, 0.45));
            float s = max(dot(normalize(vDir), sunDir), 0.0);
            col += glow * (pow(s, 6.0) * glowSize + pow(s, 400.0) * 2.0 * step(0.01, glowSize));
            gl_FragColor = vec4(col, 1.0);
          }`}
      />
    </mesh>
  )
}

function Ground({ color }: { color: string }) {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[900, 900]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  )
}

/** Deck, wings and the two truss towers that every concept shares. */
function StageShell({ lamps }: { lamps: number }) {
  const steel = <meshStandardMaterial color="#2a2c33" metalness={0.8} roughness={0.35} />
  const truss = (x: number) => (
    <group position={[x, 0, -2]}>
      {[-0.8, 0.8].map((dx) =>
        [-0.8, 0.8].map((dz) => (
          <mesh key={`${dx}${dz}`} position={[dx, 11, dz]} castShadow>
            <boxGeometry args={[0.18, 22, 0.18]} />
            {steel}
          </mesh>
        )),
      )}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[0, 1 + i * 2, 0]}>
          <boxGeometry args={[1.8, 0.12, 1.8]} />
          {steel}
        </mesh>
      ))}
      {[6, 10, 14, 18].map((y) => (
        <mesh key={y} position={[x > 0 ? -1.1 : 1.1, y, 1]} rotation-y={x > 0 ? -0.5 : 0.5}>
          <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          <meshStandardMaterial color="#222" emissive="#fff2dd" emissiveIntensity={lamps * 3} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
  return (
    <group>
      <mesh position={[0, 1, -6]} castShadow receiveShadow>
        <boxGeometry args={[44, 2, 18]} />
        <meshStandardMaterial color="#17181c" roughness={0.6} />
      </mesh>
      {truss(-20)}
      {truss(20)}
      {/* LED strip along the deck's front edge */}
      <mesh position={[0, 2.05, 3.02]}>
        <boxGeometry args={[44, 0.18, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffd9b0" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh position={[0, 22.4, -2]}>
        <boxGeometry args={[42, 1.2, 1.4]} />
        {steel}
      </mesh>
    </group>
  )
}

function Monolith({ led, time, seed }: { led: number; time: TimeOfDay; seed: number }) {
  const tex = useLedTexture(time)
  const r = rng(seed)
  const width = 9 + r() * 2
  return (
    <group position={[0, 2, -8]}>
      <mesh position={[0, 12, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 2, 24, 3]} />
        <meshStandardMaterial color="#1b1a1f" roughness={0.92} metalness={0.05} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 + 1.02), 12, 1.52]}>
          <boxGeometry args={[0.12, 24, 0.05]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffd7b0" emissiveIntensity={led * 0.5} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 12, 1.52]}>
        <planeGeometry args={[width, 22]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={led} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Arch({ led }: { led: number }) {
  return (
    <group position={[0, 2, -8]}>
      <mesh position={[0, 0, 0]} castShadow>
        <torusGeometry args={[14, 1.1, 24, 96, Math.PI]} />
        <meshStandardMaterial color="#d8cfc0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 1.2]}>
        <torusGeometry args={[12.4, 0.25, 12, 96, Math.PI]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffb35c" emissiveIntensity={led} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Ribbons({ led, beamColors }: { led: number; beamColors: [string, string] }) {
  const curves = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const y = 6 + i * 3
        return new THREE.CatmullRomCurve3([
          new THREE.Vector3(-18, y, -8),
          new THREE.Vector3(-8, y + 3 - i, -6),
          new THREE.Vector3(4, y - 2 + i * 0.6, -9),
          new THREE.Vector3(18, y + 1, -7),
        ])
      }),
    [],
  )
  return (
    <group position={[0, 2, 0]}>
      {curves.map((c, i) => (
        <mesh key={i}>
          <tubeGeometry args={[c, 128, 0.5 - i * 0.05, 16, false]} />
          <meshStandardMaterial color={beamColors[i % 2]} emissive={beamColors[i % 2]} emissiveIntensity={led * (1 - i * 0.12)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function Halo({ led }: { led: number }) {
  return (
    <group position={[0, 16, -8]}>
      <mesh>
        <torusGeometry args={[8, 0.7, 24, 128]} />
        <meshStandardMaterial color="#ffd38a" emissive="#ffb347" emissiveIntensity={led} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[10.2, 0.12, 12, 128]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffe2b0" emissiveIntensity={led * 0.6} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** The audience as instanced silhouettes, with phone screens lit at night. */
function Audience({ count, phones, seed }: { count: number; phones: boolean; seed: number }) {
  const people = useRef<THREE.InstancedMesh>(null)
  const lights = useRef<THREE.InstancedMesh>(null)
  const placed = useMemo(() => {
    const r = rng(seed + 7)
    return Array.from({ length: count }, () => {
      const z = 6 + Math.pow(r(), 1.35) * 58
      const spread = 16 + z * 0.5
      return { x: (r() * 2 - 1) * spread, z, h: 1.55 + r() * 0.3, phone: r() < 0.12 }
    })
  }, [count, seed])

  useMemo(() => {
    queueMicrotask(() => {
      const m = new THREE.Matrix4()
      placed.forEach((p, i) => {
        m.makeScale(1, p.h / 1.7, 1).setPosition(p.x, p.h / 2, p.z)
        people.current?.setMatrixAt(i, m)
      })
      if (people.current) people.current.instanceMatrix.needsUpdate = true
      let j = 0
      placed.forEach((p) => {
        if (!p.phone || !lights.current) return
        m.makeScale(1, 1, 1).setPosition(p.x + 0.15, p.h + 0.35, p.z - 0.2)
        lights.current.setMatrixAt(j++, m)
      })
      if (lights.current) {
        lights.current.count = j
        lights.current.instanceMatrix.needsUpdate = true
      }
    })
  }, [placed])

  return (
    <group>
      <instancedMesh ref={people} args={[undefined, undefined, count]} castShadow>
        <capsuleGeometry args={[0.22, 1.15, 3, 6]} />
        <meshStandardMaterial color="#07070a" roughness={1} />
      </instancedMesh>
      {phones && (
        <instancedMesh ref={lights} args={[undefined, undefined, count]}>
          <boxGeometry args={[0.07, 0.12, 0.02]} />
          <meshStandardMaterial color="#ffffff" emissive="#dfe8ff" emissiveIntensity={4} toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  )
}

/** Volumetric beams from the truss towers and the roof, aimed into the haze over the stage. */
function Beams({ strength, colors, sweep = 0 }: { strength: number; colors: [string, string]; sweep?: number }) {
  if (!strength) return null
  // A fan of beams along the roof truss plus two from each tower, aimed up and out over the crowd.
  const rigs: { pos: [number, number, number]; target: [number, number, number]; color: string }[] = [
    ...[-15, -9, -3, 3, 9, 15].map((x, i) => ({
      pos: [x, 22.4, -2] as [number, number, number],
      target: [x * 2.6 + (i % 2 ? sweep : -sweep), 46, 34] as [number, number, number],
      color: colors[i % 2]!,
    })),
    { pos: [-20, 20, -2], target: [-36, 4, 40], color: colors[1] },
    { pos: [20, 20, -2], target: [36, 4, 40], color: colors[0] },
  ]
  return (
    <>
      {rigs.map((b, i) => (
        <BeamLight key={i} {...b} strength={strength} />
      ))}
    </>
  )
}

function BeamLight({ pos, target, color, strength }: { pos: [number, number, number]; target: [number, number, number]; color: string; strength: number }) {
  const ref = useRef<THREE.SpotLight>(null)
  const { scene } = useThree()
  const t = useMemo(() => {
    const o = new THREE.Object3D()
    scene.add(o)
    return o
  }, [scene])
  t.position.set(...target)
  useFrame(() => {
    if (ref.current) ref.current.target = t
  })
  return (
    <SpotLight
      ref={ref}
      position={pos}
      color={color}
      intensity={400 * strength}
      distance={110}
      angle={0.24}
      attenuation={90}
      anglePower={3}
      radiusTop={0.4}
      radiusBottom={9}
      opacity={0.45 * strength}
      volumetric
    />
  )
}

type Shot = { from: [number, number, number]; to: [number, number, number]; target: [number, number, number]; fov: number }

/** The three camera moves a clip can use, matching the cue sheet: crane up, slow push-in, locked wide. */
const MOVES: Shot[] = [
  { from: [0, 2.5, 26], to: [0, 18, 46], target: [0, 12, -6], fov: 40 },
  { from: [0, 9, 78], to: [0, 7, 34], target: [0, 12, -6], fov: 32 },
  { from: [0, 10, 92], to: [0, 10, 92], target: [0, 11, -4], fov: 30 },
]

const ease = (u: number) => u * u * (3 - 2 * u)

/** Aims the camera: a fixed view for stills, or a move over the clip's eight seconds for motion. */
function Rig({ view, motion }: { view: StageView; motion?: StageSpec['motion'] }) {
  const { camera } = useThree()
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (motion) {
      const shot = MOVES[motion.cue % MOVES.length]!
      const u = ease(Math.min(1, Math.max(0, (motion.t * motion.pace) / 8)))
      cam.position.set(...(shot.from.map((a, i) => a + (shot.to[i]! - a) * u) as [number, number, number]))
      cam.fov = shot.fov
      cam.lookAt(...shot.target)
    } else {
      const v = VIEWS[view]
      cam.position.set(...v.position)
      cam.fov = v.fov
      cam.lookAt(...v.target)
    }
    cam.updateProjectionMatrix()
  }, [camera, view, motion])
  return null
}

export function StageScene({ concept, timeOfDay, crowd, view, seed = 1, sunOverride, postFx = true, motion }: StageSpec) {
  const base = sunOverride ? { ...LOOKS[timeOfDay], sun: sunOverride } : LOOKS[timeOfDay]
  // In motion the LED content breathes with the beat and the beams sweep slowly.
  const beat = motion ? 1 + 0.18 * Math.sin(motion.t * motion.pace * 5) : 1
  const look = { ...base, led: base.led * beat }
  const sweep = motion ? Math.sin(motion.t * motion.pace * 0.7) * 12 : 0
  const { gl, scene } = useThree()
  gl.toneMappingExposure = look.exposure
  // Lets the off-screen renderer know which spec the scene currently shows.
  scene.userData.spec = `${concept}|${timeOfDay}|${crowd}|${view}|${seed}`

  return (
    <>
      <Rig view={view} motion={motion} />
      {look.sky === 'night' ? (
        <>
          <color attach="background" args={['#04050c']} />
          <Stars radius={300} depth={60} count={3000} factor={4} fade />
        </>
      ) : (
        <GradientSky top={look.skyTop} horizon={look.skyHorizon} glow={look.sunGlow} glowSize={look.glowSize} sun={look.sun} />
      )}
      <fog attach="fog" args={[look.fog, look.fogNear, look.fogFar]} />
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemi]} />
      <directionalLight position={look.sun} intensity={look.sunLight} color={look.sunColor} />

      <Ground color={look.ground} />
      <StageShell lamps={look.beams} />
      {concept === 'monolith' && <Monolith led={look.led} time={timeOfDay} seed={seed} />}
      {concept === 'arch' && <Arch led={look.led} />}
      {concept === 'ribbons' && <Ribbons led={look.led} beamColors={look.beamColors} />}
      {concept === 'halo' && <Halo led={look.led} />}
      <Audience count={crowd === 'full' ? 4200 : 1800} phones={look.phones} seed={seed} />
      <Beams strength={look.beams} colors={look.beamColors} sweep={sweep} />
      {/* Stage wash: key lights from the front of house onto the deck and set, a backlight halo behind it */}
      <spotLight position={[-14, 18, 34]} angle={0.5} penumbra={0.8} intensity={look.beams ? 2200 : 300} distance={90} color="#ffe2c2" />
      <spotLight position={[14, 18, 34]} angle={0.5} penumbra={0.8} intensity={look.beams ? 2200 : 300} distance={90} color="#ffe2c2" />
      <pointLight position={[0, 14, -16]} intensity={look.beams ? 3500 * look.beams : 0} distance={70} color={look.beamColors[0]} />
      <pointLight position={[0, 3, 10]} intensity={look.beams ? 900 * look.beams : 0} distance={40} color={look.beamColors[1]} />

      {postFx && (
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={timeOfDay === 'daylight' ? 0.25 : 1.1} luminanceThreshold={timeOfDay === 'daylight' ? 0.95 : 0.75} luminanceSmoothing={0.2} />
        <Noise opacity={0.035} />
        <Vignette eskil={false} offset={0.25} darkness={0.55} />
        {/* With a post-processing chain, tone mapping happens here (it reads the renderer's exposure). */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
      )}
    </>
  )
}
