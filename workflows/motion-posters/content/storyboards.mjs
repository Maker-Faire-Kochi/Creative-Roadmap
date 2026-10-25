// Motion poster storyboards: one short story per awareness topic. Beat i is slide i of the topic in
// ../../awareness-carousels/content/topics.mjs (the copy's source of truth): the slide's full sentence is the
// supporting line, set under the 3D stage. Each beat adds:
//   say:  the studio's lettering for the beat, usually the slide's accent words. Uppercase Latin only
//         (A–Z 0–9 & ! ? . - and spaces; no apostrophes, so "you're" becomes YOU ARE), one word per row, 4 words
//         at most. An array plays its parts in turn within the beat. ~WORD~ is struck through (the slide's ~strike~).
//   act:  scene actions and when they fire, in seconds into the beat: { tumble: 0.6 }. See src/stage/sets/index.ts.
//   shot: backwater camera shot (0 wide, 1 fishers, 2 net, 3 bank). set: change the scene at this beat (a cut).
// The last slide is the payoff (letters in red, or an inverted block in the Noise look); an end card with
// END_SAY follows it. render.mjs stops if a beat count doesn't match the slides or a word can't be set.
// opts (per storyboard or beat, with set): zoom (closer framing), view (Makey / pin-map view height), shot,
// query (people: frame one person, "person=child&vh=1.6").
// Never show an event date: the website's machines scene (a live countdown) is not used.
export const END_SAY = "COMING SOON";

export const STORYBOARDS = {
  "01-maker-faire-101": {
    set: "makey",
    opts: { view: 0.52 },
    beats: [
      { say: "MAKER FAIRE?" },
      { say: "~CONFERENCE~", act: { shove: 0.5 } },
      { say: "SHOW AND TELL", act: { wave: 0.4 } },
      { say: "YOU TRY", act: { hop: 0.3 } },
    ],
  },
  "02-kerala-already-makes": {
    set: "backwater",
    beats: [
      { say: "BEFORE THE WORD", shot: 0 },
      { say: "KERALA WAS MAKING", shot: 1 },
      { say: "IN WORKSHOPS", shot: 3 },
      { say: "NOW A STAGE", shot: 0, act: { wave: 0.4 } },
    ],
  },
  "03-not-just-tech": {
    set: "electronics",
    beats: [
      { say: "~CODING?~", act: { solder: 0.2 } },
      { say: ["WOODWORK", "COOKING", "MUSIC", "ART"], set: "workshop", act: { saw: 0.1 } },
      { say: "CODING TOO", set: "electronics", act: { boot: 0.2 } },
    ],
  },
  "04-who-counts-as-a-maker": {
    set: "people",
    opts: { zoom: 1.6 },
    beats: [
      { say: "MAKER?" },
      { say: "NO PERMISSION", act: { "look-here": 0.3 } },
      { say: "YOU ARE ONE", act: { wave: 0.2 } },
    ],
  },
  "05-repair-is-making": {
    set: "electronics",
    beats: [
      { say: ["FAN?", "BAG?", "LAMP?"], act: { lamp: 0.2, measure: 1.6 } },
      { say: "MAKING", act: { wave: 0.3 } },
    ],
  },
  "06-version-one": {
    set: "makey",
    opts: { view: 0.52 },
    beats: [
      { say: "DID NOT WORK", act: { tumble: 0.8 } },
      { say: "BURNT FIRST BATCH" },
      { say: ["~FAILURE~", "VERSION 1"] },
      { say: "WHAT CHANGED", act: { hop: 0.4 } },
    ],
  },
  "07-kuttimakers": {
    set: "people",
    opts: { query: "person=child&vh=2.4" },
    beats: [
      { say: "HOW OLD?" },
      { say: "BIG CURIOSITY", act: { kite: 0.3 } },
      { say: "BUILDING", act: { wave: 0.3 } },
    ],
  },
  "08-maker-stories": {
    set: "people",
    opts: { query: "person=maker&vh=2.4" },
    beats: [
      { say: "A PERSON" },
      { say: "WHAT IS NEXT", act: { point: 0.3 } },
      { say: "MAKER STORIES", act: { clap: 0.3 } },
    ],
  },
  "09-curiosity-is-enough": {
    set: "makey",
    opts: { view: 0.52 },
    beats: [
      { say: "ANYTHING?" },
      { say: ["COME ANYWAY", "ENOUGH"], act: { wave: 0.4 } },
    ],
  },
  "10-sharing-over-winning": {
    set: "people",
    opts: { zoom: 1.6 },
    beats: [
      { say: "BEAT SOMEONE?" },
      { say: "SHARE", act: { point: 0.3 } },
      { say: "WHAT YOU LEARNED", act: { "look-here": 0.3 } },
      { say: "TAKE HOME", act: { clap: 0.3 } },
    ],
  },
  "11-the-maker-movement": {
    set: "people",
    opts: { zoom: 1.3 },
    beats: [
      { say: "KEEPS GOING" },
      { say: "SHARED SPACES" },
      { say: "HELP SOMEONE BUILD", act: { point: 0.3 } },
      { say: "MAKER MOVEMENT", act: { wave: 0.3 } },
    ],
  },
  "12-where-it-started": {
    set: "people",
    opts: { zoom: 1.6 },
    beats: [
      { say: "A MAGAZINE" },
      { say: "TO THE PAGE" },
      { say: "2006", act: { "look-here": 0.3 } },
      { say: "CAME TOGETHER", act: { clap: 0.3 } },
    ],
  },
  "13-the-global-scale": {
    set: "pin-map",
    beats: [
      { say: "TRAVEL?", act: { "pin:bay-area": 0.2, pins: 0.9, travel: 2.0 } },
      { say: "232" },
      { say: "27" },
      { say: "5" },
      { say: "TO SHARE", act: { kochi: 0.2, links: 0.9 } },
    ],
  },
  "14-global-has-place-names": {
    set: "pin-map",
    beats: [
      { say: "PLACE NAMES" },
      { say: ["BAY AREA", "ROME", "HANNOVER"], act: { "pin:bay-area": 0.2, "pin:rome": 1.0, "pin:hannover": 1.8 } },
      { say: ["SHENZHEN", "TAIPEI"], act: { "pin:shenzhen": 0.2, "pin:taipei": 1.2 } },
      { say: "KOCHI", act: { kochi: 0.3 } },
    ],
  },
  "15-one-network-many-scales": {
    set: "hero",
    opts: { zoom: 1.4 },
    beats: [
      { say: "SAME SIZE?" },
      { say: "WIDER DRAW" },
      { say: "LOCAL MAKERS" },
      { say: "ROOM FOR EACH" },
    ],
  },
  "16-what-travels": {
    set: "people",
    opts: { query: "person=visitor&vh=2.4" },
    beats: [
      { say: "WHAT STAYS?" },
      { say: ["HOW DID", "YOU MAKE THAT?"], act: { point: 0.3 } },
      { say: "LET ME SHOW YOU", act: { "look-here": 0.3 } },
      { say: "MAKING TOGETHER", act: { clap: 0.3 } },
    ],
  },
  "17-what-kerala-makes-of-it": {
    set: "backwater",
    beats: [
      { say: "ITS PEOPLE", shot: 3 },
      { say: "WAYS OF MAKING", shot: 1 },
      { say: "KERALA MAKES IT?", shot: 2, act: { kite: 0.5 } },
      { say: "OUR MAKER FAIRE", shot: 0, act: { wave: 0.4 } },
    ],
  },
  "18-kochi-in-the-network": {
    set: "pin-map",
    beats: [
      { say: "MAP", act: { kochi: 0.3 } },
      { say: "GLOBAL NETWORK", act: { pins: 0.2 } },
      { say: "BEYOND OUR CIRCLES", act: { links: 0.2 } },
      { say: "CONVERSATION", act: { travel: 0.3 } },
    ],
  },
  "19-what-connections-can-do": {
    set: "people",
    opts: { zoom: 1.2 },
    beats: [
      { say: "SMALL WORLD" },
      { say: "A NEW QUESTION", act: { point: 0.3 } },
      { say: "MEET ANOTHER MAKER", act: { wave: 0.3 } },
      { say: "YOUR PROJECT", act: { clap: 0.3 } },
    ],
  },
};
