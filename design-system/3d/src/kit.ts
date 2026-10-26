// Stage parts every 3D illustration shares (3d/STANDARD.md): the light pair, the contact shadow under anything
// standing, the glow halo of a lit part, the orthographic framing, and a few plain geometries the motions draw
// with (pins, arcs, rings). Written for this design system; the values follow the makerfaire.in scenes.
import * as THREE from 'three'
import { KEYS, type Materials } from './palette'

/** Sky/ground fill plus one key light from the upper left front. No shadow maps. */
export function addLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8d2, 1.9))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(-3, 5, 4)
  scene.add(key)
}

let blob: THREE.CanvasTexture | null = null
function blobTexture() {
  if (blob) return blob
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(0,0,0,1)')
  grad.addColorStop(0.6, 'rgba(0,0,0,0.45)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  blob = new THREE.CanvasTexture(c)
  return blob
}

/** A soft dark blob on the ground under an object (radius in metres). */
export function contactShadow(radiusX: number, radiusZ = radiusX) {
  const mat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, opacity: 0.22, depthWrite: false })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radiusX * 2, radiusZ * 2), mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.0005
  mesh.renderOrder = -1
  mesh.name = 'shadow'
  return mesh
}

let halo: THREE.CanvasTexture | null = null
/** A warm glow sprite for a lit part (a bulb that is on). */
export function glowSprite(size: number) {
  if (!halo) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,246,200,0.95)')
    grad.addColorStop(0.35, 'rgba(255,240,170,0.45)')
    grad.addColorStop(1, 'rgba(255,240,170,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    halo = new THREE.CanvasTexture(c)
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, opacity: 0 }))
  s.scale.setScalar(size)
  s.name = 'glow'
  return s
}

/** Fits an orthographic camera to a view height (metres) at the canvas aspect. */
export function fitOrtho(cam: THREE.OrthographicCamera, w: number, h: number, viewHeight: number) {
  const a = w / h
  cam.top = viewHeight / 2
  cam.bottom = -viewHeight / 2
  cam.left = -viewHeight * a / 2
  cam.right = viewHeight * a / 2
  cam.updateProjectionMatrix()
}

/** A raised arc between two points, drawn progressively with setDrawRange (a connection: cyan). */
export function arcLine(a: THREE.Vector3, b: THREE.Vector3, lift: number, color: string = KEYS.cyan) {
  const mid = a.clone().lerp(b, 0.5)
  mid.y += lift
  const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(64)
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color }))
  line.geometry.setDrawRange(0, 0)
  line.userData.count = pts.length
  return line
}

/** A flat ring on the ground (a ripple, a selection). */
export function ringLine(radius: number, color: string) {
  const pts = Array.from({ length: 97 }, (_, i) => new THREE.Vector3(Math.cos(i / 48 * Math.PI) * radius, 0, Math.sin(i / 48 * Math.PI) * radius))
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true }))
}

/** A plain map pin: metal stem and a flat head, standing on y = 0. */
export function pinMesh(m: Materials, head: 'red' | 'dark' | 'light' | 'cyan' = 'dark', height = 0.13) {
  const g = new THREE.Group()
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.085, height * 0.085, height, 24).translate(0, height / 2, 0), m.face.metal)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.3, height * 0.3, height * 0.18, 24).translate(0, height, 0), m.face[head])
  g.add(stem, cap)
  if (head !== 'dark') g.add(new THREE.LineSegments(new THREE.EdgesGeometry(cap.geometry, 20), m.line))
  return g
}

/** A sheet of paper or a page: a thin box with hairline edges. */
export function sheetMesh(m: Materials, w: number, d: number, key: keyof typeof KEYS = 'light') {
  const geo = new THREE.BoxGeometry(w, 0.002, d)
  const g = new THREE.Group()
  g.add(new THREE.Mesh(geo, m.face[key]), new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), m.line))
  return g
}

export function disposeTree(root: THREE.Object3D) {
  root.traverse(o => {
    const mesh = o as THREE.Mesh
    mesh.geometry?.dispose()
  })
}
