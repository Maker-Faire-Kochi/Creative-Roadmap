// A pin map for the network topics, built from the website's beam kit (core/kit.ts): a plain board with a
// latitude/longitude graticule between two slotted beams, and pins that drop in on cue. It is an illustration,
// not a map of every Faire: it only pins the places the carousel copy names (topics 13, 14 and 18). Kochi's pin
// is red (attention), the rest are ink; arcs are cyan (the selected connection).
// Cues: pin:<id> (one pin), pins (every named pin but Kochi, in turn), kochi (Kochi's pin and a ring),
//       links (arcs from Kochi to every pin standing), travel (arcs from the Bay Area to every pin standing).
import * as THREE from 'three'
import { Assembly, addLights, beamGeometry, blockGeometry, discGeometry, fitOrtho, pinGeometry } from '../../../vendor/website/app/three/core/kit'
import type { SceneContext, SceneInstance } from '../../../vendor/website/app/three/core/stage'

const PLACES: Record<string, [number, number]> = {
  'bay-area': [-122.3, 37.8],
  'rome': [12.5, 41.9],
  'hannover': [9.7, 52.4],
  'shenzhen': [114.1, 22.5],
  'taipei': [121.5, 25.0],
  'kochi': [76.3, 9.9],
}
const W = 2.6, D = 1.3
/** Equirectangular: longitude across, latitude into the board (north away from the viewer). */
const at = ([lon, lat]: [number, number]) => new THREE.Vector3((lon / 180) * (W / 2), 0, (-lat / 90) * (D / 2))

const DROP = 0.55, ARC = 1.1
const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3
/** Falls from above and settles with one small bounce. */
function dropY(k: number) {
  if (k >= 1) return 0
  if (k < 0.7) return 0.45 * (1 - (k / 0.7) ** 2)
  const b = (k - 0.7) / 0.3
  return 0.04 * Math.sin(Math.PI * b)
}

export default async function create(ctx: SceneContext, opts: { view?: number }): Promise<SceneInstance> {
  const m = ctx.materials
  const scene = new THREE.Scene()
  addLights(scene)
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30)
  const aim = new THREE.Vector3(0, 0, 0.05)

  // The board, its graticule and the two slotted beams that hold it.
  const board = new Assembly()
    .add(blockGeometry(W, 0.05, D), 'light', { pos: [0, -0.025, 0] })
  const rail = beamGeometry({ length: W, width: 0.09, thickness: 0.035, holes: [0, W / 2, W], slots: [[0.18, W / 2 - 0.18], [W / 2 + 0.18, W - 0.18]] })
  for (const z of [-D / 2 - 0.06, D / 2 + 0.06]) board.add(rail, 'mid', { pos: [-W / 2, 0.0, z], rot: [-Math.PI / 2, 0, 0] })
  scene.add(board.build(m, 'board'))
  const grid: number[] = []
  for (let lon = -150; lon <= 150; lon += 30) grid.push(...at([lon, 90]).setY(0.001).toArray(), ...at([lon, -90]).setY(0.001).toArray())
  for (let lat = -60; lat <= 60; lat += 30) grid.push(...at([-180, lat]).setY(0.001).toArray(), ...at([180, lat]).setY(0.001).toArray())
  const gridGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(grid, 3))
  scene.add(new THREE.LineSegments(gridGeo, m.lineFaint))

  // Pins: a metal stem and a flat head; geometry shared.
  const stem = pinGeometry(0.011, 0.13).rotateX(Math.PI / 2).translate(0, 0.065, 0)
  const head = discGeometry(0.04, 0.025).rotateX(-Math.PI / 2).translate(0, 0.13, 0)
  const pinPart = (red: boolean) => new Assembly().add(stem, 'metal').add(head, red ? 'red' : 'dark').build(m, 'pin')
  const pins = new Map<string, { group: THREE.Group, t0: number }>()
  for (const [id, ll] of Object.entries(PLACES)) {
    const group = pinPart(id === 'kochi')
    group.position.copy(at(ll))
    group.visible = false
    scene.add(group)
    pins.set(id, { group, t0: Infinity })
  }
  // Kochi's ring: a circle on the board that grows and fades.
  const ringGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 65 }, (_, i) => new THREE.Vector3(Math.cos(i / 32 * Math.PI), 0, Math.sin(i / 32 * Math.PI))))
  const ringMat = new THREE.LineBasicMaterial({ color: ctx.palette.red, transparent: true, opacity: 0 })
  const ring = new THREE.Line(ringGeo, ringMat)
  ring.position.copy(at(PLACES.kochi!)).setY(0.003)
  scene.add(ring)

  // Arcs: raised curves between two pins' heads, drawn out over ARC seconds.
  const arcMat = new THREE.LineBasicMaterial({ color: ctx.palette.cyan })
  const arcs: { line: THREE.Line, t0: number, n: number }[] = []
  const arcKeys = new Set<string>()
  function connect(from: string, t: number) {
    let i = 0
    for (const [id, p] of pins) {
      if (id === from || p.t0 > t || arcKeys.has(`${from}>${id}`)) continue
      const a = at(PLACES[from]!).setY(0.13), b = at(PLACES[id]!).setY(0.13)
      const mid = a.clone().lerp(b, 0.5).setY(0.13 + a.distanceTo(b) * 0.35)
      const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(48)
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat)
      line.geometry.setDrawRange(0, 0)
      scene.add(line)
      arcs.push({ line, t0: t + i * 0.12, n: pts.length })
      arcKeys.add(`${from}>${id}`)
      i++
    }
  }

  let time = 0
  const drop = (id: string, t: number) => {
    const p = pins.get(id)
    if (p && p.t0 === Infinity) p.t0 = t
  }
  return {
    scene,
    camera,
    step(dt) {
      time += dt
    },
    frame() {
      // A slow, steady drift round the board: the map is alive between cues.
      const yaw = 0.12 * Math.sin(time * 0.35)
      camera.position.set(Math.sin(yaw) * 2.6, 2.3, Math.cos(yaw) * 2.6).add(aim)
      camera.lookAt(aim)
      for (const p of pins.values()) {
        const k = (time - p.t0) / DROP
        p.group.visible = k >= 0
        if (k >= 0) p.group.position.y = dropY(k)
      }
      const kochi = pins.get('kochi')!
      const r = (time - kochi.t0 - DROP) / 1.6
      ringMat.opacity = r >= 0 ? 1 - ease(r % 1) : 0
      ring.scale.setScalar(0.04 + 0.22 * ease(r % 1))
      for (const a of arcs) a.line.geometry.setDrawRange(0, Math.round(a.n * ease((time - a.t0) / ARC)))
    },
    resize(w, h) {
      fitOrtho(camera, w, h, opts.view ?? 1.5)
    },
    action(name) {
      if (name.startsWith('pin:')) { drop(name.slice(4), time); return name }
      if (name === 'pins') { Object.keys(PLACES).filter(id => id !== 'kochi').forEach((id, i) => drop(id, time + i * 0.18)); return name }
      if (name === 'kochi') { drop('kochi', time); return name }
      if (name === 'links') { connect('kochi', time); return name }
      if (name === 'travel') { connect('bay-area', time); return name }
      return null
    },
    dispose() {
      scene.traverse(o => (o as THREE.Mesh).geometry?.dispose())
      ringMat.dispose()
      arcMat.dispose()
    },
  }
}
