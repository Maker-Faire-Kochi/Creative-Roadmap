# Full local workspace inventory

Preserved from the workspace README on 22 October 2026. Paths and preview commands below describe the full local working archive. The private Git repository carries guidelines and selected references; these experiment folders and exports are intentionally outside its tracked contents. Earlier statements remain dated context. [Current guide](creative-guidelines.md) takes precedence for new work.

---

# Maker Faire Kochi

Standalone local workspace extracted on 11 October 2026. All preview assets, fonts, renderer files and beam palette data are owned locally. No active preview or build should read the Design System directory.

## Start here

Run `python3 serve.py`, then open http://127.0.0.1:8796/ . The current straight-beam study is at http://127.0.0.1:8796/beam-illustrations/open-study/ . The server uses only this folder. Add this folder as a local project in Codex to give future chats the right file context.

## Current direction

Pair Anton Regular headlines with IBM Plex Mono Regular supporting text and Medium labels, captions and event details (user direction, 11 October 2026). Bricolage remains a historical reference; retain Noto Sans Malayalam for Malayalam script coverage.

Keep straight, slotted beams and the restrained hairline Three.js drawing style. `beam-illustrations/open-study/` is the restored baseline. It remains an exploration, not an approved final identity. The curved playful revision was explicitly rolled back. Its files remain in `beam-illustrations/open-study/archive/play-revision/`. The shared-bench expansion and Zine brand expression were also rejected; keep them only as history. Develop locally and keep work out of Figma until explicitly requested.

Color must have a clear purpose: draw attention to an action, distinguish parts or states, or improve contrast. Start with neutral structure and apply the Maker Faire palette selectively; do not recolor whole illustrations merely to include every brand color. The mechanism samples currently reserve red for drive input and cyan for the selected part.

## Poster direction name

Call this poster direction **Loud Design**. Use that name in previews, briefs and future work. **Make Some Noise** remains the campaign headline.

## Contents

- `genz-poster-lab/media-signal/`: media-team volunteer post and story in the user-selected Make Some Noise style, with an original Anatomy-built camera/slider illustration, all five creative roles, Kerala-wide eligibility, verified signup QR, editable geometry and retained reviews.

- `genz-poster-lab/`: **Loud Design**, the poster directions requested 13 October 2026 beyond the existing palette/type system, with three moodboards, editable 1080 × 1350 posters and retained Astra reviews. The user prefers **Make Some Noise.** for continuation. `genz-poster-lab/signal-play/` adds three typography experiments, including the actual supplied Kochi logo and official colors. These remain separate concept experiments; prior illustrations, Figma and Paper are intact.

- `media-team/`: new media-team volunteer recruitment poster, 4:5 post and 9:16 story, openly licensed photographs, five creative roles and verified signup QR.

- `volunteer-motion/`: the alternate `story-02.html` uses a closer maker photograph and a shorter story-team invitation, alongside the original 12-second volunteer collage motion study, Anton + Mono, Maker red/cyan/white, with editable timeline and MP4 export; 1080 × 1920 story edition includes the supplied Kochi logo.

- `brand-guidelines/`: local color and typography reference from the existing Kochi Figma foundations and guidelines, with font files, licenses, JSON and CSS. The current pairing is Anton with IBM Plex Mono; the earlier campaign typography remains documented as a historical reference. Figma originals are preserved.

- `beam-illustrations/`: six original objects, current straight-beam study, earlier shared bench and spatial applications, and archived revisions.
- `beam-illustrations/robot-study/`: separate Anatomy toolkit trial: a moving pick-and-place robot with straight slotted links. It does not replace the current baseline.
- `beam-illustrations/piano-study/`: separate interactive grand-piano anatomy study. Eleven annotated assemblies separate and reassemble; the assembled instrument plays local Salamander samples through touch/computer keys, a MIDI demo and MIDI-file import. Optional controller input depends on browser support.
- `beam-illustrations/anatomy-samples/`: Maker Faire Kochi mechanism samples in the straight-beam language: a pen plotter, stamp press and hand winch, with motion, exploded parts and interactive inspection.
- `beam-illustrations/cheenavala-study/`: focused cheenavala anatomy in the same system. Eight assemblies separate for inspection; a ten-second cycle lowers and lifts the woven net with opposite counterweight motion. Red marks operating ropes and cyan marks the selected assembly.
- `maker-faire-posters/`, `maker-motion/`, `maker-riso/`, `maker-editorial/`, `maker-kinetic/`: earlier poster, illustration, research and motion studies.
- `kerala-already-makes/`, `kerala-photo-zine/`, `kerala-collage-motion/`: Kerala campaign studies, references, credits, source assets and exports.
- `cheenavala-three-motion/`, `cheenavala-guided-motion/`: 3D motion and guided detail studies.
- `workshop-system/`: historical Workshop Edition brand and spatial exploration; not the current baseline.
- `spatial-concepts/`: self-contained entrance / workshop concept board and SVG marks from this chat.
- `outputs/`: volunteer story poster and a risograph treatment, with the original retained and photo credits / generation prompt in the riso JSON sidecar.
- `hairline-extension/`: independent copy of the shared illustration reference and its license.
- `references/zine/`: historical guide snapshot, preserved only for provenance.
- `migration/`: checksums, dependency changes and originals of files adjusted during extraction.

## Editing and exports

The beam SVG builder uses `beam-illustrations/palette.json`; it no longer reads the old core tokens. Run `python3 beam-illustrations/build.py` from this project. The workshop builder uses bundled fonts and local illustrations. Each study retains its own README and existing capture commands / ports. Capture scripts may require Node, Playwright and Chrome; Python image scripts may require Pillow and fontTools. These are tooling dependencies, not dependencies on Design System. Bundled font, Three.js and Hairline licenses stay beside their assets.

Existing ZIP exports and historical Figma/Paper ledgers are preserved as historical delivery records. They may contain old paths or external file IDs; regenerate from the migrated editable source for new handoffs. The 11 Maker Faire creative groups were subsequently moved from Design System to the Maker Faire Posters Figma file; see `migration/figma-migration.json`. The original Kochi moodboard, foundations and guidelines remain in Figma. Paper remains unchanged. Historical README statements about a selected direction are superseded by the current direction above.

Reference moodboard: https://www.figma.com/design/0kwqCaBkGGypYupzl7gsuj/Maker-Faire-Kochi-Moodboard?node-id=0-1
