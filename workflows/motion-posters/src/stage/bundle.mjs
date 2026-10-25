// Bundles the 3D stage (src/stage/entry.ts + the website's three.js scenes) into build/stage.js, one ES module
// the render page imports. The website's sound and vue imports are replaced by the stubs in ./stubs.
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const here = p => fileURLToPath(new URL(p, import.meta.url))
const stubs = {
  name: 'stubs',
  setup(b) {
    b.onResolve({ filter: /composables\/usePanelSound$/ }, () => ({ path: here('./stubs/usePanelSound.js') }))
    b.onResolve({ filter: /^vue$/ }, () => ({ path: here('./stubs/vue.js') }))
  },
}
await build({
  entryPoints: [here('./entry.ts')],
  outfile: here('../../build/stage.js'),
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  define: { 'import.meta.dev': 'false' },
  plugins: [stubs],
  logLevel: 'warning',
})
console.log('build/stage.js')
