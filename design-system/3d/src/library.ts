// The model library: 3d/manifest.json lists every CC0 model with its source, licence, hash and restyle rules
// (materials and colours to keys, named parts, real height); the beam kit (beams.ts) adds our own procedural
// assemblies (ids beam-*). instantiate() makes a fresh copy, so each prop on a stage can move its own parts.
import * as THREE from 'three'
import type { Materials } from './palette'
import { loadModel, type Model, type ModelSpec } from './restyle'
import { BEAMS } from './beams'

export interface Source {
  pack: string
  url: string
  /** The file inside the pack's zip, or the direct download. */
  path?: string
  author: string
  licence: 'CC0-1.0'
  sha256: string
}

export interface Entry extends Omit<ModelSpec, 'id'> {
  title: string
  source: Source
  triangles: number
  /** What it stands for, in the posters that use it. */
  uses?: string[]
}

export interface Manifest {
  models: Record<string, Entry>
}

THREE.Cache.enabled = true

export class Library {
  constructor(readonly manifest: Manifest, private base: string, private m: Materials) {}

  has(id: string) {
    return id in this.manifest.models || id in BEAMS
  }

  async instantiate(id: string): Promise<Model> {
    if (id in BEAMS) return BEAMS[id]!.build(this.m)
    const e = this.manifest.models[id]
    if (!e) throw new Error(`No model "${id}" in the manifest`)
    return loadModel(`${this.base}/${e.file}`, { ...e, id }, this.m)
  }
}
