// Camera moves (design-system/motion.md): every time a poster's text changes, the camera moves. A move starts
// displaced from the scene's own framing and settles into it over MOVE_S seconds (quintic), then keeps drifting
// the same way, slowly, while the beat holds. Moves are offsets applied on top of whatever camera a scene sets
// (ours or a makerfaire.in scene's), so they work for any set: an orbit about the point the camera looks at, a
// crane (pitch), a truck (sideways), a push or pull (zoom on an orthographic camera, dolly on a perspective one).
import * as THREE from 'three'
import { smoother } from './motions'

export const MOVES = ['orbit-l', 'orbit-r', 'push-in', 'pull-out', 'crane-up', 'crane-down', 'truck-l', 'truck-r'] as const
export type Move = typeof MOVES[number] | 'hold'
export const MOVE_S = 0.9

export interface CamOffset {
  /** Radians about the world's vertical through the look point. */
  yaw: number
  /** Radians about the camera's right axis through the look point (positive looks down more). */
  pitch: number
  /** Zoom factor (>1 closer). */
  zoom: number
  /** Sideways shift as a fraction of the view height. */
  truck: number
}

const NONE: CamOffset = { yaw: 0, pitch: 0, zoom: 1, truck: 0 }

/** Where each move starts (its offset at s = 0) and how it drifts per second once settled. */
const SHAPE: Record<Exclude<Move, 'hold'>, { start: Partial<CamOffset>, drift: Partial<CamOffset> }> = {
  'orbit-l': { start: { yaw: 0.55 }, drift: { yaw: -0.035 } },
  'orbit-r': { start: { yaw: -0.55 }, drift: { yaw: 0.035 } },
  'push-in': { start: { zoom: 0.7 }, drift: { zoom: 0.025 } },
  'pull-out': { start: { zoom: 1.45 }, drift: { zoom: -0.02 } },
  'crane-up': { start: { pitch: -0.28 }, drift: { pitch: 0.012 } },
  'crane-down': { start: { pitch: 0.24 }, drift: { pitch: -0.012 } },
  'truck-l': { start: { truck: 0.32 }, drift: { truck: -0.012 } },
  'truck-r': { start: { truck: -0.32 }, drift: { truck: 0.012 } },
}

/** The offset s seconds into a beat that opens with `move`. */
export function moveOffset(move: Move, s: number): CamOffset {
  if (move === 'hold') return { ...NONE }
  const { start, drift } = SHAPE[move], k = 1 - smoother(s / MOVE_S), d = Math.max(0, s - MOVE_S * 0.5)
  return {
    yaw: (start.yaw ?? 0) * k + (drift.yaw ?? 0) * d,
    pitch: (start.pitch ?? 0) * k + (drift.pitch ?? 0) * d,
    zoom: (1 + ((start.zoom ?? 1) - 1) * k) * (1 + (drift.zoom ?? 0) * d),
    truck: (start.truck ?? 0) * k + (drift.truck ?? 0) * d,
  }
}

/** The direction things travel across the screen during a move, [dx, dy] (a wipe follows it). */
export function screenDirection(move: Move): [number, number] {
  switch (move) {
    case 'orbit-l': case 'truck-l': return [1, 0]
    case 'orbit-r': case 'truck-r': return [-1, 0]
    case 'crane-up': return [0, 1]
    case 'crane-down': return [0, -1]
    default: return [0, 0]
  }
}

/** A default sequence for n beats: never the same move twice in a row, and the first beat settles in. */
export function defaultMoves(n: number, seed = 0): Move[] {
  const order: Move[] = ['push-in', 'orbit-l', 'crane-down', 'orbit-r', 'truck-l', 'pull-out', 'crane-up', 'truck-r']
  return Array.from({ length: n }, (_, i) => order[(i + seed) % order.length]!)
}

const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(), fwd = new THREE.Vector3()

/** Applies an offset to a camera the scene has just placed (call after the scene's own frame()). */
export function applyCamOffset(cam: THREE.OrthographicCamera | THREE.PerspectiveCamera, off: CamOffset, pivotY = 0) {
  cam.updateMatrixWorld()
  cam.getWorldDirection(fwd)
  // The look point: where the view ray meets the ground plane at pivotY, else a few metres ahead.
  const dist = fwd.y < -0.05 ? (pivotY - cam.position.y) / fwd.y : 3
  const pivot = cam.position.clone().addScaledVector(fwd, Math.max(0.2, dist))
  const viewH = (cam as THREE.OrthographicCamera).isOrthographicCamera
    ? ((cam as THREE.OrthographicCamera).top - (cam as THREE.OrthographicCamera).bottom) / cam.zoom
    : 2 * Math.tan(THREE.MathUtils.degToRad((cam as THREE.PerspectiveCamera).fov) / 2) * cam.position.distanceTo(pivot)
  right.crossVectors(fwd, up).normalize()
  const shift = right.clone().multiplyScalar(off.truck * viewH)
  v.copy(cam.position).sub(pivot)
  v.applyAxisAngle(right, -off.pitch)
  // Keep the camera above the look point.
  if (v.y < 0.05 * v.length()) v.y = 0.05 * v.length()
  v.applyAxisAngle(up, off.yaw)
  if ((cam as THREE.PerspectiveCamera).isPerspectiveCamera) v.divideScalar(off.zoom)
  else cam.zoom *= off.zoom
  pivot.add(shift)
  cam.position.copy(pivot).add(v)
  cam.lookAt(pivot)
  cam.updateProjectionMatrix()
}
