# design-system/ — Maker Faire Kochi "The Open Workshop" (offline)

An offline copy of the Figma moodboard's design system, so Claude, Codex or a person can work **without the Figma MCP**. Snapshot: 2026-10-05, from Figma file `xczyTXBjbMPH9JXyYDeO8w`.

## Read in this order
1. **`DESIGN.md`**: the spec. Its YAML frontmatter is the normative tokens; the prose covers rules, kit usage, logo policy and content rules.
2. **`tokens/tokens.css`**: import it into any HTML/CSS. It defines the `--mf-color-*` variables, the fonts (local woff2) and the `.mf-display`, `.mf-label` and similar classes. `tokens/tokens.json` holds the same values in W3C design-token format.
3. **`kit.json`**: every kit SVG, with its viewBox, each path's colour, bounding box and role (e.g. "upper diagonal beam", "hub bolt"), plus the joint pivots for animation.
4. **`reference/figma-map.md`**: the Figma file page by page, with node ids and the verbatim text of every board, linked to the screenshots in `reference/screens/`.

## Folder map
```
DESIGN.md                 spec (tokens + rules)
tokens/tokens.css         CSS variables + @font-face + type classes
tokens/tokens.json        W3C design tokens
kit.json                  kit SVG geometry, path roles, pivots, Figma node ids
assets/kit/parts/         beam|elbow|wheel - red|blue|yellow|ink .svg      (240×240)
assets/kit/assemblies/    k|crank|crane|arrow - full|ink|paper|blue|yellow  (600×600)
assets/kit/wayfinding/    wayfinding-arrow-ink|paper .svg (rotate for Up/Left)
assets/logo/              reference-logo.svg/.png (REFERENCE ONLY, do not publish)
assets/fonts/             Bricolage Grotesque (variable), IBM Plex Mono 500/600, Noto Sans Malayalam 700 (OFL)
reference/figma-map.md    node-by-node map + verbatim copy
reference/screens/        board screenshots + component-set exports + labelled kit contact sheet
specimen.html             open in a browser to see tokens, type and the whole kit
```

## Quick start (HTML)
```html
<link rel="stylesheet" href="design-system/tokens/tokens.css">
<h1 class="mf-display" style="color:var(--mf-color-ink)">A city made of working parts.</h1>
<p class="mf-label">Maker Faire Kochi / The Open Workshop</p>
<img src="design-system/assets/kit/assemblies/k-full.svg" width="400" alt="">
```
When inlining several kit SVGs on one page, prefix their `id`s (they all use `Vector`, `Vector_2`, …).

## Worked examples in this repo
- `volunteer-call-*/build/build.mjs`: static Instagram story and post posters built on this system.
- `brag-output-2026-10-02-154317/build/`: Hyperframes videos that animate the kit at its joints (`kit.js` shows the K assembly, the arrow unfold and the bass-driven spin).

## Refreshing from Figma
Only when the Figma file changes. Re-export the component sets (`7:74`, `8:42`, `21:145`) and the boards listed in `reference/figma-map.md`, then update `DESIGN.md` and the token files. Keep the hex values exactly as Figma reports them.
