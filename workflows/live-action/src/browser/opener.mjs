// Browser side: one frame of the opener, the headline in the Poster Studio's letters (Studio Sans, air mode)
// filling the frame. Rows squash up into place one after another, then keep the studio's elastic loop motion.
import { layoutTreatment, appendTreatmentArtwork } from "/studio/src/treatment.js";
import { drawPosterScene } from "/studio/src/scene.js";

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const backOut = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
const disc = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
let P, canvas, ctx;

export function init(p) {
  P = p;
  canvas = document.createElement("canvas");
  canvas.width = p.width; canvas.height = p.height;
  ctx = canvas.getContext("2d", { alpha: false });
  return true;
}

export function frame(i) {
  const t = i / P.fps, rect = P.rect;
  // P.settings: the studio's own treatment settings (style, contrast, pressure, variation) for this headline.
  const L = layoutTreatment(P.text, rect, "air", (t / P.loop) % 1, P.energy, { font: "original", layout: "stack", ...P.settings }, P.curve);
  const n = Math.max(1, L.cells.length - 1);
  L.cells = L.cells.filter((c) => {
    const start = c.row * P.rowGap + (c.index / n) * 0.18;
    const s = backOut(clamp((t - start) / P.inDur));
    const h = c.h; c.h = h * s; c.y += h - c.h;
    return c.h > 1.5;
  });
  for (const lr of L.rows) lr.cells = L.cells.filter((c) => c.row === lr.index);
  const scene = { width: P.width, height: P.height, background: "rgba(0,0,0,0)", ops: [] };
  appendTreatmentArtwork(scene, L, { fg: P.fg, bg: P.bg }, rect);
  // Studio Sans draws the stroke of "?" but not its dot: add the dot under the stroke.
  for (const c of L.cells.filter((c) => c.char === "?")) {
    const d = Math.min(c.h * 0.075, c.w * 0.32);
    scene.ops.push({ kind: "path", d: disc(c.x + c.w / 2, c.y + c.h + d * 0.2, d), fill: P.fg });
  }
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, P.width, P.height);
  drawPosterScene(ctx, scene);
  return canvas.toDataURL("image/png");
}
