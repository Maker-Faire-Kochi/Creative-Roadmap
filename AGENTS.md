# AGENTS.md

Repository: content strategy and campaign assets for **Maker Faire Kochi 2027**.

## Brand guidelines: read this before making any visual
The guidelines come from [niyamax/maker-faire-kochi](https://github.com/niyamax/maker-faire-kochi) and are copied verbatim into **`guidelines/`** (commit and re-sync steps in `guidelines/UPSTREAM.md`). Don't edit them here.

1. `guidelines/docs/creative-guidelines.md`: the authority for direction, type, colour, logo, illustration and content.
2. `brand/tokens.css`: link it for the fonts and colour variables. `brand/logo/official/` holds the official lockups.
3. `guidelines/references/README.md`: the selected visual references (straight-beam baseline, Make Some Noise, media-team post/story, camera/slider).
4. `guidelines/docs/research-and-credits.md`: sources, image provenance and licences. Keep credits and licences with their assets.

**`design-system/`** is our design system v2, built on the guidelines for motion and 3D:
- the 3D asset standard (`3d/STANDARD.md`)
- the CC0 model library (`3d/manifest.json`, recorded sources and hashes)
- the beam kit
- the motion language (`motion.md`)
- colour in motion (`color-motion.md`)
- wording for motion (`copy.md`)
- Studio Sans (`type/studio-sans.md`)

Read its README before making anything that moves or is 3D.

`archive/open-workshop/` is the former "Open Workshop" design system (v1) (Bricolage, paper/ink palette, construction kit). It is **historical**: use it for provenance only, not for new work. The Figma moodboard is file `0kwqCaBkGGypYupzl7gsuj`; edit Figma or Paper only when the user asks.

## Hard rules
- **Two directions; say which one a piece uses.**
  - General: Anton Regular headlines, IBM Plex Mono Regular for supporting text, IBM Plex Mono Medium for labels, captions and event details. Motion posters are the exception: they letter General headlines in Studio Sans (a recorded deviation, `guidelines/UPSTREAM.md`).
  - Loud Design / Make Some Noise campaign: warm yellow `#ffe86c`, electric blue `#2b19d9`, Dela Gothic One headlines, Inter supporting copy.
- Colour has a purpose. Start from neutral structure and use the official red `#ed1c24`, cyan `#00aeef` and white only to draw attention, show a part or state, or improve contrast. Never recolour everything just to show the palette. The Open Workshop paper/ink/coir palette is historical.
- Malayalam: Noto Sans Malayalam for script coverage. Baloo Chettan 2 ExtraBold for Malayalam/Manglish display headlines (Malayalam letters only; Latin stays in the direction's display face). Give Malayalam equal visual presence.
- Illustration: straight slotted beams with plausible joints, opaque faces and fine hairline edges. Curved playful beams are rejected. Make one dominant image event with a clear reading order. Solve one illustration before extending it to many applications, and label conceptual machines as illustrations, not engineering designs.
- 3D: every object meets `design-system/3d/STANDARD.md`. That means opaque faces, ink hairlines, neutral first, real scale, CC0 models only (CC0-1.0, with source and sha256 recorded in the manifest; `node design-system/3d/fetch.mjs --check` must pass), or the beam kit. No likenesses of trademarked characters or products. The models are illustrations, never evidence.
- Motion lettering says complete sentences: the slide's own words with exact punctuation. A rewrite needs a reason and the user's approval (`design-system/copy.md`).
- Logo: use the official Maker Faire Kochi lockups in `brand/logo/official/` intact: original proportions and colours, white interior kept. Use long on light grounds, border on coloured or dark grounds, and square for stacked sign-offs. Never recolour, reconstruct, crop or overlap them.
- The Open Workshop kit SVGs (`archive/open-workshop/assets/kit/`) are archive art, allowed only in the awareness carousels until straight-beam illustrations replace them. The K and other assemblies are never a logo or part of a lockup.
- Content: no event date unless asked (use "COMING SOON"). Don't invent venues, deadlines, experience requirements or performance claims. Use clear, descriptive words (CODING, not CODE). Volunteer calls are Kerala-wide (location "KERALA"); before release, re-check the signup URL (`makerfaire.in/volunteer`) and the rendered QR, with its full quiet zone.
- Evidence: never present stock photos as documented Kerala participants or generated objects as photographed exhibits. Record whether a direction is selected, exploratory or rejected, and keep substantial prior iterations.

## Workflows: generating and scheduling content
Repeatable pipelines live in **`workflows/`**; read `workflows/README.md`, then the runbook of the one you're using.

- `workflows/awareness-carousels/`: renders the awareness carousels (19 topics × 5 designs × post + story) in English and Manglish, in either look (`--look=general` or `--look=noise`), with layout QA and a review gallery.
- `workflows/motion-posters/`: renders a motion poster per awareness topic (post + story, 12–18-second silent MP4 stories, a beat per carousel slide) in six looks: `general` and `noise`, plus the exploratory `colour`, `noise-shift`, `weave` and `weave-plain`. In the Weave looks the full-bleed text is set first, then one object (a CC0 model, or a beam-kit assembly with `--hero=beams`) pops up in the middle and pushes the letters out; the logo comes only on the end card, with text on top or model on top in the band looks. Each beat sets the slide's full sentence in the Poster Studio letters (Studio Sans, or Dela Gothic One in the Noise looks). A 3D tableau acts it out: design-system models and beams plus the makerfaire.in actors (`vendor/poster-studio` and `vendor/website` are git submodules: run `git submodule update --init`). The camera moves on every text change, and the transition looks change the whole ground's colour.
- `workflows/live-action/`: turns live-action footage (a maker or organiser talking to camera, one clip or several back to back) into a 1080×1920 story with sound: a Poster Studio opener (white on red) that wipes up into the footage, red-on-white Studio Sans subtitle cards tilted a little in 3D (the speaker's own words, Manglish or English as spoken, transcribed card by card and broken at the measured voice breaks), then either the General COMING SOON end card or a CTA end card on a brand ground (Makey, footer, up to two QR codes). One spec per story (`content/<slug>.json`), assembled and rendered with HyperFrames (pinned).
- `workflows/instagram-scheduling/`: schedules the carousels and their stories on Meta Business Suite from an approved plan, and trial reels (shown to non-followers first; app-only) through the Instagram app on an Android phone over wireless debugging (`phone.py`: types and verifies the approved caption, tags @makerfaire, sets Trial, schedules, and stops before Schedule unless `--submit`).

Rules that apply to any agent:
- **Source in git, output out of git.** Generated artwork, galleries, schedule ledgers, screenshots and upload copies go in `output/` (git-ignored) or a campaign output folder, never in `workflows/`. The repo is **public**: never commit them, or Meta account identifiers.
- **Copy has one source of truth:** slide copy in `workflows/awareness-carousels/content/topics.mjs` (English) and `topics-ml.mjs` (Manglish); motion poster storyboards (wording rewrites with their reasons, objects, motions and camera per beat) in `workflows/motion-posters/content/storyboards.mjs`; live-action stories (opener, footage, subtitle wording and timing, end card) in `workflows/live-action/content/<slug>.json`; the 3D library in `design-system/3d/manifest.json`; captions and keyword tags in `content/captions.md`; schedules in `workflows/instagram-scheduling/plans/*.json`. Change the source and re-render; never hand-edit a generated file.
- **Human gates:** the user approves every caption before it is scheduled, and a fluent speaker reviews Manglish copy before it is published. Record approvals with `prepare.py --approve`; never assume one. Never publish immediately, and don't re-render or edit artwork that is already scheduled.
- Captions use bracketed keyword tags (`[MakerFaireKochi, Maker, Kochi, Kerala]`), not hashtags. Stories have no caption.
- Manglish: Malayalam grammar with English maker words kept in English, "Maker Faire Kochi" always English, no event date (`ഉടൻ വരുന്നു` = coming soon). Maker Stories isn't released yet, so copy says it is coming.

## Other context
- `index.html`: the Creative Content Roadmap (five campaign stages, content series, calendar). It's the source of truth for content strategy.
- `brag-output-*`, `volunteer-call-*` and `awareness-carousels-*`: generated campaign assets from earlier runs (untracked). New awareness runs write to `output/` via the workflows above.
