// Renders the motion posters' end beat on its own, on any ground: Makey (the makerfaire.in robot) pops up and waves
// in the model-top window, with the footer (lockup + labels) drawn by the ground. It reuses the motion-posters
// render page (workflows/motion-posters/src/page.mjs) and 3D stage (build/stage.js) unmodified; the plan below
// mirrors what workflows/motion-posters/src/render.mjs builds for a General story's last beat, with no lettering
// (maxRows 0: the live-action CTA puts its QR codes where COMING SOON would be).
// usage (module): await renderEndCard({ ground: "blue", seconds: 6, label: "WHY KOCHI", out: "end.mp4" })
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { REPO } from "./studio-page.mjs";
import { END_STAGE } from "../../motion-posters/content/storyboards.mjs";

const MP = path.join(REPO, "workflows/motion-posters");
const DS = path.join(REPO, "design-system");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FPS = 30, WARM = 1.5;

// From workflows/motion-posters/src/render.mjs (GROUNDS, LOGOS, FORMATS.story, PAD, LOOKS.general): keep in step.
const C = { paper: "#F6F6F3", ink: "#222222", red: "#ED1C24", cyan: "#00AEEF", yellow: "#FFE86C", blue: "#2B19D9", white: "#FFFFFF" };
export const GROUNDS = {
  paper: { bg: C.paper, fg: C.ink, accent: C.red, strike: C.red, logo: "long", edges: true },
  red: { bg: C.red, fg: C.white, accent: C.ink, strike: C.ink, logo: "border", edges: true },
  cyan: { bg: C.cyan, fg: C.ink, accent: C.white, strike: C.red, logo: "border", edges: true },
  yellow: { bg: C.yellow, fg: C.blue, accent: C.red, strike: C.red, logo: "border", edges: true },
  blue: { bg: C.blue, fg: C.yellow, accent: C.white, strike: C.red, logo: "border", edges: false },
};
const LOGOS = {
  long: { src: "/repo/brand/logo/official/MF_Kochi_Logo_long.png", ratio: 646 / 3871 },
  border: { src: "/repo/brand/logo/official/MF_Kochi_Logo_border.png", ratio: 859 / 4092 },
};
const STORY = { w: 1080, h: 1920, logoW: 400, labelSize: 24, base: 1670, type: [960, 590], window: [200, 760] }, PAD = 70;
const LOOK = {
  name: "General / Studio Sans", status: "selected", studioFont: "original", charWidth: 0.74, plates: false,
  labelFamily: "IBM Plex Mono", labelWeight: 500,
};
const FONTS = [{ family: "IBM Plex Mono", url: "/repo/guidelines/brand-guidelines/fonts/IBMPlexMono-Medium.ttf", descriptors: { weight: "500" } }];

export async function renderEndCard({ ground = "blue", seconds = 6, label, signoff = "MAKER FAIRE KOCHI · COMING SOON", out }) {
  if (!GROUNDS[ground]) throw new Error(`end card ground "${ground}": one of ${Object.keys(GROUNDS).join(", ")}`);
  if (!fs.existsSync(path.join(MP, "build/stage.js"))) throw new Error("workflows/motion-posters/build/stage.js missing: run npm run build:stage there");
  const F = STORY;
  const logos = Object.fromEntries(Object.entries(LOGOS).map(([k, l]) => { const h = F.logoW * l.ratio; return [k, { x: PAD, y: F.base - h, w: F.logoW, h }]; }));
  const layout = {
    type: { x: 44, y: F.type[0], w: F.w - 88, h: F.type[1] },
    window: { x: 0, y: F.window[0], w: F.w, h: F.window[1] },
    focus: [0, 1, F.window[0] / F.h, (F.window[0] + F.window[1]) / F.h],
    footer: { pad: PAD, logos, labelSize: F.labelSize, base: F.base, top: Math.min(...Object.values(logos).map((l) => l.y)) },
  };
  const manifest = JSON.parse(fs.readFileSync(path.join(DS, "3d/manifest.json"), "utf8"));
  const resolved = {
    start: 0, end: seconds, final: true, props: END_STAGE.props, actors: END_STAGE.actors,
    do: (END_STAGE.do ?? []).map(([m, w, t, p]) => [m, w, t, p]), fx: [], act: (END_STAGE.act ?? []).map(([a, w, t, o]) => [a, w, t, o]),
  };
  const beat = {
    index: 0, start: 0, end: seconds, set: "tableau", setKey: "tableau|end", cam: "pull-out", camStart: 0, rows: [], ground,
    tx: "iris", txDir: [1, 0], cues: [], last: true, cut: [0.5, 0.5, 0.56, 0.42], pop: 0.75, exit: Infinity, stage: END_STAGE,
    opts: { beats: [resolved], manifest, base: "/ds/3d/models", warm: WARM, fill: 1 },
  };
  const plan = { width: F.w, height: F.h, fps: FPS, warm: WARM, layout, look: LOOK, fonts: FONTS, grounds: GROUNDS, beats: [beat], maxRows: 0, label, signoff, logos: LOGOS };

  const browser = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  const ROOTS = { "/studio/": path.join(MP, "vendor/poster-studio"), "/build/": path.join(MP, "build"), "/src/": path.join(MP, "src"), "/repo/": REPO, "/ds/": DS };
  const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".ttf": "font/ttf", ".woff2": "font/woff2", ".png": "image/png", ".glb": "model/gltf-binary" };
  await page.route("http://mfk.local/**", (r) => {
    const u = decodeURIComponent(new URL(r.request().url()).pathname);
    if (u === "/render.html") return r.fulfill({ body: "<!doctype html><meta charset=utf-8>", contentType: "text/html" });
    const root = Object.keys(ROOTS).find((k) => u.startsWith(k)), file = root && path.join(ROOTS[root], u.slice(root.length));
    if (!file || !file.startsWith(ROOTS[root] + path.sep) || !fs.existsSync(file)) return r.fulfill({ status: 404 });
    r.fulfill({ path: file, contentType: TYPES[path.extname(file)] || "application/octet-stream" });
  });
  await page.goto("http://mfk.local/render.html");
  await page.evaluate(async () => { window.poster = await import("/src/page.mjs"); });
  await page.evaluate((p) => window.poster.init(p), plan);

  const frames = Math.round(seconds * FPS);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "slow", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, fail) => ff.on("close", (code) => (code ? fail(new Error(`ffmpeg ${code}`)) : ok())));
  for (let i = 0; i < frames; i++) {
    const url = await page.evaluate((n) => window.poster.frame(n), i);
    if (!ff.stdin.write(Buffer.from(url.split(",")[1], "base64"))) await new Promise((ok) => ff.stdin.once("drain", ok));
  }
  ff.stdin.end();
  await done;
  await browser.close();
  return { frames, ground: GROUNDS[ground] };
}

// Run directly: node src/end-card.mjs <ground> <seconds> <label> <out.mp4>
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [ground, seconds, label, out] = process.argv.slice(2);
  const r = await renderEndCard({ ground, seconds: Number(seconds), label, out: path.resolve(out) });
  console.log(`end card: ${r.frames} frames on ${ground} → ${out}`);
}
