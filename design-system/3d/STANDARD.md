# The 3D asset standard

Every 3D object in Maker Faire Kochi motion work looks like it belongs to one set. That set is the makerfaire.in scenes ([Maker-Faire-Kochi/Website](https://github.com/Maker-Faire-Kochi/Website), `app/three/`). The standard below is read from that site's code and from the guidelines' [straight-beam baseline](../../guidelines/references/illustration/straight-beam-baseline.png). Our code (`src/`) puts it into practice; none of the website's code is copied (that repository has no licence).

## What the set looks like

- **Simple forms.** Planar plates, blocks, discs and pins, or smooth low-poly lofts for organic shapes (people, fabric). Nothing needs a texture to read.
- **Real scale, in metres.** Makey is about 0.25 m. People are 7.5 heads tall, children 5.5. A model's `height` in the manifest sets its scale.
- **Opaque faces, flat colour.** One `MeshLambertMaterial` per palette key, drawn with polygon offset, with no maps and no PBR.
- **Hairline edges.** 1px ink (`#222222`) lines at a 20° crease angle, or 30–60° for curved models, so facets don't turn into a mesh of lines. Dark parts get no edges.
- **Light.** Hemisphere light 1.9 (sky white, ground `#D8D8D2`) plus one directional light 1.6 from the upper-left front (-3, 5, 4). No shadow maps. Anything standing gets a soft contact-shadow blob.
- **Framing.** An elevated three-quarter orthographic view: azimuth about -0.62 rad, elevation about 0.52 rad. Transparent background, no tone mapping.
- **Budget.** At most 5,000 triangles a model and about 80,000 a scene.

## Palette keys

| Key | Colour | Use |
|---|---|---|
| light | `#FBFBF9` | shells, paper, pin caps |
| mid | `#C9C9C2` | neutral parts |
| dark | `#2B2B2B` | joints, servos, soles, burnt things (no edges) |
| stone | `#9C9A92` | grey parts, smoke |
| metal | `#C4C8CC` | shafts, pins, tools |
| wood / woodDark | `#D9C4A1` / `#A88B63` | wood, card, cloth |
| water | `#DCE6EC` | glass, pale blue |
| leaf | `#8FA77E` | plants, circuit boards |
| red | `#ED1C24` | **purpose only:** a drive input (crank, motor), an action, a fault (spark) |
| cyan | `#00AEEF` | **purpose only:** a selection, a connection (links, a rejoined cable) |
| accent | `#225DAC` | **one per scene:** the beam blue, or one figure's garment |

A lit part (a bulb that is on) uses the glow material and a warm halo.

## Restyling a model (`src/restyle.ts`)

Every model is restyled when it loads, so the downloaded file stays untouched and its hash keeps meaning something:
1. Rotate the model (`rotate`, for models authored on their side), then scale it to `height` and stand it on y = 0, centred.
2. Give every face one key, taking the first rule that applies:
   - its cut part's `key`
   - `materials[name]`
   - `colors[#rrggbb]`
   - otherwise the automatic mapping from its colour (material colour or colour-atlas texel). Greys go by lightness, browns to wood, greens to leaf, pale blues to water. A saturated colour **becomes neutral**: a model never keeps a colour just because it has one.
3. Faces are opaque Lambert; edges are ink hairlines at `edge` degrees.
4. Keep the node hierarchy, so rigs still move joint by joint (the robot arm's elements). `parts` can also cut named parts out of a single mesh by `material` or `box`, with a `pivot`, so motions can address them (`desk-fan.blades`, `table-lamp.shade`, `cog.left`).

## Choosing a CC0 model

A model qualifies when **all** of these hold:
- [ ] Its licence is CC0-1.0, checked on its page (Kenney packs, Quaternius, and Poly Pizza models marked "CC0 1.0 Public Domain").
- [ ] It reads as simple forms at thumbnail size, without its texture.
- [ ] It is within the triangle budget, with plausible proportions at real scale.
- [ ] After restyling it sits beside the website's scenes and the beam kit (check on a contact sheet).
- [ ] It is not a likeness of a trademarked character or product, and carries no logo or brand.
- [ ] It means something in the piece: say what it stands for in `uses`.

Search Kenney first (furniture, food, survival, factory, prototype, city kits), then Quaternius, then CC0-only Poly Pizza. Rejected so far: the Poster Studio's sample images, which are photo-style 2D renders, one of which resembles a film character. There is no CC0 3D printer of a usable standard: "the broken print" is a printed cog that cracks.

## Adding a model

1. Add an entry to `manifest.json`:
   - `title`, `file` (`<pack>/<name>.glb`), `height`, and any `rotate`, `edge`, `materials`, `colors`, `parts`
   - `uses`
   - `source`: `pack`, `page`, `url`, `path` (inside a zip), `author`, `licence: "CC0-1.0"`
   - Kenney GLB packs also need their `Textures/colormap.png`, listed under `files`.
2. `node 3d/fetch.mjs` downloads it. `node 3d/fetch.mjs --record` writes its sha256 and triangle count. `node 3d/fetch.mjs --check` must pass.
3. `npm run sheet -- --manifest <id>` checks it against this standard (the tool prints its size and parts).
4. Credit it in `CREDITS.md`.

## The beam kit (`src/beams.ts`)

The guidelines' illustration language, built in code:
- Straight beams a whole number of pitches long (`PITCH` = 0.1 m), with round ends, end holes and a centre slot.
- Plain pins with light caps and a dark centre.
- Paper and ink beams, one accent blue, red only for a drive input.

| Assembly | Parts | Meaning |
|---|---|---|
| `beam-gesture` | `joint0`–`joint3` | The baseline study. On every end card the blue beam opens its joint: an open invitation |
| `beam-crank` | `crank` (red), `arm` | You try: turning the crank lifts the arm |
| `beam-frame-s` / `-m` / `-l` | `side0`–`side3` | One vocabulary at many sizes |
| `beam-link` | `swing` | A connection that pins two things together |

The kit is our own work and procedural (no file). The library serves it beside the CC0 models.
