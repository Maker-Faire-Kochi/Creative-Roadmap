# Awareness carousels

Renders the Maker Faire Kochi awareness carousels: **19 topics × 5 designs × post (1080×1350) and story (1080×1920)**, in **English** and in **Manglish** (Malayalam grammar with the English maker words kept in English). Each design renders in one of two **looks** from the brand guidelines, and the look is always chosen explicitly. The pipeline also builds a review gallery and runs layout QA. Read the repo-root `AGENTS.md` and `guidelines/docs/creative-guidelines.md` first.

| Look | Flag | Type | Colour |
|---|---|---|---|
| General | `--look=general` | Anton headlines, IBM Plex Mono labels | neutral paper/ink/dark, official red and cyan for emphasis |
| Loud Design / Make Some Noise | `--look=noise` | Dela Gothic One headlines, Inter labels | warm yellow `#ffe86c` + electric blue `#2b19d9`; accents are inverted blocks |

Colour roles per design live in `src/looks.mjs`. Dela Gothic One is wide, so in the Noise look a line that would set below the 65px minimum is split at the word boundary nearest its middle. The words never change and struck-through words stay whole, but Noise line breaks can differ from the copy file. The art is the archived Open Workshop kit (`archive/open-workshop/assets/kit/`), tinted whole to the look's ink, until straight-beam illustrations replace it.

## Setup

```bash
cd workflows/awareness-carousels
npm install                      # playwright-core only; rendering uses your installed Google Chrome
```

Output goes to `$MFK_OUT` (default `output/awareness-carousels-<look>/`, git-ignored). `CHROME_PATH` overrides the Chrome binary. `output/awareness-carousels/` holds the earlier Open Workshop set that is already scheduled, so don't render into it.

## Where things live

| Path | Role |
|---|---|
| `content/topics.mjs` | **English slide copy** for every topic: `slides[].lines`, `cta`, stat slides, kit assembly (`asm`), sources. Markup: `*accent*`, `~strike~`. |
| `content/topics-ml.mjs` | **Manglish slide copy and captions**, same keys as `topics.mjs` |
| `content/captions.md` | **English captions and keyword tags**, hand-reviewed and approved. Source of truth for scheduling. `package.mjs` copies it unchanged; nothing regenerates it. |
| `content/sources.md`, `topic-review.md` | Fact sources and the deduplication decisions, copied into the output |
| `src/build.mjs` | Renders all five designs (`A-assembly`, `B-panorama`, `C-colour-blocks`, `D-board`, `E-signage`) from the copy |
| `src/package.mjs` | Verifies the PNGs, builds the gallery (`index.html`), topic overview sheets and the cover sheet |
| `src/ml-docs.mjs` | Writes the English ↔ Manglish copy deck and the Manglish captions |
| `src/looks.mjs` | The two looks: fonts, colour roles per design, logo plan |
| `src/studio.mjs`, `studio-page.mjs`, `studio-stills.mjs` | The Studio track: type posters, their 3D illustrations and the square-lockup sign-off |
| `content/studio-assets.mjs` | **The Studio track's illustration per slide** (props, actors, actions) |
| `src/paths.mjs` | Shared paths and environment |

## Commands

Run from `workflows/awareness-carousels/`. Every command takes `--look=general|noise`, which also picks the default output folder (add `MFK_OUT=<dir>` to target another folder):

```bash
node src/build.mjs --look=general                # all topics, English
node src/build.mjs --look=general 05- E-         # filters: topic prefix and/or design prefix
node src/build.mjs --look=general --lang=ml      # Manglish; output under <out>/ml/
node src/ml-docs.mjs --look=general              # <out>/ml/copy-deck.md and captions-ml.md
node src/package.mjs --look=general              # gallery, overview sheets, cover sheet, QA (needs all topics rendered)
node src/package.mjs --look=general --partial    # package only the rendered topics (a pilot)
node src/package.mjs --look=general --docs-only  # just the docs
```

`package.mjs` styles the gallery from `build/look.json`, which the render writes.

`--no-logo` renders without the official logo; `--review` writes to `_logo-review/` instead.

### Studio track (exploratory)

The Malayalam carousels as Poster Studio type posters: Latin in Studio Sans, Malayalam in Baloo Chettan 2. There are two colour tracks:
- `red`: white letters on red, with the last slide on paper.
- `white`: red letters on paper, with the last slide on red.

Under the lettering sits **one 3D illustration per slide**, from `content/studio-assets.mjs`. Each one is a still of the motion posters' tableau (CC0 props, the beam kit, Makey), drawn by `workflows/motion-posters/build/stage.js`. The **last slide is the sign-off**: the square lockup, with Makey waving beside it. Stat slides have no illustration, because the numeral is the image. Each illustration is sized by visual weight (`assetSize` in `src/studio.mjs`: about the same area whether it is one object or a row), so it supports the lettering rather than filling the space. It sits at the bottom right, on the line above the footer, so text and picture read on one diagonal. A wide row keeps a margin on its left. On the sign-off, Makey stands about 1.6× the square lockup's height. On paper grounds a lit part (`glow`) is drawn unlit, since it washes out there.

```bash
(cd ../motion-posters && npm install && npm run build:stage)   # once: the 3D stage
node src/studio.mjs --lang=ml --track=red 01- 02- 05- 13-      # output/awareness-carousels-studio/ml/red/
node src/studio.mjs --lang=ml --track=white 01- 02- 05- 13-
node src/studio.mjs --lang=ml --track=red --plain              # type only, no illustrations (the earlier version)
```

Illustrations exist for the pilot topics 01, 02, 05 and 13. Other topics render type only until they get an entry. QA also flags an illustration that has no room left under the text, or one that would be upscaled too far.

## Output layout (`$MFK_OUT`)

`<topic>/<design>/post|story/NN.png` and `_strip-*.jpg` per design, `<topic>/_overview-*.jpg`, `ml/` (same tree for Manglish), `index.html` gallery, `_series-overview.jpg`, `captions.md`, `copy-deck.md`, `build/` (editable fitted HTML and `qa-report*.json`).

## QA

The renderer fails a render when a line overflows, a headline drops under the minimum size, a text block runs into the footer, or a font doesn't load. `build/qa-report.json` and `qa-report-ml.json` must show `issues: 0`; fix the copy, not the checks. A partial re-run overwrites the report, so finish with one full render of the language you changed.

Typical fixes: re-break a long line, drop a word, or split into more lines. Design **E (Signage)** has the narrowest plate and fails first. Then look at the strips; QA doesn't catch a bad line break or an odd accent.

## Adding or changing a topic

1. Add the slides to `content/topics.mjs` (2–6 slides; the last has `cta: true`; no event date, say "coming soon"; clear descriptive words, `CODING` not `CODE`).
2. Add its caption and `[Keyword, Keyword]` line to `content/captions.md` (see the instagram-scheduling runbook for the format).
3. Add the Manglish version to `content/topics-ml.mjs`.
4. Render English and Manglish, check QA and the strips, run `node src/package.mjs`.
5. `instagram-scheduling/prepare.py` asserts the topic set (`range(1, 20)` today); update that when topics are added.

## Manglish rules (the `--lang=ml` edition)

- **English stays English** for maker and tech words people actually say: maker, make, build, project, coding, repair, fix, workshop, idea, version, circuit, print, stage, network, global, community, festival and so on. **Malayalam carries grammar and feeling**: ചെയ്യൂ, ആണ്, വേണ്ട, ഉണ്ട്, നമ്മുടെ, പിന്നെ.
- A Malayalam suffix on an English word takes a hyphen and starts with a full letter: `project-ന്റെ`, `Campus-കളിൽ`, `coding-ഉം`. Never attach a bare vowel sign.
- "Maker Faire Kochi" is always in English. The place-name Malayalam (കൊച്ചി) stays in Noto Sans Malayalam, per the guidelines.
- Sentence case, not capitals (English words in capitals look shouty inside Malayalam lines).
- Keep Malayalam lines short (about 18 characters or fewer per line). Long Malayalam words are the main cause of QA failures.
- Same content rules as English: no event date (`ഉടൻ വരുന്നു` / `coming soon`). **Maker Stories is not released**, so topic 08 says it is coming (`ഉടൻ എത്തും`), never "meet them in Maker Stories".
- Type: the look's display face (Anton or Dela Gothic One) for Latin, **Baloo Chettan 2 ExtraBold** for Malayalam letters (`--mf-font-malayalam-display` in `brand/tokens.css`, Malayalam `unicode-range` only, so Latin always falls through to the display face). Baloo is a documented local deviation from upstream (see `guidelines/UPSTREAM.md`).
- **Have a fluent speaker review `ml/copy-deck.md` before anything is published.** Edit `topics-ml.mjs`, re-render that topic, run `ml-docs.mjs`.

## Don't

- Don't hand-edit PNGs, the gallery or anything in `output/`. Change the copy and re-render.
- Don't re-render English creatives that are in a scheduling ledger unless you mean to: the ledger records each PNG's SHA-256 and `prepare.py` will stop with "Artwork changed". To check a change is safe, render to a scratch `MFK_OUT` and `cmp` against the existing PNGs.
- Don't add a date, recolour the logo, or use the K as a logo (see `AGENTS.md`).
