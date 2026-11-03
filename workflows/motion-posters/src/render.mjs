// Motion posters: one short story per awareness topic × format (post 4:5, story 9:16), in one of four looks.
// Each slide of the topic becomes a beat: its full sentence in the Poster Studio's letters (vendor/poster-studio,
// used unmodified), over a 3D tableau that acts the sentence out: CC0 props from design-system/3d and the
// makerfaire.in actors and scenes (vendor/website), bundled into build/stage.js. Every text change moves the
// camera; the transition looks also change the whole ground's colour. Frames are drawn one at a time in headless
// Chrome (src/page.mjs) and ffmpeg encodes them, so a render repeats exactly.
// usage: npm run build:stage, then node src/render.mjs --look=general|noise|colour|noise-shift|weave [--place=text-top|model-top] [topicPrefix ...]
// Output: $MFK_OUT (default output/motion-posters-<look>[-<place>], git-ignored).
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { TOPICS } from "../../awareness-carousels/content/topics.mjs";
import { STORYBOARDS, END_SAY, END_STAGE } from "../content/storyboards.mjs";
import { beatRows, rowText, wordCount, sentence, SETTABLE } from "./copy.mjs";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(PKG, "../..");
const STUDIO = path.join(PKG, "vendor/poster-studio");
const WEBSITE = path.join(PKG, "vendor/website");
const DS = path.join(REPO, "design-system");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ── Looks and grounds (design-system/color-motion.md) ─────────────────────────
const C = { paper: "#F6F6F3", ink: "#222222", red: "#ED1C24", cyan: "#00AEEF", yellow: "#FFE86C", blue: "#2B19D9", white: "#FFFFFF" };
// Each ground fixes its letters, accent and strike colours, its logo (the long lockup on paper only, the border
// lockup on every coloured or dark ground) and whether the 3D's ink edges show on it.
const GROUNDS = {
  paper: { bg: C.paper, fg: C.ink, accent: C.red, strike: C.red, logo: "long", edges: true },
  red: { bg: C.red, fg: C.white, accent: C.ink, strike: C.ink, logo: "border", edges: true },
  ink: { bg: C.ink, fg: C.paper, accent: C.cyan, strike: C.red, logo: "border", edges: false },
  cyan: { bg: C.cyan, fg: C.ink, accent: C.white, strike: C.red, logo: "border", edges: true },
  yellow: { bg: C.yellow, fg: C.blue, accent: C.red, strike: C.red, logo: "border", edges: true },
  blue: { bg: C.blue, fg: C.yellow, accent: C.white, strike: C.red, logo: "border", edges: false },
  "red-noise": { bg: C.red, fg: C.yellow, accent: C.white, strike: C.blue, logo: "border", edges: true },
};
const GF = "/repo/guidelines/brand-guidelines/fonts", CF = "/repo/guidelines/references/campaign/fonts";
const PLEX = [
  { family: "IBM Plex Mono", url: `${GF}/IBMPlexMono-Medium.ttf`, descriptors: { weight: "500" } },
];
const INTER = [{ family: "Inter", url: `${CF}/Inter.ttf`, descriptors: { weight: "100 900" } }];
// Lettering: Studio Sans (the studio's own procedural alphabet, font id "original") for General and Colour; the
// Noise looks keep Dela Gothic One. charWidth: a letter's width over its height, for sizing rows.
const LOOKS = {
  general: {
    name: "General / Studio Sans", status: "selected", studioFont: "original", charWidth: 0.74, plates: false,
    labelFamily: "IBM Plex Mono", labelWeight: 500, fonts: PLEX, grounds: () => ({ beats: ["paper"], payoff: "paper", end: "paper" }),
  },
  noise: {
    name: "Loud Design / Make Some Noise", status: "selected", studioFont: "dela", charWidth: 0.9, plates: true, markScale: 1.25,
    labelFamily: "Inter", labelWeight: 700, fonts: INTER, grounds: () => ({ beats: ["yellow"], payoff: "yellow", end: "yellow" }),
  },
  colour: {
    name: "Colour / Studio Sans (exploratory)", status: "exploratory", studioFont: "original", charWidth: 0.74, plates: false, shift: true,
    labelFamily: "IBM Plex Mono", labelWeight: 500, fonts: PLEX,
    // Every text change brings a new brand colour; the payoff lands on red; the end card is paper. No charcoal
    // (ink) ground: the user ruled the dark grey out.
    grounds: (n) => ({ beats: rotate(["paper", "cyan", "yellow", "blue"], n), payoff: "red", end: "paper" }),
  },
  weave: {
    name: "Weave / Studio Sans (exploratory)", status: "exploratory", studioFont: "original", charWidth: 0.74, plates: false, shift: true, weave: true,
    labelFamily: "IBM Plex Mono", labelWeight: 500, fonts: PLEX,
    // The sentence fills the poster; one object pops up in the middle and pushes the letters out. The Colour
    // look's grounds; the lockup only on the end card.
    grounds: (n) => ({ beats: rotate(["paper", "cyan", "yellow", "blue"], n), payoff: "red", end: "paper" }),
  },
  "weave-plain": {
    name: "Weave Plain / Studio Sans (exploratory)", status: "exploratory", studioFont: "original", charWidth: 0.74, plates: false, weave: true,
    labelFamily: "IBM Plex Mono", labelWeight: 500, fonts: PLEX,
    // Weave on one ground, as General is to Colour: paper throughout, accents in red.
    grounds: () => ({ beats: ["paper"], payoff: "paper", end: "paper" }),
  },
  "noise-shift": {
    name: "Noise Shift / Dela Gothic One (exploratory)", status: "exploratory", studioFont: "dela", charWidth: 0.9, plates: true, markScale: 1.25, shift: true,
    labelFamily: "Inter", labelWeight: 700, fonts: INTER,
    grounds: (n) => ({ beats: rotate(["yellow", "blue"], n), payoff: "red-noise", end: "blue" }),
  },
};
const rotate = (a, n) => a.map((_, i) => a[(i + n) % a.length]);
const LOGOS = {
  long: { src: "/repo/brand/logo/official/MF_Kochi_Logo_long.png", ratio: 646 / 3871 },
  border: { src: "/repo/brand/logo/official/MF_Kochi_Logo_border.png", ratio: 859 / 4092 },
};

// ── Formats and placements ────────────────────────────────────────────────────
// Bands: [y, height] for the lettering and the 3D window, by placement. Stories keep clear of Instagram's top
// (profile) and bottom (reply) overlays; the footer's labels sit on `base`.
const FORMATS = {
  post: {
    w: 1080, h: 1350, logoW: 360, labelSize: 22, base: 1280,
    "text-top": { type: [60, 470], window: [550, 640] },
    "model-top": { type: [700, 480], window: [30, 660] },
  },
  story: {
    w: 1080, h: 1920, logoW: 400, labelSize: 24, base: 1670,
    "text-top": { type: [220, 600], window: [840, 720] },
    "model-top": { type: [960, 590], window: [200, 760] },
  },
};
const PLACES = ["text-top", "model-top"];
const FPS = 30, PAD = 70, WARM = 1.5, END = 2.6, MIN_S = 12, MAX_S = 18, MAX_ROWS = 6;
const IN = 0.45, OUT = 0.35;
const TX_ORDER = ["iris", "wipe", "shutter", "rise"];
// Weave: the object's hole, [cx, cy, w, h] as fractions of the type area: always the middle, where it pops up.
const CUT = [0.5, 0.5, 0.56, 0.42];
// Weave timing: the object pops up once the sentence is in (at least POP_MIN into the beat), acts for at least
// ACT seconds, and shrinks away LEAVE seconds before the letters go out.
const POP_AFTER = 0.35, POP_MIN = 0.9, ACT = 1.6, LEAVE = 0.4;
// Weave: a sentence of RICH_WORDS words or more gets its object inside the text; a shorter one is set as a band,
// the object in its own window, on top for one band beat and below for the next (the storyboard can force
// either with weave.layout).
const RICH_WORDS = 6;
// Weave type areas: the whole post with a margin; on a story, the full width between Instagram's top and bottom
// overlays. The end card keeps a band under the letters for the lockup.
const WEAVE = { post: { margin: 36, top: 36, bottom: 1314, logoW: 520 }, story: { margin: 36, top: 200, bottom: 1660, logoW: 560 } };
const MOVES = ["push-in", "orbit-l", "crane-down", "orbit-r", "truck-l", "pull-out", "crane-up", "truck-r"];
const DIRS = { "orbit-l": [1, 0], "truck-l": [1, 0], "orbit-r": [-1, 0], "truck-r": [-1, 0], "crane-up": [0, 1], "crane-down": [0, -1] };

const ARGS = process.argv.slice(2);
const lookArg = ARGS.find((a) => a.startsWith("--look="))?.slice(7);
const placeArg = ARGS.find((a) => a.startsWith("--place="))?.slice(8);
// Weave looks: the beat's one object is a CC0 model (cc0) or a beam-kit assembly (beams).
const HERO = ARGS.find((a) => a.startsWith("--hero="))?.slice(7) ?? "cc0";
if (!["cc0", "beams"].includes(HERO)) { console.error("--hero is cc0 or beams"); process.exit(2); }
if (!LOOKS[lookArg]) { console.error(`Pass --look=${Object.keys(LOOKS).join("|")}`); process.exit(2); }
if (placeArg && !PLACES.includes(placeArg)) { console.error(`--place is ${PLACES.join(" or ")}`); process.exit(2); }
const LOOK = LOOKS[lookArg];
const only = ARGS.filter((a) => !a.startsWith("--"));
const OUT_DIR = path.resolve(REPO, process.env.MFK_OUT || `output/motion-posters-${lookArg}${placeArg ? `-${placeArg}` : ""}${LOOK.weave && HERO === "beams" ? "-beams" : ""}`);
for (const [dir, file] of [[STUDIO, "src/scene.js"], [WEBSITE, "app/three/core/kit.ts"]])
  if (!fs.existsSync(path.join(dir, file))) { console.error(`${path.relative(PKG, dir)} missing: run git submodule update --init`); process.exit(2); }
if (!fs.existsSync(path.join(PKG, "build/stage.js"))) { console.error("build/stage.js missing: run npm run build:stage"); process.exit(2); }
const MANIFEST = JSON.parse(fs.readFileSync(path.join(DS, "3d/manifest.json"), "utf8"));
const rev = (dir) => execFileSync("git", ["-C", dir, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const REVS = { studio: rev(STUDIO), website: rev(WEBSITE) };

// ── Copy → timeline ───────────────────────────────────────────────────────────
/** A storyboard time, in seconds from the beat's start: 0.4, "r1" (when row 1 comes in), "r1+0.3", "end-0.5". */
function at(v, beat) {
  if (typeof v === "number") return beat.start + v;
  const m = String(v).match(/^(r(\d+)|end)([+-][\d.]+)?$/);
  if (!m) throw new Error(`bad time "${v}"`);
  const base = m[1] === "end" ? beat.end : beat.rows[+m[2]]?.t;
  if (base === undefined) throw new Error(`no row ${m[2]} for time "${v}"`);
  return base + Number(m[3] ?? 0);
}

function timeline(key, look = LOOK) {
  const t = TOPICS[key], sb = STORYBOARDS[key], issues = [];
  if (!t) throw new Error(`No topic ${key}`);
  if (!sb?.beats) return { issues: ["no storyboard yet"], beats: [], seconds: 0 };
  if (sb.beats.length !== t.slides.length) issues.push(`${sb.beats.length} beats for ${t.slides.length} slides`);
  const topicNo = Number(key.slice(0, 2));
  const place = placeArg ?? sb.place ?? (topicNo % 2 ? "model-top" : "text-top");
  const g = look.grounds(topicNo);
  // Rows come in one after another at reading pace; the beat holds for the whole sentence (0.3 s a word, at
  // least 1.2 s after its last row), then the letters go out. In the transition looks the letters wait for the
  // colour to land.
  const plans = t.slides.map((slide, i) => {
    const b = sb.beats[i] ?? {}, rows = beatRows(slide, b.say);
    if (b.say && !b.why) issues.push(`beat ${i + 1}: a rewrite (say) needs a why`);
    if (rows.length > MAX_ROWS) issues.push(`beat ${i + 1}: ${rows.length} rows, at most ${MAX_ROWS}`);
    for (const r of rows) if (!SETTABLE.test(rowText(r))) issues.push(`beat ${i + 1}: "${rowText(r)}" has characters the letters can't set`);
    const hero = look.weave ? b.weave?.[HERO] : null;
    if (look.weave) {
      if (!hero) issues.push(`beat ${i + 1}: no weave.${HERO} hero yet`);
      else if ([hero.prop, hero.actor].filter(Boolean).length !== 1) issues.push(`beat ${i + 1}: a weave hero is exactly one prop or one actor`);
      else if (!hero.means) issues.push(`beat ${i + 1}: the weave hero needs a means`);
    }
    else if (!b.stage && !b.set && !sb.set) issues.push(`beat ${i + 1}: no stage`);
    const lead = look.shift && i > 0 ? 0.3 : 0.12, rel = [];
    let k = lead;
    rows.forEach((r, ri) => { if (ri) k += Math.max(0.4, 0.24 * rows[ri - 1].words.length); rel.push(k); });
    const words = wordCount(rows), hold = Math.max(1.2, 0.3 * words - (k - lead));
    // Weave: the sentence is read first, then the object pops up and acts before the letters go.
    const pop = Math.max(k + IN + POP_AFTER, POP_MIN);
    const dur = look.weave ? Math.max(k + IN + hold + OUT, pop + ACT + LEAVE + OUT) : k + IN + hold + OUT;
    return { b, rows, rel, dur, hero, pop };
  });
  const sum = plans.reduce((n, p) => n + p.dur, 0);
  const f = Math.max(0.85, Math.min(Math.max(1, (MIN_S - END) / sum), (MAX_S - END) / sum));
  const beats = [];
  let clock = 0, set = sb.set ?? "tableau", opts = sb.opts ?? {}, bands = 0;
  const nextPlace = () => (bands++ % 2 ? "text-top" : "model-top");
  plans.forEach(({ b, rows, rel, dur, hero, pop }, i) => {
    if (look.weave) set = "tableau";
    else if (b.set) { set = b.set; opts = b.opts ?? {}; }
    else if (b.stage) set = "tableau";
    const start = clock, end = clock + dur * f;
    const cam = b.cam ?? MOVES[(i + topicNo) % MOVES.length];
    const beat = {
      index: i, start, end, set, opts, cam, camStart: start, means: b.means ?? "",
      rows: rows.map((r, ri) => ({ ...r, t: start + rel[ri] * f })),
      ground: i === t.slides.length - 1 ? g.payoff : g.beats[i % g.beats.length],
      tx: b.tx ?? TX_ORDER[(i + topicNo) % TX_ORDER.length], stage: b.stage, cues: [], cut: CUT,
    };
    if (look.weave) {
      beat.mode = b.weave?.layout ?? (wordCount(rows) >= RICH_WORDS ? "in-text" : "band");
      if (beat.mode === "band") beat.place = nextPlace();
    }
    if (look.weave && hero) {
      beat.pop = start + pop * f;
      beat.exit = end - OUT - LEAVE;
      beat.means = hero.means;
      beat.stage = heroStage(hero, `hero${i}`, beat.pop - start, beat.exit - start);
    }
    beat.txDir = DIRS[cam] ?? [1, 0];
    if (set !== "tableau") {
      if (b.shot !== undefined) beat.cues.push({ name: "shot", arg: b.shot, t: start });
      for (const [name, sec] of Object.entries(b.act ?? {})) beat.cues.push({ name, t: at(sec, beat) });
    }
    beats.push(beat);
    clock = end;
  });
  // The end card: COMING SOON with Makey waving (END_STAGE), the same sign-off on every poster.
  const last = beats.at(-1);
  if (last) beats.push({
    index: beats.length, start: clock, end: clock + END, set: "tableau", cam: "pull-out", camStart: clock,
    // Weave: COMING SOON is set first, then Makey pops up in the middle of it and waves.
    stage: look.weave ? { ...END_STAGE, do: END_STAGE.do.map(([m, w, tt, p]) => [m, w, tt + 0.7, p]), act: END_STAGE.act.map(([a, w, tt, o]) => [a, w, tt + 0.5, o]) } : END_STAGE,
    rows: beatRows({ lines: [END_SAY] }).map((r) => ({ ...r, t: clock + (look.shift ? 0.3 : 0.12) })),
    ground: g.end, tx: "iris", txDir: [1, 0], cues: [], last: true, cut: CUT, pop: clock + 0.75, exit: Infinity,
    ...(look.weave ? { mode: "band", place: nextPlace() } : {}),
    means: "The sign-off: Makey, the maker robot, pops up and waves the viewer in.",
  });
  // The tableau: every beat that has a stage, its times resolved to poster seconds.
  const stageBeats = beats.filter((b) => b.set === "tableau");
  const lastStage = stageBeats.at(-1);
  const resolved = stageBeats.map((b) => {
    const s = b.stage ?? {};
    try {
      return {
        start: b.start, end: b.end, final: b === lastStage && b === beats.at(-1), frame: s.frame, props: s.props, actors: s.actors,
        do: (s.do ?? []).map(([m, target, tt, p]) => [m, target, at(tt, b), p]),
        fx: (s.fx ?? []).map(([kind, tt, p]) => [kind, at(tt, b), p]),
        act: (s.act ?? []).map(([a, who, tt, o]) => [a, who, at(tt, b), o]),
      };
    } catch (e) { issues.push(`beat ${b.index + 1}: ${e.message}`); return null; }
  });
  const tableauOpts = { beats: resolved, manifest: MANIFEST, base: "/ds/3d/models", warm: WARM, fill: look.weave ? 0.85 : 1 };
  for (const b of beats) {
    if (b.set === "tableau") { b.opts = tableauOpts; b.setKey = `tableau|${key}`; }
    else b.setKey = `${b.set}|${JSON.stringify(b.opts)}`;
  }
  const seconds = clock + END;
  if (beats.length && (seconds < MIN_S - 0.01 || seconds > MAX_S + 0.01)) issues.push(`${seconds.toFixed(1)} s, outside ${MIN_S}–${MAX_S} s`);
  return { beats, seconds, issues, place, label: `${key.slice(0, 2)} / ${t.label.toUpperCase()}` };
}

/**
 * A Weave beat's stage from its one hero (storyboard `weave.cc0` or `weave.beams`): the prop or actor at the
 * centre, popping up at `pop` and shrinking away at `exit` (seconds into the beat); the hero's own motions,
 * effects and actions are given in seconds after the pop, naming it "hero" ("hero.blades", "@hero+[0,0.1,0]").
 */
function heroStage(hero, name, pop, exit) {
  const rename = (v) => (typeof v === "string" ? v.replace(/^hero\b/, name).replace(/@hero\b/g, `@${name}`) : v);
  const deep = (o) => (Array.isArray(o) ? o.map(deep) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deep(v)])) : rename(o));
  return {
    props: hero.prop ? [{ at: [0, 0, 0], ...hero.prop, name }] : [],
    actors: hero.actor ? [{ at: [0, 0, 0], ...hero.actor, name }] : [],
    frame: hero.frame,
    do: [["pop", name, pop, { dur: 0.5 }], ...(hero.do ?? []).map(([m, tg, tt, p]) => [m, rename(tg), pop + tt, p]), ["shrink", name, exit, { dur: 0.35 }]],
    fx: (hero.fx ?? []).map(([kind, tt, p]) => [kind, pop + tt, deep(p)]),
    act: (hero.act ?? []).map(([a, who, tt, o]) => [a, rename(who), pop + tt, o]),
  };
}

function layout(fmt, place) {
  const F = FORMATS[fmt], P = F[place];
  if (LOOK.weave) {
    const Wv = WEAVE[fmt], type = { x: Wv.margin, y: Wv.top, w: F.w - Wv.margin * 2, h: Wv.bottom - Wv.top };
    const endLogos = Object.fromEntries(Object.entries(LOGOS).map(([k, l]) => {
      const h = Wv.logoW * l.ratio;
      return [k, { x: (F.w - Wv.logoW) / 2, y: Wv.bottom - h, w: Wv.logoW, h }];
    }));
    const logoTop = Math.min(...Object.values(endLogos).map((l) => l.y)), H = type.h, GAP = 40;
    // Band beats: no footer, so the letters and the window share the whole height. On the end card the lockup
    // takes the bottom, under whichever of the two is lower.
    const rect = (y0, y1, full = false) => ({ x: full ? 0 : type.x, y: y0, w: full ? F.w : type.w, h: y1 - y0 });
    const split = 0.47 * H;
    const bands = {
      "model-top": {
        window: rect(type.y, type.y + split, true), type: rect(type.y + split + GAP, type.y + H),
        endWindow: rect(type.y, type.y + split, true), endType: rect(type.y + split + GAP, logoTop - GAP), endLogos,
      },
      "text-top": {
        type: rect(type.y, type.y + split), window: rect(type.y + split + GAP, type.y + H, true),
        endType: rect(type.y, type.y + split), endWindow: rect(type.y + split + GAP, logoTop - GAP, true), endLogos,
      },
    };
    return { mode: "weave", type, bands, window: { x: 0, y: 0, w: F.w, h: F.h } };
  }
  const logos = Object.fromEntries(Object.entries(LOGOS).map(([k, l]) => {
    const h = F.logoW * l.ratio;
    return [k, { x: PAD, y: F.base - h, w: F.logoW, h }];
  }));
  return {
    type: { x: 44, y: P.type[0], w: F.w - 88, h: P.type[1] },
    window: { x: 0, y: P.window[0], w: F.w, h: P.window[1] },
    focus: [0, 1, P.window[0] / F.h, (P.window[0] + P.window[1]) / F.h],
    footer: { pad: PAD, logos, labelSize: F.labelSize, base: F.base, top: Math.min(...Object.values(logos).map((l) => l.y)) },
  };
}

// ── Browser ──────────────────────────────────────────────────────────────────
// The Mac's GPU (ANGLE/Metal) draws a frame in tens of ms; MFK_SWIFTSHADER=1 uses the CPU renderer instead.
async function openPage() {
  const gl = process.env.MFK_SWIFTSHADER ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--ignore-gpu-blocklist"];
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb", ...gl] });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
  const ROOTS = { "/studio/": STUDIO, "/build/": path.join(PKG, "build"), "/src/": path.join(PKG, "src"), "/repo/": REPO, "/ds/": DS };
  const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".ttf": "font/ttf", ".woff2": "font/woff2", ".png": "image/png", ".glb": "model/gltf-binary" };
  await page.route("http://mfk.local/**", (r) => {
    const u = decodeURIComponent(new URL(r.request().url()).pathname);
    if (u === "/render.html") return r.fulfill({ body: "<!doctype html><meta charset=utf-8>", contentType: "text/html" });
    const root = Object.keys(ROOTS).find((k) => u.startsWith(k));
    const file = root && path.join(ROOTS[root], u.slice(root.length));
    if (!file || !file.startsWith(ROOTS[root] + path.sep) || !fs.existsSync(file)) return r.fulfill({ status: 404 });
    r.fulfill({ path: file, contentType: TYPES[path.extname(file)] || "application/octet-stream" });
  });
  await page.goto("http://mfk.local/render.html");
  await page.evaluate(async () => { window.poster = await import("/src/page.mjs"); });
  return { browser, page };
}

function encode(file) {
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, fail) => ff.on("close", (code) => (code ? fail(new Error(`ffmpeg exited ${code} for ${file}`)) : ok())));
  return { write: (buf) => new Promise((ok) => (ff.stdin.write(buf) ? ok() : ff.stdin.once("drain", ok))), end: () => (ff.stdin.end(), done) };
}
const probe = (file) => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=width,height,nb_read_frames:format=duration", "-of", "json", file], { encoding: "utf8" }));
const png = (url) => Buffer.from(url.split(",")[1], "base64");

const report = [];
const { browser, page } = await openPage();
for (const key of Object.keys(TOPICS)) {
  if (only.length && !only.some((o) => key.startsWith(o))) continue;
  const story = timeline(key), dir = path.join(OUT_DIR, key);
  if (story.issues.length) { report.push({ topic: key, issues: story.issues }); console.log(`${key}: ISSUES ${story.issues.join(" | ")}`); continue; }
  fs.mkdirSync(dir, { recursive: true });
  for (const fmt of Object.keys(FORMATS)) {
    const F = FORMATS[fmt], L = layout(fmt, story.place), frames = Math.round(story.seconds * FPS), issues = [];
    // Weave: each beat's hole in pixels, inside the type area it sits in.
    const holed = story.beats.map((b) => {
      if (!LOOK.weave || b.mode !== "in-text") return b;
      const T = L.type, [cx, cy, w, h] = b.cut;
      return { ...b, hole: { x: T.x + (cx - w / 2) * T.w, y: T.y + (cy - h / 2) * T.h, w: w * T.w, h: h * T.h } };
    });
    const plan = {
      width: F.w, height: F.h, fps: FPS, warm: WARM, layout: L, look: { ...LOOK, grounds: undefined }, fonts: LOOK.fonts, grounds: GROUNDS, beats: holed,
      maxRows: MAX_ROWS, label: story.label, signoff: "MAKER FAIRE KOCHI · COMING SOON", logos: LOGOS,
    };
    await page.evaluate((p) => window.poster.init(p), plan);
    // Weave: measure every in-text object's footprint first (a 3D-only pass), so the letters make room once.
    await page.evaluate((n) => window.poster.measure(n), Math.round(story.seconds * FPS));
    const video = path.join(dir, `${fmt}.mp4`), enc = encode(video), t0 = Date.now();
    // The cover: the first beat once its sentence has settled.
    const b0 = story.beats[0], cover = Math.round((b0.end - OUT - 0.3) * FPS);
    // The 3D is checked once per beat while it is on: late in the beat, or mid-act for a Weave hero.
    const checks = new Map(story.beats.map((b) => [Math.round((b.pop !== undefined ? Math.min(b.pop + 1.0, b.end - 0.2) : b.end - OUT - 0.1) * FPS), b]));
    for (let i = 0; i < frames; i++) {
      const buf = png(await page.evaluate((n) => window.poster.frame(n), i));
      if (i === cover) fs.writeFileSync(path.join(dir, `${fmt}.png`), buf);
      const s = await page.evaluate(() => window.poster.stats());
      const now = holed.find((b) => i / FPS < b.end) ?? holed.at(-1);
      const band = L.mode !== "weave" || now.mode !== "band" ? L.type : now.last ? L.bands[now.place].endType : L.bands[now.place].type, e = s.letters;
      if (e && (e.x0 < band.x - 6 || e.x1 > band.x + band.w + 6 || e.y0 < band.y - 6 || e.y1 > band.y + band.h + 6))
        issues.push(`letters leave their band at ${(i / FPS).toFixed(1)} s`);
      if (checks.has(i)) {
        const v = await page.evaluate(() => window.poster.stageVariance());
        if (v.covered < 0.02 || v.spread < 4) issues.push(`3D stage looks blank at ${(i / FPS).toFixed(1)} s`);
      }
      await enc.write(buf);
    }
    await enc.end();
    const info = probe(video), st = info.streams[0];
    if (st.width !== F.w || st.height !== F.h) issues.push(`size ${st.width}×${st.height}`);
    if (+st.nb_read_frames !== frames) issues.push(`${st.nb_read_frames} frames, expected ${frames}`);
    if (Math.abs(+info.format.duration - frames / FPS) > 0.05) issues.push(`duration ${info.format.duration}s`);
    const unique = [...new Set(issues)];
    report.push({ topic: key, format: fmt, place: story.place, seconds: +(frames / FPS).toFixed(2), beats: story.beats.map((b) => ({ say: sentence(b.rows), ground: b.ground, cam: b.cam, tx: b.tx, set: b.set, means: b.means })), issues: unique });
    console.log(`${key} ${fmt}: ${(frames / FPS).toFixed(1)} s, ${((Date.now() - t0) / 1000).toFixed(0)} s to render, ${unique.length ? "ISSUES " + unique.join(" | ") : "ok"}`);
  }
}
await browser.close();

// ── Review gallery and QA report ───────────────────────────────────────────
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const rows = Object.keys(TOPICS).filter((k) => fs.existsSync(path.join(OUT_DIR, k, "post.mp4"))).map((k) => {
  const s = timeline(k), v = (f) => `<a href="${k}/${f}.mp4"><video src="${k}/${f}.mp4" poster="${k}/${f}.png" autoplay muted loop playsinline></video></a>`;
  const beats = s.beats.map((b) => `<li><span class="sw" style="background:${GROUNDS[b.ground].bg}"></span><b>${esc(sentence(b.rows))}</b>${b.means ? ` <span class="means">${esc(b.means)}</span>` : ""} <span class="meta">${b.set} · ${b.cam}${LOOK.shift ? ` · ${b.tx}` : ""}</span></li>`).join("");
  return `<article><p class="meta">${esc(s.label)} · ${s.seconds.toFixed(1)} s · ${s.place}</p><div class="v">${v("post")}${v("story")}</div><ol>${beats}</ol></article>`;
}).join("");
const tokens = path.relative(OUT_DIR, path.join(REPO, "brand/tokens.css")).split(path.sep).join("/");
fs.writeFileSync(path.join(OUT_DIR, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion posters / ${esc(LOOK.name)}</title><link rel="stylesheet" href="${tokens}"><style>
body{margin:0;background:#f6f6f3;color:#222;font-family:var(--mf-font-body)}header,main{max-width:1200px;margin:auto;padding:32px 20px}h1{font:400 clamp(40px,7vw,80px)/1 var(--mf-font-display);margin:12px 0}
.meta{font:500 13px/1.5 var(--mf-font-label);text-transform:uppercase}article{border-top:2px solid;padding:24px 0}.v{display:flex;gap:16px;align-items:flex-start}.v a{flex:1 1 0;min-width:0}video{width:100%;height:auto;display:block;border:1px solid #222}a{color:#222}
ol{font-size:14px;line-height:1.6}.means{color:#555}.sw{display:inline-block;width:12px;height:12px;border:1px solid #222;margin-right:6px;vertical-align:-1px}
</style></head><body><header><p class="meta">Maker Faire Kochi / Awareness / Motion posters / ${esc(LOOK.name)} · ${LOOK.status}</p><h1>Motion posters</h1><p>One story per topic: a beat per carousel slide, its full sentence in the letters, then COMING SOON. Lettering: Poster Studio (${REVS.studio}). 3D: CC0 models restyled to design-system/3d, with the makerfaire.in actors and scenes (${REVS.website}); all illustrations, not documentation. Post 1080×1350 and story 1080×1920, ${FPS} fps, silent (add music in Instagram).</p></header><main>${rows}</main></body></html>`);
// A filtered run updates its topics in the existing report, so the report always covers every rendered poster.
const qaFile = path.join(OUT_DIR, "qa-report.json"), done = new Set(report.map((r) => r.topic));
const kept = only.length && fs.existsSync(qaFile) ? JSON.parse(fs.readFileSync(qaFile, "utf8")).renders.filter((r) => !done.has(r.topic)) : [];
const renders = [...kept, ...report].sort((a, b) => a.topic.localeCompare(b.topic) || (a.format ?? "").localeCompare(b.format ?? ""));
fs.writeFileSync(qaFile, JSON.stringify({ generated: new Date().toISOString(), look: lookArg, status: LOOK.status, ...REVS, renders, issues: renders.reduce((n, r) => n + r.issues.length, 0) }, null, 2));
if (report.some((r) => r.issues.length)) process.exitCode = 1;
