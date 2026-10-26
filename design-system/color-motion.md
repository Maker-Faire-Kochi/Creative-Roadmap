# Colour in motion

Six looks for motion pieces. Two follow the guidelines' directions. Three are new **transition** looks, where every text change brings a full-screen colour change. Weave Plain sets Weave on one ground.

| Look | Flag | Letters | Grounds | Status |
|---|---|---|---|---|
| General | `general` | Studio Sans | Paper throughout; accents in red | Selected (Studio Sans is a recorded deviation from Anton) |
| Loud Design / Make Some Noise | `noise` | Dela Gothic One | Yellow throughout; accent words on inverted blue plates | Selected |
| Colour | `colour` | Studio Sans | Brand colours. The beats rotate paper, cyan, yellow, blue (starting point by topic); the payoff lands on red; the end card is paper. No charcoal ground: the user ruled the dark grey out (2026-10-26) | **Exploratory** |
| Weave | `weave` | Studio Sans | Colour's grounds. The sentence fills the poster edge to edge, and one object pops up in the middle and pushes the letters out (see [motion.md](motion.md) § Placement). No footer: the official lockup appears only on the end card. The object is a CC0 model (`--hero=cc0`) or a beam-kit assembly (`--hero=beams`) | **Exploratory** |
| Weave Plain | `weave-plain` | Studio Sans | Paper throughout, accents in red, no colour change; otherwise as Weave | **Exploratory** |
| Noise Shift | `noise-shift` | Dela Gothic One | Noise palette + red. The beats alternate yellow and blue; the payoff lands on red; the end card is blue | **Exploratory** |

Supporting labels: IBM Plex Mono Medium (General and Colour), Inter Bold (both Noise looks). Weave has no labels.

## Grounds and their pairs

Each ground fixes everything drawn on it:

| Ground | Background | Letters | Accent | Strike | Logo | 3D ink edges |
|---|---|---|---|---|---|---|
| paper | `#F6F6F3` | ink `#222222` | red `#ED1C24` | red | long lockup | shown |
| red | `#ED1C24` | white | ink | ink | border lockup | shown |
| ink (defined, not in any rotation) | `#222222` | paper | cyan `#00AEEF` | red | border lockup | hidden |
| cyan | `#00AEEF` | ink | white | red | border lockup | shown |
| yellow | `#FFE86C` | blue `#2B19D9` | red | red | border lockup | shown |
| blue | `#2B19D9` | yellow | white | red | border lockup | hidden |
| red (Noise Shift) | `#ED1C24` | yellow | white | blue | border lockup | shown |

In the Noise looks an accent word sits on a plate in the letters' colour, with its letters in the ground's colour (as in the carousels), and a strike cuts through in the ground's colour.

**Logo:** the long lockup on paper only, and the border lockup on every coloured or dark ground (AGENTS.md). Each lockup is drawn only with its own ground. During a transition the incoming ground and its logo are revealed together through the same shape, so a lockup never sits on the wrong colour, and it is never recoloured, cropped or overlapped.

**3D on colour:** objects keep their neutral materials on every ground. Ink edges hide on ink and blue, where they would vanish; the faces carry the form there.

## Transitions

The colour starts 0.15 s before the text change and lands over 0.55 s (quintic). The old letters are already squashing out, and in the transition looks the new letters wait 0.3 s for the colour.

| Kind | Shape |
|---|---|
| `iris` | A circle grows from the centre of the 3D window, as if from the object |
| `wipe` | A straight edge crosses in the direction the camera moves (orbit or truck: sideways; crane: up or down) |
| `shutter` | Five bars slide in from alternate sides, staggered |
| `rise` | The colour grows out of the new letter rows |

The default rotates through the four, and a storyboard sets `tx` per beat. The end card always opens with an iris.
