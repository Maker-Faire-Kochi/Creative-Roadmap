// Contact sheet: renders models restyled to the standard, one tile each, three-quarter orthographic view, so a
// reviewer (or the person picking CC0 models) can check them against 3d/STANDARD.md at a glance.
// usage: node 3d/tools/sheet.mjs --out=sheet.png [--cols=6] [--tile=320] (<file.glb> ... | --manifest [id ...] | --beams)
// Needs build/ds3d.js (npm run build) and Google Chrome.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const DS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const args = process.argv.slice(2);
const opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const out = path.resolve(opt("out", "sheet.png")), cols = +opt("cols", 6), tile = +opt("tile", 320);
const rest = args.filter((a) => !a.startsWith("--"));
const manifest = JSON.parse(fs.readFileSync(path.join(DS, "3d/manifest.json"), "utf8"));
let items;
if (args.includes("--beams")) {
  // The beam kit is procedural: its ids come from the bundle.
  items = ["beam-gesture", "beam-crank", "beam-frame-s", "beam-frame-m", "beam-frame-l", "beam-link"].map((id) => ({ label: id, url: "", spec: { id, file: "", height: 1 } }));
} else if (args.includes("--manifest")) {
  const ids = rest.length ? rest : Object.keys(manifest.models);
  items = ids.map((id) => ({ label: id, url: `/ds/3d/models/${manifest.models[id].file}`, spec: { id, ...manifest.models[id] } }));
} else {
  items = rest.map((f, i) => ({ label: path.basename(f, ".glb"), url: `/f/${i}/${path.basename(f)}`, file: path.resolve(f), spec: { id: path.basename(f, ".glb"), file: "", height: 1 } }));
}
if (!items.length) { console.error("Nothing to draw"); process.exit(2); }

const browser = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
page.on("console", (m) => (m.type() === "error" ? console.error(m.text()) : m.type() === "log" && console.log(m.text())));
await page.route("http://ds.local/**", (r) => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname);
  if (u === "/") return r.fulfill({ body: "<!doctype html><meta charset=utf-8>", contentType: "text/html" });
  let file = null;
  if (u.startsWith("/f/")) {
    // A model and the files it references (a colour atlas in Textures/), from the model's own folder.
    const [, , i, ...rest] = u.split("/"), it = items[+i];
    if (it) { const dir = path.dirname(it.file); file = path.join(dir, rest.join("/")); if (!file.startsWith(dir + path.sep)) file = null; }
  }
  else if (u.startsWith("/ds/")) { file = path.join(DS, u.slice(4)); if (!file.startsWith(DS + path.sep)) file = null; }
  if (!file || !fs.existsSync(file)) return r.fulfill({ status: 404 });
  r.fulfill({ path: file, contentType: file.endsWith(".js") ? "text/javascript" : file.endsWith(".png") ? "image/png" : "model/gltf-binary" });
});
await page.goto("http://ds.local/");
const dataUrl = await page.evaluate(async ({ items, cols, tile }) => {
  const ds = await import("/ds/build/ds3d.js");
  const THREE = ds.THREE ?? (await import("/ds/build/ds3d.js")).THREE;
  const rows = Math.ceil(items.length / cols), label = 34;
  const sheet = document.createElement("canvas");
  sheet.width = cols * tile; sheet.height = rows * (tile + label);
  const g = sheet.getContext("2d");
  g.fillStyle = "#F6F6F3"; g.fillRect(0, 0, sheet.width, sheet.height);
  const m = ds.createMaterials();
  for (let i = 0; i < items.length; i++) {
    const it = items[i], x = (i % cols) * tile, y = Math.floor(i / cols) * (tile + label);
    let text = it.label;
    try {
      const r = await ds.renderTile(it.url, it.spec, m, tile);
      g.drawImage(r.canvas, x, y);
      text += `  ${r.triangles}t  ${r.keys.join(" ")}`;
      console.log(`${it.label}: ${r.triangles} triangles, size ${r.size.join(" × ")} m (w × h × d), keys ${r.keys.join(" ")}${r.parts.length ? `, parts ${r.parts.join(" ")}` : ""}`);
    } catch (e) { text += `  ERROR ${e.message}`; }
    g.fillStyle = "#222"; g.font = "500 13px monospace"; g.fillText(text.slice(0, 44), x + 8, y + tile + 20);
  }
  return sheet.toDataURL("image/png");
}, { items: items.map(({ label, url, spec }) => ({ label, url, spec })), cols, tile });
fs.writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
await browser.close();
console.log(out);
