// The 3D stage for the motion posters: the website's three.js scenes (vendor/website, makerfaire.in) driven
// headlessly and deterministically. The render page calls init() once per poster, then for every video frame
// advance(steps) + render() and draws `canvas` under the studio's letters.
//
// The website's scenes are fixed-step simulations (DT = 1/200 s, seeded), so the same sequence of
// advance() and cue() calls always draws the same frames. Nothing here reads a clock.
import * as THREE from 'three'
import { createMaterials } from '../../vendor/website/app/three/core/kit'
import { readPalette } from '../../vendor/website/app/three/core/palette'
import type { SceneInstance } from '../../vendor/website/app/three/core/stage'
import { applyCamOffset, moveOffset, type Move } from '../../../../design-system/3d/src/camera'
import { SETS, type SetName } from './sets'

export const DT = 1 / 200

export interface StageOptions {
  set: SetName
  width: number
  height: number
  /** The box the scene frames its subject for, as fractions of the canvas: [x0, x1, y0, y1] (the website's focus box). */
  focus: [number, number, number, number]
  /** Set-specific options (see sets.ts). */
  opts?: Record<string, unknown>
}

let renderer: THREE.WebGLRenderer | null = null
let inst: SceneInstance | null = null
let cueSet: ((name: string, arg?: unknown) => string | null) | null = null
let size = { width: 1, height: 1, zoom: 0 }
export let canvas: HTMLCanvasElement | null = null

export async function init(o: StageOptions) {
  dispose()
  canvas = document.createElement('canvas')
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(o.width, o.height, false)
  renderer.setClearColor(0x000000, 0)
  const palette = readPalette()
  const materials = createMaterials(palette)
  const ctx = { materials, palette, posterMode: false, coarse: true, width: o.width, height: o.height }
  const made = await SETS[o.set](ctx, o.opts ?? {})
  inst = made.inst
  cueSet = made.cue
  size = { width: o.width, height: o.height, zoom: Number(o.opts?.zoom ?? 0) }
  reframe(o.focus)
  renderer.compile(inst.scene, inst.camera)
  return { ok: true }
}

/**
 * Frames the scene for a box of the canvas ([x0, x1, y0, y1] as fractions): the scene fits its subject to the box
 * (the website's fit() from core/stage.ts), and a view offset extends the same camera over the whole canvas. The
 * Weave look calls it at every beat, when the object's hole in the text moves.
 */
export function reframe(focus: [number, number, number, number]) {
  const [x0, x1, y0, y1] = focus
  const fw = Math.max(1, size.width * (x1 - x0))
  const fh = Math.max(1, size.height * (y1 - y0))
  inst!.resize(fw, fh)
  const cam = inst!.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera
  cam.setViewOffset(fw, fh, -size.width * x0, -size.height * y0, size.width, size.height)
  // opts.zoom: closer than the scene frames itself (the posters' window is shorter than the website's boxes).
  if (size.zoom) cam.zoom = size.zoom
  cam.updateProjectionMatrix()
}

/** Runs n fixed simulation steps. */
export function advance(n: number) {
  for (let i = 0; i < n; i++) inst!.step(DT)
}

/** A storyboard cue: a set-specific control (camera shot, prop) or one of the scene's own actions. */
export function cue(name: string, arg?: unknown): string | null {
  return cueSet?.(name, arg) ?? inst!.action?.(name) ?? null
}

/**
 * Draws the scene. `move` is the beat's camera move and `s` the seconds since the beat began: the move is laid on
 * top of whatever camera the scene set this frame, then taken off again, so scenes that place their camera once
 * (and those that place it every frame) both see their own camera next time.
 */
export function render(move: Move = 'hold', s = 0) {
  inst!.frame(1)
  const cam = inst!.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera
  const saved = { p: cam.position.clone(), q: cam.quaternion.clone(), zoom: cam.zoom }
  if (move !== 'hold') applyCamOffset(cam, moveOffset(move, s))
  renderer!.clear()
  renderer!.render(inst!.scene, cam)
  cam.position.copy(saved.p)
  cam.quaternion.copy(saved.q)
  cam.zoom = saved.zoom
  cam.updateProjectionMatrix()
}

export function dispose() {
  inst?.dispose()
  renderer?.dispose()
  inst = null
  renderer = null
  cueSet = null
}
