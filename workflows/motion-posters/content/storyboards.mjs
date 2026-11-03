// Motion poster storyboards: one short story per awareness topic. Beat i is slide i of the topic in
// ../../awareness-carousels/content/topics.mjs, the copy's source of truth.
//
// Lettering: the slide's full sentence, one carousel line per row (design-system/copy.md). A beat replaces it only
// with `say` (rows, with the slide's *accent* / ~struck~ marks) and a `why`; every rewrite is listed in the
// wording table (node src/wording.mjs) for approval.
//
// The 3D (design-system/motion.md): each beat's objects act its sentence out, and `means` says how, for review.
//   stage.props   [{ name, model (design-system/3d/manifest.json), at: [x, y, z] metres, yaw, scale, keep }]
//                 keep: carry the prop from the previous beat (otherwise it shrinks away as its beat ends).
//   stage.actors  [{ name, kind: "makey" | "person", variant (shirt kurta mundu skirt headscarf child), seed, at, yaw }]
//   stage.do      [[motion, "prop" or "prop.part", time, params]]  motions: design-system/3d/src/motions.ts
//                 (drop pop rise slide shrink sink move spin turntable turn swing shake bob recolor glow)
//   stage.fx      [[effect, time, params]]  effects: design-system/3d/src/fx.ts (spark smoke seam cable pages link ripple);
//                 a point may name a prop: "@fan", "@fan+[0,0.1,0]"
//   stage.act     [[action, actor, time]]  Makey: tumble wave hop shove; people: wave clap point step-back
//   stage.frame   { at, view, yaw, pitch } to override the framing fitted round the beat's things
// Times are seconds from the beat's start, or "r1" (when row 1 of the lettering comes in), "r1+0.3", "end-0.4".
// cam: the camera move that opens the beat (push-in pull-out orbit-l orbit-r crane-up crane-down truck-l truck-r).
// tx: the colour transition in the Colour looks (iris wipe shutter rise). place: "text-top" | "model-top".
// A beat may instead cut to a makerfaire.in scene: set (backwater electronics workshop people makey hero pin-map),
// opts, shot, act: { cue: time }.
// Never show an event date: the website's machines scene (a live countdown) is not used.
export const END_SAY = "COMING SOON";
// The sign-off on every end card: Makey, the makerfaire.in maker robot, pops up and waves the viewer in under
// COMING SOON. (Until 2026-11-02 this was the beam kit's open gesture; replaced at the user's request.)
// The name is unique so it never clashes with a Makey a topic's own beats put on stage.
export const END_STAGE = {
  actors: [{ name: "signoff-makey", kind: "makey", at: [0, 0, 0], yaw: -0.5 }],
  do: [["pop", "signoff-makey", 0.05, { dur: 0.45 }]],
  act: [["wave", "signoff-makey", 0.45]],
};

const DIGIT_YAW = 0.9; // turns a digit's face (its wood face) square to the default camera
// Along the screen's left-to-right for the default camera (yaw -0.62): where to stand things in a row.
const BENCH = 0.34; // 06: the three failures side by side
const along = (i, n, gap) => { const k = (i - (n - 1) / 2) * gap; return [+(k * 0.81).toFixed(3), 0, +(k * 0.58).toFixed(3)]; };

export const STORYBOARDS = {
  "05-repair-is-making": {
    place: "model-top",
    beats: [
      {
        means: "Each repair happens as its line is read: the fan's blades go back on and spin, a seam is stitched across the bag, the lamp's cable rejoins and the lamp lights.",
        cam: "push-in", tx: "iris",
        stage: {
          props: [
            { name: "fan", model: "desk-fan", at: along(0, 3, 0.4), yaw: -0.4 },
            { name: "bag", model: "bag", at: along(1, 3, 0.4), yaw: -0.62 },
            { name: "lamp", model: "table-lamp", at: along(2, 3, 0.4) },
          ],
          do: [
            ["drop", "fan", "r0-0.1", { amount: 0.2 }],
            ["pop", "fan.blades", "r0+0.35", { dur: 0.35 }],
            ["spin", "fan.blades", "r0+0.75", { axis: "z", rate: 2.2 }],
            ["drop", "bag", "r1-0.1", { amount: 0.2 }],
            ["drop", "lamp", "r2-0.1", { amount: 0.2 }],
            ["glow", "lamp.shade", "r2+0.8", { amount: 2.4 }],
          ],
          fx: [
            ["seam", "r1+0.25", { from: "@bag+[-0.11,0.135,0.06]", to: "@bag+[0.08,0.135,-0.08]", dur: 1.1 }],
            ["cable", "r2+0.2", { points: ["@lamp+[0.03,0.006,-0.02]", "@lamp+[0.12,0.006,-0.12]", "@lamp+[0.2,0.006,-0.22]", "@lamp+[0.32,0.006,-0.27]"], gap: 0.07 }],
            ["spark", "r2+0.75", { at: "@lamp+[0.15,0.01,-0.16]", color: "#00AEEF", size: 0.05 }],
          ],
        },
      },
      {
        means: "All three repairs keep working side by side, the camera circling them: the fan turning, the bag closed, the lamp lit. Repair is making.",
        cam: "orbit-r", tx: "wipe",
        stage: {
          props: [
            { name: "fan", model: "desk-fan", keep: true },
            { name: "bag", model: "bag", keep: true },
            { name: "lamp", model: "table-lamp", keep: true },
          ],
        },
      },
    ],
  },

  "06-version-one": {
    place: "text-top",
    beats: [
      {
        means: "Makey, the maker robot, falls over on “didn't work”: the version that didn't work.",
        cam: "push-in", tx: "iris",
        stage: {
          actors: [{ name: "makey", kind: "makey", at: [0, 0, 0], yaw: -0.5 }],
          act: [["tumble", "makey", "r2+0.15"]],
          frame: { view: 0.62, at: [0, 0.1, 0.06] },
        },
      },
      {
        means: "Each failure as its line is read: the wrong circuit sparks, the printed cog cracks in two, the first batch burns and smokes.",
        cam: "truck-l", tx: "wipe",
        stage: {
          frame: { view: 0.5 },
          props: [
            { name: "board", model: "circuit-board", at: along(0, 3, BENCH), yaw: 0.3 },
            { name: "cog", model: "cog", at: along(1, 3, BENCH) },
            { name: "pan", model: "frying-pan", at: along(2, 3, BENCH), yaw: 0.5 },
            { name: "c1", model: "cookie", at: [along(2, 3, BENCH)[0] - 0.03, 0.012, along(2, 3, BENCH)[2] + 0.03] },
            { name: "c2", model: "cookie", at: [along(2, 3, BENCH)[0] + 0.05, 0.012, along(2, 3, BENCH)[2] + 0.0] },
            { name: "c3", model: "cookie", at: [along(2, 3, BENCH)[0] - 0.0, 0.012, along(2, 3, BENCH)[2] - 0.06] },
          ],
          do: [
            ["pop", "board", "r0-0.15"],
            ["shake", "board", "r0+0.4", { amount: 0.01 }],
            ["drop", "cog", "r1-0.15", { amount: 0.2 }],
            ["move", "cog.left", "r1+0.45", { to: [-0.035, 0, 0.012], dur: 0.3 }],
            ["turn", "cog.left", "r1+0.45", { axis: "z", amount: -0.22, dur: 0.3 }],
            ["move", "cog.right", "r1+0.45", { to: [0.035, 0, -0.012], dur: 0.3 }],
            ["turn", "cog.right", "r1+0.45", { axis: "z", amount: 0.22, dur: 0.3 }],
            ["pop", "pan", "r2-0.15"],
            ["pop", "c1", "r2-0.05"], ["pop", "c2", "r2"], ["pop", "c3", "r2+0.05"],
            ["recolor", "c1", "r2+0.45", { key: "dark" }], ["recolor", "c2", "r2+0.5", { key: "dark" }], ["recolor", "c3", "r2+0.55", { key: "dark" }],
          ],
          fx: [
            ["spark", "r0+0.4", { at: "@board+[0.04,0.015,0.02]", size: 0.07 }],
            ["smoke", "r2+0.55", { at: "@pan+[0,0.02,0]", size: 0.022, spread: 0.08 }],
          ],
        },
      },
      {
        means: "The cracked cog is not thrown away: a 1 rises beside it. It is version 1.",
        cam: "crane-down", tx: "shutter",
        stage: {
          props: [
            { name: "cog", model: "cog", keep: true },
            { name: "one", model: "digit-1", at: [along(1, 3, BENCH)[0] + 0.2, 0, along(1, 3, BENCH)[2] - 0.1], yaw: DIGIT_YAW },
          ],
          do: [["rise", "one", "r2", { dur: 0.5 }]],
          frame: { at: [along(1, 3, BENCH)[0] + 0.08, 0.08, along(1, 3, BENCH)[2] - 0.04], view: 0.55 },
        },
      },
      {
        means: "What changed: beside version 1, a new pair of cogs turns together, and Makey, back on its feet, waves the viewer over.",
        cam: "pull-out", tx: "rise",
        stage: {
          props: [
            { name: "cog", model: "cog", keep: true },
            { name: "one", model: "digit-1", keep: true },
            { name: "cogA", model: "cog", at: [0.42, 0, 0.12] },
            { name: "cogB", model: "cog", at: [0.655, 0, 0.12] },
          ],
          actors: [{ name: "makey2", kind: "makey", at: [0.5, 0, 0.42], yaw: -0.5, seed: 32 }],
          do: [
            ["drop", "cogA", "r0", { amount: 0.15 }], ["drop", "cogB", "r0+0.1", { amount: 0.15 }],
            ["spin", "cogA", "r1", { axis: "y", rate: 0.3, dur: 0.6 }], ["spin", "cogB", "r1", { axis: "y", rate: -0.3, dur: 0.6 }],
          ],
          act: [["wave", "makey2", "r1+0.2"]],
        },
      },
    ],
  },

  "12-where-it-started": {
    place: "text-top",
    beats: [
      {
        means: "A magazine lands open and its pages turn: the makers were first found in a magazine.",
        cam: "crane-down", tx: "iris",
        stage: {
          props: [{ name: "book", model: "open-book", at: [0, 0, 0] }],
          do: [["drop", "book", 0, { amount: 0.15 }]],
          fx: [["pages", "r0+0.3", { spine: "@book+[0,0.04,0]", width: 0.135, depth: 0.22, count: 3, every: 0.45, dur: 0.7 }]],
          frame: { view: 0.42, at: [0, 0.05, 0] },
        },
      },
      {
        means: "The projects rise up off the open page, one by one: a robot arm, a lamp, a radio.",
        cam: "orbit-l", tx: "wipe",
        stage: {
          props: [
            { name: "book", model: "open-book", keep: true },
            { name: "arm", model: "robot-arm", at: [-0.075, 0.042, 0.02], scale: 0.38 },
            { name: "lamp", model: "table-lamp", at: [0.07, 0.042, -0.05], scale: 0.38 },
            { name: "radio", model: "radio", at: [0.085, 0.042, 0.06], scale: 0.32, yaw: -0.4 },
          ],
          do: [["rise", "arm", "r1"], ["rise", "lamp", "r1+0.3"], ["rise", "radio", "r2"]],
          frame: { view: 0.45, at: [0, 0.1, 0] },
        },
      },
      {
        means: "2006 drops in digit by digit, and the first Faire's tent goes up behind it.",
        cam: "push-in", tx: "shutter",
        stage: {
          props: [
            { name: "d2", model: "digit-2", at: along(0, 4, 0.16), yaw: DIGIT_YAW },
            { name: "d0a", model: "digit-0", at: along(1, 4, 0.16), yaw: DIGIT_YAW },
            { name: "d0b", model: "digit-0", at: along(2, 4, 0.16), yaw: DIGIT_YAW },
            { name: "d6", model: "digit-6", at: along(3, 4, 0.16), yaw: DIGIT_YAW },
            { name: "tent", model: "tent", at: [0.2, 0, -0.9], scale: 0.2, yaw: -0.62 },
          ],
          do: [
            ["drop", "d2", 0], ["drop", "d0a", 0.12], ["drop", "d0b", 0.24], ["drop", "d6", 0.36],
            ["rise", "tent", "r1", { dur: 0.7 }],
          ],
        },
      },
      {
        means: "The people step out from behind a giant open magazine and gather round it, clapping: they came together.",
        cam: "pull-out", tx: "rise",
        stage: {
          props: [{ name: "mag", model: "open-book", at: [0, 0, 0], scale: 4 }],
          actors: [
            { name: "p1", kind: "person", variant: "kurta", seed: 5, at: [-0.85, 0, 0.25], yaw: -0.3 },
            { name: "p2", kind: "person", variant: "headscarf", seed: 9, at: [0.1, 0, -0.6], yaw: -0.5, accent: true },
            { name: "p3", kind: "person", variant: "mundu", seed: 13, at: [0.9, 0, 0.15], yaw: -0.9 },
          ],
          do: [
            ["pop", "mag", 0],
            ["slide", "p1", "r1-0.2", { from: [0.7, 0, -0.9], dur: 0.9 }],
            ["slide", "p2", "r1", { from: [0, 0, -0.6], dur: 0.9 }],
            ["slide", "p3", "r1+0.2", { from: [-0.7, 0, -0.9], dur: 0.9 }],
          ],
          act: [["clap", "p1", "r2+0.2"], ["clap", "p2", "r2+0.3"], ["clap", "p3", "r2+0.25"]],
          // Framed a little higher and wider than the fit: the 3D is no longer clipped to its window, and the
          // pull-out's close start would otherwise carry the giant magazine down into the footer.
          frame: { at: [0, 0.08, -0.17], view: 2.4 },
        },
      },
    ],
  },

  // ── Wording rewrites for topics whose stages are still to be built (after the pilot is approved) ──
  "02-kerala-already-makes": {
    beats: [{}, {}, {}, { say: ["Now Kerala’s", "making gets", "a *stage.*"], why: "“Now it gets a stage” leans on the slide before it; on its own the beat needs its subject." }],
  },
  "08-maker-stories": {
    beats: [{}, {}, { say: ["Maker Stories:", "*coming soon.*"], why: "Maker Stories isn't released yet (AGENTS.md); the slide's “Meet them in Maker Stories” would send people to nothing." }],
  },
  "13-the-global-scale": {
    beats: [
      {},
      { say: ["*232*", "Maker Faires", "in 2025"], why: "The stat label “Maker Faires / 2025” reads as a sentence: 232 Maker Faires in 2025." },
      { say: ["*27*", "countries", "in 2025"], why: "As above: 27 countries in 2025." },
      { say: ["*5*", "continents", "in 2025"], why: "As above: 5 continents in 2025." },
      {},
    ],
  },
};

// ── Weave heroes ──────────────────────────────────────────────────────────────
// The Weave looks show ONE object a beat. The sentence is set first, filling the poster; then the hero pops up
// in the middle and pushes the letters out of its way, does its one action, and shrinks away before the letters
// go. Two heroes per beat: `cc0` (a model from the library) and `beams` (a beam-kit assembly), chosen with
// --hero=cc0|beams. Times are seconds after the pop; the hero is named "hero" ("hero.blades", "@hero+[0,0.1,0]").
// A beam frame's sides open by turning them before the beat (time -5, instantly) and close by turning them back.
const open = (part, amount) => ["turn", part, -5, { axis: "z", amount, dur: 0.01 }];
const close = (part, amount, t) => ["turn", part, t, { axis: "z", amount: -amount, dur: 0.4 }];
export const WEAVE_HEROES = {
  "05-repair-is-making": [
    {
      cc0: { prop: { model: "desk-fan", yaw: -0.4 }, means: "One repair stands for all three: the fan's blades snap back on, it shudders, then spins up.",
        do: [["pop", "hero.blades", 0.3, { dur: 0.3 }], ["shake", "hero", 0.6, { amount: 0.01 }], ["spin", "hero.blades", 0.85, { axis: "z", rate: 2.4 }]] },
      beams: { prop: { model: "beam-frame-m", yaw: -0.62 }, means: "A frame with three loose sides: they swing shut and pin, one after another. Repairing is reconnecting.",
        do: [open("hero.side1", 0.9), open("hero.side2", -0.8), open("hero.side3", 0.7), close("hero.side1", 0.9, 0.35), close("hero.side2", -0.8, 0.75), close("hero.side3", 0.7, 1.15)] },
    },
    {
      cc0: { prop: { model: "table-lamp" }, means: "The rewired lamp lights up: that's making.", do: [["glow", "hero.shade", 0.45, { amount: 2.2 }]] },
      beams: { prop: { model: "beam-crank", yaw: -0.62 }, means: "The crank turns (red, the drive) and lifts the arm: making is doing.",
        do: [["spin", "hero.crank", 0.3, { axis: "z", rate: -0.7, dur: 0.4 }], ["turn", "hero.arm", 0.3, { axis: "z", amount: 0.55, dur: 1.4 }]] },
    },
  ],
  "06-version-one": [
    {
      cc0: { actor: { kind: "makey", yaw: -0.5 }, means: "Makey, the maker robot, falls over: the version that didn't work.", act: [["tumble", "hero", 0.3]] },
      beams: { prop: { model: "beam-gesture", yaw: -0.3 }, means: "The open gesture collapses, joint by joint: it didn't work.",
        do: [["turn", "hero.joint3", 0.3, { axis: "z", amount: -1.1, dur: 0.35 }], ["turn", "hero.joint2", 0.5, { axis: "z", amount: -0.7, dur: 0.35 }], ["turn", "hero.joint1", 0.7, { axis: "z", amount: 0.5, dur: 0.35 }]] },
    },
    {
      cc0: { prop: { model: "cog" }, means: "The printed cog sparks and cracks in two: the broken print, and with it every first try that fails.",
        do: [["move", "hero.left", 0.4, { to: [-0.035, 0, 0.012], dur: 0.3 }], ["turn", "hero.left", 0.4, { axis: "z", amount: -0.22, dur: 0.3 }], ["move", "hero.right", 0.4, { to: [0.035, 0, -0.012], dur: 0.3 }], ["turn", "hero.right", 0.4, { axis: "z", amount: 0.22, dur: 0.3 }]],
        fx: [["spark", 0.35, { at: "@hero+[0,0.06,0]", size: 0.08 }], ["smoke", 0.5, { at: "@hero+[0,0.04,0]", size: 0.02, spread: 0.06 }]] },
      beams: { prop: { model: "beam-frame-m", yaw: -0.62 }, means: "A frame shudders and one side breaks loose and drops: something went wrong.",
        do: [["shake", "hero", 0.3, { amount: 0.012 }], ["turn", "hero.side2", 0.55, { axis: "z", amount: 1.2, dur: 0.45 }]] },
    },
    {
      cc0: { prop: { model: "digit-1", yaw: 0.9 }, means: "A 1 rises: not failure, version 1.", do: [["turntable", "hero", 0.4, { rate: 0.06 }]] },
      beams: { prop: { model: "beam-link", yaw: -0.62 }, means: "A single beam swings up into place: the first version, standing.",
        do: [["turn", "hero.swing", -5, { axis: "z", amount: -1.3, dur: 0.01 }], ["turn", "hero.swing", 0.35, { axis: "z", amount: 1.3 + Math.PI / 2, dur: 0.6 }]] },
    },
    {
      cc0: { prop: { model: "cog" }, means: "The cog, whole now, turning: what changed.", do: [["spin", "hero", 0.3, { axis: "y", rate: 0.35, dur: 0.6 }]] },
      beams: { prop: { model: "beam-crank", yaw: -0.62 }, means: "The crank turns and the arm lifts: the next version works. Come show it.",
        do: [["spin", "hero.crank", 0.3, { axis: "z", rate: -0.8, dur: 0.4 }], ["turn", "hero.arm", 0.3, { axis: "z", amount: 0.6, dur: 1.2 }]] },
    },
  ],
  "12-where-it-started": [
    {
      cc0: { prop: { model: "open-book" }, means: "The magazine lands open and its pages turn: the makers were in a magazine.",
        fx: [["pages", 0.35, { spine: "@hero+[0,0.04,0]", width: 0.135, depth: 0.22, count: 3, every: 0.35, dur: 0.6 }]] },
      beams: { prop: { model: "beam-gesture", yaw: -0.3 }, means: "The gesture opens like a magazine's spread.",
        do: [["turn", "hero.joint3", -5, { axis: "z", amount: -1.2, dur: 0.01 }], ["turn", "hero.joint3", 0.35, { axis: "z", amount: 1.6, dur: 0.7 }]] },
    },
    {
      cc0: { prop: { model: "robot-arm" }, means: "A maker's project, a robot arm, rises off the page and moves.", do: [["swing", "hero", 0.5, { axis: "z", amount: 0.12, hz: 1.2, dur: 1.5 }]] },
      beams: { prop: { model: "beam-crank", yaw: -0.62 }, means: "A project made of beams rises and its crank turns: projects brought to the page.",
        do: [["spin", "hero.crank", 0.35, { axis: "z", rate: -0.6, dur: 0.4 }]] },
    },
    {
      cc0: { prop: { model: "tent", yaw: -0.62 }, means: "A tent goes up: the first Faire, Bay Area, 2006.", do: [["turntable", "hero", 0.4, { rate: 0.05 }]] },
      beams: { prop: { model: "beam-frame-l", yaw: -0.62 }, means: "A large frame stands up: the first Faire, the first structure.", do: [["turntable", "hero", 0.4, { rate: 0.05 }]] },
    },
    {
      cc0: { actor: { kind: "person", variant: "kurta", seed: 5, yaw: -0.5 }, means: "One of the people behind the pages steps in and claps: they came together.", act: [["clap", "hero", 0.5]] },
      beams: { prop: { model: "beam-gesture", yaw: -0.3 }, means: "The gesture's blue beam reaches out and joins: they came together.",
        do: [["turn", "hero.joint3", 0.35, { axis: "z", amount: 0.8, dur: 0.8 }]] },
    },
  ],
};
for (const [key, list] of Object.entries(WEAVE_HEROES)) list.forEach((weave, i) => { STORYBOARDS[key].beats[i].weave = weave; });
