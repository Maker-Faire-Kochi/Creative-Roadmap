# Maker Faire Kochi — guidelines & references

A compact working reference for the Maker Faire Kochi visual work developed so far. It records creative decisions, typography, color, selected visual references and source credits. Compiled from the local project on **22 October 2026**.

## Start here

- [Creative guidelines](docs/creative-guidelines.md): illustration, campaign, type, color and content rules.
- [Visual references](references/README.md): the straight-beam baseline, Make Some Noise campaign, camera rig and supplied logo.
- [Research & credits](docs/research-and-credits.md): reference links, image provenance and licenses.
- [Local study inventory](docs/local-workspace-inventory.md): an index of the wider body of experiments and their status.
- [Color and typography tokens](brand-guidelines/tokens.json) and [CSS variables](brand-guidelines/tokens.css): the existing local foundation snapshot.

## Direction

The illustration baseline uses **straight slotted beams, opaque surfaces and fine hairline edges**. Anton with IBM Plex Mono is the general working type pairing; Noto Sans Malayalam supplies Malayalam coverage.

The later selected **Loud Design / Make Some Noise** campaign uses warm yellow, electric blue, Dela Gothic One and Inter. Its media-team adaptation carries the same campaign language. These campaign choices have their own context; they do not establish an approved identity for every application.

Curved playful beams were rolled back. Shared Bench, Zine and Open Workshop remain historical explorations. The guide distinguishes official logo references, working directions and historical proposals.

## Included

Written guidelines, a small selection of still images and an SVG reference, supplied logo artwork, color/type data, locally bundled reference fonts, provenance and licenses. Images remain unchanged from their local source files; [the manifest](references/manifest.json) records their origins and SHA-256 checksums.

Full experiment source folders, renderer/toolkit dependencies, frame sequences, video/GIF exports, delivery ZIPs and repeated iterations remain in the local archive. The repository's allowlist in `.gitignore` keeps them out of routine commits. Git LFS is not required.

## Preview the existing color/type sheet

```sh
git clone https://github.com/niyamax/maker-faire-kochi.git
cd maker-faire-kochi
python3 serve.py
```

Open http://127.0.0.1:8796/brand-guidelines/ . The full local archive also retains its original study previews, including `/beam-illustrations/open-study/`; those runtime files are not distributed in this reference repository.

## Working rules

Keep this project independent of Design System. Preserve original source files, credits and licenses. Inspect rendered work at intended size, keep substantial prior iterations locally, and record whether a direction is selected, exploratory or rejected. Edit Figma and Paper only when explicitly requested.

Maker Faire marks and third-party assets retain their respective rights and licenses. No blanket license is applied to this collection.
