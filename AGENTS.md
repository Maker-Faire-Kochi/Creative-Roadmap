# AGENTS.md

Repository: content strategy and campaign assets for **Maker Faire Kochi 2027**.

## Design system: read this before making any visual
The visual system ("The Open Workshop") is saved offline in **`design-system/`**. Use it instead of calling the Figma MCP, which is rate-limited.

1. `design-system/DESIGN.md`: the spec. Its YAML frontmatter tokens are normative: use the hex values, fonts and sizes verbatim.
2. `design-system/tokens/tokens.css`: link it for colours, local fonts and type classes. `tokens.json` has the same values in W3C token format.
3. `design-system/kit.json` and `design-system/assets/kit/`: the construction-kit SVGs (parts, assemblies, wayfinding), with path roles and joint pivots.
4. `design-system/reference/figma-map.md` and `reference/screens/`: the Figma boards, verbatim copy and node ids.

Only go back to Figma (file `xczyTXBjbMPH9JXyYDeO8w`) if something isn't in that folder.

## Hard rules
- Colours are paper `#f4efdf`, ink `#20251f`, blue `#2854d9`, red `#ef432d` and yellow `#f7c928`. Maker red and blue (`#ed1c24`, `#00aeef`) are for the official logo only.
- Type is Bricolage Grotesque 96pt ExtraBold (display), Bricolage Regular (body), IBM Plex Mono Medium in uppercase (labels) and Noto Sans Malayalam Bold (place name).
- Assemble, don't decorate. Build graphics from kit parts joined at their holes. Don't recolour inside a part or distort it; scale uniformly.
- Logo: use the official Maker Faire Kochi lockups in `design-system/assets/logo/official/`, as supplied. Use long on paper, border on coloured or dark grounds, and square for stacked sign-offs. Never recolour, crop or overlap them. `assets/logo/reference-logo.*` is a superseded placeholder, so don't publish it.
- The K and the other assemblies are supporting graphics, never a logo or part of a lockup.
- Content: no event date unless asked (use "COMING SOON"). Use clear, descriptive words (CODING, not CODE). Volunteer calls are Kerala-wide (location "KERALA").

## Other context
- `index.html`: the Creative Content Roadmap (five campaign stages, content series, calendar). It's the source of truth for content strategy.
- `brag-output-*` and `volunteer-call-*`: generated campaign assets, with their build scripts under `build/`.
