"use client"

import { useEffect, useMemo, useRef, Suspense, type ReactNode } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Float, PerspectiveCamera, RoundedBox } from "@react-three/drei"
import * as THREE from "three"

export type SceneState = {
  step: number
  floors: number
  units: number
  footprint: number
  energyGrade: string | null
  selected: string[]
  insulated: boolean
  newWindows: boolean
  photovoltaic: boolean
  reduceMotion: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BRAND = "#5b56e0"

function num(value: number | undefined | null, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  const v = num(value, min)
  return Math.min(max, Math.max(min, v))
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

type GradeTone = "green" | "amber" | "red" | "grey"

function gradeTone(grade: string | null): GradeTone {
  if (!grade) return "grey"
  const g = grade.trim().toUpperCase()
  if (g.startsWith("A") || g === "B") return "green"
  if (g === "C" || g === "D") return "amber"
  if (g === "E" || g === "F" || g === "G") return "red"
  return "grey"
}

function toneColor(tone: GradeTone): string {
  switch (tone) {
    case "green":
      return "#10b981"
    case "amber":
      return "#f59e0b"
    case "red":
      return "#ef4444"
    default:
      return "#94a3b8"
  }
}

function has(selected: string[], id: string): boolean {
  return Array.isArray(selected) && selected.includes(id)
}

// Derived, NaN-safe layout numbers from the scene state.
function useLayout(state: SceneState) {
  return useMemo(() => {
    const storeys = clamp(Math.round(num(state.floors, 3)), 2, 14)
    const footprint = clamp(num(state.footprint, 3), 2, 6)
    const units = clamp(num(state.units, 6), 1, 60)

    const storeyHeight = 0.62
    const height = storeys * storeyHeight
    // Footprint drives width/depth, units nudge them a touch wider.
    const width = clamp(footprint + units * 0.02, 2, 6)
    const depth = clamp(footprint * 0.82 + units * 0.015, 2, 6)
    const cols = clamp(Math.round(2 + footprint * 0.6 + units * 0.06), 2, 6)

    return { storeys, storeyHeight, height, width, depth, cols, units }
  }, [state.floors, state.footprint, state.units])
}

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------

type WindowsProps = {
  layout: ReturnType<typeof useLayout>
  glowing: boolean
  blinds: boolean
}

function Windows({ layout, glowing, blinds }: WindowsProps) {
  const targetGlow = useRef(0)
  targetGlow.current = glowing ? 1 : 0

  const paneGeo = useMemo(() => new THREE.BoxGeometry(0.22, 0.34, 0.05), [])
  const slatGeo = useMemo(() => new THREE.BoxGeometry(0.26, 0.04, 0.02), [])

  // One shared, mutated material for every pane (cheap + uniform glow).
  const paneMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1f2530"),
        emissive: new THREE.Color("#9ccbff"),
        emissiveIntensity: 0.02,
        metalness: 0.1,
        roughness: 0.3,
      }),
    []
  )
  const slatMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#cbd2dc"),
        roughness: 0.6,
        metalness: 0.05,
      }),
    []
  )

  useEffect(() => {
    return () => {
      paneGeo.dispose()
      slatGeo.dispose()
      paneMat.dispose()
      slatMat.dispose()
    }
  }, [paneGeo, slatGeo, paneMat, slatMat])

  // Build window + optional blind positions across the four faces.
  const items = useMemo(() => {
    const { storeys, storeyHeight, width, depth, cols, height } = layout
    const out: {
      pos: [number, number, number]
      rotY: number
    }[] = []
    const faces: { axis: "x" | "z"; sign: number }[] = [
      { axis: "z", sign: 1 },
      { axis: "z", sign: -1 },
      { axis: "x", sign: 1 },
      { axis: "x", sign: -1 },
    ]
    for (const face of faces) {
      const span = face.axis === "z" ? width : depth
      const offset = (face.axis === "z" ? depth : width) / 2 + 0.03
      const rotY = face.axis === "z" ? 0 : Math.PI / 2
      for (let s = 0; s < storeys; s++) {
        const y = -height / 2 + storeyHeight * (s + 0.5)
        for (let c = 0; c < cols; c++) {
          const t = cols === 1 ? 0.5 : c / (cols - 1)
          const lateral = (t - 0.5) * (span - 0.5)
          const pos: [number, number, number] =
            face.axis === "z"
              ? [lateral, y, face.sign * offset]
              : [face.sign * offset, y, lateral]
          out.push({ pos, rotY })
        }
      }
    }
    return out
  }, [layout])

  const dull = useMemo(() => new THREE.Color("#1f2530"), [])
  const lit = useMemo(() => new THREE.Color("#bfe0ff"), [])
  const emis = useMemo(() => new THREE.Color("#9ccbff"), [])

  useFrame((_, delta) => {
    const d = Number.isFinite(delta) ? Math.min(delta, 0.05) : 0.016
    paneMat.emissiveIntensity = damp(
      paneMat.emissiveIntensity,
      targetGlow.current * 1.4 + 0.02,
      6,
      d
    )
    const target = targetGlow.current > 0.5 ? lit : dull
    paneMat.color.lerp(target, 1 - Math.exp(-6 * d))
    paneMat.emissive.lerp(emis, 1 - Math.exp(-6 * d))
  })

  return (
    <group>
      {items.map((it, i) => (
        <group key={i} position={it.pos} rotation={[0, it.rotY, 0]}>
          <mesh geometry={paneGeo} material={paneMat} castShadow />
          {blinds ? (
            <group position={[0, 0, 0.04]}>
              {[0.1, 0, -0.1].map((sy, si) => (
                <mesh
                  key={si}
                  geometry={slatGeo}
                  material={slatMat}
                  position={[0, sy, 0]}
                />
              ))}
            </group>
          ) : null}
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Facade body
// ---------------------------------------------------------------------------

type BuildingBodyProps = {
  layout: ReturnType<typeof useLayout>
  insulated: boolean
}

function BuildingBody({ layout, insulated }: BuildingBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const insulatedRef = useRef(insulated)
  insulatedRef.current = insulated

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (mesh) {
      mesh.scale.x = damp(mesh.scale.x, layout.width, 5, delta)
      mesh.scale.y = damp(mesh.scale.y, layout.height, 5, delta)
      mesh.scale.z = damp(mesh.scale.z, layout.depth, 5, delta)
    }
    const mat = matRef.current
    if (mat) {
      const bare = new THREE.Color("#8b8f96")
      const clad = new THREE.Color("#eef1f5")
      const target = insulatedRef.current ? clad : bare
      mat.color.lerp(target, 1 - Math.exp(-5 * delta))
      mat.roughness = damp(
        mat.roughness,
        insulatedRef.current ? 0.7 : 0.95,
        5,
        delta
      )
    }
  })

  return (
    <RoundedBox
      ref={meshRef}
      args={[1, 1, 1]}
      radius={0.05}
      smoothness={4}
      scale={[layout.width, layout.height, layout.depth]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        ref={matRef}
        color="#8b8f96"
        roughness={0.95}
        metalness={0.04}
      />
    </RoundedBox>
  )
}

// ---------------------------------------------------------------------------
// Roof cap (insulated roof renovation)
// ---------------------------------------------------------------------------

function RoofCap({
  layout,
  active,
}: {
  layout: ReturnType<typeof useLayout>
  active: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const target = activeRef.current ? 1 : 0.0001
    mesh.scale.y = damp(mesh.scale.y, target, 6, delta)
    mesh.scale.x = damp(mesh.scale.x, layout.width + 0.14, 6, delta)
    mesh.scale.z = damp(mesh.scale.z, layout.depth + 0.14, 6, delta)
    mesh.position.y = damp(mesh.position.y, layout.height / 2 + 0.07, 6, delta)
  })

  return (
    <RoundedBox
      ref={ref}
      args={[1, 0.14, 1]}
      radius={0.04}
      smoothness={3}
      position={[0, layout.height / 2 + 0.07, 0]}
      castShadow
    >
      <meshStandardMaterial color="#3f4654" roughness={0.8} metalness={0.1} />
    </RoundedBox>
  )
}

// ---------------------------------------------------------------------------
// Solar panels (photovoltaics)
// ---------------------------------------------------------------------------

function SolarPanels({
  layout,
  active,
  raised,
}: {
  layout: ReturnType<typeof useLayout>
  active: boolean
  raised: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  const cells = useMemo(() => {
    const out: [number, number][] = []
    const nx = 3
    const nz = 2
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        out.push([(i - (nx - 1) / 2) * 0.42, (j - (nz - 1) / 2) * 0.42])
      }
    }
    return out
  }, [])

  useFrame((_, delta) => {
    const group = ref.current
    if (!group) return
    const target = activeRef.current ? 1 : 0.0001
    const s = damp(group.scale.x, target, 6, delta)
    group.scale.setScalar(s)
    const baseY = layout.height / 2 + (raised ? 0.18 : 0.04)
    group.position.y = damp(group.position.y, baseY, 6, delta)
  })

  return (
    <group
      ref={ref}
      position={[0, layout.height / 2 + 0.04, 0]}
      rotation={[-0.32, 0, 0]}
      scale={0.0001}
    >
      {cells.map((c, i) => (
        <mesh key={i} position={[c[0], 0, c[1]]} castShadow>
          <boxGeometry args={[0.38, 0.03, 0.38]} />
          <meshStandardMaterial
            color="#13234d"
            emissive="#1d3a8a"
            emissiveIntensity={0.25}
            metalness={0.5}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Rooftop chimney (heating) + vents (recuperation)
// ---------------------------------------------------------------------------

function Chimney({
  layout,
  active,
}: {
  layout: ReturnType<typeof useLayout>
  active: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useFrame((_, delta) => {
    const g = ref.current
    if (!g) return
    g.scale.y = damp(g.scale.y, activeRef.current ? 1 : 0.0001, 6, delta)
    g.position.y = damp(g.position.y, layout.height / 2 + 0.2, 6, delta)
    g.position.x = damp(g.position.x, layout.width * 0.28, 6, delta)
    g.position.z = damp(g.position.z, layout.depth * 0.28, 6, delta)
  })

  return (
    <group
      ref={ref}
      position={[
        layout.width * 0.28,
        layout.height / 2 + 0.2,
        layout.depth * 0.28,
      ]}
      scale={[1, 0.0001, 1]}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.4, 12]} />
        <meshStandardMaterial color="#5a4a42" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 12]} />
        <meshStandardMaterial
          color="#ff9b54"
          emissive="#ff7a1a"
          emissiveIntensity={1.2}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}

function Vents({
  layout,
  active,
}: {
  layout: ReturnType<typeof useLayout>
  active: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useFrame((_, delta) => {
    const g = ref.current
    if (!g) return
    g.scale.setScalar(damp(g.scale.x, activeRef.current ? 1 : 0.0001, 6, delta))
    g.position.y = damp(g.position.y, layout.height / 2 + 0.1, 6, delta)
    g.position.x = damp(g.position.x, -layout.width * 0.26, 6, delta)
    g.position.z = damp(g.position.z, -layout.depth * 0.24, 6, delta)
  })

  return (
    <group
      ref={ref}
      position={[
        -layout.width * 0.26,
        layout.height / 2 + 0.1,
        -layout.depth * 0.24,
      ]}
      scale={0.0001}
    >
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 12]} />
          <meshStandardMaterial
            color="#c2c8d2"
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Heat pump unit on the ground
// ---------------------------------------------------------------------------

function HeatPump({
  layout,
  active,
}: {
  layout: ReturnType<typeof useLayout>
  active: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useFrame((_, delta) => {
    const g = ref.current
    if (!g) return
    g.scale.setScalar(damp(g.scale.x, activeRef.current ? 1 : 0.0001, 6, delta))
    g.position.x = damp(g.position.x, layout.width / 2 + 0.4, 6, delta)
    g.position.z = damp(g.position.z, layout.depth * 0.3, 6, delta)
  })

  return (
    <group
      ref={ref}
      position={[
        layout.width / 2 + 0.4,
        -layout.height / 2 + 0.18,
        layout.depth * 0.3,
      ]}
      scale={0.0001}
    >
      <RoundedBox
        args={[0.42, 0.32, 0.26]}
        radius={0.04}
        smoothness={3}
        castShadow
      >
        <meshStandardMaterial color="#dfe3e9" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0, 0.135]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#8a90a0" roughness={0.6} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Energy halo ring on the ground
// ---------------------------------------------------------------------------

function EnergyHalo({
  color,
  layout,
}: {
  color: string
  layout: ReturnType<typeof useLayout>
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const targetColor = useMemo(() => new THREE.Color(color), [color])

  useFrame((_, delta) => {
    const mat = matRef.current
    if (mat) {
      mat.color.lerp(targetColor, 1 - Math.exp(-5 * delta))
      mat.emissive.lerp(targetColor, 1 - Math.exp(-5 * delta))
    }
    const ring = ringRef.current
    if (ring) {
      const radius = Math.max(layout.width, layout.depth) * 0.62 + 0.5
      ring.scale.x = damp(ring.scale.x, radius, 5, delta)
      ring.scale.y = damp(ring.scale.y, radius, 5, delta)
      ring.position.y = -layout.height / 2 - 0.02
    }
  })

  return (
    <mesh
      ref={ringRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -layout.height / 2 - 0.02, 0]}
    >
      <ringGeometry args={[0.82, 1, 64]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={1.1}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Energy grade badge — letter drawn on a CanvasTexture (no font fetch)
// ---------------------------------------------------------------------------

function Badge({
  grade,
  color,
  layout,
}: {
  grade: string | null
  color: string
  layout: ReturnType<typeof useLayout>
}) {
  const letter = grade ? grade.trim().toUpperCase().charAt(0) || "?" : "?"

  const texture = useMemo(() => {
    if (typeof document === "undefined") return null
    const size = 256
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = 4
    return tex
  }, [])

  useEffect(() => {
    if (!texture) return
    const canvas = texture.image as HTMLCanvasElement
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const size = canvas.width
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = color
    const r = 48
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(size - r, 0)
    ctx.quadraticCurveTo(size, 0, size, r)
    ctx.lineTo(size, size - r)
    ctx.quadraticCurveTo(size, size, size - r, size)
    ctx.lineTo(r, size)
    ctx.quadraticCurveTo(0, size, 0, size - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 170px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(letter, size / 2, size / 2 + 8)
    texture.needsUpdate = true
  }, [texture, letter, color])

  useEffect(() => {
    return () => {
      texture?.dispose()
    }
  }, [texture])

  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    g.position.y = damp(g.position.y, layout.height / 2 + 0.85, 5, delta)
    g.position.x = damp(g.position.x, layout.width / 2 + 0.55, 5, delta)
  })

  if (!texture) return null

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.8}>
      <group
        ref={groupRef}
        position={[layout.width / 2 + 0.55, layout.height / 2 + 0.85, 0]}
      >
        <mesh>
          <planeGeometry args={[0.7, 0.7]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      </group>
    </Float>
  )
}

// ---------------------------------------------------------------------------
// Camera + group rig: reframes per step, auto-rotates
// ---------------------------------------------------------------------------

const STEP_CAMERA: Record<number, [number, number, number]> = {
  0: [6.5, 4.2, 7.5],
  1: [4.6, 2.4, 6.6],
  2: [5.4, 3.2, 6.8],
  3: [4.8, 6.2, 6.2],
}

function Rig({ state, children }: { state: SceneState; children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const camRef = useRef<THREE.PerspectiveCamera>(null)
  const stepRef = useRef(state.step)
  const reduceRef = useRef(state.reduceMotion)
  stepRef.current = clamp(Math.round(num(state.step, 0)), 0, 3)
  reduceRef.current = state.reduceMotion

  useFrame((stateCtx, delta) => {
    const d = Number.isFinite(delta) ? Math.min(delta, 0.05) : 0.016
    const cam = camRef.current
    if (cam) {
      const target = STEP_CAMERA[stepRef.current] ?? STEP_CAMERA[0]
      cam.position.x = damp(cam.position.x, target[0], 3, d)
      cam.position.y = damp(cam.position.y, target[1], 3, d)
      cam.position.z = damp(cam.position.z, target[2], 3, d)
      cam.lookAt(0, 0.4, 0)
    }
    const g = groupRef.current
    if (g) {
      if (!reduceRef.current) {
        g.rotation.y += d * 0.18
      }
    }
  })

  return (
    <>
      <PerspectiveCamera
        ref={camRef}
        makeDefault
        position={[6.5, 4.2, 7.5]}
        fov={42}
      />
      <group ref={groupRef}>{children}</group>
    </>
  )
}

// ---------------------------------------------------------------------------
// Scene contents
// ---------------------------------------------------------------------------

function SceneContents({ state }: { state: SceneState }) {
  const invalidate = useThree((s) => s.invalidate)
  const layout = useLayout(state)

  const tone = gradeTone(state.energyGrade)
  const accent = toneColor(tone)

  const windowsGlow = has(state.selected, "windows") || state.newWindows
  const insulated = has(state.selected, "insulation") || state.insulated
  const pv = has(state.selected, "photovoltaics") || state.photovoltaic
  const roof = has(state.selected, "roof")
  const blinds = has(state.selected, "blinds")
  const heatpump = has(state.selected, "heatpump")
  const heating = has(state.selected, "heating")
  const recuperation = has(state.selected, "recuperation")

  // Re-render the demand frameloop whenever inputs change.
  useEffect(() => {
    invalidate()
  }, [
    invalidate,
    state.step,
    state.floors,
    state.units,
    state.footprint,
    state.energyGrade,
    state.selected,
    state.insulated,
    state.newWindows,
    state.photovoltaic,
    state.reduceMotion,
  ])

  return (
    <Rig state={state}>
      <BuildingBody layout={layout} insulated={insulated} />
      <Windows layout={layout} glowing={windowsGlow} blinds={blinds} />
      <RoofCap layout={layout} active={roof} />
      <SolarPanels layout={layout} active={pv} raised={roof} />
      <Chimney layout={layout} active={heating} />
      <Vents layout={layout} active={recuperation} />
      <HeatPump layout={layout} active={heatpump} />
      <EnergyHalo color={accent} layout={layout} />
      <Badge grade={state.energyGrade} color={accent} layout={layout} />
    </Rig>
  )
}

// ---------------------------------------------------------------------------
// Canvas wrapper (default export)
// ---------------------------------------------------------------------------

export default function BuildingScene({
  state,
  className,
}: {
  state: SceneState
  className?: string
}) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      frameloop={state.reduceMotion ? "demand" : "always"}
      shadows
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.55} color="#ffffff" />
        <directionalLight
          position={[6, 9, 5]}
          intensity={1.5}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
        />
        <directionalLight
          position={[-6, 4, -4]}
          intensity={0.5}
          color={BRAND}
        />
        <pointLight position={[0, 2, 8]} intensity={0.4} color="#bfe0ff" />
        <SceneContents state={state} />
      </Suspense>
    </Canvas>
  )
}
