// Makey for the posters: the website's robot (createMakey) on the paper, framed close and kept at the centre.
// Unlike its lab scene it never wanders off by itself; the storyboard's cues make it act:
// wave, hop, shove, tumble (falls, gets up, dusts off, waves), and walk (a few steps toward the viewer and back).
import * as THREE from 'three'
import { addLights, fitOrtho } from '../../../vendor/website/app/three/core/kit'
import type { SceneContext, SceneInstance } from '../../../vendor/website/app/three/core/stage'
import type { RobotCommand } from '../../../vendor/website/app/three/robots/types'
import { createMakey } from '../../../vendor/website/app/three/robots/makey/makey'

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export default async function create(ctx: SceneContext, opts: { view?: number }): Promise<SceneInstance> {
  const scene = new THREE.Scene()
  addLights(scene)
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
  camera.position.set(1.9, 1.45, 2.9)
  camera.lookAt(0, 0.17, 0)
  const makey = createMakey(ctx, { accent: 'accent', seed: 31, posterMode: false })
  scene.add(makey.root)
  const camYaw = Math.atan2(camera.position.x, camera.position.z)
  makey.placeAt(0, 0, camYaw - 0.35)
  // Eyes on the viewer: a point on the camera's side, so it greets the audience.
  const viewer = new THREE.Vector3(camera.position.x * 0.2, 0.35, camera.position.z * 0.2)
  makey.lookAt(viewer)

  const cmd: RobotCommand = { speed: 0, yawRate: 0 }
  let goal: { x: number, z: number } | null = null
  const home = { x: 0, z: 0 }

  return {
    scene,
    camera,
    step(dt) {
      cmd.speed = 0
      cmd.yawRate = 0
      if (!makey.busy && !makey.fallen) {
        const target = goal ?? home
        const dx = target.x - makey.position.x, dz = target.z - makey.position.z, dist = Math.hypot(dx, dz)
        // Walk to the goal, then come home; at home turn back to face the viewer.
        const heading = dist > 0.03 ? Math.atan2(dx, dz) : camYaw - 0.35
        const err = wrap(heading - makey.heading)
        cmd.yawRate = clamp(2.4 * err, -1.3, 1.3)
        if (dist > 0.03) cmd.speed = Math.min(makey.maxSpeed * 0.8, dist) * Math.max(0, Math.cos(err)) ** 2
        else if (goal) goal = null
      }
      makey.step(dt, cmd)
    },
    frame(alpha) {
      makey.frame(alpha)
    },
    resize(w, h) {
      fitOrtho(camera, w, h, opts.view ?? 0.62)
    },
    action(name) {
      switch (name) {
        case 'wave': if (makey.fallen) return null; makey.wave(1); return 'wave'
        case 'hop': if (makey.busy) return null; makey.react('tap'); return 'hop'
        case 'shove': makey.react('shove'); return 'shove'
        case 'tumble': makey.react('tumble'); return 'tumble'
        case 'walk': goal = { x: 0.12, z: 0.22 }; return 'walk'
      }
      return null
    },
    dispose() {
      makey.dispose()
    },
  }
}
