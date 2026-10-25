# Motion posters

Renders one **motion poster per awareness topic**: 19 topics × post (1080×1350) and story (1080×1920), in either look. Each poster is a short **story** (12–18 s, 30 fps, silent MP4), with **one beat per carousel slide** and then a COMING SOON end card.

A beat has three layers:
- **Lettering:** the slide's key words in the [Maker Faire Kochi Poster Studio](https://github.com/niyamax/maker-faire-kochi-poster-studio)'s elastic lettering.
- **3D scene:** a live scene from [makerfaire.in](https://makerfaire.in) ([Maker-Faire-Kochi/Website](https://github.com/Maker-Faire-Kochi/Website)) acting the beat.
- **Sentence:** the slide's full sentence underneath.

Read the repo-root `AGENTS.md` first.

## Setup

```bash
git submodule update --init      # vendor/poster-studio and vendor/website at their pinned commits
cd workflows/motion-posters
npm install                      # playwright-core, three, esbuild; rendering uses your installed Google Chrome; encoding needs ffmpeg
npm run build:stage              # bundles the 3D stage into build/stage.js (git-ignored); re-run after changing src/stage/ or the website pin
```

## How it works

| Layer | Source | Code |
|---|---|---|
| Lettering | The studio's own `layoutTreatment()` + `appendTreatmentArtwork()` + `drawPosterScene()`, used unmodified. Each word gets its share of the type band; cells squash in and out of their row. | `src/page.mjs` |
| 3D stage | The website's three.js scenes (`app/three/`), driven headlessly: fixed 5 ms simulation steps, seeded, no clock. Cues in the storyboard fire the scenes' own actions (Makey tumbles, the electronics bench boots, the cheena vala's camera moves). | `src/stage/` → `build/stage.js` |
| Sentence, footer | The slide's sentence in the look's text face; official logo; series label | `src/page.mjs` |

`src/render.mjs` builds a timeline from the copy:
- Each beat runs 0.45 s in, then holds for reading (0.3 s a word, at least 1.6 s), then 0.35 s out.
- Topics with few slides hold longer, so every story runs at least 12 s.

It then draws every frame in headless Chrome (the GPU via ANGLE/Metal, about 17 ms a frame; `MFK_SWIFTSHADER=1` uses the CPU instead) and pipes PNGs to ffmpeg (H.264, yuv420p). The first frame is a finished beat, so it works as the cover.

Renders are **deterministic**: the same source gives a byte-identical MP4 on the same machine.

### Sets (`src/stage/sets/`)

| Set | What it is | Cues | Topics |
|---|---|---|---|
| `makey` | Makey, close and centred (our wrapper of the website's `createMakey`) | wave, hop, shove, tumble, walk | 01, 06, 09 |
| `backwater` | Fort Kochi cheena vala, fishers, palms | `shot` 0–3 (wide, fishers, net, bank), dip, wave, kite | 02, 17 |
| `electronics` | A maker's electronics bench, soldering | `shot` 0–3, solder, boot, chase, servo, lamp, measure, wave | 03, 05 |
| `workshop` | The carpenter's workshop | saw, plane, chisel, stool, wave | 03 |
| `people` | A fair group, people at work, the art props | wave, clap, point, look-here, kite, plot… (`opts.query` frames one person) | 04, 07, 08, 10, 11, 12, 16, 19 |
| `hero` | The robot football playground (Makey, ducks, balancer, dog) | none: it plays by itself | 15 |
| `pin-map` | Ours, built from the website's beam kit: a board with pins at the places the copy names, Kochi in red, cyan arcs | `pin:<id>`, pins, kochi, links, travel | 13, 14, 18 |

The website's `machines` scene is **not used**: its split-flap counter shows the live countdown to the event date.

### Looks

| Look | Flag | Ground | Lettering | Payoff beat | Text | Logo |
|---|---|---|---|---|---|---|
| General | `--look=general` | paper `#F6F6F3` | Anton, ink | red `#ED1C24` | IBM Plex Mono | long lockup |
| Loud Design / Make Some Noise | `--look=noise` | yellow `#FFE86C` | Dela Gothic One, blue `#2B19D9` | inverted blue block | Inter | border lockup |

A `~struck~` word gets a bar through its letters: red in General, a yellow cut in Noise, as in the carousels.

## Copy

| Where | What |
|---|---|
| `../awareness-carousels/content/topics.mjs` | Each slide is a beat; its full sentence is set under the scene (the copy's source of truth) |
| `content/storyboards.mjs` | Per topic: the set and its options; per beat, what the lettering says (`say`, usually the slide's accent words) and the scene cues (`act`, `shot`, a cut to another `set`) |
| `END_SAY` in `storyboards.mjs` | The end card: COMING SOON |

**Lettering limits.**
- **Characters:** uppercase Latin only (`A–Z 0–9 & ! ? . -`). There are no apostrophes, so "you're" becomes YOU ARE.
- **Rows:** one word per row, at most 4 words. A 1–2 letter word shares its neighbour's row.
- **Longer phrases:** pass an array to play parts in turn within the beat.

The renderer stops with an issue if a word can't be set, if a topic's beat count doesn't match its slides, or if a story would run outside 12–18 s.

**No Manglish edition:** the studio's letters are Latin only.

## Commands

Run from `workflows/motion-posters/` (add `MFK_OUT=<dir>` to target another folder):

```bash
npm run build:stage
node src/render.mjs --look=general           # all topics (about 4 minutes)
node src/render.mjs --look=noise 05- 18-     # filter by topic prefix
```

## Output (`$MFK_OUT`, default `output/motion-posters-<look>/`, git-ignored)

- `<topic>/post.mp4` and `story.mp4`.
- `post.png` and `story.png`: a cover frame at 1 s.
- `index.html`: a gallery with every story playing, plus its beats.
- `qa-report.json`, which records:
  - lettering and slide-count checks
  - duration 12–18 s
  - that the 3D stage isn't blank in any beat
  - that the sentence stays clear of the footer
  - size, frame count and duration via ffprobe

## Directions

| Direction | Status |
|---|---|
| Topic stories: Poster Studio lettering + makerfaire.in 3D scenes, a beat per slide (this workflow) | **Selected** (2026-10-26), pending review |
| 8-second loops of the studio animating only the topic label (commit history of this folder) | **Rejected**: the letters moved, but the poster never said what the topic was about |

## Updating the vendored code

```bash
git -C workflows/motion-posters/vendor/website fetch && git -C workflows/motion-posters/vendor/website checkout <commit>
npm run build:stage
```

Re-render a few topics in both looks, look at them, then commit the new submodule pointer. The website's scene contract (`SceneInstance`: `step`, `frame`, `resize`, `action`) and the studio's `layoutTreatment` / `appendTreatmentArtwork` / `drawPosterScene` are what this workflow depends on.

## Rules and credits

- Same content rules as the carousels: no event date (COMING SOON), no invented places (the pin map shows only the places the copy names), clear words, captions approved before scheduling.
- **The 3D scenes are illustrations**, not photographs or documentation of real Kerala makers or exhibits. Say so wherever the posters are described.
- Don't hand-edit the MP4s in `output/`; change the storyboard or the slide copy and re-render.
- Poster Studio: code MIT, fonts OFL (notices in `vendor/poster-studio/licenses/`).
- The makerfaire.in scenes are by Shaan Shoukath and twilighty-abhi (Maker-Faire-Kochi/Website). That repository has **no licence file**. It is used here, by the same organisation, as a pinned submodule and is not copied into this repo. A licence is requested in the PR that added this workflow.
- The Maker Faire Kochi logo and marks are covered by neither licence.
