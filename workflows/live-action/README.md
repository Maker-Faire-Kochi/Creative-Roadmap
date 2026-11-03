# Live-action stories

Turns a piece of **live-action footage** (a maker or organiser talking to camera) into a Maker Faire Kochi story: 1080×1920, 30 fps, with sound. Each story has three parts:

1. **Opener:** a question or headline in the [Poster Studio](https://github.com/niyamax/maker-faire-kochi-poster-studio)'s letters (Studio Sans, air mode), white on brand red `#ED1C24`, filling the frame. The rows squash up one after another, with a pop as each one lands. After 3 s it wipes up, uncovering the footage.
2. **Footage:** played as shot, full length, with its own sound and a whoosh on the wipe. One **subtitle card** per spoken phrase:
   - red **Anton** (the General headline face) on a white rounded plate, set as live text, **at most two rows**, 70 px, capitals 60 px tall (down to 56 px before a card splits; a card kept whole with `subtitleSplit: false` sets smaller instead). Anton is proportional, so rows wrap by its advance widths, measured from the font at build time. `subtitleFace: "plex"` sets IBM Plex Mono Medium instead (64 → 50 px); `"studio"` brings back the earlier Studio Sans cards (60 → 48 px);
   - a new card at every voice break, and also wherever a phrase won't fit in two rows (**the two-row rule**: the card splits between words, at the quietest moment near where the words divide, each piece on screen at least 0.6 s; "MAKER FAIRE" never splits);
   - tilted a little in 3D, alternating left and right; the whole plate tilts, never the letters;
   - its bottom edge on the bottom line of the 80% title-safe box.
3. **End card:** the last 2.6 s of a General-look motion poster (Makey waving, COMING SOON, long lockup, labels), with its topic label re-set for this story and a pop as Makey appears.

This is **not** the motion-posters workflow. That one builds stories from carousel copy and 3D; this one starts from footage. They share the Poster Studio letters, the end card and the motion language ([`design-system/motion.md`](../../design-system/motion.md)). Read the repo-root `AGENTS.md` first.

The project is assembled and rendered with [HyperFrames](https://hyperframes.heygen.com), pinned to `hyperframes@0.8.229` in `src/build.mjs`. The first live-action story is **What is Maker Faire?** (`content/what-is-maker-faire.json`, Kurian, C0002).

## Setup

```bash
git submodule update --init   # the Poster Studio (workflows/motion-posters/vendor/poster-studio)
cd workflows/live-action
npm install                   # playwright-core; rendering uses your Google Chrome and ffmpeg
```

You also need:
- **A General-look motion poster story** for the end card. Any `story.mp4` from `workflows/motion-posters` (`--look=general`) works; the spec names it in `end.from`.
- **The SFX library.** By default the build reads `~/.claude/skills/media-use/audio/assets/sfx/` (the HyperFrames media-use skill's bundled files, Pixabay licence, credits in its `CREDITS.md`). Set `MFK_SFX_DIR` to use another copy.

## Steps

### 1. Find the phrase breaks

```bash
node src/breaks.mjs "<clip>" --whisper          # one proposed card per phrase, with what was said in it
```

- `breaks.mjs` measures the voice breaks from the audio. Workshop footage never falls silent, so the threshold sits between the clip's own noise floor and its speech level. Phrases over 2.6 s split at their deepest dip. `--json` prints the cards as spec entries.
- **`--whisper` gives the words as spoken, in Manglish.** It cuts each card out and transcribes it alone with whisper.cpp `large-v3` in **English mode with a Manglish example prompt**. That romanises Kurian's Malayalam/English mix as he says it: "Super Fab Lab aanenkil, / Inger space aanenkil, allam actually Kochiyiil aana." Clean it by hand (names, doubled consonants: "Tinker", "ellam", "Kochiyil") and confirm with the person who knows the footage.
  - Needs `whisper-cli` (Homebrew `whisper-cpp`) and the large-v3 model at `~/.cache/hyperframes/whisper/models/` (downloaded by `npx hyperframes transcribe … --model large-v3`; `MFK_WHISPER_MODEL` overrides).
  - What doesn't work: Malayalam mode (`-l ml`, any model) returns an **English translation**. Hindi mode returns phonetic Devanagari (usable, but worse). A whole-clip run loses the card alignment. Parakeet doesn't cover Malayalam.
- A very short card at the end of a phrase (under ~0.5 s) often comes back garbled: fold it into the card before.

### 2. Write the spec: `content/<slug>.json`

| Key | What |
|---|---|
| `title`, `status` | The story's name; its approval state (who approved the wording and when; outstanding reviews) |
| `opener.settings` | Optional: the Poster Studio's treatment settings for this headline (`pressure`, `contrast`, `style`, `variation`). Lower `pressure` thins heavy letters (a W that fills in) |
| `subtitleFace` | Optional: `anton` (default), `plex` (IBM Plex Mono Medium) or `studio` (Studio Sans, drawn by the Poster Studio) |
| `clips[].frame` | Optional: `{ width, height, x, y }` zooms and places that clip to frame the speaker: the video's box in px (object-fit cover) and its top-left offset, as Studio's resize/move writes them. It must cover the 1080×1920 frame. Carry a Studio framing edit back here, or the next build loses it. A single `footage` takes `footage.frame` |
| `end.transition` | Optional: `"sweep"` hides the cut from the footage to the end card with the red sweep and whoosh used between clips |
| `subtitleRows` | Optional: the two-row rule's row limit (default 2; 0 turns it off) |
| `opener.text` | The headline, one row per `\n`, uppercase. Studio Sans sets A–Z, 0–9 and `. , ’ ?` |
| `opener.seconds` | How long the opener holds before it has wiped away (default 3); `loop`: the letters' loop period (default 4) |
| `clips[]` | `{ src, subtitles[] }` per clip, played back to back with a hard cut (sound faded 0.06 s each side of the cut). `src` is relative to the repo root; footage stays out of git (e.g. under the week's campaign folder). A single clip can also be written as `footage.src` + top-level `subtitles` |
| `subtitles[]` | `{ start, end, say, means }`: times are **seconds into that clip**; `say` is what appears (uppercase; `/` forces a line break); `means` is the English meaning, for reviewers |
| `end` (poster) | `{ kind: "poster", from, label }`: the last 2.6 s of a General story (`from`), its topic label re-set to `label` |
| `end` (cta) | `{ kind: "cta", ground: "paper", seconds: 6, label, qr: [{ url, caption }, …] }`: the end beat rendered on its own ground by `src/end-card.mjs` (Makey pops up and waves; the footer's lockup and labels as on the posters, `label` above `MAKER FAIRE KOCHI · COMING SOON`), with one or two QR codes where COMING SOON would be. Grounds: `paper red cyan yellow blue`, from `design-system/color-motion.md`; captions take the ground's letter colour, their titles its accent; on light grounds the white QR plates get an ink hairline edge. **Use paper** (the blue ground was tried and rejected) |

The subtitles say **what the speaker says**: Manglish where they speak Malayalam, English where they speak English. Malayalam grammar with English maker words kept in English; "Maker Faire" and "Maker Faire Kochi" always English. Get the wording from the person who knows the footage. A card wraps automatically; use `/` where a name would split (`MAKER / FAIRE`) or a word would be left alone on the last line.

### 3. Build, review, render

```bash
node src/build.mjs <slug>             # → output/live-action/<slug>/ : the HyperFrames project, SUBTITLES.md; runs check
cd ../../output/live-action/<slug> && npx --yes hyperframes@0.8.229 preview   # review in Studio
node src/build.mjs <slug> --render    # → output/live-action/<slug>/<slug>.mp4
```

- `MFK_OUT=<dir>` builds somewhere else.
- The build regenerates the whole project from the spec. **Change the spec and rebuild; don't hand-edit the generated HTML.** Edits made in Studio are lost on the next build, so carry them back into the spec or into `src/build.mjs`.

## Timeline

| Reel time | What | Sound |
|---|---|---|
| 0 → `seconds` | Opener; rows land at 0.16 s intervals | A pop per row (volumes 0.5 / 0.38 / 0.42 / 0.55) |
| `seconds` − 0.4 | Opener wipes up (0.4 s, power3.in); footage already playing beneath | Whoosh, peak on the wipe's middle |
| footage | Footage (0.25 s audio fade-in) + subtitle cards | The footage's own sound |
| between clips | A red panel sweeps up through the frame (0.5 s) and hides the hard cut at its midpoint, the opener's wipe in miniature; sound faded 0.06 s each side | A whoosh, peak on the cut (the library has one whoosh take, so it's the opener's at a lower level) |
| end (poster) | 2.6 s end card, hard cut | A pop as Makey appears |
| end (cta) | 6 s (default): Makey pops (0.05 s) and waves; the QR plates pop in at 0.9 s | A pop on Makey, another on the plates |

Subtitle timing: a card opens 0.05 s before its phrase and pops up (flip from 78° to its tilt, 0.42 s, back.out). It holds across a pause shorter than 0.5 s, so the plate never blinks between phrases; otherwise it stays 0.3 s after the last word. Each sound effect starts so its peak lands one frame after the picture (pop peaks 0.12 s in, whoosh 0.16 s in).

## Rules

- **Copy:** subtitles are the speaker's own words (copy rule in `design-system/copy.md`). The **Manglish needs a fluent speaker's review before release** (AGENTS.md). Record who approved the wording in `status`. The usual content rules hold: no event date in our own copy (COMING SOON); what the speaker says is subtitled as said.
- **Layout:** subtitles never cover the speaker's face. Check snapshots across the clip; if a speaker stands lower in frame, the safe-line placement may need a per-story override.
- **Logo:** the end card's lockup is never recoloured, cropped or covered. The label patch covers only the topic label's box.
- **QR codes** (cta): error correction Q, the 4-module quiet zone kept, ink modules on a white plate, never recoloured. Before release, check every URL loads (a 404 behind a printed code is dead) and decode both codes from a rendered frame (`jsqr`; the build's QR plates sit at x 45–515 and 565–1035, y 940–1400). The interest form is `https://makerfaire.in/interestform` (`/intrestform` is a 404).
- **Output out of git:** `output/` is git-ignored; footage and rendered stories never go into the repo (it is public).
- **Credits:** Poster Studio code MIT (Studio Sans included), fonts OFL (`workflows/motion-posters/vendor/poster-studio/licenses/`). SFX: Pixabay licence (media-use `CREDITS.md`). IBM Plex Mono: OFL (`guidelines/`).

## Directions

| Direction | Status |
|---|---|
| Studio Sans opener (white on red) → footage with tilted red-on-white Studio Sans subtitle cards → General COMING SOON end card | **Selected** (2026-11-02), first story *What is Maker Faire?* (Kurian). Subtitle face superseded 2026-11-03 (next row) |
| Subtitle cards in IBM Plex Mono Medium, the brand's caption face, instead of Studio Sans; opener, plates, tilt and timing unchanged | **Rejected** (2026-11-03): "the text doesnt look good" |
| Subtitle cards in Anton, the General headline face, capitals as tall as the Studio Sans cards | **Selected** (2026-11-03), all three stories |
| Footage zoomed to frame the speaker: the user framed C0007 in Studio (1.38×); the other clips are matched to it by face size and position (macOS Vision face detection, median of 7 frames): C0002 1.59×, C0003 1.36×, C0004 1.44× | **Selected** (2026-11-03) |
| Red sweep with whoosh on the cut to the CTA end card (`end.transition: "sweep"`) | **Selected** (2026-11-03), *Call for Volunteers* |
| Two clips back to back with a red sweep between them, ending on a paper CTA card: Makey and the footer as on the posters, two QR codes (interest form, Telegram) in place of COMING SOON, 6 s | **Selected** (2026-11-02), *Why Kochi?* (Kurian, C0003 + C0004) |
| One clip ending on the paper CTA card with the volunteer form and Telegram QR codes; opener CALL FOR / VOLUNTEERS | **Draft** (2026-11-02), *Call for Volunteers* (Kurian, C0007). Wording awaits approval. C0006 (take part / support the initiative) is held as a spare: it largely repeats C0004 in *Why Kochi?* |
| The CTA end card on blue `#2B19D9` | **Rejected** (2026-11-02): "blue is not working at all" |
| Cards broken only at voice breaks (up to 4 rows) | **Superseded** (2026-11-02) by the two-row rule: some cards were "very big chunks of text on one go". A raw 34-character limit was tried first and split too much |
| Opener at the studio defaults for every headline | **Adjusted** (2026-11-02): in WHY KOCHI? the W filled in and read as a U; a spec can pass the studio's own settings (`opener.settings`, here pressure 0, contrast 0, style original) |
| Subtitle letters squashed row by row to fake a 3D tilt | **Rejected** (2026-11-02): the flattened lower rows were hard to read. The plate tilts instead |
