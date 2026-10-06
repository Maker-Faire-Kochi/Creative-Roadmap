---
name: "Maker Faire Kochi — The Open Workshop"
version: "1.1 (campaign exploration)"
source:
  figma_file_key: "xczyTXBjbMPH9JXyYDeO8w"
  figma_file_name: "Maker Faire Kochi Moodeboard (Copy)"
  figma_url: "https://www.figma.com/design/xczyTXBjbMPH9JXyYDeO8w/Maker-Faire-Kochi-Moodeboard--Copy-"
  pages: { "0:1": "00 Start Here", "5:13": "02 Graphic Kit" }
  exported: "2026-10-05"
  moodboard: "https://in.pinterest.com/awaaz_/maker-faire-kochi-the-open-workshop/"
colors:
  # Figma variables (exact). Use these names in code: --mf-color-*
  paper: "#f4efdf"      # mf/color/paper — default light ground
  ink: "#20251f"        # mf/color/ink — text + dark ground (never pure #000)
  blue: "#2854d9"       # mf/color/blue — accent, Malayalam place name, cover ground
  red: "#ef432d"        # mf/color/red — accent
  yellow: "#f7c928"     # mf/color/yellow — accent
  white: "#ffffff"      # mf/color/white — logo only
  maker-red: "#ed1c24"  # mf/color/maker-red — official Maker Faire logo ONLY
  maker-blue: "#00aeef" # mf/color/maker-blue — official Maker Faire logo ONLY
typography:
  display:
    family: "Bricolage Grotesque"
    figma_style: "96pt ExtraBold"   # exact Figma style name
    weight: 800
    optical_size: 96                 # font-variation-settings: "opsz" 96, "wdth" 100
    case: "uppercase for headlines; sentence case for card titles"
    line_height: "0.90–1.01 of size (cover 137/130, start 98/94, section 86/86.86)"
    letter_spacing: "-2% to -3% (cover -4px @137px, start -2px @98px, section -1.72px @86px)"
  title:
    family: "Bricolage Grotesque"
    figma_style: "96pt ExtraBold"
    sizes: ["30px / 30.3px, -0.6px (part names, UPPERCASE)", "28px / 31.36px (card titles, sentence case)"]
  body:
    family: "Bricolage Grotesque"
    figma_style: "Regular"
    weight: 400
    optical_size: 14
    sizes: ["30/38.4", "28/36", "26/33.28", "23/32", "20/22.4"]
  label:
    family: "IBM Plex Mono"
    figma_style: "Medium"
    weight: 500
    case: "UPPERCASE"
    styles:
      "MF / Campaign type / Label / 20": "20px / 22.4px, 0 tracking"
      "MF / Campaign type / Label / 14": "14px / 15.68px, 0 tracking"
    other_sizes: ["22/24.64 underlined links", "18/23.04", "16/17.92", "16/24 (2-line block)"]
  malayalam:
    family: "Noto Sans Malayalam"
    weight: 700
    size: "64px / 71.68px"
    color: "blue"
    text: "കൊച്ചി"
spacing:
  base: 4             # --mf-space-4 = 4px (the only spacing variable in the file)
  frame_margin: 64    # all 1440-wide boards use 64px outer margin
radius:
  none: 0             # --mf-radius-none — the system is square-cornered (parts themselves are rounded capsules)
rules:
  rule_weight: "1px on 1440px boards (scale to 2–4px for 1080px social/video)"
components:
  parts: "Beam, Elbow, Wheel × red/blue/yellow/ink — assets/kit/parts/*.svg (240×240 viewBox)"
  assemblies: "Construction K, Hand crank, Crane, Direction arrow × full/ink/paper/blue/yellow — assets/kit/assemblies/*.svg (600×600)"
  assemblies_derived: "Wheel arm × full/ink/paper/blue/yellow — assets/kit/assemblies/wheelarm-*.svg (600×600) — NOT in Figma; built from kit parts"
  wayfinding: "Wayfinding arrow × ink/paper, direction by rotation — assets/kit/wayfinding/*.svg"
  logo: "assets/logo/reference-logo.svg — REFERENCE ONLY, replace with organiser-supplied Kochi mark"
  geometry: "kit.json — per-path roles, bounding boxes and joint pivots for every SVG"
---

# The Open Workshop — Maker Faire Kochi visual system

> **For agents (Claude, Codex, others):** the YAML frontmatter above is the **normative** layer — quote hex values, font families, weights and sizes verbatim; never invent or round them. The prose below is intent and judgment. Asset paths are relative to this folder. Machine-readable tokens: `tokens/tokens.json` (W3C design-token format) and `tokens/tokens.css` (CSS custom properties). Kit geometry: `kit.json`.

## 1. Idea

**"A city made of working parts."** Kochi is shown as a working workshop: rigid parts, visible connections, movement at the joints. Every graphic is *assembled* from a small kit of perforated construction parts — beams, elbows and wheels — the way a maker builds. Curiosity becomes a shared language; built from parts, open to everyone.

Campaign line on the cover: **A CITY / MADE OF / WORKING / PARTS.** Kit motto: **RIGID PARTS / VISIBLE CONNECTIONS / MOVEMENT AT THE JOINTS.** Guiding rule (board title): **ASSEMBLE, DON'T DECORATE.**

Other phrases found in the file (layer names from earlier drafts — usable as tone references, not as approved copy): *Curiosity becomes a shared language · Built from parts. Open to everyone. · Pick a part. Make it yours. · Place becomes a part. · Curiosity, in motion. · A city that builds. · Direction with character. · Follow an idea · Keep the family resemblance.*

## 2. Colour

| Token | Hex | Role |
|---|---|---|
| `paper` | `#f4efdf` | Default ground (warm, never pure white) |
| `ink` | `#20251f` | Text, rules, dark ground (never pure black) |
| `blue` | `#2854d9` | Accent; full-bleed grounds (Start Here board); Malayalam place name |
| `red` | `#ef432d` | Accent |
| `yellow` | `#f7c928` | Accent; small labels on blue/ink |
| `maker-red` / `maker-blue` / `white` | `#ed1c24` / `#00aeef` / `#fff` | **Official Maker Faire logo only** — never use as campaign colours |

Grounds used in the file: paper (cover, base parts), blue (start here), ink (parts in use, with paper panels). One ground per board/frame; accents are full-saturation, used as solid shapes, never gradients or glows.

**Text contrast (WCAG 2.x, computed):**

| Pair | Ratio | Use |
|---|---|---|
| ink on paper | 13.57 | any text |
| ink on yellow | 9.91 | any text |
| blue on paper | 5.43 | any text |
| ink on red | 4.09 | large/bold text only (≥24px regular or ≥18.66px bold) |
| yellow on blue | 3.97 | large text only |
| paper on red | 3.31 | large text only |
| blue on ink · red on yellow · paper on yellow · blue on red | 2.50 / 2.42 / 1.37 / 1.64 | **never for text** |

## 3. Typography

- **Display — Bricolage Grotesque, Figma style "96pt ExtraBold"** (weight 800, `opsz` 96). Tight: line-height ≈ 0.9–1.0 × size, tracking −2 % to −3 %. Headlines UPPERCASE; card/section titles may be sentence case (e.g. "The core construction parts", "Start with a template.").
- **Body — Bricolage Grotesque Regular** (`opsz` 14), line-height ≈ 1.28 × size.
- **Labels — IBM Plex Mono Medium, UPPERCASE.** Used for headers, footers, numbering (`01`, `02`, `03`), section kickers (`03 / THE CONSTRUCTION KIT`), and links (underlined, 22px). Slash-separated metadata is the house pattern: `THE OPEN WORKSHOP / DESIGN DIRECTION`, `KOCHI / 2027`.
- **Malayalam — Noto Sans Malayalam Bold**, in blue: കൊച്ചി (cover, under the K).
- Web/video fallbacks: none needed — all four families are Google Fonts and ship in `assets/fonts/` (OFL). In Figma use the exact style names (`96pt ExtraBold`, `Regular`, `Medium`).
- Before production the Start Here board says: *"apply the supplied Kochi logo and confirm typography against the current organiser kit."*

## 4. Layout grammar (from the boards)

- Boards are 1440 wide (1000–1200 tall) with a **64px margin**.
- **Header**: Plex Mono labels top-left (and top-right for version/context, e.g. `THE OPEN WORKSHOP / CAMPAIGN EXPLORATION / V1.1`).
- **Footer**: a full-width **1px rule**, then three Plex Mono 14px labels: left `MAKER FAIRE KOCHI`, middle `<SECTION / CONTEXT>`, right page number `00`/`04`.
- **Three-column info blocks** (Start Here): rule → yellow mono number → display title (28px) → body (23px), columns at x = 64 / 512 / 960, 400px wide.
- **Panels** (Parts in use): paper rectangles 640×332, square corners, on an ink ground; mono label top-left, one-line caption bottom-left, the graphic placed right and allowed to fill the panel height.
- Square corners everywhere (`radius 0`); the only round things are the parts themselves.
- No shadows, no gradients, no textures in the file. Depth comes from overlapping parts and solid colour fields.

## 5. The construction kit (graphics)

All artwork is in `assets/kit/` as the exact Figma exports. Geometry, path roles and pivots: `kit.json`.

**Parts** (`MF / Construction Parts`, 7:74) — *"Six parts, four working colours. Connect parts at their holes to build recognisable letters, mechanisms and directional graphics. Scale proportionally; retain the cutouts."* (The file currently contains three part types — beam, elbow, wheel — in red/blue/yellow/ink.) Each part: *"A perforated part … Join at a visible pivot and scale uniformly. The cutouts remain transparent."*

| Part | Meaning (board 03) | File |
|---|---|---|
| Beam | The main member | `parts/beam-{red,blue,yellow,ink}.svg` |
| Elbow | The corner connection | `parts/elbow-{…}.svg` |
| Wheel (gear) | The rotating part | `parts/wheel-{…}.svg` |

**Assemblies** (`MF / Assemblies`, 8:42) — *"Construction K, hand crank, crane and arrow. Use a single colour for most applications; reserve the full-colour artwork for large focal illustrations. Keep graphics separate from the official event logo."* Each: *"A connected Open Workshop assembly. Preserve proportions and visible joints."* Tones: `full`, `ink`, `paper`, `blue`, `yellow`.

| Assembly | Board label · caption | Files |
|---|---|---|
| Construction K | CONSTRUCTION K · "Supporting graphic; keep it separate from the logo." | `assemblies/k-*.svg` |
| Hand crank | HAND CRANK · "A wheel, crank and bearing support." | `assemblies/crank-*.svg` |
| Crane | CRANE · "A reference to the working waterfront." | `assemblies/crane-*.svg` |
| Direction arrow | DIRECTION ARROW · "Use the sign components for directions." | `assemblies/arrow-*.svg` |

**Derived assemblies (not in the Figma file).** These are built in this repo from the kit's own parts, joined hole to hole by the kit rules. Treat them as campaign extensions, not moodboard canon.

| Assembly | Built from | Files |
|---|---|---|
| Wheel arm | blue elbow bracket + red beam + yellow wheel. The elbow's arm-end hole meets the beam's left hole; the beam's right hole meets the wheel hub. Ink bolts sit at both joints, and the wheel sits behind so the connecting beam reads. | `assemblies/wheelarm-{full,ink,paper,blue,yellow}.svg` |

Use it where a simple, three-step mechanism fits. The awareness carousels assemble it as elbow → wheel → beam. Geometry and pivots are in `kit.json → assemblies.wheelarm-*`.

**Wayfinding arrow** (`MF / Wayfinding Arrow`, 21:145) — variants `Tone = ink | paper` × `Direction = Right | Up | Left`. The exported artwork points right; Up/Left are the same artwork rotated −90° / 180°.

**Kit rules**
- New assemblies are allowed when they are built from kit parts joined at their holes (see *Derived assemblies*). Record their provenance in `kit.json`.
- Never recolour inside a part or distort it; scale uniformly; keep the holes/cutouts transparent (they show the ground through).
- Build new graphics by **joining parts at their holes** (visible pivots), not by drawing new shapes.
- Prefer single-tone artwork; full colour only for large focal pieces.
- The K and other assemblies are **supporting graphics — never a logo substitute** and never locked up with the official logo.
- Motion: things move **at the joints** — beams unfold about a bolt, wheels turn about their centre, the crank turns about its axle, the crane hook lowers on its cable. See `kit.json → pivots`.

## 6. Logo

`assets/logo/reference-logo.svg` (node 10:2) is a **reference placeholder** (Maker Faire wordmark in maker-red/maker-blue). Figma note: *"REFERENCE ONLY. The public identity guide specifies the supplied local-event logo. Replace this reference with the current organiser-supplied Kochi mark before release. Preserve official artwork, proportions and clearspace."* Docs: https://makerfaire.com/make-logos/. Until the official mark is supplied, set "MAKER FAIRE KOCHI" in Plex Mono or display type instead of using this file in published work.

## 7. Using the system (Start Here board, verbatim)

1. **Start with a template.** Use the posters, signs, badges and stickers as your starting point.
2. **Edit the instance.** Change names and destinations. Use variants for roles and directions.
3. **Use the shared styles.** Use shared colours and type styles. Scale artwork in proportion.

The board links to "01 / FOUNDATIONS", "02 / GRAPHIC KIT" and "04 / APPLICATIONS"; only *00 Start Here* and *02 Graphic Kit* exist in the copied file (no poster/sign/badge templates were included).

## 8. Implementation notes (learned while producing campaign assets)

- **Social/video scale**: on 1080-wide canvases use 80px side margins, labels 24–30px, body 40–50px, headlines 130–300px, rules 3–4px.
- **Instagram story safe zone**: keep key text between y≈250 and y≈1620 on 1080×1920.
- Kit SVGs reuse ids (`Vector`, `Vector_2`…) — **prefix ids when inlining more than one SVG** in a page.
- Animating a part that also moves as a group: put the group translation on a wrapper `<g>` and the rotation on the path (GSAP `svgOrigin` + `y` on the same path drifts).
- A single 240px beam is too thick to act as a strike-through across a word; use a long capsule in the beam's style (red, paper slot, ink bolts) instead.
- In Figma (Plugin API) the display style string is `"96pt ExtraBold"`, not "ExtraBold".
- Local font URLs with spaces must be quoted/encoded in CSS `url()`.

## 9. Campaign content rules (from the organisers — Oct 2026)

- Don't print the event date in content unless asked; use **COMING SOON**.
- Prefer clear, descriptive words over the shortest ones (**CODING**, **WOODWORK**, not CODE/WOOD).
- Volunteer calls are **Kerala-wide**: location line reads **KERALA**, not the Malayalam place name.
- Roadmap/strategy source: `../index.html` (Creative Content Roadmap).
