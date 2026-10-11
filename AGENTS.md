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
- Type is Bricolage Grotesque 96pt ExtraBold (display), Bricolage Regular (body), IBM Plex Mono Medium in uppercase (labels), Noto Sans Malayalam Bold (place name) and Baloo Chettan 2 ExtraBold (Malayalam/Manglish headlines, Malayalam letters only; Latin stays Bricolage).
- Assemble, don't decorate. Build graphics from kit parts joined at their holes. Don't recolour inside a part or distort it; scale uniformly.
- Logo: use the official Maker Faire Kochi lockups in `design-system/assets/logo/official/`, as supplied. Use long on paper, border on coloured or dark grounds, and square for stacked sign-offs. Never recolour, crop or overlap them. `assets/logo/reference-logo.*` is a superseded placeholder, so don't publish it.
- The K and the other assemblies are supporting graphics, never a logo or part of a lockup.
- Content: no event date unless asked (use "COMING SOON"). Use clear, descriptive words (CODING, not CODE). Volunteer calls are Kerala-wide (location "KERALA").

## Workflows: generating and scheduling content
Repeatable pipelines live in **`workflows/`**; read `workflows/README.md`, then the runbook of the one you're using.

- `workflows/awareness-carousels/`: renders the awareness carousels (19 topics × 5 designs × post + story) in English and Manglish, with layout QA and a review gallery.
- `workflows/instagram-scheduling/`: schedules the carousels and their stories on Meta Business Suite from an approved plan.

Rules that apply to any agent:
- **Source in git, output out of git.** Generated artwork, galleries, schedule ledgers, screenshots and upload copies go in `output/` (git-ignored) or a campaign output folder, never in `workflows/`. The repo is **public**: never commit them, or Meta account identifiers.
- **Copy has one source of truth:** slide copy in `workflows/awareness-carousels/content/topics.mjs` (English) and `topics-ml.mjs` (Manglish); captions and keyword tags in `content/captions.md`; schedules in `workflows/instagram-scheduling/plans/*.json`. Change the source and re-render; never hand-edit a generated file.
- **Human gates:** the user approves every caption before it is scheduled, and a fluent speaker reviews Manglish copy before it is published. Record approvals with `prepare.py --approve`; never assume one. Never publish immediately, and don't re-render or edit artwork that is already scheduled.
- Captions use bracketed keyword tags (`[MakerFaireKochi, Maker, Kochi, Kerala]`), not hashtags. Stories have no caption.
- Manglish: Malayalam grammar with English maker words kept in English, "Maker Faire Kochi" always English, no event date (`ഉടൻ വരുന്നു` = coming soon). Maker Stories isn't released yet, so copy says it is coming.

## Other context
- `index.html`: the Creative Content Roadmap (five campaign stages, content series, calendar). It's the source of truth for content strategy.
- `brag-output-*`, `volunteer-call-*` and `awareness-carousels-*`: generated campaign assets from earlier runs (untracked). New awareness runs write to `output/` via the workflows above.
