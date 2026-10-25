// Runs inside the render page (headless Chrome). Composes one poster frame at a time:
//   1. the ground colour,
//   2. the 3D stage (build/stage.js: the makerfaire.in scenes), drawn in its window,
//   3. the beat's lettering, laid out by the Poster Studio's own layoutTreatment/appendTreatmentArtwork and
//      drawn by its drawPosterScene, squashing in and out of its row (the studio's elastic cells),
//   4. the slide's sentence in the look's text face, and the footer (logo + series label).
// render.mjs passes a plan (timeline, layout, look) to init() and calls frame(i) for every video frame.
import { layoutTreatment, appendTreatmentArtwork } from "/studio/src/treatment.js";
import { drawPosterScene } from "/studio/src/scene.js";
import * as stage from "/build/stage.js";

const STEPS = 200; // simulation steps per second (the website's DT = 1/200)
let plan, ctx, canvas, logo, current = null, fired = new Set(), textBottom = 0;

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeIn = (x) => x ** 3;
const backOut = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;

export async function init(p) {
  plan = p;
  fired = new Set();
  current = null;
  textBottom = 0;
  canvas = document.createElement("canvas");
  canvas.width = p.width;
  canvas.height = p.height;
  ctx = canvas.getContext("2d", { alpha: false });
  for (const f of p.fonts) document.fonts.add(await new FontFace(f.family, `url(${f.url})`, f.descriptors).load());
  logo = new Image();
  logo.src = p.logo.src;
  await logo.decode();
  return { ok: true };
}

/** The beat (and its lettering part) at time t. */
function at(t) {
  const beat = plan.beats.find((b) => t < b.end) ?? plan.beats.at(-1);
  const part = beat.parts.find((s) => t < s.end) ?? beat.parts.at(-1);
  return { beat, part };
}

async function useSet(beat) {
  const key = `${beat.set}|${JSON.stringify(beat.opts)}`;
  if (current === key) return;
  await stage.init({ set: beat.set, width: plan.width, height: plan.height, focus: plan.layout.focus, opts: beat.opts });
  stage.advance(Math.round(plan.warm * STEPS));
  current = key;
}

/** Letters for one lettering part: the studio's layout in the type rect, each cell squashed by its own clock. */
function letters(part, t, look, payoff) {
  // One word per row, as the studio sets portrait headlines, but a word of one or two characters shares its
  // neighbour's row: alone it would stretch across the whole row ("VERSION 1", "A MAGAZINE"). The studio always
  // breaks rows at spaces, so each word is laid out in its own share of the row.
  const rows = [];
  for (const w of part.text.split(/ +/)) {
    const prev = rows.at(-1);
    if (prev && (w.length <= 2 || (prev.length === 1 && prev[0].length <= 2))) prev.push(w);
    else rows.push([w]);
  }
  const chars = (row) => row.join("").length;
  // Rows share the band, but a long row stays no taller than its letters can be wide (no needle letters).
  const r = plan.layout.type, rowH = Math.min(r.h / rows.length, r.w / (Math.max(...rows.map(chars)) * 0.55));
  const gap = rowH * 0.2, phase = (t / 8) % 1;
  // A short word would stretch each letter wide across the whole band; cap the letter shape at about square.
  const width = Math.min(r.w, Math.max(...rows.map((row) => chars(row) * rowH * 1.05 + gap * (row.length - 1))));
  const words = [];
  rows.forEach((row, ri) => {
    let x = r.x;
    const unit = (width - gap * (row.length - 1)) / chars(row);
    for (const w of row) {
      words.push({ text: w, rect: { x, y: r.y + ri * rowH, w: unit * w.length, h: rowH } });
      x += unit * w.length + gap;
    }
  });
  const total = words.reduce((n, w) => n + w.text.length, 0), a = (t - part.start) / 0.45, z = (part.end - t) / 0.32;
  const colors = payoff && look.payoffPlate ? { fg: look.payoffFg, bg: look.payoffPlate } : { fg: payoff ? look.payoffFg : look.letters, bg: look.bg };
  const scene = { width: plan.width, height: plan.height, background: "rgba(0,0,0,0)", ops: [] };
  const laid = [], all = [];
  let index = 0;
  for (const w of words) {
    const L = layoutTreatment(w.text, w.rect, "air", phase, 1, { font: look.studioFont, layout: "stack" }, "smooth");
    L.cells = L.cells.filter((cell) => {
      const d = ((index + cell.index) / Math.max(1, total - 1)) * 0.45;
      const s = Math.min(backOut(clamp((a - d) / 0.55)), part.last ? 1 : easeOut(clamp((z - d * 0.5) / 0.55)));
      const h = cell.h;
      cell.h = h * s;
      cell.y += h - cell.h;
      return cell.h > 1.5;
    });
    for (const row of L.rows) row.cells = L.cells.filter((c) => c.row === row.index);
    index += w.text.length;
    laid.push({ L, rect: w.rect });
    all.push(...L.cells);
  }
  if (all.length && payoff && look.payoffPlate) {
    const pad = rowH * 0.12, x0 = Math.min(...all.map((c) => c.x)), x1 = Math.max(...all.map((c) => c.x + c.w));
    const y0 = Math.min(...all.map((c) => c.y)), y1 = Math.max(...all.map((c) => c.y + c.h));
    scene.ops.push({ kind: "rect", x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2, fill: look.payoffPlate });
  }
  for (const { L, rect } of laid) appendTreatmentArtwork(scene, L, colors, rect);
  // ~STRUCK~: a bar drawn through each row once the letters are in.
  const k = part.struck ? easeOut(clamp((t - part.start - 0.55) / 0.35)) * Math.min(1, z * 2) : 0;
  if (k > 0) rows.forEach((row, ri) => {
    const cells = all.filter((c) => c.y + c.h > r.y + ri * rowH && c.y < r.y + (ri + 1) * rowH);
    if (!cells.length) return;
    const x0 = Math.min(...cells.map((c) => c.x)), x1 = Math.max(...cells.map((c) => c.x + c.w));
    const cy = r.y + ri * rowH + rowH * 0.52, th = Math.max(8, rowH * 0.09);
    scene.ops.push({ kind: "rect", x: x0 - th, y: cy - th / 2, w: (x1 - x0 + th * 2) * k, h: th, fill: look.strike });
  });
  return scene;
}

/** The slide's sentence: *accent* in the label weight, ~struck~ with a line through, wrapped to the text rect. */
function sentence(beat, t, look) {
  const r = plan.layout.text, size = plan.layout.textSize, lh = size * 1.32;
  const alpha = (beat.index === 0 ? 1 : easeOut(clamp((t - beat.start - 0.15) / 0.35))) * (beat.last ? 1 : clamp((beat.end - t) / 0.25));
  if (alpha <= 0) return;
  const runs = [];
  for (const m of beat.line.matchAll(/(\*[^*]+\*|~[^~]+~|[^*~]+)/g)) {
    const s = m[0], style = s[0] === "*" ? "accent" : s[0] === "~" ? "struck" : "plain";
    const text = style === "plain" ? s : s.slice(1, -1);
    for (const w of text.split(/(?<= )/)) if (w) runs.push({ w, style });
  }
  const fontFor = (style) => `${style === "accent" ? look.textAccentWeight : look.textWeight} ${size}px "${look.textFamily}"`;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = look.text;
  ctx.textBaseline = "alphabetic";
  let x = r.x, y = r.y + size;
  for (const run of runs) {
    ctx.font = fontFor(run.style);
    const w = ctx.measureText(run.w).width, bare = ctx.measureText(run.w.trimEnd()).width;
    if (x > r.x && x + bare > r.x + r.w) { x = r.x; y += lh; }
    ctx.fillText(run.w, x, y);
    if (run.style === "struck") { ctx.fillStyle = look.strikeText; ctx.fillRect(x, y - size * 0.33, bare, Math.max(3, size * 0.08)); ctx.fillStyle = look.text; }
    x += w;
  }
  ctx.restore();
  textBottom = Math.max(textBottom, y + size * 0.3);
}

/** What QA reads back: the lowest the sentence has reached so far. */
export function stats() {
  return { textBottom };
}

function footer(look) {
  const f = plan.layout.footer;
  ctx.drawImage(logo, f.logo.x, f.logo.y, f.logo.w, f.logo.h);
  ctx.save();
  ctx.fillStyle = look.text;
  ctx.textAlign = "right";
  ctx.font = `${look.labelWeight} ${f.labelSize}px "${look.labelFamily}"`;
  const right = plan.width - f.pad;
  ctx.fillText(plan.label, right, f.logo.y + f.logo.h - f.labelSize * 1.45);
  ctx.fillText(plan.signoff, right, f.logo.y + f.logo.h);
  ctx.restore();
}

/** Draws frame i and returns it as a PNG data URL. */
export async function frame(i) {
  const t = i / plan.fps, look = plan.look;
  const { beat, part } = at(t);
  await useSet(beat);
  for (const c of beat.cues) {
    const id = `${beat.index}:${c.name}:${c.t}`;
    if (t >= c.t && !fired.has(id)) { fired.add(id); stage.cue(c.name, c.arg); }
  }
  stage.advance(Math.floor(((i + 1) * STEPS) / plan.fps) - Math.floor((i * STEPS) / plan.fps));
  stage.render();

  ctx.fillStyle = look.bg;
  ctx.fillRect(0, 0, plan.width, plan.height);
  const w = plan.layout.window;
  ctx.save();
  ctx.beginPath();
  ctx.rect(w.x, w.y, w.w, w.h);
  ctx.clip();
  ctx.drawImage(stage.canvas, 0, 0);
  ctx.restore();
  drawPosterScene(ctx, letters(part, t, look, beat.payoff));
  if (beat.line) sentence(beat, t, look);
  footer(look);
  return canvas.toDataURL("image/png");
}

/** Mean luminance spread in the stage window: a blank (failed) stage reads near zero. */
export function stageVariance() {
  const w = plan.layout.window, g = document.createElement("canvas");
  g.width = 64; g.height = 64;
  const c = g.getContext("2d");
  c.drawImage(stage.canvas, w.x, w.y, w.w, w.h, 0, 0, 64, 64);
  const d = c.getImageData(0, 0, 64, 64).data;
  let n = 0, sum = 0, sq = 0;
  for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 8) { const l = (d[k] + d[k + 1] + d[k + 2]) / 3; n++; sum += l; sq += l * l; }
  return { covered: n / 4096, spread: n ? Math.sqrt(sq / n - (sum / n) ** 2) : 0 };
}
