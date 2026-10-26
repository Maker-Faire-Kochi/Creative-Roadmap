# Motion posters

Renders one **motion poster per awareness topic**: 19 topics × post (1080×1350) and story (1080×1920), in four looks. Each poster is a short **story** (12–18 s, 30 fps, silent MP4) with **one beat per carousel slide**, then a COMING SOON sign-off.

A beat has two layers:
- **The sentence:** the slide's full sentence in the [Poster Studio](https://github.com/niyamax/maker-faire-kochi-poster-studio)'s letters, one carousel line per row, rows coming in at reading pace.
- **The tableau:** 3D objects that act the sentence out as it is read. They come from three places:
  - CC0 models and the beam kit from [`design-system/`](../../design-system/README.md)
  - the makerfaire.in actors (Makey, the people)
  - where a scene is the subject, a makerfaire.in scene (the backwater, the electronics bench)

  On "Fixed a fan?" the fan's blades go back on and spin. On "The broken print." a printed cog cracks in two.

Every text change moves the camera. In the transition looks the whole ground changes colour too.

Read the repo-root `AGENTS.md` and `design-system/README.md` first: the wording, 3D, motion and colour rules live there ([copy.md](../../design-system/copy.md), [3d/STANDARD.md](../../design-system/3d/STANDARD.md), [motion.md](../../design-system/motion.md), [color-motion.md](../../design-system/color-motion.md)).

## Setup

```bash
git submodule update --init                     # vendor/poster-studio and vendor/website at their pinned commits
(cd ../../design-system && npm install && node 3d/fetch.mjs --check)
cd workflows/motion-posters
npm install                                     # playwright-core, three, esbuild; uses your Google Chrome; encoding needs ffmpeg
npm run build:stage                             # bundles the 3D stage into build/stage.js (git-ignored); re-run after changing src/stage/, design-system/3d/src or the website pin
```

## Commands

Run from `workflows/motion-posters/` (add `MFK_OUT=<dir>` to target another folder):

```bash
npm run wording                                   # output/motion-posters-wording.html: every beat's lettering, rewrites highlighted (approve this first)
node src/render.mjs --look=general                # all topics with a stage
node src/render.mjs --look=colour 05- 06- 12-     # filter by topic prefix
node src/render.mjs --look=noise --place=model-top 06-   # force a placement
npm run specimen:studio-sans                      # output/studio-sans-specimen.png
```

The looks are `general`, `noise`, `colour` and `noise-shift` ([color-motion.md](../../design-system/color-motion.md)). Colour and Noise Shift are **exploratory**.

## How it works

| Layer | Source | Code |
|---|---|---|
| Ground, transitions, footer | The beat's ground from the look's sequence. In the transition looks the next colour comes in through an iris, wipe, shutter or rise. Each ground carries its own logo lockup and labels | `src/page.mjs` |
| 3D tableau | `sets/tableau.ts` builds each beat from `design-system/3d` (models restyled to the standard, the beam kit, motions, effects) and the website's actors. A beat can instead cut to a website scene (`set`). Camera moves come from `design-system/3d/src/camera.ts`, laid over any scene's camera | `src/stage/` → `build/stage.js` |
| Lettering | The studio's own `layoutTreatment` + `appendTreatmentArtwork` + `drawPosterScene`, used unmodified. Punctuation marks are drawn by `mark()` | `src/page.mjs` |
| Copy → rows | The slide's lines, or a storyboard rewrite (`say` + `why`), with marks carried across lines | `src/copy.mjs` |
| Timeline, QA, gallery | Beats timed to reading, times like `"r1+0.3"` resolved to seconds, frames piped to ffmpeg | `src/render.mjs` |

It renders headless Chrome on the GPU (ANGLE/Metal, about 10 s per video; `MFK_SWIFTSHADER=1` uses the CPU). Everything is a function of time or a fixed-step simulation, so renders are **deterministic**.

## Storyboards (`content/storyboards.mjs`)

Per topic: `place` (`text-top` or `model-top`), then per beat:

| Key | What |
|---|---|
| `means` | What the beat's objects mean, in a sentence. Shown in the gallery for review |
| `say`, `why` | Only for a rewrite of the slide's sentence (rows with its `*accent*` and `~strike~`), and why |
| `cam`, `tx` | The camera move that opens the beat; the colour transition (transition looks) |
| `stage.props` | `{ name, model, at, yaw, scale, keep }`, with a model from `design-system/3d/manifest.json` or a beam (`beam-gesture`, `beam-crank`, `beam-frame-s/m/l`, `beam-link`) |
| `stage.actors` | `{ name, kind: "makey" or "person", variant, seed, at, yaw }` |
| `stage.do` | `[motion, "prop" or "prop.part", time, params]` |
| `stage.fx` | `[effect, time, params]`. Points may name props (`"@lamp+[0.1,0,0]"`) |
| `stage.act` | `[action, actor, time]`: Makey tumble, wave, hop; people wave, clap, point |
| `stage.frame` | `{ at, view, yaw, pitch }` when the fitted framing isn't right |
| `set`, `opts`, `shot`, `act` | Cut to a makerfaire.in scene instead |

Times are seconds from the beat's start, or `"r1"` (when row 1 comes in), `"r1+0.3"`, or `"end-0.4"`. `END_STAGE` is the sign-off on every poster: the beam kit's open gesture, with its blue beam opening the joint.

**Status:** the pilot topics 05, 06 and 12 are staged. The other topics have their wording (and any rewrites) but no stage yet, and the renderer skips them with "no stage" until they are built.

## QA (`qa-report.json`)

- **Copy:** every row can be set, at most 6 rows, and every rewrite has a reason.
- **Timing:** 12–18 s.
- **Letters:** they never leave their band.
- **Stage:** the 3D isn't blank at the end of any beat.
- **Files:** ffprobe checks size, frame count and duration.

## Output (`$MFK_OUT`, default `output/motion-posters-<look>[-<place>]/`, git-ignored)

- `<topic>/post.mp4`, `story.mp4`, plus `post.png` and `story.png` (the cover: the first beat once settled).
- `index.html`: the gallery, with each beat's sentence, ground, camera move and meaning.
- `qa-report.json`.

## Directions

| Direction | Status |
|---|---|
| v3 (this workflow): full sentences in Studio Sans or Dela, objects that act each sentence out (CC0 + beam kit + website actors), camera moves, two placements, Colour and Noise Shift transition looks | **Selected** (2026-10-26), pilot pending review. Colour and Noise Shift **exploratory** |
| v2: key-word lettering over makerfaire.in scenes, the sentence in small type underneath | **Rejected** (2026-10-26): the words read as fragments, and the scenes were reused rather than chosen for each topic, so they felt random |
| v1: 8-second loops of the studio animating only the topic label | **Rejected**: the letters moved, but the poster never said what the topic was about |

## Rules and credits

- The same content rules as the carousels: no event date (COMING SOON), no invented places or claims, clear words, captions approved before scheduling. There is no Manglish edition, because the letters are Latin only.
- **All 3D is illustration**: never documentation of real makers, exhibits or Kerala participants.
- Don't hand-edit the MP4s; change the storyboard, the slide copy or the library, and re-render.
- **Poster Studio:** code MIT (Studio Sans included), fonts OFL (notices in `vendor/poster-studio/licenses/`).
- **3D models:** CC0, credited in `design-system/3d/CREDITS.md`. The beam kit is the design system's own.
- **The makerfaire.in actors and scenes** are by Shaan Shoukath and twilighty-abhi ([Maker-Faire-Kochi/Website](https://github.com/Maker-Faire-Kochi/Website)). That repository has **no licence file**. It is used here, within the same organisation, as a pinned submodule and is not copied into this repo, and a licence has been requested.
- Never use the website's `machines` scene: it shows the live countdown to the event date.
- The Maker Faire Kochi logo and marks are covered by no licence here.
