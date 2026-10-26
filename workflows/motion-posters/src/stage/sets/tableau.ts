// The tableau: our stage for a poster's beats. Each beat sets out CC0 props from the design system's library
// (design-system/3d, restyled to its standard) and, where a person or a robot is the subject, the makerfaire.in
// actors (Makey, the people), then plays the beat's motions, effects and actions at the times the storyboard
// gives (render.mjs resolves them to poster seconds). Props a beat keeps carry over to the next beat; the rest
// shrink away as the beat ends and the next beat's props come in. The camera frames each beat's props from an
// elevated three-quarter view; entry.ts adds the beat's camera move on top.
import * as THREE from 'three'
import type { SceneContext, SceneInstance } from '../../../vendor/website/app/three/core/stage'
import type { RobotCommand } from '../../../vendor/website/app/three/robots/types'
import { createMakey } from '../../../vendor/website/app/three/robots/makey/makey'
import { createPerson } from '../../../vendor/website/app/three/people/person'
import {
  Director, FX, Library, addLights, contactShadow, createMaterials, fitOrtho,
  type FxName, type Fx, type Manifest, type MotionName, type MotionParams, type Model,
} from '../../../../../design-system/3d/src/index'

type V3 = [number, number, number]
export interface PropSpec { name: string, model: string, at?: V3, yaw?: number, scale?: number, keep?: boolean, shadow?: boolean }
export interface ActorSpec { name: string, kind: 'makey' | 'person', variant?: string, seed?: number, at?: V3, yaw?: number, keep?: boolean, look?: Record<string, unknown>, accent?: boolean }
export interface BeatSpec {
  start: number
  end: number
  /** The last beat before the end card: its props stay. */
  final?: boolean
  frame?: { at?: V3, view?: number, yaw?: number, pitch?: number }
  props?: PropSpec[]
  actors?: ActorSpec[]
  /** [motion, target ("fan" or "fan.blades"), time, params] */
  do?: [MotionName, string, number, MotionParams?][]
  /** [effect, time, params]; points may name a prop: "@fan" is its position, "@fan+[0,0.1,0]" offset from it. */
  fx?: [FxName, number, Record<string, unknown>][]
  /** [action, actor, time, options] */
  act?: [string, string, number, Record<string, unknown>?][]
}

interface Actor { holder: THREE.Group, step(dt: number): void, frame(a: number): void, play(action: string, o?: Record<string, unknown>): void, size: THREE.Vector3 }

const ENTER = new Set(['drop', 'pop', 'rise', 'slide'])
const EXIT_S = 0.3

export default async function create(ctx: SceneContext, opts: { beats: BeatSpec[], manifest: Manifest, base: string, warm: number, t0?: number, fill?: number }): Promise<SceneInstance & { edges(on: boolean): void }> {
  const scene = new THREE.Scene()
  addLights(scene)
  const m = createMaterials()
  const lib = new Library(opts.manifest, opts.base, m)
  const director = new Director(m)
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 60)
  let aspect = 1

  const things = new Map<string, { root: THREE.Object3D, model?: Model, actor?: Actor }>()
  const effects: Fx[] = []
  const actors: Actor[] = []
  const acts: { t: number, actor: Actor, action: string, o?: Record<string, unknown>, done: boolean }[] = []

  const makeActor = (s: ActorSpec): Actor => {
    const holder = new THREE.Group()
    if (s.kind === 'makey') {
      const makey = createMakey(ctx, { accent: 'accent', seed: s.seed ?? 31, posterMode: false })
      holder.add(makey.root)
      makey.placeAt(0, 0, 0)
      const cmd: RobotCommand = { speed: 0, yawRate: 0 }
      return {
        holder, size: new THREE.Vector3(0.18, 0.26, 0.14),
        step: dt => makey.step(dt, cmd),
        frame: a => makey.frame(a),
        play: (action) => {
          if (action === 'wave') makey.wave(1)
          else if (action === 'hop') makey.react('tap')
          else makey.react(action as never)
        },
      }
    }
    const p = createPerson(ctx, { seed: s.seed ?? 3, variant: (s.variant ?? 'shirt') as never, posterMode: false, look: s.look as never, accent: s.accent })
    holder.add(p.root)
    p.placeAt(0, 0, 0)
    const h = s.variant === 'child' ? 1.15 : 1.7
    return {
      holder, size: new THREE.Vector3(0.5, h, 0.3),
      step: dt => p.step(dt),
      frame: a => p.frame(a),
      play: (action, o) => p.play(action as never, o as never),
    }
  }

  // Build every beat's things (kept ones are reused), then schedule their entries and exits.
  const lifetimes = new Map<string, { first: number, last: number }>()
  for (let bi = 0; bi < opts.beats.length; bi++) {
    const beat = opts.beats[bi]!
    const specs: (PropSpec | ActorSpec)[] = [...(beat.props ?? []), ...(beat.actors ?? [])]
    for (const s of specs) {
      const existing = things.get(s.name)
      if (existing && s.keep) { lifetimes.get(s.name)!.last = bi; continue }
      if (existing) throw new Error(`beat ${bi + 1}: "${s.name}" is already on stage; add keep: true or use another name`)
      let root: THREE.Object3D, model: Model | undefined, actor: Actor | undefined
      if ('model' in s) {
        model = await lib.instantiate(s.model)
        root = model.root
        if (s.shadow !== false) root.add(contactShadow(Math.max(model.size.x, model.size.z) * 0.62))
      }
      else {
        actor = makeActor(s)
        actors.push(actor)
        root = actor.holder
      }
      root.position.set(...(s.at ?? [0, 0, 0]))
      root.rotation.y = s.yaw ?? 0
      if ('scale' in s && s.scale) root.scale.setScalar(s.scale)
      scene.add(root)
      things.set(s.name, { root, model, actor })
      lifetimes.set(s.name, { first: bi, last: bi })
    }
  }
  const target = (name: string) => {
    const [base, part] = name.split('.')
    const th = things.get(base!)
    if (!th) throw new Error(`No prop or actor "${base}" on stage`)
    if (!part) return { object: th.root, model: th.model }
    const o = th.model?.parts[part]
    if (!o) throw new Error(`"${base}" (${th.model?.id}) has no part "${part}"`)
    // A part moves in its model's source units; its moves are given in metres.
    th.root.updateMatrixWorld(true)
    const ws = o.parent!.getWorldScale(new THREE.Vector3()).x / th.root.getWorldScale(new THREE.Vector3()).x
    return { object: o, model: th.model, unit: 1 / ws }
  }
  // Entries: a thing's first beat may give one (drop, pop, rise, slide); otherwise it pops in, staggered.
  const entered = new Set<string>()
  opts.beats.forEach((beat) => {
    for (const [name, t, motion] of (beat.do ?? []).map(d => [d[1], d[2], d[0]] as const))
      if (ENTER.has(motion) && !name.includes('.')) entered.add(name)
  })
  let stagger = 0
  for (const [name, life] of lifetimes) {
    const beat = opts.beats[life.first]!
    if (!entered.has(name)) director.play(target(name), 'pop', beat.start + 0.05 + 0.08 * stagger++, { dur: 0.45 })
    const lastBeat = opts.beats[life.last]!
    if (!lastBeat.final) director.play(target(name), 'shrink', lastBeat.end - EXIT_S, { dur: EXIT_S })
  }
  // The beats' own motions, effects and actions.
  const point = (v: unknown): V3 => {
    if (Array.isArray(v)) return v as V3
    const s = String(v), mt = s.match(/^@([\w-]+)(?:\+\[([^\]]+)\])?$/)
    if (!mt) throw new Error(`Bad point ${s}`)
    const p = things.get(mt[1]!)!.root.position.clone()
    if (mt[2]) p.add(new THREE.Vector3(...mt[2].split(',').map(Number) as V3))
    return p.toArray() as V3
  }
  for (const beat of opts.beats) {
    for (const [motion, name, t, p] of beat.do ?? []) director.play(target(name), motion, t, p ?? {})
    for (const [kind, t, p] of beat.fx ?? []) {
      const o: Record<string, unknown> = { ...p, t0: t, m }
      for (const k of ['at', 'from', 'to', 'spine']) if (k in o) o[k] = point(o[k])
      if (Array.isArray(o.points)) o.points = (o.points as unknown[]).map(point)
      const fx = (FX[kind] as (o: never) => Fx)(o as never)
      scene.add(fx.object)
      // An effect belongs to its beat: it stops when the beat's things leave (or at the end, for the last beat).
      const until = beat.final ? Infinity : beat.end
      effects.push({ object: fx.object, update: t => { fx.update(t); if (t >= until) fx.object.visible = false } })
    }
    for (const [action, name, t, o] of beat.act ?? []) {
      const a = things.get(name)?.actor
      if (!a) throw new Error(`"${name}" is not an actor`)
      acts.push({ t, actor: a, action, o, done: false })
    }
  }

  // The framing per beat: given, or fitted round the beat's things at rest.
  const frames = opts.beats.map((beat) => {
    const box = new THREE.Box3()
    for (const s of [...(beat.props ?? []), ...(beat.actors ?? [])]) {
      const th = things.get(s.name)!
      const size = th.model?.size ?? th.actor!.size
      const sc = th.root.scale.x, p = th.root.position
      box.expandByPoint(new THREE.Vector3(p.x - size.x * sc / 2, p.y, p.z - size.z * sc / 2))
      box.expandByPoint(new THREE.Vector3(p.x + size.x * sc / 2, p.y + size.y * sc, p.z + size.z * sc / 2))
    }
    const centre = beat.frame?.at ? new THREE.Vector3(...beat.frame.at) : box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    return { centre, size, view: beat.frame?.view, yaw: beat.frame?.yaw ?? -0.62, pitch: beat.frame?.pitch ?? 0.52 }
  })

  let time = 0
  // The stage may start mid-poster (after a cut from a website scene): t0 is the poster time it starts at.
  const posterTime = () => time - opts.warm + (opts.t0 ?? 0)
  return {
    scene,
    camera,
    step(dt) {
      time += dt
      const t = posterTime()
      for (const a of acts) if (!a.done && t >= a.t) { a.done = true; a.actor.play(a.action, a.o) }
      for (const a of actors) a.step(dt)
    },
    frame(alpha) {
      const t = posterTime()
      director.update(t)
      for (const fx of effects) fx.update(t)
      for (const a of actors) a.frame(alpha)
      // The current beat's framing (the end card keeps the last).
      let i = opts.beats.findIndex(b => t < b.end)
      if (i < 0) i = opts.beats.length - 1
      const f = frames[i]!
      const width = Math.hypot(f.size.x, f.size.z)
      // fill < 1 frames closer: the Weave look's object fills its hole in the text.
      const view = (f.view ?? Math.max(f.size.y * 1.5, width * 1.25 / aspect, 0.2)) * (opts.fill ?? 1)
      const d = 20
      camera.position.set(
        f.centre.x + Math.sin(f.yaw) * Math.cos(f.pitch) * d,
        f.centre.y + Math.sin(f.pitch) * d,
        f.centre.z + Math.cos(f.yaw) * Math.cos(f.pitch) * d)
      camera.lookAt(f.centre)
      camera.zoom = 1
      fitOrtho(camera, aspect, 1, view)
    },
    resize(w, h) {
      aspect = w / h
      fitOrtho(camera, w, h, 1)
    },
    /** Ink edges disappear on ink and blue grounds; the faces carry the form there. */
    edges(on) {
      m.line.visible = on
      m.lineFaint.visible = on
    },
    dispose() {
      scene.traverse(o => (o as THREE.Mesh).geometry?.dispose())
    },
  }
}
