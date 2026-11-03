// Studio Sans specimen (design-system/type/studio-sans.md): every glyph the motion posters set, in the studio's
// own air mode, with the full stop and colon drawn as the posters draw them.
// usage: node src/specimen-studio-sans.mjs   → output/studio-sans-specimen.png (git-ignored)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(PKG, "../..");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const out = path.join(REPO, "output/studio-sans-specimen.png");
const ROOTS = { "/studio/": path.join(PKG, "vendor/poster-studio"), "/src/": path.join(PKG, "src"), "/build/": path.join(PKG, "build") };

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.route("http://mfk.local/**", (r) => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname);
  if (u === "/") return r.fulfill({ body: "<!doctype html><meta charset=utf-8>", contentType: "text/html" });
  const root = Object.keys(ROOTS).find((k) => u.startsWith(k)), file = root && path.join(ROOTS[root], u.slice(root.length));
  if (!file || !fs.existsSync(file)) return r.fulfill({ status: 404 });
  r.fulfill({ path: file, contentType: "text/javascript" });
});
await page.goto("http://mfk.local/");
const url = await page.evaluate(async () => {
  const { layoutTreatment, appendTreatmentArtwork } = await import("/studio/src/treatment.js");
  const { drawPosterScene } = await import("/studio/src/scene.js");
  const { mark } = await import("/src/page.mjs");
  const lines = ["ABCDEFGHIJKLM", "NOPQRSTUVWXYZ", "0123456789", "& ! ? - / = +", "’ “ ” , . :", "DIDN’T WORK.", "MAKE: BROUGHT"];
  const W = 1600, rowH = 150, pad = 60, c = document.createElement("canvas");
  c.width = W; c.height = pad * 2 + lines.length * rowH * 1.2 + 60;
  const g = c.getContext("2d");
  g.fillStyle = "#F6F6F3"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#222"; g.font = "500 22px monospace"; g.fillText("STUDIO SANS · POSTER STUDIO (MIT) · AIR MODE", pad, pad - 10);
  lines.forEach((line, i) => {
    const y = pad + 30 + i * rowH * 1.2, scene = { width: W, height: c.height, background: "rgba(0,0,0,0)", ops: [] };
    let x = pad;
    for (const word of line.split(" ")) {
      const rect = { x, y, w: word.length * 0.74 * rowH, h: rowH };
      const L = layoutTreatment(word, rect, "air", 0, 1, { font: "original", layout: "stack" }, "smooth");
      const marks = L.cells.filter((cell) => cell.char === "." || cell.char === ":");
      L.cells = L.cells.filter((cell) => !marks.includes(cell));
      marks.push(...L.cells.filter((cell) => cell.char === "?" || cell.char === "!"));
      for (const r of L.rows) r.cells = L.cells.filter((cell) => cell.row === r.index);
      appendTreatmentArtwork(scene, L, { fg: "#222222", bg: "#F6F6F3" }, rect);
      for (const m of marks) for (const d of mark(m)) scene.ops.push({ kind: "path", d, fill: "#ED1C24" });
      x += rect.w + rowH * 0.3;
    }
    drawPosterScene(g, scene);
  });
  return c.toDataURL("image/png");
});
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
await browser.close();
console.log(path.relative(REPO, out));
