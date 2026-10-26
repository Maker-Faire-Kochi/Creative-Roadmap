// Runs inside the render page (headless Chrome). Composes one poster frame at a time:
//   1. the ground: the beat's colour, and in the transition looks the next colour coming in through a shape
//      (iris, wipe, shutter, rise) as the text changes; the footer (logo + labels) is drawn with each ground, so
//      the logo for a ground only ever sits on that ground;
//   2. the 3D stage (build/stage.js) in its window, with the beat's camera move;
//   3. the beat's lettering: the full sentence, one row per carousel line, laid out by the Poster Studio's own
//      layoutTreatment/appendTreatmentArtwork and drawn by its drawPosterScene; rows squash in one after another
//      and out together.
// render.mjs passes a plan (timeline, layout, look, grounds) to init() and calls frame(i) for every video frame.
import { layoutTreatment, appendTreatmentArtwork } from "/studio/src/treatment.js";
import { drawPosterScene } from "/studio/src/scene.js";
import * as stage from "/build/stage.js";

const STEPS = 200; // simulation steps per second (the website's DT = 1/200)
const IN = 0.45, OUT = 0.32, TX = 0.55, TX_LEAD = 0.15;
let plan, ctx, canvas, logos = {}, current = null, fired = new Set(), extent = null, rowsCache = new Map();

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOut = (x) => 1 - (1 - x) ** 3;
const smoother = (x) => { const t = clamp(x); return t * t * t * (t * (t * 6 - 15) + 10); };
const backOut = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;

export async function init(p) {
  plan = p;
  fired = new Set();
  current = null;
  extent = null;
  rowsCache = new Map();
  canvas = document.createElement("canvas");
  canvas.width = p.width;
  canvas.height = p.height;
  ctx = canvas.getContext("2d", { alpha: false });
  for (const f of p.fonts) document.fonts.add(await new FontFace(f.family, `url(${f.url})`, f.descriptors).load());
  for (const [k, l] of Object.entries(p.logos)) {
    logos[k] = new Image();
    logos[k].src = l.src;
    await logos[k].decode();
  }
  return { ok: true };
}

const beatAt = (t) => plan.beats.find((b) => t < b.end) ?? plan.beats.at(-1);

/** A beat's set and options come as one key (render.mjs): a new key means a new stage, a cut. */
async function useSet(beat, t) {
  const key = beat.setKey;
  if (current === key) return;
  await stage.init({ set: beat.set, width: plan.width, height: plan.height, focus: plan.layout.focus, opts: { ...beat.opts, t0: t } });
  stage.advance(Math.round(plan.warm * STEPS));
  current = key;
  fired = new Set([...fired].filter((id) => !id.startsWith("edges")));
}

// ── Lettering ────────────────────────────────────────────────────────────────
/**
 * Row and word rectangles for a beat: one type size for the whole sentence (a stat row larger), as big as the
 * band's height and its widest row allow; rows set from the band's top, ragged right. Carousel lines are the
 * rows, re-broken where a long line would keep the type small.
 */
function layoutRows(beat) {
  if (rowsCache.has(beat.index)) return rowsCache.get(beat.index);
  const r = plan.layout.type, CH = plan.look.charWidth, GAP = 0.3, LEAD = 0.16;
  const weight = (row) => (row.stat ? 1.7 : 1);
  const units = (row) => row.words.reduce((n, w) => n + w.text.length * CH, 0) + GAP * (row.words.length - 1);
  const size = (rows) => {
    let h = r.h / (rows.reduce((n, row) => n + weight(row), 0) + LEAD * (rows.length - 1));
    for (const row of rows) h = Math.min(h, r.w / (units(row) * weight(row)));
    return h;
  };
  // Re-break: while the widest row is what keeps the type small, split it at the word boundary that balances its
  // halves (reading order kept; the second half comes in just after the first), up to MAX_ROWS rows.
  let rows = beat.rows.map((row) => ({ ...row }));
  while (rows.length < plan.maxRows) {
    const h = size(rows), wi = rows.reduce((best, row, i) => (units(row) * weight(row) > units(rows[best]) * weight(rows[best]) ? i : best), 0);
    const row = rows[wi];
    if (row.words.length < 2) break;
    let cut = 1, diff = Infinity;
    for (let k = 1; k < row.words.length; k++) {
      const d = Math.abs(units({ words: row.words.slice(0, k) }) - units({ words: row.words.slice(k) }));
      if (d < diff) { diff = d; cut = k; }
    }
    const next = [...rows.slice(0, wi), { ...row, words: row.words.slice(0, cut) }, { ...row, words: row.words.slice(cut), t: row.t + 0.15, stat: false }, ...rows.slice(wi + 1)];
    if (size(next) < h * 1.08) break;
    rows = next;
  }
  const h = size(rows);
  let y = r.y;
  const out = rows.map((row) => {
    const rh = h * weight(row), words = [];
    let x = r.x;
    for (const w of row.words) {
      const ww = w.text.length * CH * rh;
      words.push({ ...w, rect: { x, y, w: ww, h: rh } });
      x += ww + GAP * rh;
    }
    const laid = { words, y, h: rh, t: row.t };
    y += rh + LEAD * h;
    return laid;
  });
  rowsCache.set(beat.index, out);
  return out;
}

// ── Punctuation marks ─────────────────────────────────────────────────────────
const STUDIO_MARKS = new Set([".", ":"]);
/** Studio Sans draws the strokes of these but drops their dots: the dot is added under the stroke. */
const STUDIO_DOTTED = new Set(["?", "!"]);
const MARKS = new Set([".", ":", ";", ",", "’", "'", "‘", "“", "”", '"']);
const disc = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
/** A comma's tail hanging from a dot at (cx, cy); flip turns it over (an opening quote). */
const tail = (cx, cy, r, flip = false) => {
  const k = flip ? -1 : 1, f = (x, y) => `${cx + x * r * k} ${cy + y * r * k}`;
  return `M${f(0.98, 0)}L${f(0.25, 2.1)}L${f(-0.55, 1.9)}L${f(-0.3, 0.2)}Z`;
};
/** Paths for a punctuation cell: dots and comma shapes a letter stroke wide, at the baseline or the cap line. */
export function mark(c, scale = 1) {
  const r = Math.min(c.h * 0.12 * scale, c.w * 0.7), cx = c.x + c.w / 2, low = c.y + c.h - r * 1.9, high = c.y + r;
  switch (c.char) {
    case ".": return [disc(cx, c.y + c.h - r, r)];
    // Under a Studio Sans stroke: smaller, and a little below the baseline, clear of the stroke's end.
    case "?": case "!": { const d = Math.min(c.h * 0.12, c.w * 0.6); return [disc(cx, c.y + c.h + d * 0.35, d)]; }
    case ":": return [disc(cx, c.y + c.h * 0.36, r), disc(cx, c.y + c.h - r, r)];
    case ";": return [disc(cx, c.y + c.h * 0.36, r), disc(cx, low, r), tail(cx, low, r)];
    case ",": return [disc(cx, low, r), tail(cx, low, r)];
    case "’": case "'": return [disc(cx, high, r), tail(cx, high, r)];
    case "‘": return [disc(cx, high + r * 1.2, r), tail(cx, high + r * 1.2, r, true)];
    case "”": case '"': return [disc(cx - r * 1.3, high, r), tail(cx - r * 1.3, high, r), disc(cx + r * 1.3, high, r), tail(cx + r * 1.3, high, r)];
    case "“": return [disc(cx - r * 1.3, high + r * 1.2, r), tail(cx - r * 1.3, high + r * 1.2, r, true), disc(cx + r * 1.3, high + r * 1.2, r), tail(cx + r * 1.3, high + r * 1.2, r, true)];
    default: return [];
  }
}

function letters(beat, t) {
  const g = plan.grounds[beat.ground], look = plan.look, phase = (t / 8) % 1;
  const scene = { width: plan.width, height: plan.height, background: "rgba(0,0,0,0)", ops: [] };
  const plates = [], strikes = [], artwork = [];
  const out = beat.last ? 1 : (beat.end - t) / OUT;
  for (const row of layoutRows(beat)) {
    const n = row.words.reduce((k, w) => k + w.text.length, 0);
    let index = 0;
    for (const w of row.words) {
      const L = layoutTreatment(w.text, w.rect, "air", phase, 1, { font: look.studioFont, layout: "stack" }, "smooth");
      L.cells = L.cells.filter((cell) => {
        const d = ((index + cell.index) / Math.max(1, n - 1)) * 0.25;
        const s = Math.min(backOut(clamp((t - row.t - d) / IN)), easeOut(clamp(out - d * 0.5)));
        const h = cell.h;
        cell.h = h * s;
        cell.y += h - cell.h;
        return cell.h > 1.5;
      });
      // Punctuation is set here, not by the studio: Studio Sans draws nothing for a full stop or a colon in its air
      // mode, and the font outlines (Dela) stretch a mark to the full row height ("THAT’S" reads "THATIS").
      const dots = L.cells.filter((c) => (look.studioFont === "original" ? STUDIO_MARKS : MARKS).has(c.char));
      if (dots.length) L.cells = L.cells.filter((c) => !dots.includes(c));
      for (const lr of L.rows) lr.cells = L.cells.filter((c) => c.row === lr.index);
      index += w.text.length;
      const shown = [...L.cells, ...dots];
      if (!shown.length) continue;
      const box = {
        x0: Math.min(...shown.map((c) => c.x)), x1: Math.max(...shown.map((c) => c.x + c.w)),
        y0: Math.min(...shown.map((c) => c.y)), y1: Math.max(...shown.map((c) => c.y + c.h)),
      };
      extent = extent ? { x0: Math.min(extent.x0, box.x0), x1: Math.max(extent.x1, box.x1), y0: Math.min(extent.y0, box.y0), y1: Math.max(extent.y1, box.y1) } : box;
      // Accent: a plate in the letters' colour with the letters in the ground's (Noise looks), or the ground's
      // accent colour. Struck: a bar through the word once its letters are in.
      const plate = w.accent && look.plates;
      if (plate) plates.push({ box, pad: row.h * 0.1 });
      const colors = { fg: plate ? g.bg : w.accent ? g.accent : g.fg, bg: plate ? g.fg : g.bg };
      artwork.push({ L, rect: w.rect, colors });
      for (const c of dots) for (const d of mark(c, look.markScale)) artwork.push({ d, colors });
      if (look.studioFont === "original") for (const c of L.cells.filter((cell) => STUDIO_DOTTED.has(cell.char))) for (const d of mark(c)) artwork.push({ d, colors });
      if (w.struck) {
        const k = easeOut(clamp((t - row.t - 0.55) / 0.35)) * Math.min(1, out * 2);
        if (k > 0) strikes.push({ box, k, th: Math.max(8, row.h * 0.09), cy: row.y + row.h * 0.52 });
      }
    }
  }
  for (const p of plates) scene.ops.push({ kind: "rect", x: p.box.x0 - p.pad, y: p.box.y0 - p.pad, w: p.box.x1 - p.box.x0 + p.pad * 2, h: p.box.y1 - p.box.y0 + p.pad * 2, fill: g.fg });
  for (const a of artwork) {
    if (a.d) scene.ops.push({ kind: "path", d: a.d, fill: a.colors.fg });
    else appendTreatmentArtwork(scene, a.L, a.colors, a.rect);
  }
  for (const s of strikes) scene.ops.push({ kind: "rect", x: s.box.x0 - s.th, y: s.cy - s.th / 2, w: (s.box.x1 - s.box.x0 + s.th * 2) * s.k, h: s.th, fill: look.plates ? g.bg : g.strike });
  return scene;
}

// ── Ground, transitions and footer ───────────────────────────────────────────
function footer(groundName) {
  const g = plan.grounds[groundName], f = plan.layout.footer, l = f.logos[g.logo];
  ctx.drawImage(logos[g.logo], l.x, l.y, l.w, l.h);
  ctx.save();
  ctx.fillStyle = g.fg;
  ctx.textAlign = "right";
  ctx.font = `${plan.look.labelWeight} ${f.labelSize}px "${plan.look.labelFamily}"`;
  const right = plan.width - f.pad, base = f.base;
  ctx.fillText(plan.label, right, base - f.labelSize * 1.45);
  ctx.fillText(plan.signoff, right, base);
  ctx.restore();
}

function ground(name) {
  ctx.fillStyle = plan.grounds[name].bg;
  ctx.fillRect(0, 0, plan.width, plan.height);
  footer(name);
}

/** The shape the incoming ground shows through, at progress k (0 → 1). */
function txShape(beat, k) {
  const W = plan.width, H = plan.height, w = plan.layout.window;
  ctx.beginPath();
  switch (beat.tx) {
    case "iris": {
      const cx = w.x + w.w / 2, cy = w.y + w.h / 2;
      const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
      ctx.arc(cx, cy, Math.max(0.01, R * k), 0, Math.PI * 2);
      break;
    }
    case "wipe": {
      const [dx, dy] = beat.txDir ?? [1, 0];
      if (dy) { const hh = H * k; ctx.rect(0, dy > 0 ? 0 : H - hh, W, hh); }
      else { const ww = W * k; ctx.rect(dx >= 0 ? 0 : W - ww, 0, ww, H); }
      break;
    }
    case "shutter": {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const ki = smoother(k * 1.6 - i * 0.15), ww = W * ki;
        ctx.rect(i % 2 ? W - ww : 0, (i * H) / n, ww, H / n + 1);
      }
      break;
    }
    default: { // rise: the colour grows out of the letter rows
      const rows = layoutRows(beat);
      for (const row of rows) {
        const cy = row.y + row.h / 2, hh = H * smoother(k * 1.2);
        ctx.rect(0, cy - hh, W, hh * 2);
      }
    }
  }
  ctx.clip();
}

function drawGround(beat, t) {
  const prev = plan.beats[beat.index - 1];
  const k = prev && prev.ground !== beat.ground ? smoother((t - (beat.start - TX_LEAD)) / TX) : 1;
  // Before the boundary the outgoing beat is still current; its successor's colour may already be coming in.
  const next = plan.beats[beat.index + 1];
  const kn = next && next.ground !== beat.ground ? smoother((t - (next.start - TX_LEAD)) / TX) : 0;
  if (kn > 0) {
    ground(beat.ground);
    ctx.save(); txShape(next, kn); ground(next.ground); ctx.restore();
  } else if (k < 1) {
    ground(prev.ground);
    ctx.save(); txShape(beat, k); ground(beat.ground); ctx.restore();
  } else ground(beat.ground);
}

/** Draws frame i and returns it as a PNG data URL. */
export async function frame(i) {
  const t = i / plan.fps, beat = beatAt(t);
  await useSet(beat, t);
  const edgesId = `edges:${beat.index}`;
  if (beat.set === "tableau" && !fired.has(edgesId)) { fired.add(edgesId); stage.cue("edges", plan.grounds[beat.ground].edges); }
  for (const c of beat.cues) {
    const id = `${beat.index}:${c.name}:${c.t}`;
    if (t >= c.t && !fired.has(id)) { fired.add(id); stage.cue(c.name, c.arg); }
  }
  stage.advance(Math.floor(((i + 1) * STEPS) / plan.fps) - Math.floor((i * STEPS) / plan.fps));
  stage.render(beat.cam, t - beat.camStart);

  drawGround(beat, t);
  const w = plan.layout.window;
  ctx.save();
  ctx.beginPath();
  ctx.rect(w.x, w.y, w.w, w.h);
  ctx.clip();
  ctx.drawImage(stage.canvas, 0, 0);
  ctx.restore();
  drawPosterScene(ctx, letters(beat, t));
  return canvas.toDataURL("image/png");
}

/** What QA reads back: how far the letters have reached (they must stay inside the type band). */
export function stats() {
  const e = extent;
  extent = null;
  return { letters: e };
}

/** Luminance spread in the stage window: a blank (failed) stage reads near zero. */
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
