// The Studio track's illustrations: one 3D still per slide, set under the lettering (src/studio.mjs).
// Each still is one image event that shows the slide's sentence, drawn by the motion posters' 3D stage
// (workflows/motion-posters/build/stage.js): CC0 props from design-system/3d/manifest.json, the beam kit, and the
// makerfaire.in actors (Makey, the people). They are illustrations, never evidence (design-system/README.md).
//
//   props   [{ name, model, at: [x, y, z] metres, yaw, scale }]   (models: design-system/3d/manifest.json or a beam id)
//   actors  [{ name, kind: "makey" | "person", variant, seed, at, yaw }]
//   do      [[motion, "prop" or "prop.part", time, params]]   (design-system/3d/src/motions.ts; e.g. glow)
//   act     [[action, actor, time]]                          (Makey: wave hop shove tumble; people: wave clap point)
//   frame   { at, view, yaw, pitch }                         (the tableau's framing; default three-quarter view)
//   t       seconds of simulation before the still is taken (lets an action reach its pose; default 1.2)
// null: no illustration (stat slides: the numeral is the image).
//
// Every last slide is the sign-off: the square lockup and Makey, the maker robot, waving the viewer in (the motion
// posters' end card, workflows/motion-posters/content/storyboards.mjs END_STAGE).
//
// Pilot (2026-11-02): topics 01, 02, 05 and 13, solved before extending to the rest (guidelines: solve one
// illustration before extending it to many applications). Topics without an entry render type only.

// Along the default camera's left-to-right (yaw -0.62): where to stand things in a row.
const along = (i, n, gap) => { const k = (i - (n - 1) / 2) * gap; return [+(k * 0.81).toFixed(3), 0, +(k * 0.58).toFixed(3)]; };

export const SIGNOFF = { actors: [{ name: "makey", kind: "makey", yaw: -0.5 }], act: [["wave", "makey", 0.2]], t: 1.1 };

export const STUDIO_ASSETS = {
  "01-maker-faire-101": [
    // "Maker Faire, what's that?": Makey, the maker robot, looks up at the question.
    { actors: [{ name: "makey", kind: "makey", yaw: -0.3 }], act: [["hop", "makey", 0.1]], t: 0.9 },
    // "It isn't a conference.": a workbench, not a lectern.
    { props: [{ name: "bench", model: "workbench", yaw: -0.5 }] },
    // "A show-and-tell of people making their own things": three things people made, side by side.
    { props: [
      { name: "arm", model: "robot-arm", at: along(0, 3, 0.36) },
      { name: "board", model: "circuit-board", at: along(1, 3, 0.36), yaw: -0.62 },
      { name: "radio", model: "radio", at: along(2, 3, 0.36), yaw: -0.5 },
    ] },
    SIGNOFF,
  ],
  "02-kerala-already-makes": [
    // "Before the word 'maker' came...": the word, in a book.
    { props: [{ name: "book", model: "open-book", yaw: -0.4 }] },
    // "...Kerala started the work long ago.": an old valve radio, the kind Kerala's repair shops kept going.
    { props: [{ name: "radio", model: "radio", yaw: -0.5 }] },
    // "In the repair shop. In the kitchen. On campus. In the workshop.": one thing from each, in reading order.
    { props: [
      { name: "fan", model: "desk-fan", at: along(0, 4, 0.34), yaw: -0.4 },
      { name: "pan", model: "frying-pan", at: along(1, 4, 0.34), yaw: -0.9 },
      { name: "laptop", model: "laptop", at: along(2, 4, 0.34), yaw: -0.5 },
      { name: "cog", model: "cog", at: along(3, 4, 0.34) },
    ] },
    SIGNOFF,
  ],
  "05-repair-is-making": [
    // "Fixed the fan? Stitched the bag? Rewired the lamp?": the three repairs, the lamp lit.
    { props: [
      { name: "fan", model: "desk-fan", at: along(0, 3, 0.4), yaw: -0.4 },
      { name: "bag", model: "bag", at: along(1, 3, 0.4), yaw: -0.62 },
      { name: "lamp", model: "table-lamp", at: along(2, 3, 0.4) },
    ], do: [["glow", "lamp.shade", 0.1, { amount: 1.1 }]], t: 1.4 },
    SIGNOFF,
  ],
  "13-the-global-scale": [
    // "How far will an idea go?": the idea, a lamp that lights.
    { props: [{ name: "lamp", model: "table-lamp" }], do: [["glow", "lamp.shade", 0.1, { amount: 1.1 }]], t: 1.4 },
    null, null, null,
    SIGNOFF,
  ],
};
