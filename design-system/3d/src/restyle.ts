// Loads a CC0 model (glTF binary) and restyles it to the standard (3d/STANDARD.md): every map and PBR material is
// dropped, every face takes one palette key (from its material, its colour-atlas texel, or the manifest's
// overrides), faces are opaque Lambert with polygon offset, and edges are 1px ink hairlines (none on dark parts).
// The node hierarchy is kept, so a rig (a robot arm's elements) still moves joint by joint; the manifest can also
// cut named parts out of a single mesh (a fan's blades by material, a lamp's head by a box) with their own pivot.
// The model is normalised to metres, standing on y = 0, centred on x/z.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { keyFor, NO_EDGES, type Key, type Materials } from './palette'

export interface PartSpec {
  /** Select by node name (the node and everything under it; the hierarchy is kept). */
  node?: string
  /** Select faces by source material name. */
  material?: string
  /** Select faces whose centre lies in this box, as fractions of the model's bounds: [x0, y0, z0, x1, y1, z1]. */
  box?: [number, number, number, number, number, number]
  /** Recolour the part's faces to one key. */
  key?: Key
  /** Pivot for the part (faces cut out of a mesh), as fractions of the model's bounds; default the part's centre. */
  pivot?: [number, number, number]
}

export interface ModelSpec {
  id: string
  file: string
  /** Real height in metres; the model is scaled to it (after `rotate`). */
  height: number
  /** Euler rotation (radians) applied first, for a model authored on its side (a board standing up). */
  rotate?: [number, number, number]
  /** Crease angle for edges, degrees: 20 for plates and blocks, 40–60 for curved models. */
  edge?: number
  /** Source material name → key. */
  materials?: Record<string, Key>
  /** Source colour (#rrggbb, matched within a small distance) → key. */
  colors?: Record<string, Key>
  parts?: Record<string, PartSpec>
}

export interface Model {
  id: string
  root: THREE.Group
  /** Named parts (groups whose origin is the part's pivot). */
  parts: Record<string, THREE.Object3D>
  /** Size in metres after normalising. */
  size: THREE.Vector3
  triangles: number
  /** Every face mesh, by key: what a motion recolours (a burnt batch, a lit bulb). */
  meshes: { mesh: THREE.Mesh, key: Key, part: string | null }[]
}

const loader = new GLTFLoader()
const atlasCache = new Map<unknown, ImageData>()

function atlas(tex: THREE.Texture): ImageData {
  const img = tex.image as CanvasImageSource & { width: number, height: number }
  let data = atlasCache.get(img)
  if (!data) {
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.drawImage(img, 0, 0)
    data = g.getImageData(0, 0, c.width, c.height)
    atlasCache.set(img, data)
  }
  return data
}

function texel(data: ImageData, u: number, v: number): [number, number, number] {
  const fr = (x: number) => x - Math.floor(x)
  const x = Math.min(data.width - 1, Math.floor(fr(u) * data.width)), y = Math.min(data.height - 1, Math.floor(fr(v) * data.height))
  const i = (y * data.width + x) * 4
  // The atlas is sRGB; the palette keys compare in sRGB too.
  return [data.data[i]! / 255, data.data[i + 1]! / 255, data.data[i + 2]! / 255]
}

const hexRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
}

/** Edges for a geometry: 1px ink lines at the crease angle. */
export function edgesFor(geo: THREE.BufferGeometry, m: Materials, angle = 20) {
  const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, angle), m.line)
  lines.name = 'edges'
  return lines
}

export async function loadModel(url: string, spec: ModelSpec, m: Materials): Promise<Model> {
  const gltf = await loader.loadAsync(url)
  const src = gltf.scene
  if (spec.rotate) src.rotation.set(...spec.rotate)
  src.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(src)
  const span = box.getSize(new THREE.Vector3())
  const scale = spec.height / Math.max(1e-6, span.y)
  const frac = (f: [number, number, number]) => new THREE.Vector3(
    box.min.x + f[0] * span.x, box.min.y + f[1] * span.y, box.min.z + f[2] * span.z)

  const parts: Record<string, THREE.Object3D> = {}
  const meshes: Model['meshes'] = []
  const colorRules = Object.entries(spec.colors ?? {}).map(([hex, key]) => ({ rgb: hexRgb(hex), key }))
  let triangles = 0

  const partByNode = (o: THREE.Object3D) => {
    for (let n: THREE.Object3D | null = o; n; n = n.parent)
      for (const [name, p] of Object.entries(spec.parts ?? {})) if (p.node && p.node === n.name) return name
    return null
  }
  const cutParts = Object.entries(spec.parts ?? {}).filter(([, p]) => !p.node)

  const sourceMeshes: THREE.Mesh[] = []
  const dropped = new Set<THREE.Material>()
  src.traverse(o => { if ((o as THREE.Mesh).isMesh) sourceMeshes.push(o as THREE.Mesh) })
  for (const mesh of sourceMeshes) {
    const geo = mesh.geometry
    const pos = geo.getAttribute('position'), nor = geo.getAttribute('normal'), uv = geo.getAttribute('uv')
    const index = geo.index
    const mats = ([] as THREE.Material[]).concat(mesh.material)
    mats.forEach(x => dropped.add(x))
    const groups = geo.groups.length ? geo.groups : [{ start: 0, count: index ? index.count : pos.count, materialIndex: 0 }]
    const nodePart = partByNode(mesh)
    // Buckets: (cut part or null) × key → triangle vertex indices.
    const buckets = new Map<string, { part: string | null, key: Key, verts: number[] }>()
    const world = mesh.matrixWorld
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), centre = new THREE.Vector3()
    for (const g of groups) {
      const mat = mats[g.materialIndex ?? 0] as THREE.MeshStandardMaterial
      for (let t = g.start; t < g.start + g.count; t += 3) {
        const ia = index ? index.getX(t) : t, ib = index ? index.getX(t + 1) : t + 1, ic = index ? index.getX(t + 2) : t + 2
        a.fromBufferAttribute(pos, ia).applyMatrix4(world)
        b.fromBufferAttribute(pos, ib).applyMatrix4(world)
        c.fromBufferAttribute(pos, ic).applyMatrix4(world)
        centre.copy(a).add(b).add(c).divideScalar(3)
        let part: string | null = null
        let key: Key | undefined
        for (const [name, p] of cutParts) {
          if (p.material && p.material !== mat.name) continue
          if (p.box) {
            const lo = frac([p.box[0], p.box[1], p.box[2]]), hi = frac([p.box[3], p.box[4], p.box[5]])
            if (centre.x < lo.x || centre.y < lo.y || centre.z < lo.z || centre.x > hi.x || centre.y > hi.y || centre.z > hi.z) continue
          }
          part = name
          key = p.key
          break
        }
        if (!key && nodePart) key = spec.parts?.[nodePart]?.key
        if (!key) key = spec.materials?.[mat.name]
        if (!key) {
          let rgb: [number, number, number]
          if (mat.map && uv) {
            const data = atlas(mat.map)
            const u = (uv.getX(ia) + uv.getX(ib) + uv.getX(ic)) / 3, v = (uv.getY(ia) + uv.getY(ib) + uv.getY(ic)) / 3
            rgb = texel(data, u, v)
          }
          else {
            const col = mat.color.clone().convertLinearToSRGB()
            rgb = [col.r, col.g, col.b]
          }
          const rule = colorRules.find(r => Math.hypot(r.rgb[0] - rgb[0], r.rgb[1] - rgb[1], r.rgb[2] - rgb[2]) < 0.08)
          key = rule?.key ?? keyFor(rgb)
        }
        const id = `${part}|${key}`
        if (!buckets.has(id)) buckets.set(id, { part, key, verts: [] })
        buckets.get(id)!.verts.push(ia, ib, ic)
        triangles++
      }
    }
    // The restyled node: same local transform, children per bucket. Cut parts become pivoted child groups.
    const node = new THREE.Group()
    node.name = mesh.name
    node.position.copy(mesh.position)
    node.quaternion.copy(mesh.quaternion)
    node.scale.copy(mesh.scale)
    const inv = new THREE.Matrix4().copy(world).invert()
    const holders = new Map<string | null, THREE.Object3D>([[null, node]])
    for (const bucket of buckets.values()) {
      let holder = holders.get(bucket.part)
      let offset = new THREE.Vector3()
      if (!holder) {
        holder = new THREE.Group()
        holder.name = bucket.part!
        const pivotSpec = spec.parts![bucket.part!]!.pivot
        // Pivot in world (model) space → the mesh's local space.
        const pv = pivotSpec ? frac(pivotSpec) : partCentre(pos, buckets, bucket.part!, world)
        offset = pv.clone().applyMatrix4(inv)
        holder.position.copy(offset)
        node.add(holder)
        holders.set(bucket.part, holder)
        parts[bucket.part!] = holder
      }
      else offset = holder === node ? new THREE.Vector3() : holder.position.clone()
      const out = new THREE.BufferGeometry()
      const P = new Float32Array(bucket.verts.length * 3), N = new Float32Array(bucket.verts.length * 3)
      bucket.verts.forEach((vi, k) => {
        P[k * 3] = pos.getX(vi) - offset.x
        P[k * 3 + 1] = pos.getY(vi) - offset.y
        P[k * 3 + 2] = pos.getZ(vi) - offset.z
        if (nor) { N[k * 3] = nor.getX(vi); N[k * 3 + 1] = nor.getY(vi); N[k * 3 + 2] = nor.getZ(vi) }
      })
      out.setAttribute('position', new THREE.BufferAttribute(P, 3))
      if (nor) out.setAttribute('normal', new THREE.BufferAttribute(N, 3))
      else out.computeVertexNormals()
      const face = new THREE.Mesh(out, m.face[bucket.key])
      face.name = bucket.key
      holder.add(face)
      meshes.push({ mesh: face, key: bucket.key, part: bucket.part ?? nodePart })
      if (!NO_EDGES.has(bucket.key)) holder.add(edgesFor(out, m, spec.edge ?? 20))
    }
    mesh.parent!.add(node)
    mesh.parent!.remove(mesh)
    if (nodePart && mesh.name === spec.parts?.[nodePart]?.node) parts[nodePart] = node
    for (const child of [...mesh.children]) node.add(child)
  }
  // Rig parts selected by a node that has no mesh of its own (an empty joint).
  for (const [name, p] of Object.entries(spec.parts ?? {})) {
    if (p.node && !parts[name]) {
      const n = src.getObjectByName(p.node)
      if (n) parts[name] = n
    }
  }
  for (const mat of dropped) { (mat as THREE.MeshStandardMaterial).map?.dispose(); mat.dispose() }

  const root = new THREE.Group()
  root.name = spec.id
  const centre = box.getCenter(new THREE.Vector3())
  src.position.set(-centre.x, -box.min.y, -centre.z)
  const holder = new THREE.Group()
  holder.scale.setScalar(scale)
  holder.add(src)
  root.add(holder)
  return { id: spec.id, root, parts, size: span.clone().multiplyScalar(scale), triangles, meshes }
}

function partCentre(pos: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  buckets: Map<string, { part: string | null, verts: number[] }>, part: string, world: THREE.Matrix4) {
  const b = new THREE.Box3(), v = new THREE.Vector3()
  for (const bucket of buckets.values()) {
    if (bucket.part !== part) continue
    for (const vi of bucket.verts) b.expandByPoint(v.fromBufferAttribute(pos, vi).applyMatrix4(world))
  }
  return b.getCenter(new THREE.Vector3())
}
