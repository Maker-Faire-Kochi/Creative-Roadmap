// The motion library: named, deterministic motions for props and their parts. A motion is a pure function of
// the time since it started, so a frame depends only on the time it is drawn at (renders repeat exactly, and a
// specimen can scrub). Each frame the director resets every animated object to its rest transform and applies
// the motions in the order they were added: offsets add up, rotations compose, scales multiply.
//
// Eases follow the makerfaire.in scenes: quintic smoother for moves, a soft overshoot only where a thing lands.
import * as THREE from 'three'
import { glowSprite } from './kit'
import type { Key, Materials } from './palette'
import type { Model } from './restyle'

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const smoother = (x: number) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10) }
export const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3
/** Lands with one small overshoot. */
export const backOut = (x: number) => { const t = clamp01(x) - 1; return 1 + 2.2 * t ** 3 + 1.2 * t ** 2 }

type Axis = 'x' | 'y' | 'z'
const AXES: Record<Axis, THREE.Vector3> = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) }

export interface Pose {
  offset: THREE.Vector3
  rotation: THREE.Quaternion
  scale: THREE.Vector3
  visible: boolean
}

export interface MotionParams {
  /** Seconds. */
  dur?: number
  axis?: Axis
  /** Radians (turn, swing) or metres (drop height, explode distance). */
  amount?: number
  /** Turns per second (spin, turntable). */
  rate?: number
  /** Hz (swing, shake). */
  hz?: number
  /** [x, y, z] metres (slide from, move to). */
  to?: [number, number, number]
  from?: [number, number, number]
  /** Arc height for move, metres. */
  lift?: number
  key?: Key
}

/** A motion's effect at local time s (seconds since it started; negative = not yet). */
type Apply = (pose: Pose, s: number, p: MotionParams, target: Target) => void

export interface Target {
  object: THREE.Object3D
  model?: Model
  /** Local units per metre for the object's moves: a part inside a model's normalising scale moves in source units. */
  unit?: number
}

const q = new THREE.Quaternion()
const rot = (pose: Pose, axis: Axis, angle: number) => pose.rotation.multiply(q.setFromAxisAngle(AXES[axis], angle))

export const MOTIONS: Record<string, Apply> = {
  /** Hidden until it starts, then falls in from `amount` m above and lands with a small bounce. */
  drop(pose, s, p, t) {
    const k = s / (p.dur ?? 0.55), h = (p.amount ?? 0.5) * (t.unit ?? 1)
    if (k < 0) { pose.visible = false; return }
    if (k < 0.7) pose.offset.y += h * (1 - (k / 0.7) ** 2)
    else if (k < 1) pose.offset.y += h * 0.06 * Math.sin(Math.PI * (k - 0.7) / 0.3)
  },
  /** Hidden until it starts, then scales up from nothing with a small overshoot. */
  pop(pose, s, p) {
    const k = s / (p.dur ?? 0.5)
    if (k < 0) { pose.visible = false; return }
    pose.scale.multiplyScalar(Math.max(1e-3, backOut(k)))
  },
  /** Grows up out of the ground (y scale). */
  rise(pose, s, p) {
    const k = s / (p.dur ?? 0.6)
    if (k < 0) { pose.visible = false; return }
    pose.scale.y *= Math.max(1e-3, smoother(k))
  },
  /** Slides in from an offset. */
  slide(pose, s, p, t) {
    const k = s / (p.dur ?? 0.6)
    if (k < 0) { pose.visible = false; return }
    const f = p.from ?? [-1, 0, 0], e = (1 - smoother(k)) * (t.unit ?? 1)
    pose.offset.x += f[0] * e; pose.offset.y += f[1] * e; pose.offset.z += f[2] * e
  },
  /** Leaves: shrinks away to nothing and stays gone. */
  shrink(pose, s, p) {
    if (s < 0) return
    const k = smoother(s / (p.dur ?? 0.4))
    if (k >= 1) { pose.visible = false; return }
    pose.scale.multiplyScalar(1 - k)
  },
  /** Leaves: sinks into the ground and stays gone. */
  sink(pose, s, p, t) {
    if (s < 0) return
    const k = smoother(s / (p.dur ?? 0.6))
    if (k >= 1) { pose.visible = false; return }
    pose.offset.y -= k * (t.model?.size.y ?? 0.5) * 1.05 * (t.unit ?? 1)
  },
  /** Moves by `to` (metres), optionally over an arc; stays there. */
  move(pose, s, p, t) {
    if (s < 0) return
    const u = t.unit ?? 1, k = smoother(s / (p.dur ?? 0.8)), to = (p.to ?? [0, 0, 0]).map(v => v * u) as [number, number, number]
    pose.offset.x += to[0] * k; pose.offset.y += to[1] * k + (p.lift ?? 0) * u * Math.sin(Math.PI * k); pose.offset.z += to[2] * k
  },
  /** Spins up to `rate` turns a second about `axis` and keeps going. */
  spin(pose, s, p) {
    if (s < 0) return
    const ramp = p.dur ?? 0.8, w = (p.rate ?? 1.5) * Math.PI * 2
    const angle = s < ramp ? w * s * s / (2 * ramp) : w * (s - ramp / 2)
    rot(pose, p.axis ?? 'y', angle)
  },
  /** A slow, steady turn of the whole object (a turntable). */
  turntable(pose, s, p) {
    rot(pose, p.axis ?? 'y', Math.max(0, s) * (p.rate ?? 0.12) * Math.PI * 2)
  },
  /** Turns by `amount` radians about `axis` and stays (a lid opening, a barrier lifting, a page turning). */
  turn(pose, s, p) {
    if (s < 0) return
    rot(pose, p.axis ?? 'z', (p.amount ?? Math.PI / 2) * smoother(s / (p.dur ?? 0.7)))
  },
  /** Swings about `axis`, dying away. */
  swing(pose, s, p) {
    if (s < 0) return
    const decay = Math.exp(-s / (p.dur ?? 1.2))
    rot(pose, p.axis ?? 'z', (p.amount ?? 0.25) * decay * Math.sin(2 * Math.PI * (p.hz ?? 1.6) * s))
  },
  /** A short shake (a fault, a crack). */
  shake(pose, s, p, t) {
    if (s < 0 || s > (p.dur ?? 0.45)) return
    const a = (p.amount ?? 0.012) * (t.unit ?? 1) * (1 - s / (p.dur ?? 0.45))
    pose.offset.x += a * Math.sin(2 * Math.PI * (p.hz ?? 14) * s)
    pose.offset.z += a * Math.cos(2 * Math.PI * (p.hz ?? 14) * s * 1.3)
  },
  /** A small up-and-down (a needle, a hammer tap), repeating. */
  bob(pose, s, p, t) {
    if (s < 0) return
    pose.offset[p.axis ?? 'y'] -= (p.amount ?? 0.01) * (t.unit ?? 1) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (p.hz ?? 4) * s))
  },
}

/** Motions that change how a model is drawn rather than where it is. */
export const STATES = {
  /** Recolours every face of the target (a burnt batch: `key: 'dark'`). */
  recolor(t: Target, s: number, p: MotionParams, m: Materials) {
    if (!t.model) return
    const k = smoother(s / (p.dur ?? 0.6))
    for (const e of t.model.meshes) {
      if (!isUnder(e.mesh, t.object)) continue
      e.mesh.material = k >= 0.5 ? m.face[p.key ?? 'dark'] : m.face[e.key]
      const lines = e.mesh.parent?.children.find(c => c.name === 'edges')
      if (lines) lines.visible = !(k >= 0.5 && (p.key ?? 'dark') === 'dark')
    }
  },
  /** Lights a part: its faces turn to the glow material and a halo fades in. */
  glow(t: Target, s: number, p: MotionParams, m: Materials) {
    const on = s >= 0
    const k = smoother(s / (p.dur ?? 0.35))
    let halo = t.object.children.find(c => c.name === 'glow') as THREE.Sprite | undefined
    if (!halo) {
      const box = new THREE.Box3().setFromObject(t.object)
      const size = box.getSize(new THREE.Vector3()).length()
      halo = glowSprite(Math.max(0.05, size * (p.amount ?? 3)))
      t.object.worldToLocal(halo.position.copy(box.getCenter(new THREE.Vector3())))
      t.object.add(halo)
    }
    ;(halo.material as THREE.SpriteMaterial).opacity = on ? k : 0
    t.object.traverse(o => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const entry = t.model?.meshes.find(e => e.mesh === mesh)
      if (entry) mesh.material = on && k > 0.4 ? m.glow : m.face[entry.key]
    })
  },
}

function isUnder(o: THREE.Object3D, root: THREE.Object3D) {
  for (let n: THREE.Object3D | null = o; n; n = n.parent) if (n === root) return true
  return false
}

export type MotionName = keyof typeof MOTIONS | keyof typeof STATES

interface Clip { target: Target, name: MotionName, t0: number, p: MotionParams }

/**
 * Plays motions on objects at absolute times. update(t) poses everything for time t; nothing depends on the
 * frames before it.
 */
export class Director {
  private clips: Clip[] = []
  private rest = new Map<THREE.Object3D, { p: THREE.Vector3, q: THREE.Quaternion, s: THREE.Vector3, v: boolean }>()
  constructor(private m: Materials) {}

  play(target: Target, name: MotionName, t0: number, p: MotionParams = {}) {
    if (!(name in MOTIONS) && !(name in STATES)) throw new Error(`Unknown motion ${name}`)
    const o = target.object
    if (!this.rest.has(o)) this.rest.set(o, { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone(), v: o.visible })
    this.clips.push({ target, name, t0, p })
  }

  /** True if anything is scheduled for this object (it is shown from its first motion's rule). */
  has(o: THREE.Object3D) {
    return this.rest.has(o)
  }

  update(t: number) {
    const poses = new Map<THREE.Object3D, Pose>()
    for (const [o, r] of this.rest) poses.set(o, { offset: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(1, 1, 1), visible: r.v })
    for (const c of this.clips) {
      const s = t - c.t0
      if (c.name in MOTIONS) MOTIONS[c.name as keyof typeof MOTIONS]!(poses.get(c.target.object)!, s, c.p, c.target)
      else STATES[c.name as keyof typeof STATES](c.target, s, c.p, this.m)
    }
    for (const [o, r] of this.rest) {
      const pose = poses.get(o)!
      o.position.copy(r.p).add(pose.offset)
      o.quaternion.copy(r.q).multiply(pose.rotation)
      o.scale.copy(r.s).multiply(pose.scale)
      o.visible = pose.visible
    }
  }
}
