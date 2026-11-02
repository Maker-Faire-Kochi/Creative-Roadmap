// The Studio track (exploratory, 2026-11-02): the awareness carousels as Poster Studio type posters.
// Latin in Studio Sans (the studio's own engine, workflows/motion-posters/vendor/poster-studio, unmodified),
// Malayalam in Baloo Chettan 2 ExtraBold; red grounds with white letters and ink accents, the last slide on paper
// (ink letters, red accents), one lockup and one label line. After the studio's art direction: the lettering is
// the artwork; no plates, rules, arrows or kit art.
// usage: node src/studio.mjs --lang=ml [--track=red|white] [topicPrefix ...]   (output: $MFK_OUT, default output/awareness-carousels-studio)
// Writes <out>/ml/<topic>/post|story/NN.png, _strip-post.jpg, _strip-story.jpg, <out>/ml/_series-overview.jpg and
// <out>/build/qa-report-ml.json.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { TOPICS } from "../content/topics.mjs";
import { TOPICS_ML } from "../content/topics-ml.mjs";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SRC, "../../..");
const STUDIO = path.join(REPO, "workflows/motion-posters/vendor/poster-studio");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARGS = process.argv.slice(2);
const ML = ARGS.includes("--lang=ml");
// Colour tracks: red = white letters on red (the last slide on paper); white = red letters on paper (the last slide
// on red). Both are the user's (2026-11-02).
const TRACK = ARGS.find((a) => a.startsWith("--track="))?.slice(8) ?? "red";
if (!["red", "white"].includes(TRACK)) { console.error("--track=red|white"); process.exit(2); }
const only = ARGS.filter((a) => !a.startsWith("--"));
const OUT = path.resolve(REPO, process.env.MFK_OUT || "output/awareness-carousels-studio");
const LANG_DIR = path.join(OUT, ML ? "ml" : "en", TRACK);
if (!fs.existsSync(path.join(STUDIO, "src/scene.js"))) { console.error("Poster Studio missing: git submodule update --init (workflows/motion-posters/vendor/poster-studio)"); process.exit(2); }

const C = { paper: "#F6F6F3", ink: "#222222", red: "#ED1C24", white: "#FFFFFF" };
const GROUNDS = {
  red: { bg: C.red, fg: C.white, accent: C.ink, strike: C.ink, logo: "border" },
  paper: { bg: C.paper, fg: C.ink, accent: C.red, strike: C.red, logo: "long" },
  "paper-red": { bg: C.paper, fg: C.red, accent: C.ink, strike: C.ink, logo: "long" },
  "red-white": { bg: C.red, fg: C.white, accent: C.ink, strike: C.ink, logo: "border" },
};
// [inner slides, last slide] per track
const TRACKS = { red: ["red", "paper"], white: ["paper-red", "red-white"] };
// Bands keep clear of the footer and, on stories, of Instagram's top bar and reply field.
const FORMATS = {
  post: { w: 1080, h: 1350, band: { x: 60, y: 110, w: 960, h: 1000 }, footer: { pad: 60, base: 1282, logoW: 340, labelSize: 22 } },
  story: { w: 1080, h: 1920, band: { x: 60, y: 230, w: 960, h: 1260 }, footer: { pad: 60, base: 1672, logoW: 380, labelSize: 24 } },
};
const MIN_SIZE = 64;
const FONTS = [
  { family: "Baloo Chettan 2", url: "/repo/brand/fonts/BalooChettan2-800-malayalam.woff2", descriptors: { weight: "800", unicodeRange: "U+0D00-0D7F, U+200C-200D, U+25CC" } },
  { family: "IBM Plex Mono", url: "/repo/guidelines/brand-guidelines/fonts/IBMPlexMono-Medium.ttf", descriptors: { weight: "500" } },
  { family: "Noto Sans Malayalam", url: "/repo/guidelines/brand-guidelines/fonts/NotoSansMalayalam-variable.ttf", descriptors: { weight: "100 900" } },
];
const LOGOS = { long: "/repo/brand/logo/official/MF_Kochi_Logo_long.png", border: "/repo/brand/logo/official/MF_Kochi_Logo_border.png" };

const browser = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
const ROOTS = { "/studio/": STUDIO, "/x/": SRC, "/repo/": REPO };
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".ttf": "font/ttf", ".woff2": "font/woff2", ".png": "image/png" };
await page.route("http://mfk.local/**", (r) => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname);
  if (u === "/r.html") return r.fulfill({ body: "<!doctype html><meta charset=utf-8>", contentType: "text/html" });
  const root = Object.keys(ROOTS).find((k) => u.startsWith(k)), file = root && path.join(ROOTS[root], u.slice(root.length));
  if (!file || !file.startsWith(ROOTS[root]) || !fs.existsSync(file)) return r.fulfill({ status: 404 });
  r.fulfill({ path: file, contentType: TYPES[path.extname(file)] || "application/octet-stream" });
});
await page.goto("http://mfk.local/r.html");
const ready = await page.evaluate(async (p) => { window.S = await import("/x/studio-page.mjs"); return window.S.init(p); }, { fonts: FONTS, logos: LOGOS });
const report = [];
if (ready.fonts.some((ok) => !ok)) report.push({ topic: "*", issues: [`font load failure: ${JSON.stringify(ready.fonts)}`] });

const png = (url) => Buffer.from(url.split(",")[1], "base64");
for (const [key, en] of Object.entries(TOPICS)) {
  if (only.length && !only.some((o) => key.startsWith(o))) continue;
  const t = ML ? { ...en, ...TOPICS_ML[key] } : en, n = t.slides.length;
  for (const [fk, F] of Object.entries(FORMATS)) {
    const dir = path.join(LANG_DIR, key, fk);
    fs.mkdirSync(dir, { recursive: true });
    const files = [];
    for (const [i, sl] of t.slides.entries()) {
      const last = i === n - 1, ground = GROUNDS[TRACKS[TRACK][last ? 1 : 0]];
      const label = last ? (ML ? "MAKER FAIRE KOCHI · ഉടൻ വരുന്നു" : "MAKER FAIRE KOCHI · COMING SOON") : `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      const r = await page.evaluate((p) => window.S.slide(p), { width: F.w, height: F.h, ground, band: F.band, footer: F.footer, slide: sl, label, minSize: MIN_SIZE });
      const file = path.join(dir, `${String(i + 1).padStart(2, "0")}.png`);
      fs.writeFileSync(file, png(r.png));
      files.push(file);
      report.push({ topic: key, format: fk, slide: i + 1, size: r.size, issues: r.issues });
      if (r.issues.length) console.log(`${key} ${fk} ${i + 1}: ${r.issues.join(" | ")}`);
    }
    // The strip: the carousel's slides side by side, for review.
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `${files.map((_, k) => `[${k}]scale=360:-1[s${k}]`).join(";")};${files.map((_, k) => `[s${k}]`).join("")}hstack=${files.length}`, "-q:v", "3", path.join(LANG_DIR, key, `_strip-${fk}.jpg`)]);
  }
  console.log(`${key}: ${t.slides.length} slides × post + story`);
}
await browser.close();

// Series overview: every topic's cover (post), 5 across.
const covers = Object.keys(TOPICS).map((k) => path.join(LANG_DIR, k, "post", "01.png")).filter((f) => fs.existsSync(f));
if (covers.length) {
  const cols = 5, rows = Math.ceil(covers.length / cols), pad = cols * rows - covers.length;
  const ins = covers.flatMap((f) => ["-i", f]);
  const blank = pad ? ["-f", "lavfi", "-i", `color=c=#f6f6f3:s=1080x1350:d=1`] : [];
  const parts = [...covers.map((_, k) => `[${k}]scale=432:540[c${k}]`), ...(pad ? [`[${covers.length}]scale=432:540,split=${pad}${Array.from({ length: pad }, (_, k) => `[b${k}]`).join("")}`] : [])];
  const cells = [...covers.map((_, k) => `[c${k}]`), ...Array.from({ length: pad }, (_, k) => `[b${k}]`)];
  const rowsF = Array.from({ length: rows }, (_, r) => `${cells.slice(r * cols, r * cols + cols).join("")}hstack=${cols}[r${r}]`);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...ins, ...blank, "-filter_complex", rows > 1 ? `${[...parts, ...rowsF].join(";")};${Array.from({ length: rows }, (_, r) => `[r${r}]`).join("")}vstack=${rows}` : `${[...parts, ...rowsF].join(";").replace(/\[r0\]$/, "")}`, "-frames:v", "1", "-q:v", "3", path.join(LANG_DIR, "_series-overview.jpg")]);
}
fs.mkdirSync(path.join(OUT, "build"), { recursive: true });
const issues = report.reduce((k, r) => k + r.issues.length, 0);
fs.writeFileSync(path.join(OUT, "build", `qa-report-${ML ? "ml" : "en"}-${TRACK}.json`), JSON.stringify({ generated: new Date().toISOString(), track: "studio", renders: report, issues }, null, 2));
console.log(`QA: ${issues} issue(s); sizes ${Math.min(...report.filter((r) => r.size).map((r) => r.size))}–${Math.max(...report.filter((r) => r.size).map((r) => r.size))} px → ${path.relative(REPO, LANG_DIR)}`);
if (issues) process.exitCode = 1;
