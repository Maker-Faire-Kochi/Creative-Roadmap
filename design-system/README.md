# Design system v2

Maker Faire Kochi's working design system for motion and 3D: it shows how the brand guidelines apply when things move and when objects are 3D. v1 was the Open Workshop system (Bricolage, paper/ink/coir, the construction kit). It is archived in `archive/open-workshop/` and is history only.

**Authority:** `guidelines/` is the brand authority, copied verbatim from [niyamax/maker-faire-kochi](https://github.com/niyamax/maker-faire-kochi). Don't restate or override it here. `brand/tokens.css` holds the fonts, colours and official lockups. This system adds what the guidelines leave open: a 3D standard, a motion language, colour in motion and wording for motion. Where it departs from the guidelines, the departure is recorded in `guidelines/UPSTREAM.md` § Local deviations.

| Part | What it is |
|---|---|
| [3d/STANDARD.md](3d/STANDARD.md) | The 3D asset standard: how every model looks (taken from the makerfaire.in scenes), the selection checklist, and how to add a model |
| [3d/manifest.json](3d/manifest.json) + `3d/models/` | The CC0 model library: the source, licence, sha256, triangle count and restyle rules of every model |
| [3d/CREDITS.md](3d/CREDITS.md) | Where every model comes from |
| `3d/src/` | The code. Every workflow uses it: `palette`, `restyle` (any model → the standard), `beams` (the beam kit), `kit` (lights, shadow, glow), `motions`, `fx` (effects), `camera` (moves), `library` |
| `3d/specimen.html` | A live specimen of every model and beam assembly, restyled and turning |
| [motion.md](motion.md) | The motion language: beats, timing, letters, objects, camera |
| [color-motion.md](color-motion.md) | The four motion looks, the grounds and their contrast pairs, the logo on each ground, and the colour transitions |
| [copy.md](copy.md) | Wording for motion: full sentences, exact punctuation, and when a rewrite is allowed |
| [type/studio-sans.md](type/studio-sans.md) | Studio Sans, the Poster Studio's elastic alphabet |

## Status

| Item | Status |
|---|---|
| 3D standard, CC0 library, beam kit | **Selected** (2026-10-26) |
| Motion language, wording rules | **Selected** (2026-10-26) |
| General motion look in Studio Sans | **Selected** by the user (2026-10-26). A local deviation: the guidelines set Anton |
| Colour and Noise Shift looks (full-screen colour transitions) | **Exploratory** until approved |

Record changes here: a direction is selected, exploratory or rejected. Keep substantial earlier iterations.

## Use

```bash
cd design-system
npm install                 # three, esbuild, playwright-core (exact versions)
node 3d/fetch.mjs           # reproduce 3d/models/ from the recorded sources and check hashes, licences, budgets
npm run specimen            # build and serve the 3D specimen on http://localhost:4173
npm run sheet -- --out=sheet.png --manifest      # a contact sheet of the library (or --beams, or any .glb files)
```

`workflows/motion-posters` bundles `3d/src` into its stage. One copy of three serves both (see its `src/stage/bundle.mjs`).

## Rules

- **CC0 only.** Every third-party model is CC0-1.0, and its source and hash are recorded in the manifest. `3d/fetch.mjs --check` fails on anything else.
- **Illustrations, not evidence.** The models and the beam kit are illustrations. Never present them as photographs, documented Kerala participants or real exhibits. Label conceptual machines as illustrations, not engineering designs.
- **Colour has a purpose.** The structure stays neutral. Red marks a drive input, an action or a fault. Cyan marks a selection or a connection. At most one accent blue appears in a scene.
- Generated renders never go in here. They belong in `output/` (git-ignored), and the repo is public.
