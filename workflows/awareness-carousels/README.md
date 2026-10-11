# Awareness carousels

Renders the Maker Faire Kochi awareness carousels: **19 topics × 5 designs × post (1080×1350) and story (1080×1920)**, in **English** and in **Manglish** (Malayalam grammar with the English maker words kept in English). It also builds a review gallery and runs layout QA. Read the repo-root `AGENTS.md` and `design-system/DESIGN.md` first.

## Setup

```bash
cd workflows/awareness-carousels
npm install                      # playwright-core only; rendering uses your installed Google Chrome
```

Output goes to `$MFK_OUT` (default `output/awareness-carousels/`, git-ignored). `CHROME_PATH` overrides the Chrome binary.

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
| `src/paths.mjs` | Shared paths and environment |

## Commands

Run from `workflows/awareness-carousels/` (add `MFK_OUT=<dir>` to target another folder):

```bash
node src/build.mjs                 # all topics, English
node src/build.mjs 05- E-          # filters: topic prefix and/or design prefix
node src/build.mjs --lang=ml       # Manglish; output under <out>/ml/
node src/ml-docs.mjs               # <out>/ml/copy-deck.md and captions-ml.md
node src/package.mjs               # gallery, overview sheets, cover sheet, QA (needs all topics rendered)
node src/package.mjs --docs-only   # just the docs
```

`--no-logo` renders without the official logo; `--review` writes to `_logo-review/` instead.

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
- "Maker Faire Kochi" is always in English. The place-name Malayalam (കൊച്ചി) stays in Noto Sans Malayalam, per the design system.
- Sentence case, not capitals (English words in capitals look shouty inside Malayalam lines).
- Keep Malayalam lines short (about 18 characters or fewer per line). Long Malayalam words are the main cause of QA failures.
- Same content rules as English: no event date (`ഉടൻ വരുന്നു` / `coming soon`). **Maker Stories is not released**, so topic 08 says it is coming (`ഉടൻ എത്തും`), never "meet them in Maker Stories".
- Type: Bricolage Grotesque for Latin, **Baloo Chettan 2 ExtraBold** for Malayalam letters (`--mf-font-malayalam-display` in the design system, Malayalam `unicode-range` only, so Latin always falls through to Bricolage).
- **Have a fluent speaker review `ml/copy-deck.md` before anything is published.** Edit `topics-ml.mjs`, re-render that topic, run `ml-docs.mjs`.

## Don't

- Don't hand-edit PNGs, the gallery or anything in `output/`. Change the copy and re-render.
- Don't re-render English creatives that are in a scheduling ledger unless you mean to: the ledger records each PNG's SHA-256 and `prepare.py` will stop with "Artwork changed". To check a change is safe, render to a scratch `MFK_OUT` and `cmp` against the existing PNGs.
- Don't add a date, recolour the logo, or use the K as a logo (see `AGENTS.md`).
