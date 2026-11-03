// Specimen helpers: draw one restyled model on its own, three-quarter orthographic, as the standard frames it.
// Used by the contact sheet (3d/tools/sheet.mjs) and the specimen page.
import * as THREE from 'three'
import { addLights, fitOrtho } from './kit'
import type { Materials } from './palette'
import { loadModel, type Model, type ModelSpec } from './restyle'
import { BEAMS } from './beams'

let renderer: THREE.WebGLRenderer | null = null

export async function renderTile(url: string, spec: ModelSpec, m: Materials, size: number, yaw = -0.7) {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(1)
    renderer.setClearColor(0x000000, 0)
  }
  renderer.setSize(size, size, false)
  const model: Model = spec.id in BEAMS ? BEAMS[spec.id]!.build(m) : await loadModel(url, spec, m)
  const scene = new THREE.Scene()
  addLights(scene)
  scene.add(model.root)
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100)
  const r = Math.max(model.size.x, model.size.y, model.size.z)
  const target = new THREE.Vector3(0, model.size.y / 2, 0)
  cam.position.set(Math.sin(yaw) * r * 3, model.size.y / 2 + r * 1.6, Math.cos(yaw) * r * 3)
  cam.lookAt(target)
  fitOrtho(cam, size, size, r * 1.5)
  renderer.render(scene, cam)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  canvas.getContext('2d')!.drawImage(renderer.domElement, 0, 0)
  const keys = [...new Set(model.meshes.map(e => e.key))]
  scene.traverse(o => (o as THREE.Mesh).geometry?.dispose())
  return { canvas, triangles: model.triangles, keys, parts: Object.keys(model.parts), size: model.size.toArray().map(v => +v.toFixed(3)) }
}
