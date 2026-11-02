// Runs inside the render page (headless Chrome). Composes one poster frame at a time:
//   1. the ground: the beat's colour, and in the transition looks the next colour coming in through a shape
//      (iris, wipe, shutter, rise) as the text changes; the footer (logo + labels) is drawn with each ground, so
//      the logo for a ground only ever sits on that ground;
//   2. the 3D stage (build/stage.js) in its window, with the beat's camera move;
//   3. the beat's lettering: the full sentence, one row per carousel line, laid out by the Poster Studio's own
//      layoutTreatment/appendTreatmentArtwork and drawn by its drawPosterScene; rows squash in one after another
//      and out together.
// The Weave looks (layout mode "weave") have no footer. A text-rich beat's sentence fills the canvas and its one
// object pops up in the middle: the letters make room for the object's measured footprint (all of its movement)
// in one graceful move, with the studio's own cut-out response above and below and a sideways parting, then hold
// still while it acts; the 3D is drawn over them as the studio draws a cut-out. Other beats are set as a band,
// the object in its own window, alternately on top and below. The logo comes only on the end card.
// render.mjs passes a plan (timeline, layout, look, grounds) to init() and calls frame(i) for every video frame.
import { layoutTreatment, appendTreatmentArtwork } from "/studio/src/treatment.js";
import { drawPosterScene } from "/studio/src/scene.js";
import { reactTypeToCutout, silhouetteFromPixels } from "/studio/src/cutout-response.js";
import * as stage from "/build/stage.js";

const STEPS = 200; // simulation steps per second (the website's DT = 1/200)
const IN = 0.45, OUT = 0.32, TX = 0.55, TX_LEAD = 0.15;
let lastHole = null;
const REACTION = 0.72; // how hard the letters give way to the object (the studio's default is 0.65)
let plan, ctx, canvas, logos = {}, current = null, fired = new Set(), extent = null, rowsCache = new Map(), framed = -1, mask = null;
/** Weave: each in-text beat's footprint, the room its object needs over its whole act (measure()). */
let footprints = new Map();

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
  framed = -1;
  lastHole = null;
  footprints = new Map();
  mask = document.createElement("canvas");
  mask.width = mask.height = 64;
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
const weave = () => plan.layout.mode === "weave";
/** A Weave beat whose object pops up inside the text (a text-rich beat); the others are set as a band. */
const inText = (beat) => weave() && beat.mode === "in-text";
/** A Weave band beat's rectangles: the type, the window and the end card's lockup, by placement. */
const bandOf = (beat) => plan.layout.bands[beat.place];
/** Where the beat's 3D sits, in pixels: the window (band looks and Weave band beats) or its hole in the text. */
const holeOf = (beat) => (!weave() ? plan.layout.window : inText(beat) ? beat.hole : beat.last ? bandOf(beat).endWindow : bandOf(beat).window);
/** Where the beat's letters go. */
const typeOf = (beat) => (!weave() ? plan.layout.type : inText(beat) ? plan.layout.type : beat.last ? bandOf(beat).endType : bandOf(beat).type);
const focusOf = (r) => [r.x / plan.width, (r.x + r.w) / plan.width, r.y / plan.height, (r.y + r.h) / plan.height];

/** A beat's set and options come as one key (render.mjs): a new key means a new stage, a cut. */
async function useSet(beat, t) {
  const key = beat.setKey;
  if (current === key) return;
  await stage.init({ set: beat.set, width: plan.width, height: plan.height, focus: focusOf(holeOf(beat)), opts: { ...beat.opts, t0: t } });
  stage.advance(Math.round(plan.warm * STEPS));
  current = key;
  framed = beat.index;
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
  if (inText(beat)) return layoutWeave(beat);
  const r = typeOf(beat), CH = plan.look.charWidth, GAP = 0.3, LEAD = 0.16;
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

/**
 * Weave rows: the sentence fills the whole type area, in two blocks that meet at the middle of the object's hole:
 * the first rows above it, the rest below (reading order kept). Its words (a stat on its own row) are broken into
 * the number of rows whose letters come closest to a pleasing width (ASPECT, width over height), and each row's
 * words share its full width by their letters. A row is never taller than keeps its letters MIN_ASPECT wide;
 * height left over in a block spreads its rows apart. Each block then gives way to the object on its own side
 * (see letters()): the studio's cut-out response squeezes the block above clear of the object's top and, mirrored,
 * the block below clear of its bottom, so the words wrap the object's live outline.
 */
const ASPECT = 0.8, MIN_ASPECT = 0.5;
function layoutWeave(beat) {
  const r = plan.layout.type, hole = beat.hole, gap = 0.025 * r.w;
  const words = beat.rows.flatMap((row) => row.words.map((w) => ({ ...w, t: row.t, stat: row.stat })));
  const chars = (ws) => ws.reduce((n, w) => n + w.text.length, 0);
  /** Splits the words into n rows of about equal letters (a stat word always alone). */
  const split = (n) => {
    const rows = [], target = chars(words) / n;
    let cur = [];
    for (const w of words) {
      if (cur.length && (w.stat || cur[0].stat || (chars(cur) + w.text.length / 2 > target && rows.length < n - 1))) { rows.push(cur); cur = []; }
      cur.push(w);
    }
    rows.push(cur);
    return rows;
  };
  let best = null;
  for (let n = 1; n <= Math.min(words.length, 9); n++) {
    const rows = split(n), h = r.h / rows.length;
    const score = rows.reduce((k, ws) => k + Math.abs(Math.log((r.w - gap * (ws.length - 1)) / chars(ws) / h / ASPECT)), 0) / rows.length;
    if (!best || score < best.score) best = { rows, score };
  }
  const rows = best.rows, mid = Math.min(r.y + r.h, Math.max(r.y, hole.y + hole.h / 2));
  const blocks = { above: { x: r.x, y: r.y, w: r.w, h: mid - r.y }, below: { x: r.x, y: mid, w: r.w, h: r.y + r.h - mid } };
  // Rows go above and below in proportion to the room on each side; with two rows or more, both sides get one.
  let nAbove = Math.round((rows.length * blocks.above.h) / r.h);
  if (rows.length > 1) nAbove = Math.min(rows.length - 1, Math.max(1, nAbove));
  const out = [];
  const place = (group, block, side) => {
    if (!group.length) return;
    const slot = block.h / group.length;
    let heights = group.map((ws) => Math.min(slot * (ws[0].stat ? 1.15 : 1), (r.w - gap * (ws.length - 1)) / chars(ws) / MIN_ASPECT));
    const sum = heights.reduce((a, b) => a + b, 0);
    if (sum > block.h) heights = heights.map((h) => (h * block.h) / sum);
    const spare = Math.max(0, block.h - heights.reduce((a, b) => a + b, 0)), between = group.length > 1 ? spare / (group.length - 1) : 0;
    // A lone row sits against the object (its far edge keeps the margin of open ground).
    let y = block.y + (group.length > 1 ? 0 : side === "above" ? spare : 0);
    group.forEach((ws, i) => {
      const rh = heights[i], per = (r.w - gap * (ws.length - 1)) / chars(ws), laid = [];
      let x = r.x;
      for (const w of ws) {
        laid.push({ ...w, rect: { x, y, w: per * w.text.length, h: rh } });
        x += per * w.text.length + gap;
      }
      const prev = out.at(-1);
      out.push({ words: laid, y, h: rh, side, block, t: ws[0].t + (prev && prev.t >= ws[0].t ? 0.12 : 0) });
      y += rh + between;
    });
  };
  place(rows.slice(0, nAbove), blocks.above, "above");
  place(rows.slice(nAbove), blocks.below, "below");
  rowsCache.set(beat.index, out);
  return out;
}

/**
 * How far the letters have made room (0 → 1): one graceful move as the object spawns (starting just before it
 * pops, quintic, no bounce), held still while it acts, and one move back as it leaves. The room is the object's
 * footprint, so nothing in the letters follows the object's own motion.
 */
function push(beat, t) {
  return smoother((t - (beat.pop - 0.15)) / 0.6) * (1 - smoother((t - beat.exit) / 0.45));
}

/**
 * The sideways push (ours, beside the studio's squeeze above and below): a row the object still crosses opens
 * round it. Its letters left of the object close up toward the left edge and those right of it toward the right
 * edge, squeezed in width, never hidden, in order. The object's width at the row comes from the same silhouette.
 */
function partRows(words, hole, outline, k, area) {
  const gap = 0.03 * area.w, x0 = area.x, x1 = area.x + area.w, n = outline.top.length;
  const rows = new Map();
  for (const wd of words) {
    if (!rows.has(wd.ri)) rows.set(wd.ri, []);
    rows.get(wd.ri).push(...wd.L.cells);
  }
  for (const cells of rows.values()) {
    if (!cells.length) continue;
    const ry0 = Math.min(...cells.map((c) => c.y)), ry1 = Math.max(...cells.map((c) => c.y + c.h)), pad = (ry1 - ry0) * 0.15;
    let ox0 = Infinity, ox1 = -Infinity;
    for (let i = 0; i < n; i++) {
      const top = outline.top[i];
      if (top === null) continue;
      const oy0 = hole.y + top * hole.h, oy1 = hole.y + (outline.bottom?.[i] ?? 1) * hole.h;
      if (oy0 < ry1 - pad && oy1 > ry0 + pad) { ox0 = Math.min(ox0, hole.x + (i / n) * hole.w); ox1 = Math.max(ox1, hole.x + ((i + 1) / n) * hole.w); }
    }
    if (ox0 > ox1) continue;
    const mid = (ox0 + ox1) / 2, left = cells.filter((c) => c.x + c.w / 2 < mid), right = cells.filter((c) => c.x + c.w / 2 >= mid);
    const l1 = Math.max(x0, ...left.map((c) => c.x + c.w)), r0 = Math.min(x1, ...right.map((c) => c.x));
    if (left.length && l1 > ox0 - gap) {
      const sc = 1 + (Math.max(0.15, (ox0 - gap - x0) / (l1 - x0)) - 1) * k;
      for (const c of left) { c.x = x0 + (c.x - x0) * sc; c.w *= sc; }
    }
    if (right.length && r0 < ox1 + gap) {
      const sc = 1 + (Math.max(0.15, (x1 - ox1 - gap) / (x1 - r0)) - 1) * k;
      for (const c of right) { const far = x1 - (c.x + c.w); c.w *= sc; c.x = x1 - far * sc - c.w; }
    }
  }
}

/** The object's outline in its hole, from the 3D just drawn: the studio's 48-column top and bottom contour. */
function silhouette(hole) {
  const g = mask.getContext("2d", { willReadFrequently: true });
  g.clearRect(0, 0, 64, 64);
  g.drawImage(stage.canvas, hole.x, hole.y, hole.w, hole.h, 0, 0, 64, 64);
  return silhouetteFromPixels(g.getImageData(0, 0, 64, 64).data, 64, 64);
}

/** Grows a footprint by the union with one silhouette (per column: the highest top, the lowest bottom). */
function unite(into, sil) {
  if (!into) return { top: [...sil.top], bottom: [...sil.bottom] };
  sil.top.forEach((top, i) => {
    if (top === null) return;
    into.top[i] = into.top[i] === null ? top : Math.min(into.top[i], top);
    into.bottom[i] = into.bottom[i] === null ? sil.bottom[i] : Math.max(into.bottom[i], sil.bottom[i]);
  });
  return into;
}

/** A footprint with a margin: one column wider each side and a little taller, so the letters clear it. */
function breathe(fp, pad = 0.03) {
  const n = fp.top.length, top = [], bottom = [];
  for (let i = 0; i < n; i++) {
    const near = [i - 1, i, i + 1].filter((j) => j >= 0 && j < n && fp.top[j] !== null);
    top.push(near.length ? Math.max(0, Math.min(...near.map((j) => fp.top[j])) - pad) : null);
    bottom.push(near.length ? Math.min(1, Math.max(...near.map((j) => fp.bottom[j])) + pad) : null);
  }
  return { top, bottom };
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
  // Pass 1: each word laid out by the studio in its rect, its letters squashed in or out by their own clock.
  const words = [];
  layoutRows(beat).forEach((row, ri) => {
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
      index += w.text.length;
      words.push({ w, row, ri, L });
    }
  });
  // Weave, in-text: the sentence makes room for the object's footprint, in two blocks (the studio's cut-out
  // response above and below; cells keep their own index and row for drawing, a block-wide pair for the
  // response), and the rows it crosses part sideways.
  const outline = inText(beat) ? footprints.get(beat.index) : null;
  if (outline && words.length) {
    const hole = beat.hole, k = push(beat, t);
    if (k > 0) {
      for (const side of ["above", "below"]) {
        const block = [], mine = words.filter((wd) => wd.row.side === side);
        if (!mine.length) continue;
        mine.forEach((wd) => wd.L.cells.forEach((c) => block.push({ ...c, index: block.length, row: wd.ri, word: wd, ownIndex: c.index, ownRow: c.row })));
        const reacted = reactTypeToCutout(block, hole, outline, mine[0].row.block, REACTION * k);
        mine.forEach((wd) => { wd.L.cells = []; });
        for (const c of reacted) c.word.L.cells.push({ ...c, index: c.ownIndex, row: c.ownRow, word: undefined });
      }
      partRows(words, hole, outline, k, plan.layout.type);
    }
  }
  // Pass 2: punctuation, accents, plates and strikes on the letters where they ended up.
  for (const { w, row, L } of words) {
    // Punctuation is set here, not by the studio: Studio Sans draws nothing for a full stop or a colon in its air
    // mode, and the font outlines (Dela) stretch a mark to the full row height ("THAT’S" reads "THATIS").
    const dots = L.cells.filter((c) => (look.studioFont === "original" ? STUDIO_MARKS : MARKS).has(c.char));
    if (dots.length) L.cells = L.cells.filter((c) => !dots.includes(c));
    for (const lr of L.rows) lr.cells = L.cells.filter((c) => c.row === lr.index);
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
      if (k > 0) strikes.push({ box, k, th: Math.max(8, (box.y1 - box.y0) * 0.09), cy: box.y0 + (box.y1 - box.y0) * 0.52 });
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
function footer(groundName, beat) {
  const g = plan.grounds[groundName];
  // Weave: no footer while the story runs; the end card carries the lockup alone, below the letters.
  if (weave()) {
    if (!beat.last) return;
    const l = bandOf(beat).endLogos[g.logo];
    ctx.drawImage(logos[g.logo], l.x, l.y, l.w, l.h);
    return;
  }
  const f = plan.layout.footer, l = f.logos[g.logo];
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

function ground(name, beat) {
  ctx.fillStyle = plan.grounds[name].bg;
  ctx.fillRect(0, 0, plan.width, plan.height);
  footer(name, beat);
}

/** The shape the incoming ground shows through, at progress k (0 → 1). */
function txShape(beat, k) {
  const W = plan.width, H = plan.height, w = holeOf(beat);
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
    ground(beat.ground, beat);
    ctx.save(); txShape(next, kn); ground(next.ground, next); ctx.restore();
  } else if (k < 1) {
    ground(prev.ground, prev);
    ctx.save(); txShape(beat, k); ground(beat.ground, beat); ctx.restore();
  } else ground(beat.ground, beat);
}

/** Moves the 3D on to frame i and draws it: the beat's stage, its cues, its framing, one frame of simulation. */
async function step(i) {
  const t = i / plan.fps, beat = beatAt(t);
  await useSet(beat, t);
  const edgesId = `edges:${beat.index}`;
  if (beat.set === "tableau" && !fired.has(edgesId)) { fired.add(edgesId); stage.cue("edges", plan.grounds[beat.ground].edges); }
  for (const c of beat.cues) {
    const id = `${beat.index}:${c.name}:${c.t}`;
    if (t >= c.t && !fired.has(id)) { fired.add(id); stage.cue(c.name, c.arg); }
  }
  // Weave: every beat has its own hole or window; the scene re-frames its object into it.
  if (weave() && framed !== beat.index) { stage.reframe(focusOf(holeOf(beat))); framed = beat.index; }
  stage.advance(Math.floor(((i + 1) * STEPS) / plan.fps) - Math.floor((i * STEPS) / plan.fps));
  stage.render(beat.cam, t - beat.camStart);
  return { t, beat };
}

/**
 * Weave: runs the poster's 3D once, alone, and measures each in-text beat's footprint: the union of its
 * object's silhouettes from the pop to the exit, with a margin. The letters then make room for all of the
 * object's movement at once, and never follow it. The stage is reset afterwards, so the real pass starts clean.
 */
export async function measure(frames) {
  if (!weave()) return { beats: 0 };
  const shapes = new Map();
  for (let i = 0; i < frames; i++) {
    const { t, beat } = await step(i);
    if (inText(beat) && t >= beat.pop && t <= beat.exit && i % 2 === 0) shapes.set(beat.index, unite(shapes.get(beat.index), silhouette(beat.hole)));
  }
  footprints = new Map([...shapes].map(([k, fp]) => [k, breathe(fp)]));
  current = null;
  fired = new Set();
  framed = -1;
  return { beats: footprints.size };
}

/** The top of the footer zone the 3D may not enter (the lockup and labels, with some air), or null if none. */
function guardTop(beat) {
  const AIR = 24;
  if (weave()) return beat.last ? Math.min(...Object.values(bandOf(beat).endLogos).map((l) => l.y)) - AIR : null;
  const f = plan.layout.footer;
  return Math.min(f.top, f.base - f.labelSize * 2.6) - AIR;
}

/** Draws frame i and returns it as a PNG data URL. */
export async function frame(i) {
  const { t, beat } = await step(i);
  drawGround(beat, t);
  if (inText(beat)) {
    // As the studio draws a cut-out: the letters (making room for the object), then the object over them.
    drawPosterScene(ctx, letters(beat, t));
    ctx.drawImage(stage.canvas, 0, 0);
  } else {
    // The object is framed into its window, but never clipped to it: the letters first, then the 3D over
    // everything, so a lamp's glow, a pop's overshoot or an exit is never cut at the window's edge.
    // The one exception is the footer: the 3D never passes over the logo lockup or its labels (AGENTS.md).
    drawPosterScene(ctx, letters(beat, t));
    const gy = guardTop(beat);
    ctx.save();
    if (gy !== null) { ctx.beginPath(); ctx.rect(0, 0, plan.width, gy); ctx.clip(); }
    ctx.drawImage(stage.canvas, 0, 0);
    ctx.restore();
  }
  lastHole = holeOf(beat);
  return canvas.toDataURL("image/png");
}

/** What QA reads back: how far the letters have reached (they must stay inside the type band). */
export function stats() {
  const e = extent;
  extent = null;
  return { letters: e };
}

/** Luminance spread where the 3D sits (the window, or the hole): a blank (failed) stage reads near zero. */
export function stageVariance() {
  const w = lastHole ?? plan.layout.window, g = document.createElement("canvas");
  g.width = 64; g.height = 64;
  const c = g.getContext("2d");
  c.drawImage(stage.canvas, w.x, w.y, w.w, w.h, 0, 0, 64, 64);
  const d = c.getImageData(0, 0, 64, 64).data;
  let n = 0, sum = 0, sq = 0;
  for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 8) { const l = (d[k] + d[k + 1] + d[k + 2]) / 3; n++; sum += l; sq += l * l; }
  return { covered: n / 4096, spread: n ? Math.sqrt(sq / n - (sum / n) ** 2) : 0 };
}
