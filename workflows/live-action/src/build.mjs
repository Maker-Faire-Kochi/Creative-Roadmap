// Live-action stories: builds a HyperFrames project from one spec (content/<slug>.json) and, with --render, the MP4.
//   1. Opener: the headline in the Poster Studio's letters (Studio Sans, air mode), white on brand red, full bleed;
//      a pop as each row lands; it wipes up to uncover the footage (the motion posters' wipe).
//   2. Footage: as shot, full length, its own sound, with one subtitle card per phrase: red IBM Plex Mono Medium (or
//      Studio Sans, subtitleFace "studio") on a white
//      rounded plate, tilted a little in 3D, its bottom edge on the 80% title-safe line.
//   3. End card: the last 2.6 s of a General-look motion poster (Makey, COMING SOON, lockup, labels), its topic
//      label re-set for this story.
// The letters are drawn by the studio in headless Chrome (src/browser/), so they reach HyperFrames as an MP4 (opener)
// and transparent PNGs (subtitles). Everything is a function of time: renders repeat exactly.
// usage: node src/build.mjs <slug> [--render] [--no-check]
// Output: $MFK_OUT (default output/live-action/<slug>/, git-ignored): the HyperFrames project, SUBTITLES.md and,
// with --render, <slug>.mp4.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { openStudioPage, REPO } from "./studio-page.mjs";
import { renderEndCard } from "./end-card.mjs";
import { envelope, characterBreak } from "./voice.mjs";
import { wrap } from "./browser/wrap.mjs";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HF = "hyperframes@0.8.229"; // pinned so a story re-renders identically; bump deliberately
const W = 1080, H = 1920, FPS = 30;
const WIPE = 0.4, END = 2.6; // opener wipe; end card length (the motion posters' END)
// Between clips: a red panel sweeps up through the frame (TX s) and hides the hard cut at its midpoint, the opener's
// wipe in miniature, with a whoosh.
const TX = 0.5;
const QR_IN = 0.9; // cta end card: the QR plates pop in after Makey has landed and started to wave
const RED = "#ED1C24", WHITE = "#FFFFFF";
// Opener lettering: margin round the frame, rows staggered by ROW_GAP, each squashing in over IN_DUR.
const OPENER = { margin: 44, bottomExtra: 40, rowGap: 0.16, inDur: 0.5, energy: 1, curve: "smooth" };
// Subtitle cards: up to 4 rows in 760 px (Studio Sans up to 60 px; Plex Mono per FACES below); a card opens LEAD before its phrase, holds
// across a pause shorter than HOLD (no blink between phrases) and otherwise stays TAIL after it.
const SUB = { color: RED, maxW: 760, maxH: 60, maxRows: 4, lead: 0.22, pad: 0.1 };
const SUB_TIME = { LEAD: 0.05, HOLD: 0.5, TAIL: 0.3 };
// The two-row rule: a card is at most SUB_ROWS rows of letters, set as large as 60 px and no smaller than
// SUB_MIN px. A card that won't fit splits between words at the quietest moment near where its words divide
// (src/voice.mjs, characterBreak), as well as at the voice breaks. A spec can set subtitleRows (0 = off: rows wrap
// up to 4, as before the rule).
const SUB_ROWS = 2, SUB_MIN = 48;
// Subtitle faces. "plex" (default, selected 2026-11-03): IBM Plex Mono Medium, the guidelines' caption face, set as
// live HTML text, 64 px down to 50 px (a monospaced advance of 0.6 em, so the character-count wrap is exact).
// "studio": the Poster Studio's Studio Sans, drawn to PNGs in the browser (src/browser/subtitle.mjs).
// "anton" (selected 2026-11-03, replacing plex): Anton, the General headline face, set as live HTML text, 70 px down to
// 56 px (capitals 0.86 em: 60 px down to 48 px, as tall as the Studio Sans cards). Anton is proportional, so rows are
// wrapped by its advance widths, measured in the browser at build time; ch (its mean capital, 0.47 em) is only the
// two-row rule's estimate of where a card must split.
const FACES = {
  anton: { ch: 0.47, max: 70, min: 56, lineHeight: 1.08, family: "Anton MF", weight: 400, font: "guidelines/brand-guidelines/fonts/Anton-Regular.ttf" },
  plex: { ch: 0.6, max: 64, min: 50, lineHeight: 1.12, family: "IBM Plex Mono MF", weight: 500, font: "guidelines/brand-guidelines/fonts/IBMPlexMono-Medium.ttf" },
  studio: { ch: 0.74, max: SUB.maxH, min: SUB_MIN },
};
const SAFE_BOTTOM = H * 0.1; // the 80% title-safe box's bottom line, 192 px up
// SFX: the HyperFrames media-use bundled library (Pixabay licence, credits in its CREDITS.md). Each starts so its
// peak lands one frame after the picture: pop peaks 0.12 s in, whoosh 0.16 s in.
const SFX_DIR = process.env.MFK_SFX_DIR || path.join(os.homedir(), ".claude/skills/media-use/audio/assets/sfx");
const SFX = { pop: { file: "pop.mp3", dur: 0.72 }, whoosh: { file: "whoosh.mp3", dur: 0.575 } };
const POP_VOLUMES = [0.5, 0.38, 0.42, 0.55];
const LABEL_FONT = path.join(REPO, "guidelines/brand-guidelines/fonts/IBMPlexMono-Medium.ttf");

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
if (!slug) { console.error("usage: node src/build.mjs <slug> [--render] [--no-check]   (content/<slug>.json)"); process.exit(2); }
const SPEC_FILE = path.join(PKG, "content", `${slug}.json`);
if (!fs.existsSync(SPEC_FILE)) { console.error(`no spec: ${path.relative(REPO, SPEC_FILE)}`); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(SPEC_FILE, "utf8"));
const faceName = spec.subtitleFace ?? "anton", FACE = FACES[faceName];
if (!FACE) { console.error(`subtitleFace: one of ${Object.keys(FACES).join(", ")}`); process.exit(2); }
const OUT = path.resolve(REPO, process.env.MFK_OUT || `output/live-action/${slug}`);
const fromRepo = (p) => path.resolve(REPO, p);
// Clips: `clips: [{ src, subtitles }]`, played back to back; a single `footage` + `subtitles` is one clip.
const clips = spec.clips ?? [{ src: spec.footage.src, subtitles: spec.subtitles, speaker: spec.footage.speaker, language: spec.footage.language, frame: spec.footage.frame }];
// A clip's optional `frame: { width, height, x, y }` zooms and places the footage to frame the speaker: the video's box
// in px (object-fit cover) and its top-left offset, as Studio's resize/move writes them. It must cover the frame.
for (const [i, c] of clips.entries()) if (c.frame) {
  const f = c.frame;
  if (f.x > 0 || f.y > 0 || f.x + f.width < W || f.y + f.height < H) { console.error(`clips[${i}].frame leaves the frame uncovered`); process.exit(2); }
}
// End card: "poster" cuts the last 2.6 s of a General story (end.from) and re-sets its label; "cta" renders the
// end beat on a ground of its own (src/end-card.mjs) with QR codes where COMING SOON would be.
const endSpec = { kind: "poster", ...spec.end };
const END_SEC = endSpec.seconds ?? (endSpec.kind === "cta" ? 6 : END);
const needs = [...clips.map((c, i) => [`clips[${i}].src`, fromRepo(c.src)]), ["SFX library", SFX_DIR], ["label font", LABEL_FONT]];
if (endSpec.kind === "poster") needs.push(["end.from", fromRepo(endSpec.from)]);
for (const [what, p] of needs) if (!fs.existsSync(p)) { console.error(`${what} missing: ${p}`); process.exit(2); }
if (endSpec.kind === "cta" && !(endSpec.qr?.length >= 1 && endSpec.qr.length <= 2)) { console.error("end.qr: one or two { url, caption }"); process.exit(2); }

const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }));
const r3 = (v) => Math.round(v * 1000) / 1000;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const flat = (say) => say.replace(/\s*\/\s*/g, " ");

// ── Timeline ──────────────────────────────────────────────────────────────────
const openerSec = spec.opener.seconds ?? 3, rows = spec.opener.text.split("\n").length;
const footageAt = r3(openerSec - WIPE);
// Each clip's place in the footage run (seconds from the first clip's start), back to back.
let run = 0;
for (const [i, c] of clips.entries()) { c.n = i + 1; c.dur = r3(probe(fromRepo(c.src))); c.at = r3(run); run += c.dur; }
const footageDur = r3(run), endAt = r3(footageAt + footageDur), total = r3(endAt + END_SEC);
// Cards in footage-run time; a card holds across a short pause only within its own clip.
const subRows = spec.subtitleRows ?? SUB_ROWS;
// subtitleSplit false: the cards are kept as written (a person grouped them); they still wrap to subRows rows.
const fit = subRows ? { rows: subRows, perRow: Math.floor(SUB.maxW / (FACE.ch * FACE.min)), split: spec.subtitleSplit !== false } : null;
if (subRows) SUB.maxRows = subRows;
for (const clip of clips) {
  const env = fit ? envelope(fromRepo(clip.src)) : null;
  clip.cards = (clip.subtitles ?? []).flatMap((c) => characterBreak(c, env, fit));
}
const cards = clips.flatMap((clip) => clip.cards.map((c, i, all) => {
  const next = all[i + 1], start = Math.max(0.1, c.start - SUB_TIME.LEAD);
  const end = next ? (next.start - c.end < SUB_TIME.HOLD ? next.start - SUB_TIME.LEAD : c.end + SUB_TIME.TAIL) : Math.min(clip.dur - 0.2, c.end + 0.25);
  return { ...c, clip: clip.n, src: { start: c.start, end: c.end }, start: r3(clip.at + start), end: r3(clip.at + end) };
})).map((c, i) => ({ id: `s${i + 1}`, ...c }));
for (const c of cards) if (c.end <= c.start) { console.error(`${c.id}: ends before it starts`); process.exit(2); }

fs.rmSync(path.join(OUT, "assets"), { recursive: true, force: true });
for (const d of ["assets/subs", "assets/sfx", "assets/fonts", "compositions"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

// ── Studio letters: the opener MP4 (and, for subtitleFace "studio", the subtitle PNGs) ──
const { browser, page, png } = await openStudioPage();
await page.evaluate(async () => { window.O = await import("/x/opener.mjs"); window.S = await import("/x/subtitle.mjs"); });
const M = OPENER.margin;
await page.evaluate((p) => window.O.init(p), {
  width: W, height: H, fps: FPS, loop: spec.opener.loop ?? 4, text: spec.opener.text, fg: WHITE, bg: RED, settings: spec.opener.settings ?? {},
  rect: { x: M, y: M, w: W - 2 * M, h: H - 2 * M - OPENER.bottomExtra }, ...OPENER,
});
await encode(path.join(OUT, "assets/opener.mp4"), Math.round(openerSec * FPS), (i) => page.evaluate((n) => window.O.frame(n), i).then(png));
const sizes = {};
// A proportional face: its advance widths per character at 1 px, measured from the font file in the browser.
let measure;
if (FACE.font && FACE.ch !== 0.6) {
  const b64 = fs.readFileSync(fromRepo(FACE.font)).toString("base64");
  const adv = await page.evaluate(async ({ b64, chars }) => {
    const f = new FontFace("SubFace", `url(data:font/ttf;base64,${b64})`);
    await f.load(); document.fonts.add(f);
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = "1000px SubFace";
    return Object.fromEntries([...chars].map((ch) => [ch, ctx.measureText(ch).width / 1000]));
  }, { b64, chars: [...new Set(cards.map((c) => c.say).join(""))].join("") });
  measure = (s, h) => [...s].reduce((w, ch) => w + (adv[ch] ?? 0.6), 0) * h;
}
for (const c of cards) {
  let r;
  if (faceName === "studio") {
    r = await page.evaluate((a) => window.S.card(a), { text: c.say, ...SUB });
    fs.writeFileSync(path.join(OUT, `assets/subs/${c.id}.png`), png(r.png));
  } else {
    // FACE.min sets where the two-row rule splits; a card kept whole (subtitleSplit false) may set smaller, as Studio Sans does.
    const { rows, h } = wrap(c.say, { maxW: SUB.maxW, maxH: FACE.max, maxRows: SUB.maxRows, ch: FACE.ch, measure });
    r = { rows, size: h };
  }
  sizes[c.id] = r;
  console.log(`${c.id} ${r.size}px  ${r.rows.join(" / ")}`);
}
await browser.close();

function encode(file, frames, frameAt) {
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, fail) => ff.on("close", (code) => (code ? fail(new Error(`ffmpeg ${code}`)) : ok())));
  return (async () => {
    for (let i = 0; i < frames; i++) { const b = await frameAt(i); if (!ff.stdin.write(b)) await new Promise((ok) => ff.stdin.once("drain", ok)); }
    ff.stdin.end();
    await done;
  })();
}

// ── Media: footage, end card, SFX, label font ───────────────────────────────
for (const c of clips) fs.copyFileSync(fromRepo(c.src), path.join(OUT, `assets/footage-${c.n}.mp4`));
const qrs = [];
if (endSpec.kind === "poster") {
  const endSrc = fromRepo(endSpec.from);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(probe(endSrc) - END), "-i", endSrc, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-r", String(FPS), path.join(OUT, "assets/end.mp4")]);
} else {
  const r = await renderEndCard({ ground: endSpec.ground ?? "blue", seconds: END_SEC, label: endSpec.label, out: path.join(OUT, "assets/end.mp4") });
  // Letters in the ground's colours: captions in its letter colour, their titles in its accent (red on paper).
  // On a light ground the white QR plates take an ink hairline edge so they don't vanish into it.
  endSpec.fg = r.ground.fg; endSpec.accent = r.ground.accent; endSpec.light = ["paper", "yellow", "cyan"].includes(endSpec.ground ?? "blue");
  // QR codes: error correction Q, the standard 4-module quiet zone, ink modules on white. Never recoloured.
  for (const [i, q] of endSpec.qr.entries()) {
    const file = `assets/qr-${i + 1}.svg`;
    fs.writeFileSync(path.join(OUT, file), await QRCode.toString(q.url, { type: "svg", errorCorrectionLevel: "Q", margin: 4, color: { dark: "#222222", light: "#ffffff" } }));
    qrs.push({ ...q, file, short: q.url.replace(/^https?:\/\//, "") });
  }
}
for (const s of Object.values(SFX)) fs.copyFileSync(path.join(SFX_DIR, s.file), path.join(OUT, "assets/sfx", s.file));
fs.copyFileSync(LABEL_FONT, path.join(OUT, "assets/fonts/IBMPlexMono-Medium.ttf"));
if (FACE.font) fs.copyFileSync(fromRepo(FACE.font), path.join(OUT, "assets/fonts", path.basename(FACE.font)));

// ── HyperFrames project ──────────────────────────────────────────────────────
const write = (rel, text) => fs.writeFileSync(path.join(OUT, rel), text);
const cuts = clips.slice(1).map((c) => r3(footageAt + c.at)); // reel times of the cuts between clips
// end.transition "sweep": the same red sweep and whoosh hide the cut from the footage to the end card.
if (endSpec.transition === "sweep") cuts.push(endAt);
const sfx = [
  ...Array.from({ length: rows }, (_, r) => ({ id: `sfx-pop-${r + 1}`, at: 0.24 + r * OPENER.rowGap, s: SFX.pop, vol: POP_VOLUMES[r % 4], lane: 4 + r })),
  { id: "sfx-whoosh", at: footageAt + 0.06, s: SFX.whoosh, vol: 0.45, lane: 4 },
  // the clip transitions: the whoosh peaks (0.16 s in) one frame after the panel covers the cut
  ...cuts.map((c, i) => ({ id: `sfx-whoosh-cut-${i + 1}`, at: c - 0.13, s: SFX.whoosh, vol: 0.36, lane: 4 })),
  // poster: as the first story (approved). cta: one pop as Makey lands (~0.33 s), one as the QR plates land.
  ...(endSpec.kind === "poster"
    ? [{ id: "sfx-pop-end", at: endAt + 0.833, s: SFX.pop, vol: 0.5, lane: 5 }]
    : [{ id: "sfx-pop-end", at: endAt + 0.24, s: SFX.pop, vol: 0.5, lane: 5 }, { id: "sfx-pop-qr", at: endAt + QR_IN + 0.24, s: SFX.pop, vol: 0.42, lane: 6 }]),
];
write("index.html", `<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: ${RED}; }
      #root { width: 100%; height: 100%; }
      .footage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; z-index: 1; }
      #subs { z-index: 2; }
      .tx { z-index: 5; overflow: hidden; }
      .tx-panel { position: absolute; inset: 0; background: ${RED}; }
      #opener { z-index: 3; }
      #end { z-index: 4; }
    </style>
  </head>
  <body>
    <!-- ${esc(spec.title)}: generated by workflows/live-action/src/build.mjs from content/${slug}.json. Edit the spec
         and rebuild; hand edits here are lost on the next build.
         0–${openerSec} s opener (wipes up at ${footageAt} s) · ${footageAt}–${endAt} s footage + subtitles · ${endAt}–${total} s end card -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
      <div id="opener" data-composition-id="opener" data-composition-src="compositions/opener.html"
        data-start="0" data-duration="${openerSec}" data-track-index="0" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>
${clips.map((c, i) => {
  // The first clip fades its sound in under the wipe; between clips a 0.06 s fade each side keeps the hard cut click-free.
  const fades = `data-fade-in="${i === 0 ? 0.25 : 0.06}"${i < clips.length - 1 || endSpec.transition === "sweep" ? ` data-fade-out="0.06"` : ""}`;
  const framed = c.frame ? ` style="width: ${c.frame.width}px; height: ${c.frame.height}px; translate: ${c.frame.x}px ${c.frame.y}px"` : "";
  return `      <video id="footage-${c.n}" class="clip footage"${framed} data-start="${r3(footageAt + c.at)}" data-duration="${c.dur}" data-track-index="1"
        src="assets/footage-${c.n}.mp4" playsinline data-has-audio="true" data-volume="1" ${fades}></video>`;
}).join("\n")}
      <div id="subs" data-composition-id="subs" data-composition-src="compositions/subs.html"
        data-start="${footageAt}" data-duration="${footageDur}" data-track-index="2" data-track-kind="captions" data-width="${W}" data-height="${H}"></div>
${cuts.map((c, i) => `      <div id="tx-${i + 1}" class="clip tx" data-start="${r3(c - TX / 2)}" data-duration="${TX}" data-track-index="0" data-layout-allow-overflow><div class="tx-panel"></div></div>`).join("\n")}
      <div id="end" data-composition-id="end" data-composition-src="compositions/end.html"
        data-start="${endAt}" data-duration="${END_SEC}" data-track-index="3" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>
${sfx.map((x) => `      <audio id="${x.id}" class="clip" data-start="${r3(x.at)}" data-duration="${x.s.dur}" data-track-index="${x.lane}" src="assets/sfx/${x.s.file}" data-volume="${x.vol}"></audio>`).join("\n")}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
${cuts.map((c, i) => `      tl.fromTo("#tx-${i + 1} .tx-panel", { yPercent: 100 }, { yPercent: 0, duration: ${TX / 2}, ease: "power3.in" }, ${r3(c - TX / 2)});
      tl.to("#tx-${i + 1} .tx-panel", { yPercent: -100, duration: ${TX / 2}, ease: "power3.out" }, ${c});`).join("\n")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`);

write("compositions/opener.html", `<template>
  <style>
    #root { position: absolute; inset: 0; overflow: hidden; }
    #opener-slide { position: absolute; inset: 0; background: ${RED}; }
    #opener-video { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; }
  </style>
  <div id="root" data-composition-id="opener" data-width="${W}" data-height="${H}">
    <!-- ${esc(spec.opener.text.replace(/\n/g, " "))}: the Poster Studio letters (assets/opener.mp4); wipes up at ${footageAt} s. -->
    <div id="opener-slide" data-layout-allow-overflow>
      <video id="opener-video" class="clip" data-start="0" data-duration="${openerSec}" data-track-index="0" src="assets/opener.mp4" muted playsinline></video>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#opener-slide", { yPercent: 0 }, { yPercent: -100, duration: ${WIPE}, ease: "power3.in" }, ${footageAt});
    window.__timelines["opener"] = tl;
  </script>
</template>
`);

write("compositions/subs.html", `<template>
  <style>
    #root { position: absolute; inset: 0; }
    /* The plate's bottom edge sits on the bottom line of the 80% title-safe box. */
    .sub { position: absolute; left: 0; right: 0; bottom: ${SAFE_BOTTOM}px; display: flex; justify-content: center; }
    .plate { background: #ffffff; border-radius: 36px; padding: 20px 32px; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18); }
    .plate img { display: block; }
${FACE.font ? `    @font-face { font-family: "${FACE.family}"; src: url("assets/fonts/${path.basename(FACE.font)}"); font-weight: ${FACE.weight}; }
` : ""}    .plate.text { padding: 22px 36px; }
    .sub-text { font-family: "${FACE.family}"; font-weight: ${FACE.weight}; color: ${SUB.color}; text-align: center; white-space: pre;
      line-height: ${FACE.lineHeight ?? 1}; letter-spacing: 0; }
  </style>
  <div id="root" data-composition-id="subs" data-width="${W}" data-height="${H}">
${cards.map((c, i) => `    <!-- ${esc(c.means ?? "")} -->
    <div id="sub-${c.id}" class="clip sub" data-start="${c.start}" data-duration="${r3(c.end - c.start)}" data-track-index="${i % 2}">
      ${faceName === "studio"
    ? `<div class="plate" id="plate-${c.id}"><img src="assets/subs/${c.id}.png" width="${sizes[c.id].w}" height="${sizes[c.id].h}" alt="${esc(flat(c.say))}" /></div>`
    : `<div class="plate text" id="plate-${c.id}"><div class="sub-text" style="font-size: ${sizes[c.id].size}px">${sizes[c.id].rows.map(esc).join("<br>")}</div></div>`}
    </div>`).join("\n")}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    const cards = ${JSON.stringify(cards.map((c) => ({ id: c.id, start: c.start, end: c.end })))};
    // A slight 3D tilt: each plate leans back from its bottom edge (which stays on the safe line) and turns a
    // little, alternating left and right card to card. The whole plate tilts; the letters are never squashed.
    cards.forEach((c, i) => {
      const p = "#plate-" + c.id, side = i % 2 ? -1 : 1;
      tl.fromTo(p,
        { opacity: 0, y: 40, rotationX: 78, rotationY: 0, rotation: 0, transformPerspective: 1100, transformOrigin: "50% 100%" },
        { opacity: 1, y: 0, rotationX: 16, rotationY: 9 * side, rotation: -2.5 * side, duration: 0.42, ease: "back.out(1.5)" }, c.start);
      tl.to(p, { opacity: 0, rotationX: 40, duration: 0.13, ease: "power2.in" }, c.end - 0.14);
      tl.set(p, { opacity: 0, visibility: "hidden" }, c.end - 0.01);
    });
    window.__timelines["subs"] = tl;
  </script>
</template>
`);

// cta: the end beat rendered on its ground with the label already in its footer; the QR codes sit where COMING
// SOON would (between Makey, y 174–844, and the footer, from y 1586): white plates with the code and its quiet
// zone, a caption in the ground's letter colour under each. They pop in once Makey has landed.
const QR_PLATE = 420, QR_PAD = 18, QR_TOP = 960;
const qrCols = qrs.length === 2 ? [70, 590] : [(W - QR_PLATE) / 2];
if (endSpec.kind === "cta") write("compositions/end.html", `<template>
  <style>
    @font-face { font-family: "IBM Plex Mono MF"; src: url("assets/fonts/IBMPlexMono-Medium.ttf"); font-weight: 500; }
    #root { position: absolute; inset: 0; }
    #end-video { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; }
    .qr-col { position: absolute; top: ${QR_TOP}px; width: ${QR_PLATE + 50}px; }
    .qr-in { display: flex; flex-direction: column; align-items: center; }
    .qr-plate { background: #ffffff; border-radius: 36px; padding: ${QR_PAD}px; line-height: 0;${endSpec.light ? ` box-shadow: inset 0 0 0 2px ${endSpec.fg};` : ""} }
    .qr-plate img { display: block; width: ${QR_PLATE - 2 * QR_PAD}px; height: ${QR_PLATE - 2 * QR_PAD}px; image-rendering: pixelated; }
    .qr-cap { margin-top: 26px; text-align: center; font-family: "IBM Plex Mono MF"; font-weight: 500; color: ${endSpec.fg}; }
    .qr-cap b { display: block; font-weight: 500; font-size: 32px; line-height: 40px; letter-spacing: 0.04em; color: ${endSpec.accent}; }
    .qr-cap span { display: block; font-size: 28px; line-height: 36px; }
  </style>
  <div id="root" data-composition-id="end" data-width="${W}" data-height="${H}">
    <!-- The end beat (Makey, ${endSpec.ground ?? "blue"} ground, lockup + labels "${esc(endSpec.label)}") from src/end-card.mjs -->
    <video id="end-video" class="clip" data-start="0" data-duration="${END_SEC}" data-track-index="0" src="assets/end.mp4" muted playsinline></video>
${qrs.map((q, i) => `    <div id="qr-col-${i + 1}" class="clip qr-col" style="left: ${qrCols[i] - 25}px" data-start="0" data-duration="${END_SEC}" data-track-index="${i + 1}">
      <div class="qr-in" id="qr-in-${i + 1}">
        <div class="qr-plate"><img src="${q.file}" alt="QR code: ${esc(q.short)}" /></div>
        <div class="qr-cap"><b>${esc(q.caption)}</b><span>${esc(q.short)}</span></div>
      </div>
    </div>`).join("\n")}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(".qr-in", { opacity: 0, scale: 0.9, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.6)", stagger: 0.12, transformOrigin: "50% 50%" }, ${QR_IN});
    window.__timelines["end"] = tl;
  </script>
</template>
`);

// poster: the General story's footer (workflows/motion-posters/src/render.mjs: PAD 70, story labelSize 24, base
// 1670): the topic label is right-aligned at x = 1010 with its baseline 1.45 × 24 px above 1670. A patch of the
// card's own paper (#F4F5F3 as decoded) covers it and the label is re-set in the same face and size. The lockup is
// untouched.
else write("compositions/end.html", `<template>
  <style>
    @font-face { font-family: "IBM Plex Mono MF"; src: url("assets/fonts/IBMPlexMono-Medium.ttf"); font-weight: 500; }
    #root { position: absolute; inset: 0; }
    #end-video { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; }
    #end-patch { position: absolute; left: 690px; top: 1608px; width: 330px; height: 36px; background: #f4f5f3; }
    #end-label { position: absolute; right: 70px; top: 1614px; width: 700px; text-align: right;
      font-family: "IBM Plex Mono MF"; font-weight: 500; font-size: 24px; line-height: 24px; color: #222222; }
  </style>
  <div id="root" data-composition-id="end" data-width="${W}" data-height="${H}"
    data-composition-variables='[{"id":"endLabel","type":"string","label":"End card topic label","default":"${esc(endSpec.label)}"}]'>
    <video id="end-video" class="clip" data-start="0" data-duration="${END_SEC}" data-track-index="0" src="assets/end.mp4" muted playsinline></video>
    <div id="end-patch" class="clip" data-start="0" data-duration="${END_SEC}" data-track-index="1" data-layout-ignore></div>
    <div id="end-label" class="clip" data-start="0" data-duration="${END_SEC}" data-track-index="2" data-var-text="endLabel">${esc(endSpec.label)}</div>
  </div>
  <script>
    window.__timelines["end"] = gsap.timeline({ paused: true });
  </script>
</template>
`);

write("package.json", JSON.stringify({ name: slug, private: true, type: "module", scripts: { dev: `npx --yes ${HF} preview`, check: `npx --yes ${HF} check`, render: `npx --yes ${HF} render --quality delivery --output ${slug}.mp4` } }, null, 2) + "\n");
write("hyperframes.json", JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { blocks: "compositions", components: "compositions/components", assets: "assets" }, media: { autoProxy: true }, authoringSkill: "hyperframes" }, null, 2) + "\n");
write("meta.json", JSON.stringify({ id: slug, name: spec.title }, null, 2) + "\n");
const ss = (t) => t.toFixed(2);
write("SUBTITLES.md", `# ${spec.title}: subtitles\n\n${spec.status ?? ""}\n\n${clips.map((c) => `- Clip ${c.n}: \`${c.src}\`, reel ${ss(footageAt + c.at)}–${ss(footageAt + c.at + c.dur)} s`).join("\n")}\n\nClip time is seconds into that clip.\n\n| # | Clip | Reel time | Clip time | On screen | Means |\n|---|---|---|---|---|---|\n${cards.map((c, i) => `| ${i + 1} | ${c.clip} | ${ss(c.start + footageAt)}–${ss(c.end + footageAt)} | ${ss(c.src.start)}–${ss(c.src.end)} | ${c.say} | ${c.means ?? ""}${c.split ? ` (part ${c.split})` : ""} |`).join("\n")}\n`);
console.log(`project: ${path.relative(REPO, OUT)}  (${total} s: opener 0–${openerSec}, footage ${footageAt}–${endAt}, end ${endAt}–${total})`);

// ── Check and render ─────────────────────────────────────────────────────────
const hf = (a, opts = {}) => execFileSync("npx", ["--yes", HF, ...a], { cwd: OUT, encoding: "utf8", maxBuffer: 1 << 28, ...opts });
if (!args.includes("--no-check")) {
  const j = JSON.parse(hf(["check", "--json"], { stdio: ["ignore", "pipe", "ignore"] }));
  const errs = Object.entries(j).filter(([, v]) => v && typeof v === "object" && v.errorCount).map(([k, v]) => `${k}: ${v.errorCount}`);
  console.log(`check: ${j.ok ? "ok" : "FAILED"}${errs.length ? ` (${errs.join(", ")})` : ""}`);
  if (!j.ok) process.exit(1);
}
if (args.includes("--render")) {
  hf(["render", "--quality", "delivery", "--output", `${slug}.mp4`], { stdio: "inherit" });
  const out = path.join(OUT, `${slug}.mp4`);
  console.log(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=width,height,nb_read_frames:format=duration", "-of", "compact", out], { encoding: "utf8" }).trim());
}
