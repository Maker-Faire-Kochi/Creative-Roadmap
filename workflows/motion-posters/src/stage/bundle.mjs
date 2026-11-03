// Bundles the 3D stage (src/stage/entry.ts + the website's three.js scenes + design-system/3d) into build/stage.js, one ES module
// the render page imports. The website's sound and vue imports are replaced by the stubs in ./stubs.
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const here = p => fileURLToPath(new URL(p, import.meta.url))
// One copy of three for everything: the website's scenes, our sets and the design system's 3D (design-system/3d,
// which has its own node_modules) all resolve three from this package.
const oneThree = {
  name: 'one-three',
  setup(b) {
    b.onResolve({ filter: /^three(\/.*)?$/ }, a => a.pluginData?.oneThree
      ? undefined
      : b.resolve(a.path, { resolveDir: here('../..'), kind: a.kind, pluginData: { oneThree: true } }))
  },
}
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
  plugins: [oneThree, stubs],
  logLevel: 'warning',
})
console.log('build/stage.js')
