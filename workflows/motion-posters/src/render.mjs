// Motion posters: one short story per awareness topic × format (post 4:5, story 9:16), in either look.
// Each slide of the topic becomes a beat: the Poster Studio's lettering (vendor/poster-studio, used unmodified)
// over a live 3D scene from makerfaire.in (vendor/website, bundled into build/stage.js), with the slide's sentence
// underneath. Frames are drawn one at a time in headless Chrome (src/page.mjs) and ffmpeg encodes them, so a
// render is repeatable. Output goes to $MFK_OUT (default output/motion-posters-<look>, git-ignored).
// usage: npm run build:stage, then node src/render.mjs --look=general|noise [topicPrefix ...]
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { TOPICS } from "../../awareness-carousels/content/topics.mjs";
import { STORYBOARDS, END_SAY } from "../content/storyboards.mjs";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(PKG, "../..");
const STUDIO = path.join(PKG, "vendor/poster-studio");
const WEBSITE = path.join(PKG, "vendor/website");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const INK = "#222222", PAPER = "#F6F6F3", RED = "#ED1C24", YELLOW = "#FFE86C", BLUE = "#2B19D9";
const GF = "/repo/guidelines/brand-guidelines/fonts", CF = "/repo/guidelines/references/campaign/fonts";
// Colour with a purpose: neutral letters, the payoff beat and the strike in red (General) or as an inverted
// block (Noise, as in the carousels). Logo: long on light grounds, border on coloured grounds (AGENTS.md).
const LOOKS = {
  general: {
    name: "General / Anton", bg: PAPER, letters: INK, payoffFg: RED, payoffPlate: null, strike: RED, text: INK,
    studioFont: "anton", textFamily: "IBM Plex Mono", textWeight: 400, textAccentWeight: 500, labelFamily: "IBM Plex Mono", labelWeight: 500,
    logo: { file: "MF_Kochi_Logo_long.png", ratio: 646 / 3871 },
    fonts: [
      { family: "IBM Plex Mono", url: `${GF}/IBMPlexMono-Regular.ttf`, descriptors: { weight: "400" } },
      { family: "IBM Plex Mono", url: `${GF}/IBMPlexMono-Medium.ttf`, descriptors: { weight: "500" } },
    ],
  },
  noise: {
    name: "Loud Design / Make Some Noise", bg: YELLOW, letters: BLUE, payoffFg: YELLOW, payoffPlate: BLUE, strike: YELLOW, text: BLUE,
    studioFont: "dela", textFamily: "Inter", textWeight: 400, textAccentWeight: 700, labelFamily: "Inter", labelWeight: 700,
    logo: { file: "MF_Kochi_Logo_border.png", ratio: 859 / 4092 },
    fonts: [{ family: "Inter", url: `${CF}/Inter.ttf`, descriptors: { weight: "100 900" } }],
  },
};
// The struck word in the sentence needs a line that shows on the ground (the Noise letters' strike is yellow).
LOOKS.noise.strikeText = BLUE;

// Bands: lettering on top, the 3D window, the sentence, the footer. Stories keep clear of Instagram's top
// (profile) and bottom (reply) overlays.
const FORMATS = {
  post: { w: 1080, h: 1350, type: [56, 400], window: [470, 530], text: 1012, textSize: 34, logoW: 360, labelSize: 22, bottom: 70 },
  story: { w: 1080, h: 1920, type: [210, 540], window: [770, 660], text: 1446, textSize: 38, logoW: 400, labelSize: 24, bottom: 250 },
};
const FPS = 30, PAD = 70, WARM = 1.5, END = 2.6, MIN_S = 12, MAX_S = 18;

const ARGS = process.argv.slice(2);
const lookArg = ARGS.find((a) => a.startsWith("--look="))?.slice(7);
if (!LOOKS[lookArg]) { console.error(`Pass --look=${Object.keys(LOOKS).join("|")}`); process.exit(2); }
const LOOK = { ...LOOKS[lookArg] };
LOOK.strikeText ??= LOOK.strike;
const only = ARGS.filter((a) => !a.startsWith("--"));
const OUT = path.resolve(REPO, process.env.MFK_OUT || `output/motion-posters-${lookArg}`);
for (const [dir, file] of [[STUDIO, "src/scene.js"], [WEBSITE, "app/three/core/kit.ts"]])
  if (!fs.existsSync(path.join(dir, file))) { console.error(`${path.relative(PKG, dir)} missing: run git submodule update --init`); process.exit(2); }
if (!fs.existsSync(path.join(PKG, "build/stage.js"))) { console.error("build/stage.js missing: run npm run build:stage"); process.exit(2); }
const rev = (dir) => execFileSync("git", ["-C", dir, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const REVS = { studio: rev(STUDIO), website: rev(WEBSITE) };

// ── Copy → timeline ───────────────────────────────────────────────────────────
const SAY = /^[A-Z0-9&!?.\- ]+$/;
const plainWords = (s) => s.replace(/[*~]/g, "").split(/\s+/).filter(Boolean).length;
function lineFor(slide) {
  if (slide.stat) return `*${slide.stat}* ${slide.label.replace(/\s*[/\n]\s*/g, " · ")}`;
  return slide.lines.join(" ");
}
function timeline(key) {
  const t = TOPICS[key], sb = STORYBOARDS[key], issues = [];
  if (!t || !sb) throw new Error(`No topic or storyboard for ${key}`);
  if (sb.beats.length !== t.slides.length) issues.push(`${sb.beats.length} beats for ${t.slides.length} slides`);
  // Each beat: 0.45 s in, a hold for reading (0.3 s a word, at least 1.6 s), 0.35 s out. A topic with few slides
  // holds longer, so every story runs at least MIN_S.
  const durs = sb.beats.map((b, index) => {
    const slide = t.slides[index];
    if (!slide) return 0;
    return Math.max(0.45 + Math.max(1.6, 0.3 * plainWords(lineFor(slide))) + 0.35, [b.say].flat().length * 1.35 + 0.4);
  });
  const sum = durs.reduce((a, b) => a + b, 0), stretch = Math.max(1, (MIN_S - END) / Math.max(1, sum));
  const beats = [];
  let clock = 0, set = sb.set, opts = sb.opts ?? {};
  sb.beats.forEach((b, index) => {
    const slide = t.slides[index];
    if (!slide) return;
    if (b.set) { set = b.set; opts = b.opts ?? {}; }
    const says = [b.say].flat();
    for (const s of says) {
      const bare = s.replace(/~/g, "");
      if (!SAY.test(bare)) issues.push(`beat ${index + 1}: "${s}" has characters the studio can't set`);
      if (bare.split(/ +/).length > 4) issues.push(`beat ${index + 1}: "${s}" is more than 4 words`);
    }
    const line = lineFor(slide);
    const dur = durs[index] * stretch;
    const start = clock, end = clock + dur, step = dur / says.length;
    const parts = says.map((s, i) => ({ text: s.replace(/~/g, ""), struck: s.startsWith("~"), start: start + i * step, end: start + (i + 1) * step }));
    const cues = [];
    if (b.shot !== undefined) cues.push({ name: "shot", arg: b.shot, t: start });
    for (const [name, sec] of Object.entries(b.act ?? {})) cues.push({ name, t: start + sec });
    beats.push({ index, set, opts, parts, line, cues, start, end, payoff: index === t.slides.length - 1 });
    clock = end;
  });
  // The first frame is the cover: its letters start in place. The end card holds its letters to the last frame.
  if (beats[0]) beats[0].parts[0].start -= 0.45;
  beats.push({ index: beats.length, set, opts, parts: [{ text: END_SAY, struck: false, start: clock, end: clock + END, last: true }], line: null, cues: [], start: clock, end: clock + END, payoff: false, last: true });
  const seconds = clock + END;
  if (seconds < MIN_S || seconds > MAX_S) issues.push(`${seconds.toFixed(1)} s, outside ${MIN_S}–${MAX_S} s`);
  return { beats, seconds, issues, label: `${key.slice(0, 2)} / ${t.label.toUpperCase()}` };
}

function layout(f) {
  const F = FORMATS[f], logoH = F.logoW * LOOK.logo.ratio;
  const logo = { x: PAD, y: F.h - F.bottom - logoH, w: F.logoW, h: logoH };
  return {
    type: { x: 38, y: F.type[0], w: F.w - 76, h: F.type[1] },
    window: { x: 0, y: F.window[0], w: F.w, h: F.window[1] },
    focus: [0, 1, F.window[0] / F.h, (F.window[0] + F.window[1]) / F.h],
    text: { x: PAD, y: F.text, w: F.w - PAD * 2 },
    textSize: F.textSize,
    footer: { pad: PAD, logo, labelSize: F.labelSize },
  };
}

// ── Browser ──────────────────────────────────────────────────────────────────
// The Mac's GPU (ANGLE/Metal) draws a frame in ~17 ms; MFK_SWIFTSHADER=1 uses the CPU renderer (~110 ms).
const gl = process.env.MFK_SWIFTSHADER ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--ignore-gpu-blocklist"];
const browser = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb", ...gl] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
const ROOTS = { "/studio/": STUDIO, "/build/": path.join(PKG, "build"), "/src/": path.join(PKG, "src"), "/repo/": REPO };
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".ttf": "font/ttf", ".woff2": "font/woff2", ".png": "image/png" };
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

function encode(file) {
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, fail) => ff.on("close", (code) => (code ? fail(new Error(`ffmpeg exited ${code} for ${file}`)) : ok())));
  return { write: (buf) => new Promise((ok) => (ff.stdin.write(buf) ? ok() : ff.stdin.once("drain", ok))), end: () => (ff.stdin.end(), done) };
}
const probe = (file) => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=width,height,nb_read_frames:format=duration", "-of", "json", file], { encoding: "utf8" }));
const png = (url) => Buffer.from(url.split(",")[1], "base64");

const report = [];
for (const key of Object.keys(TOPICS)) {
  if (only.length && !only.some((o) => key.startsWith(o))) continue;
  const story = timeline(key), dir = path.join(OUT, key);
  if (story.issues.length) { report.push({ topic: key, issues: story.issues }); console.log(`${key}: ISSUES ${story.issues.join(" | ")}`); continue; }
  fs.mkdirSync(dir, { recursive: true });
  for (const fmt of Object.keys(FORMATS)) {
    const F = FORMATS[fmt], L = layout(fmt), frames = Math.round(story.seconds * FPS), issues = [];
    const plan = {
      width: F.w, height: F.h, fps: FPS, warm: WARM, layout: L, look: LOOK, fonts: LOOK.fonts, beats: story.beats,
      label: story.label, signoff: "MAKER FAIRE KOCHI · COMING SOON", logo: { src: `/repo/brand/logo/official/${LOOK.logo.file}` },
    };
    await page.evaluate((p) => window.poster.init(p), plan);
    const video = path.join(dir, `${fmt}.mp4`), enc = encode(video), t0 = Date.now();
    const cover = Math.round(1.0 * FPS), checks = story.beats.map((b) => Math.round(((b.start + b.end) / 2) * FPS));
    for (let i = 0; i < frames; i++) {
      const buf = png(await page.evaluate((n) => window.poster.frame(n), i));
      if (i === cover) fs.writeFileSync(path.join(dir, `${fmt}.png`), buf);
      if (checks.includes(i)) {
        const v = await page.evaluate(() => window.poster.stageVariance());
        if (v.covered < 0.02 || v.spread < 4) issues.push(`3D stage looks blank at ${(i / FPS).toFixed(1)} s`);
        const s = await page.evaluate(() => window.poster.stats());
        if (s.textBottom > L.footer.logo.y - 12) issues.push(`sentence runs into the footer at ${(i / FPS).toFixed(1)} s`);
      }
      await enc.write(buf);
    }
    await enc.end();
    const info = probe(video), st = info.streams[0];
    if (st.width !== F.w || st.height !== F.h) issues.push(`size ${st.width}×${st.height}`);
    if (+st.nb_read_frames !== frames) issues.push(`${st.nb_read_frames} frames, expected ${frames}`);
    if (Math.abs(+info.format.duration - frames / FPS) > 0.05) issues.push(`duration ${info.format.duration}s`);
    report.push({ topic: key, format: fmt, seconds: +(frames / FPS).toFixed(2), beats: story.beats.map((b) => ({ say: b.parts.map((p) => p.text), set: b.set, line: b.line })), issues });
    console.log(`${key} ${fmt}: ${(frames / FPS).toFixed(1)} s, ${((Date.now() - t0) / 1000).toFixed(0)} s to render, ${issues.length ? "ISSUES " + issues.join(" | ") : "ok"}`);
  }
}
await browser.close();

// ── Review gallery and QA report ───────────────────────────────────────────
const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const rows = Object.keys(TOPICS).filter((k) => fs.existsSync(path.join(OUT, k, "post.mp4"))).map((k) => {
  const s = timeline(k), v = (f) => `<a href="${k}/${f}.mp4"><video src="${k}/${f}.mp4" poster="${k}/${f}.png" autoplay muted loop playsinline></video></a>`;
  const beats = s.beats.map((b) => `<li><b>${esc(b.parts.map((p) => (p.struck ? `~${p.text}~` : p.text)).join(" / "))}</b>${b.line ? ` · ${esc(b.line.replace(/[*~]/g, ""))}` : ""} <span class="meta">${b.set}</span></li>`).join("");
  return `<article><p class="meta">${esc(s.label)} · ${s.seconds.toFixed(1)} s</p><div class="v">${v("post")}${v("story")}</div><ol>${beats}</ol></article>`;
}).join("");
const tokens = path.relative(OUT, path.join(REPO, "brand/tokens.css")).split(path.sep).join("/");
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion posters / ${LOOK.name}</title><link rel="stylesheet" href="${tokens}"><style>
body{margin:0;background:#f6f6f3;color:#222;font-family:var(--mf-font-body)}header,main{max-width:1200px;margin:auto;padding:32px 20px}h1{font:400 clamp(40px,7vw,80px)/1 var(--mf-font-display);margin:12px 0}
.meta{font:500 13px/1.5 var(--mf-font-label);text-transform:uppercase}article{border-top:2px solid;padding:24px 0}.v{display:flex;gap:16px;align-items:flex-start}.v a{flex:1 1 0;min-width:0}video{width:100%;height:auto;display:block;border:1px solid #222}a{color:#222}ol{font-size:14px;line-height:1.5}
</style></head><body><header><p class="meta">Maker Faire Kochi / Awareness / Motion posters / ${LOOK.name}</p><h1>Motion posters</h1><p>One story per topic: a beat per carousel slide, then COMING SOON. Lettering: Poster Studio (${REVS.studio}). 3D: makerfaire.in scenes (${REVS.website}), shown as illustrations. Post 1080×1350 and story 1080×1920, ${FPS} fps, silent (add music in Instagram).</p></header><main>${rows}</main></body></html>`);
// A filtered run updates its topics in the existing report, so the report always covers every rendered poster.
const qaFile = path.join(OUT, "qa-report.json"), done = new Set(report.map((r) => r.topic));
const kept = only.length && fs.existsSync(qaFile) ? JSON.parse(fs.readFileSync(qaFile, "utf8")).renders.filter((r) => !done.has(r.topic)) : [];
const renders = [...kept, ...report].sort((a, b) => a.topic.localeCompare(b.topic) || (a.format ?? "").localeCompare(b.format ?? ""));
fs.writeFileSync(qaFile, JSON.stringify({ generated: new Date().toISOString(), look: lookArg, ...REVS, renders, issues: renders.reduce((n, r) => n + r.issues.length, 0) }, null, 2));
if (report.some((r) => r.issues.length)) process.exitCode = 1;
