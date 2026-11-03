// Effects: small procedural events that make an object's change readable (a spark on a wrong circuit, smoke off
// a burnt batch, a seam being stitched, a cable rejoining, pages turning, a connection drawing between two places).
// Like the motions, every effect is a pure function of time: update(t) with t in the poster's seconds.
import * as THREE from 'three'
import { arcLine, ringLine } from './kit'
import { KEYS, type Key, type Materials } from './palette'
import { clamp01, easeOut, smoother } from './motions'

export interface Fx {
  object: THREE.Object3D
  update(t: number): void
}

type V3 = [number, number, number]
const vec = (a: V3) => new THREE.Vector3(...a)
/** A small seeded random, so an effect's scatter is the same every render. */
function rand(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** A burst of short lines from a point (red: a fault). */
export function spark(o: { at: V3, t0: number, color?: string, count?: number, size?: number, dur?: number, seed?: number }): Fx {
  const n = o.count ?? 12, size = o.size ?? 0.06, dur = o.dur ?? 0.5, r = rand(o.seed ?? 7)
  const dirs = Array.from({ length: n }, () => new THREE.Vector3(r() - 0.5, r() * 0.8 + 0.2, r() - 0.5).normalize())
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3))
  const mat = new THREE.LineBasicMaterial({ color: o.color ?? KEYS.red, transparent: true })
  const lines = new THREE.LineSegments(geo, mat)
  lines.position.copy(vec(o.at))
  lines.frustumCulled = false
  return {
    object: lines,
    update(t) {
      const k = (t - o.t0) / dur
      lines.visible = k >= 0 && k < 1
      if (!lines.visible) return
      const pos = geo.getAttribute('position') as THREE.BufferAttribute
      const a = easeOut(k) * size, b = Math.max(0, easeOut(k) - 0.45) * size
      dirs.forEach((d, i) => {
        pos.setXYZ(i * 2, d.x * b, d.y * b, d.z * b)
        pos.setXYZ(i * 2 + 1, d.x * a, d.y * a, d.z * a)
      })
      pos.needsUpdate = true
      mat.opacity = 1 - smoother((k - 0.6) / 0.4)
    },
  }
}

/** Puffs that rise, grow and fade (smoke off a burnt batch: stone; steam: light). */
export function smoke(o: { at: V3, t0: number, m: Materials, key?: Key, count?: number, size?: number, dur?: number, spread?: number, seed?: number }): Fx {
  const n = o.count ?? 6, size = o.size ?? 0.03, dur = o.dur ?? 1.6, r = rand(o.seed ?? 11)
  const g = new THREE.Group()
  g.position.copy(vec(o.at))
  const mat = new THREE.MeshLambertMaterial({ color: KEYS[o.key ?? 'stone'], transparent: true, depthWrite: false })
  const geo = new THREE.IcosahedronGeometry(1, 1)
  const puffs = Array.from({ length: n }, (_, i) => {
    const mesh = new THREE.Mesh(geo, mat)
    g.add(mesh)
    return { mesh, delay: i * dur / n * 0.9, dx: (r() - 0.5) * (o.spread ?? 0.06), dz: (r() - 0.5) * (o.spread ?? 0.06) }
  })
  return {
    object: g,
    update(t) {
      // Puffs keep coming: each loops over dur after its delay.
      let shown = false
      for (const p of puffs) {
        const s = t - o.t0 - p.delay
        p.mesh.visible = s >= 0
        if (s < 0) continue
        shown = true
        const k = (s % dur) / dur
        p.mesh.position.set(p.dx * k, size * 2 + k * size * 6, p.dz * k)
        p.mesh.scale.setScalar(size * (0.4 + k * 1.2))
      }
      mat.opacity = shown ? 0.55 : 0
      g.visible = shown
    },
  }
}

/** Stitches along a line, laid one by one behind a needle that bobs (red thread: the action). */
export function seam(o: { from: V3, to: V3, t0: number, m: Materials, dur?: number, stitches?: number }): Fx {
  const n = o.stitches ?? 9, dur = o.dur ?? 1.4
  const a = vec(o.from), b = vec(o.to), g = new THREE.Group()
  const pts: THREE.Vector3[] = []
  const len = a.distanceTo(b), side = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(len / n * 0.35)
  for (let i = 0; i < n; i++) {
    const p = a.clone().lerp(b, (i + 0.5) / n)
    pts.push(p.clone().add(side), p.clone().sub(side))
  }
  const thread = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: KEYS.red }))
  thread.geometry.setDrawRange(0, 0)
  const needleGeo = new THREE.CylinderGeometry(0.0025, 0.0006, len / n * 2.2, 8).translate(0, len / n * 1.1, 0)
  const needle = new THREE.Mesh(needleGeo, o.m.face.metal)
  needle.add(new THREE.LineSegments(new THREE.EdgesGeometry(needleGeo, 20), o.m.line))
  g.add(thread, needle)
  return {
    object: g,
    update(t) {
      const k = clamp01((t - o.t0) / dur)
      thread.geometry.setDrawRange(0, Math.floor(k * n) * 2)
      needle.visible = t >= o.t0 && k < 1
      const p = a.clone().lerp(b, k)
      needle.position.copy(p).setY(p.y + 0.004 + 0.01 * (0.5 + 0.5 * Math.cos(k * n * Math.PI * 2)))
      needle.rotation.z = -0.35
    },
  }
}

/** A cable in two pieces that rejoin: the loose end slides back to its socket (a lamp rewired). */
export function cable(o: { points: V3[], t0: number, m: Materials, gap?: number, dur?: number, radius?: number }): Fx {
  const curve = new THREE.CatmullRomCurve3(o.points.map(vec))
  const r = o.radius ?? 0.006, split = 0.55, g = new THREE.Group()
  const piece = (t0: number, t1: number) => {
    const sub = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => curve.getPoint(t0 + (t1 - t0) * i / 11)))
    return new THREE.Mesh(new THREE.TubeGeometry(sub, 48, r, 8, false), o.m.face.dark)
  }
  const fixed = piece(0, split), loose = piece(split, 1)
  g.add(fixed, loose)
  // The loose piece starts pulled away along the cable's direction at the split.
  const away = curve.getTangent(split).multiplyScalar(-(o.gap ?? 0.06)).add(new THREE.Vector3(0, 0.02, 0))
  const dur = o.dur ?? 0.6
  return {
    object: g,
    update(t) {
      const k = smoother((t - o.t0) / dur)
      loose.position.copy(away).multiplyScalar(1 - k)
    },
  }
}

/** Pages turning over a book's spine (along z through `spine`), one after another. */
export function pages(o: { spine: V3, width: number, depth: number, t0: number, m: Materials, count?: number, every?: number, dur?: number, lift?: number }): Fx {
  const n = o.count ?? 3, every = o.every ?? 0.35, dur = o.dur ?? 0.6, g = new THREE.Group()
  g.position.copy(vec(o.spine))
  const geo = new THREE.BoxGeometry(o.width, 0.0015, o.depth).translate(o.width / 2, 0, 0)
  const edges = new THREE.EdgesGeometry(geo, 20)
  const leaves = Array.from({ length: n }, (_, i) => {
    const leaf = new THREE.Group()
    leaf.add(new THREE.Mesh(geo, o.m.face.light), new THREE.LineSegments(edges, o.m.line))
    leaf.position.y = (o.lift ?? 0.004) + i * 0.0008
    g.add(leaf)
    return leaf
  })
  return {
    object: g,
    update(t) {
      leaves.forEach((leaf, i) => {
        const k = smoother((t - o.t0 - i * every) / dur)
        leaf.visible = t >= o.t0 + i * every && k < 1
        // Lifts off the right-hand page and lays down on the left: a half turn about the spine.
        leaf.rotation.z = Math.PI * k
      })
    },
  }
}

/** A connection drawn between two points (cyan). */
export function link(o: { from: V3, to: V3, t0: number, lift?: number, dur?: number, color?: string }): Fx {
  const line = arcLine(vec(o.from), vec(o.to), o.lift ?? 0.3, o.color)
  const n = line.userData.count as number, dur = o.dur ?? 0.9
  return {
    object: line,
    update(t) { line.geometry.setDrawRange(0, Math.round(n * smoother((t - o.t0) / dur))) },
  }
}

/** Rings that grow from a point and fade, again and again (reaching beyond a circle). */
export function ripple(o: { at: V3, t0: number, radius: number, color?: string, every?: number, rings?: number }): Fx {
  const g = new THREE.Group(), every = o.every ?? 0.7
  g.position.copy(vec(o.at))
  const rings = Array.from({ length: o.rings ?? 3 }, () => { const r = ringLine(1, o.color ?? KEYS.cyan); g.add(r); return r })
  return {
    object: g,
    update(t) {
      rings.forEach((ring, i) => {
        const s = t - o.t0 - i * every
        ring.visible = s >= 0
        if (s < 0) return
        const k = (s % (every * rings.length)) / (every * rings.length)
        ring.scale.setScalar(Math.max(1e-3, o.radius * easeOut(k)))
        ;(ring.material as THREE.LineBasicMaterial).opacity = 1 - k
      })
    },
  }
}

export const FX = { spark, smoke, seam, cable, pages, link, ripple }
export type FxName = keyof typeof FX
