// Browser side: sets one subtitle card in the Poster Studio's letters (Studio Sans, air mode) on a transparent
// canvas, rows centred, one type size per card, and returns it as a PNG. Punctuation is drawn as fixed marks a
// letter stroke wide (Studio Sans draws nothing for "." and drops the dot of "?"), as in
// workflows/motion-posters/src/page.mjs.
import { layoutTreatment, appendTreatmentArtwork } from "/studio/src/treatment.js";
import { drawPosterScene } from "/studio/src/scene.js";
import { wrap } from "/x/wrap.mjs";

const CH = 0.74; // a Studio Sans letter's width over its height
const MARKS = new Set([".", ",", "’", "'"]);
const disc = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const tail = (cx, cy, r) => `M${cx + 0.98 * r} ${cy}L${cx + 0.25 * r} ${cy + 2.1 * r}L${cx - 0.55 * r} ${cy + 1.9 * r}L${cx - 0.3 * r} ${cy + 0.2 * r}Z`;
function mark(c) {
  const r = Math.min(c.h * 0.12, c.w * 0.7), cx = c.x + c.w / 2, low = c.y + c.h - r * 1.9, high = c.y + r;
  switch (c.char) {
    case ".": return [disc(cx, c.y + c.h - r, r)];
    case ",": return [disc(cx, low, r), tail(cx, low, r)];
    case "’": case "'": return [disc(cx, high, r), tail(cx, high, r)];
    default: return [];
  }
}

export function card({ text, color, maxW, maxH, maxRows, lead = 0.2, pad = 0.18 }) {
  const { rows, h } = wrap(text, { maxW, maxH, maxRows, ch: CH });
  const widths = rows.map((r) => r.length * CH * h);
  const W = Math.ceil(Math.max(...widths)), padY = Math.ceil(h * pad);
  const H = Math.ceil(rows.length * h + (rows.length - 1) * h * lead + padY * 2);
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const scene = { width: W, height: H, background: "rgba(0,0,0,0)", ops: [] }, colors = { fg: color, bg: "rgba(0,0,0,0)" };
  // Each word is laid out on its own, as workflows/motion-posters/src/page.mjs does: the studio's "stack" layout
  // puts every word of a string on its own line, which would squash a two-word row to half height.
  const words = [];
  rows.forEach((row, i) => {
    let x = (W - widths[i]) / 2;
    for (const w of row.split(" ")) {
      words.push({ text: w, rect: { x, y: padY + i * h * (1 + lead), w: w.length * CH * h, h } });
      x += (w.length + 1) * CH * h;
    }
  });
  words.forEach(({ text: word, rect }) => {
    const L = layoutTreatment(word, rect, "air", 0, 1, { font: "original", layout: "stack" }, "smooth");
    const dots = L.cells.filter((c) => MARKS.has(c.char));
    L.cells = L.cells.filter((c) => !dots.includes(c));
    for (const lr of L.rows) lr.cells = L.cells.filter((c) => c.row === lr.index);
    appendTreatmentArtwork(scene, L, colors, rect);
    for (const c of dots) for (const d of mark(c)) scene.ops.push({ kind: "path", d, fill: color });
    for (const c of L.cells.filter((c) => c.char === "?")) {
      const d = Math.min(c.h * 0.075, c.w * 0.32);
      scene.ops.push({ kind: "path", d: disc(c.x + c.w / 2, c.y + c.h + d * 0.2, d), fill: color });
    }
  });
  drawPosterScene(ctx, scene);
  return { png: canvas.toDataURL("image/png"), w: W, h: H, rows, size: h };
}
