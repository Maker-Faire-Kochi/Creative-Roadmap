// Bundles 3d/src into build/ds3d.js (one ES module, three included) for the specimen and the contact sheets.
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const here = p => fileURLToPath(new URL(p, import.meta.url))
await build({
  entryPoints: [here('../src/index.ts')],
  outfile: here('../../build/ds3d.js'),
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  logLevel: 'warning',
})
console.log('build/ds3d.js')
