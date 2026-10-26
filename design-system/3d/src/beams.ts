// The beam kit: the guidelines' illustration language in 3D (guidelines/references/illustration/
// straight-beam-baseline.png): straight slotted beams with round ends, plain pins with light caps, opaque faces
// and fine ink edges, neutral first, with one accent blue, red only for a drive input. Written for this design
// system (procedural, no source file); the library serves these assemblies beside the CC0 models, with joints
// as named parts so the motions can open, turn and swing them.
import * as THREE from 'three'
import { edgesFor } from './restyle'
import type { Key, Materials } from './palette'
import type { Model } from './restyle'

/** Hole spacing (metres): every beam is a whole number of pitches long. */
export const PITCH = 0.1
const WIDTH = PITCH * 0.62, THICK = PITCH * 0.14, HOLE = PITCH * 0.11, CAP = PITCH * 0.2

/** A beam lying along +x from its first hole (at the origin), in the x–y plane, thickness along +z. */
export function beamGeometry(pitches: number, slot = true) {
  const L = pitches * PITCH, r = WIDTH / 2, s = new THREE.Shape()
  s.moveTo(0, -r)
  s.lineTo(L, -r)
  s.absarc(L, 0, r, -Math.PI / 2, Math.PI / 2, false)
  s.lineTo(0, r)
  s.absarc(0, 0, r, Math.PI / 2, Math.PI * 1.5, false)
  for (const x of [0, L]) {
    const h = new THREE.Path()
    h.absarc(x, 0, HOLE, 0, Math.PI * 2, true)
    s.holes.push(h)
  }
  if (slot && pitches >= 2) {
    // One slot down the middle, clear of the end holes.
    const a = PITCH * 0.55, b = L - PITCH * 0.55, sr = HOLE * 0.9, h = new THREE.Path()
    h.moveTo(a, -sr)
    h.lineTo(b, -sr)
    h.absarc(b, 0, sr, -Math.PI / 2, Math.PI / 2, false)
    h.lineTo(a, sr)
    h.absarc(a, 0, sr, Math.PI / 2, Math.PI * 1.5, false)
    s.holes.push(h)
  }
  return new THREE.ExtrudeGeometry(s, { depth: THICK, bevelEnabled: false, curveSegments: 16 })
}

/** A pin through a joint: a light cap with a dark centre on each face of the stack. */
function pin(m: Materials, depth: number) {
  const g = new THREE.Group()
  const capGeo = new THREE.CylinderGeometry(CAP, CAP, THICK * 0.35, 28).rotateX(Math.PI / 2)
  const dotGeo = new THREE.CylinderGeometry(HOLE * 0.45, HOLE * 0.45, THICK * 0.4, 16).rotateX(Math.PI / 2)
  for (const z of [-THICK * 0.18, depth + THICK * 0.18]) {
    const cap = new THREE.Mesh(capGeo, m.face.light)
    cap.position.z = z
    const dot = new THREE.Mesh(dotGeo, m.face.dark)
    dot.position.z = z + (z < 0 ? -0.0004 : 0.0004)
    const rim = edgesFor(capGeo, m)
    rim.position.copy(cap.position)
    g.add(cap, dot, rim)
  }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(HOLE * 0.9, HOLE * 0.9, depth, 16).rotateX(Math.PI / 2).translate(0, 0, depth / 2), m.face.metal)
  g.add(shaft)
  return g
}

interface Built { root: THREE.Group, parts: Record<string, THREE.Object3D>, meshes: Model['meshes'] }

/** A beam as a group: faces in `key`, ink edges (none on dark), pivot at its first hole. */
function beam(m: Materials, b: Built, name: string, pitches: number, key: Key, slot = true) {
  const g = new THREE.Group()
  g.name = name
  const geo = beamGeometry(pitches, slot)
  const mesh = new THREE.Mesh(geo, m.face[key])
  g.add(mesh)
  if (key !== 'dark') g.add(edgesFor(geo, m, 20))
  b.meshes.push({ mesh, key, part: name })
  b.parts[name] = g
  return g
}

/** Finishes an assembly: stands it on y = 0, centred on x/z, and measures it. */
function finish(id: string, b: Built): Model {
  const box = new THREE.Box3().setFromObject(b.root)
  const c = box.getCenter(new THREE.Vector3())
  const inner = new THREE.Group()
  while (b.root.children.length) inner.add(b.root.children[0]!)
  inner.position.set(-c.x, -box.min.y, -c.z)
  b.root.add(inner)
  let triangles = 0
  b.root.traverse(o => { const g = (o as THREE.Mesh).geometry; if ((o as THREE.Mesh).isMesh && g) triangles += (g.index ? g.index.count : g.getAttribute('position').count) / 3 })
  return { id, root: b.root, parts: b.parts, size: box.getSize(new THREE.Vector3()), triangles: Math.round(triangles), meshes: b.meshes }
}

/** A chain of beams, each pinned to the end of the one before: joint i turns beam i about its first hole. */
function chain(m: Materials, b: Built, links: { pitches: number, key: Key, angle: number }[]) {
  let parent: THREE.Object3D = b.root, z = 0, x = 0
  links.forEach((l, i) => {
    const joint = new THREE.Group()
    joint.name = `joint${i}`
    joint.position.set(x, 0, z)
    joint.rotation.z = l.angle
    parent.add(joint)
    b.parts[`joint${i}`] = joint
    joint.add(beam(m, b, `beam${i}`, l.pitches, l.key))
    joint.add(pin(m, THICK))
    parent = joint
    x = l.pitches * PITCH
    z = THICK * 1.05
  })
  const end = new THREE.Group()
  end.position.set(x, 0, z - THICK * 1.05)
  end.add(pin(m, THICK))
  parent.add(end)
}

export const BEAMS: Record<string, { title: string, uses: string, build(m: Materials): Model }> = {
  'beam-gesture': {
    title: 'Open gesture (the baseline study: ink, paper, one blue)',
    uses: 'An open invitation: the blue beam opens the joint (joint3 turns).',
    build(m) {
      const b: Built = { root: new THREE.Group(), parts: {}, meshes: [] }
      chain(m, b, [
        // As the baseline: an ink foot and an ink upright, a paper beam rising, the blue one reaching out.
        { pitches: 3, key: 'dark', angle: Math.PI - 0.15 },
        { pitches: 3, key: 'dark', angle: -Math.PI / 2 + 0.15 },
        { pitches: 3, key: 'light', angle: -1.05 },
        { pitches: 3, key: 'accent', angle: -1.13 },
      ])
      return finish('beam-gesture', b)
    },
  },
  'beam-crank': {
    title: 'Crank on a post (red: the drive input)',
    uses: 'You try: the red crank turns (spin "crank") and lifts the arm (turn "arm").',
    build(m) {
      const b: Built = { root: new THREE.Group(), parts: {}, meshes: [] }
      // A post standing up, a red crank on its top pin, a long arm on a lower pin.
      const post = new THREE.Group()
      post.rotation.z = Math.PI / 2
      post.add(beam(m, b, 'post', 4, 'light'))
      b.root.add(post)
      const crank = new THREE.Group()
      crank.name = 'crank'
      crank.position.set(0, 4 * PITCH, THICK * 1.05)
      crank.add(beam(m, b, 'crank-beam', 1, 'red', false), pin(m, THICK))
      b.root.add(crank)
      b.parts.crank = crank
      const arm = new THREE.Group()
      arm.name = 'arm'
      arm.position.set(0, 2 * PITCH, -THICK * 1.05)
      arm.rotation.z = -0.25
      arm.add(beam(m, b, 'arm-beam', 4, 'light'), pin(m, THICK))
      b.root.add(arm)
      b.parts.arm = arm
      return finish('beam-crank', b)
    },
  },
  ...Object.fromEntries(([['s', 2], ['m', 3], ['l', 5]] as const).map(([k, n]) => [`beam-frame-${k}`, {
    title: `Square frame, ${n} pitches a side`,
    uses: 'One network, many sizes: frames of different sizes, one beam vocabulary.',
    build(m: Materials) {
      const b: Built = { root: new THREE.Group(), parts: {}, meshes: [] }
      const sides: [number, number, number][] = [[0, 0, 0], [n, 0, Math.PI / 2], [n, n, Math.PI], [0, n, -Math.PI / 2]]
      sides.forEach(([x, y, a], i) => {
        const g = new THREE.Group()
        g.position.set(x * PITCH, y * PITCH, i % 2 ? THICK * 1.05 : 0)
        g.rotation.z = a
        g.add(beam(m, b, `side${i}`, n, 'light'), pin(m, THICK))
        b.root.add(g)
      })
      return finish(`beam-frame-${k}`, b)
    },
  }])),
  'beam-link': {
    title: 'A single beam, 4 pitches (a connection)',
    uses: 'A connection: the beam swings across and pins two things together.',
    build(m) {
      const b: Built = { root: new THREE.Group(), parts: {}, meshes: [] }
      const g = new THREE.Group()
      g.name = 'swing'
      g.add(beam(m, b, 'link', 4, 'accent'), pin(m, THICK))
      b.root.add(g)
      b.parts.swing = g
      return finish('beam-link', b)
    },
  },
}
