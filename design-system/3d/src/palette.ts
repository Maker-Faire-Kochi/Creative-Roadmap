// The 3D palette: the material keys every model is restyled to (3d/STANDARD.md). The structure is neutral; red,
// cyan and the one accent blue are kept for a purpose (a drive input or fault, a selection or connection, one
// figure's accent). The values match the makerfaire.in scenes, so our props sit beside them; the official colours
// come from brand/tokens.css.
import * as THREE from 'three'

export const KEYS = {
  light: '#FBFBF9',
  mid: '#C9C9C2',
  dark: '#2B2B2B',
  wood: '#D9C4A1',
  woodDark: '#A88B63',
  stone: '#9C9A92',
  metal: '#C4C8CC',
  water: '#DCE6EC',
  leaf: '#8FA77E',
  red: '#ED1C24',
  cyan: '#00AEEF',
  accent: '#225DAC',
} as const
export type Key = keyof typeof KEYS
export const INK = '#222222'
export const PAPER = '#F6F6F3'

/** Keys drawn without ink edges: lines don't show on them. */
export const NO_EDGES = new Set<Key>(['dark'])

export interface Materials {
  face: Record<Key, THREE.MeshLambertMaterial>
  /** Hairline edges: 1px ink. */
  line: THREE.LineBasicMaterial
  /** Guides and markings: ink at 0.3. */
  lineFaint: THREE.LineBasicMaterial
  /** A lit part (a bulb that is on, a screen): unlit white-warm. */
  glow: THREE.MeshBasicMaterial
}

export function createMaterials(): Materials {
  const face = {} as Record<Key, THREE.MeshLambertMaterial>
  for (const [k, hex] of Object.entries(KEYS)) {
    // polygonOffset pushes faces back so the edge lines draw over them without z-fighting.
    face[k as Key] = new THREE.MeshLambertMaterial({ color: hex, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
  }
  return {
    face,
    line: new THREE.LineBasicMaterial({ color: INK }),
    lineFaint: new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.3 }),
    glow: new THREE.MeshBasicMaterial({ color: '#FFF6C8', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  }
}

/**
 * A source colour (from a model's material or its colour atlas) to a palette key. Neutral unless the colour is
 * clearly a natural material: greys by lightness, browns and oranges to wood, greens to leaf, pale blues to water.
 * Saturated reds, blues and the like become neutral too: a model's colour is never kept just because it has one.
 * A manifest entry can override any colour (`colors`) or any material by name (`materials`).
 */
export function keyFor(rgb: [number, number, number]): Key {
  const c = new THREE.Color(rgb[0], rgb[1], rgb[2])
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  const h = hsl.h * 360, { s, l } = hsl
  if (l < 0.2) return 'dark'
  if (s < 0.16 || l > 0.9) return l > 0.78 ? 'light' : l > 0.58 ? 'mid' : l > 0.36 ? 'stone' : 'dark'
  if (h >= 15 && h < 50) return l > 0.55 ? 'wood' : 'woodDark'
  if (h >= 50 && h < 70) return l > 0.6 ? 'light' : 'wood'
  if (h >= 70 && h < 170) return 'leaf'
  if (h >= 170 && h < 250 && l > 0.6) return 'water'
  return l > 0.72 ? 'light' : l > 0.45 ? 'mid' : 'stone'
}
