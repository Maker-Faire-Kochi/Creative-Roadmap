# Studio Sans

The elastic display alphabet of the [Maker Faire Kochi Poster Studio](https://github.com/niyamax/maker-faire-kochi-poster-studio) by niyamax. The studio calls it "the elastic studio alphabet", font id `original`.
- **Licence:** MIT, as part of the studio's application code (`NOTICE.md`). The Maker Faire Kochi logo and marks are not covered.
- **No font file.** Every glyph is a procedural skeleton (`src/flex-glyphs.js`). The air mode (`src/air-glyphs.js`) inflates the skeleton into a soft stroke whose weight swells along its length, which is why its letters breathe in motion.
- **Where it lives here:** the motion posters pin the studio as a submodule at `workflows/motion-posters/vendor/poster-studio` and import it unmodified.

## Where it is used

| Use | Status |
|---|---|
| Motion poster lettering, General look | Selected (2026-10-26). Replaces Anton in motion posters only: a recorded deviation (`guidelines/UPSTREAM.md`) |
| Motion poster lettering, Colour look | Exploratory |
| Motion poster lettering, Weave look: full-bleed, giving way to the 3D through the studio's cut-out response (`src/cutout-response.js`) | Exploratory |
| Noise looks | Not used: they keep Dela Gothic One |
| Static carousels, print | Not used: Anton stays the General display face |

## Setting it

```js
import { layoutTreatment, appendTreatmentArtwork } from "<studio>/src/treatment.js";
import { drawPosterScene } from "<studio>/src/scene.js";

const letters = layoutTreatment("DIDN’T WORK.", { x, y, w, h }, "air", phase, 1, { font: "original", layout: "stack" }, "smooth");
const scene = { width, height, background: "rgba(0,0,0,0)", ops: [] };
appendTreatmentArtwork(scene, letters, { fg: "#222222", bg: "#F6F6F3" }, { x, y, w, h });
drawPosterScene(ctx, scene);
```

- **Width:** about 0.74 of the cap height a letter on average (`glyphMetrics`). Narrow marks are narrower.
- **Uppercase only.** It sets A–Z, 0–9, & ! ? - / = + ( ) and the quotes and apostrophes.
- **Full stop and colon:** in air mode the studio draws nothing for these. The motion posters draw them as round dots a letter stroke wide (`workflows/motion-posters/src/page.mjs`, `mark()`).
- **Size:** use one size per sentence, as large as the band allows ([../motion.md](../motion.md)), so a line never squeezes into needle-thin letters.
- **Motion:** pass `phase = t / 8` (seconds) to keep the letters' own elastic loop running while they hold.

## Specimen

Render a sheet of every glyph:

```bash
cd workflows/motion-posters
node src/specimen-studio-sans.mjs       # → output/studio-sans-specimen.png
```
