// The sets a storyboard can name. Each builds a website scene (vendor/website/app/three) and may add cues of its
// own (camera shots, props) on top of the scene's action() names.
import type { SceneContext, SceneInstance } from '../../../vendor/website/app/three/core/stage'
import backwater from '../../../vendor/website/app/three/scenes/backwater/index'
import { scrollShot } from '../../../vendor/website/app/three/scenes/backwater/shots'
import electronics from '../../../vendor/website/app/three/scenes/electronics/index'
import { scrollShot as benchShot } from '../../../vendor/website/app/three/scenes/electronics/shots'
import hero from '../../../vendor/website/app/three/scenes/hero'
import workshop from '../../../vendor/website/app/three/scenes/workshop/index'
import people from '../../../vendor/website/app/three/people/lab'
import makey from './makey'
import pinMap from './pin-map'

export interface MadeSet {
  inst: SceneInstance
  cue: ((name: string, arg?: unknown) => string | null) | null
}

type SetFactory = (ctx: SceneContext, opts: Record<string, unknown>) => Promise<MadeSet>

/** A camera-shot cue for the scenes whose page writes a plain `scrollShot.progress` (the scene eases to it). */
const shots = (target: { progress: number }) => (name: string, arg?: unknown) => {
  if (name !== 'shot') return null
  target.progress = Number(arg)
  return `shot ${arg}`
}

/** Some lab scenes read options from the page address (people: ?person=child&vh=1.2); opts.query sets it while they build. */
async function withQuery<T>(query: unknown, build: () => Promise<T>): Promise<T> {
  if (!query) return build()
  const was = location.search
  history.replaceState(null, '', `?${query}`)
  try {
    return await build()
  }
  finally {
    history.replaceState(null, '', was || location.pathname)
  }
}

export const SETS = {
  /** Makey, close and centred (sets/makey.ts); cues: wave, hop, shove, tumble, walk. opts.view: view height (m). */
  makey: async (ctx, opts) => ({ inst: await makey(ctx, opts), cue: null }),
  /** The Fort Kochi cheena vala; cue shot <0..3> (wide, fishers, net, bank), plus dip, wave, kite. */
  backwater: async (ctx, opts) => {
    scrollShot.progress = Number(opts.shot ?? 0)
    return { inst: await backwater(ctx), cue: shots(scrollShot) }
  },
  /** The electronics bench; cue shot <0..3> (bench, iron, board, breadboard), plus solder, boot, chase, servo, lamp, measure, wave. */
  electronics: async (ctx, opts) => {
    benchShot.progress = Number(opts.shot ?? 0)
    return { inst: await electronics(ctx), cue: shots(benchShot) }
  },
  /** The carpenter's workshop; cues: saw, plane, chisel, stool (comes apart / goes together), wave. */
  workshop: async ctx => ({ inst: await workshop(ctx), cue: null }),
  /** A fair group round a robot's spot, three people at work and the art props; cues: wave, clap, point, look-here,
   * plot, mobile, kite, pots, lantern. opts.query frames one person, e.g. "person=child&vh=1.6". */
  people: async (ctx, opts) => ({ inst: await withQuery(opts.query, async () => people(ctx)), cue: null }),
  /** A pin map of the places the copy names (sets/pin-map.ts); cues: pin:<id>, pins, kochi, links, travel. */
  'pin-map': async (ctx, opts) => ({ inst: await pinMap(ctx, opts), cue: null }),
  /** The hero playground: Makey, ducks, the balancer and the dog playing football (plays by itself). */
  hero: async ctx => ({ inst: await hero(ctx), cue: null }),
} satisfies Record<string, SetFactory>

export type SetName = keyof typeof SETS
