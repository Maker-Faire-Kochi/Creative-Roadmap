// Browser side of the Studio track (src/studio.mjs): draws one carousel slide on a canvas.
// Lettering after the Poster Studio's art direction ("the lettering is the artwork"): one size per slide, as large
// as the band allows, rows from the top, ragged right. Latin runs are set by the studio's own engine (Studio Sans,
// air mode, unmodified); Malayalam runs in Baloo Chettan 2 ExtraBold, sized so their letter body matches the Studio
// Sans row and sitting on the same baseline. Malayalam outlines are never stretched.
import { layoutTreatment, appendTreatmentArtwork } from "/studio/src/treatment.js";
import { drawPosterScene } from "/studio/src/scene.js";

const CH = 0.74, GAP = 0.32, LEAD = 0.16; // Studio Sans letter width / row height; word gap; row gap (tight; Malayalam signs hang into it)
const ML_RE = /[ഀ-ൿ‌‍]/;
const MARKS = new Set([".", ",", ":", "’", "'"]);
let ctx, canvas, logos = {}, mlBody = 1;

const disc = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const tail = (cx, cy, r) => `M${cx + 0.98 * r} ${cy}L${cx + 0.25 * r} ${cy + 2.1 * r}L${cx - 0.55 * r} ${cy + 1.9 * r}L${cx - 0.3 * r} ${cy + 0.2 * r}Z`;
/** Punctuation the studio's air mode doesn't draw, as marks a letter stroke wide (workflows/motion-posters/src/page.mjs). */
function mark(c) {
  const r = Math.min(c.h * 0.11, c.w * 0.7), cx = c.x + c.w / 2, low = c.y + c.h - r * 1.9, high = c.y + r;
  switch (c.char) {
    case ".": return [disc(cx, c.y + c.h - r, r)];
    case ",": return [disc(cx, low, r), tail(cx, low, r)];
    case ":": return [disc(cx, c.y + c.h * 0.36, r), disc(cx, c.y + c.h - r, r)];
    case "’": case "'": return [disc(cx, high, r), tail(cx, high, r)];
    default: return [];
  }
}

export async function init(p) {
  for (const f of p.fonts) document.fonts.add(await new FontFace(f.family, `url(${f.url})`, f.descriptors ?? {}).load());
  for (const [k, src] of Object.entries(p.logos)) { logos[k] = new Image(); logos[k].src = src; await logos[k].decode(); }
  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  // Baloo's letter body (the height of ന) per pixel of font size: a Malayalam run at row height h is set at
  // h * BODY / mlBody px so its body fills BODY of the row, like a Studio Sans letter fills the row.
  ctx.font = '800 100px "Baloo Chettan 2"';
  const m = ctx.measureText("നമ");
  mlBody = (m.actualBoundingBoxAscent + 0) / 100;
  return { mlBody, fonts: ["Baloo Chettan 2", "IBM Plex Mono", "Noto Sans Malayalam"].map((f) => document.fonts.check(`800 40px "${f}"`) || document.fonts.check(`500 40px "${f}"`)) };
}

/** Splits a line into words, each word into runs of one script, with *accent* and ~strike~ marks carried. */
function parse(line) {
  const words = [];
  let accent = false, strike = false;
  for (const raw of line.split(/\s+/).filter(Boolean)) {
    let t = raw, a0 = accent, s0 = strike;
    if (t.startsWith("*")) { a0 = accent = true; t = t.slice(1); }
    if (t.startsWith("~")) { s0 = strike = true; t = t.slice(1); }
    const endA = t.endsWith("*") || /\*[.,?:!]?$/.test(t), endS = t.endsWith("~") || /~[.,?:!]?$/.test(t);
    t = t.replace(/[*~]/g, "").replace(/…/g, "..."); // Studio Sans has no ellipsis: three full stops
    const runs = [];
    for (const ch of t) {
      // Punctuation after a Malayalam word stays with it (no word-sized gap before a full stop).
      const ml = ML_RE.test(ch) || (MARKS.has(ch) && runs.length > 0 && runs.at(-1).ml);
      if (runs.length && runs.at(-1).ml === ml) runs.at(-1).text += ch;
      else runs.push({ ml, text: ch });
    }
    words.push({ runs, accent: a0, strike: s0 });
    if (endA) accent = false;
    if (endS) strike = false;
  }
  return words;
}

const mlSize = (h) => (h * 0.6) / mlBody; // Baloo font size whose letter body is 0.6 of the row (Studio Sans caps fill it)
/** A run's width at row height h. */
function runWidth(run, h, cw = CH) {
  if (!run.ml) return [...run.text].reduce((n, ch) => n + (MARKS.has(ch) ? 0.3 : cw), 0) * h;
  ctx.font = `800 ${mlSize(h)}px "Baloo Chettan 2"`;
  return ctx.measureText(run.text).width;
}
const wordWidth = (w, h, cw) => w.runs.reduce((n, r) => n + runWidth(r, h, cw), 0);
const lineWidth = (ws, h, cw) => ws.reduce((n, w) => n + wordWidth(w, h, cw), 0) + GAP * h * (ws.length - 1);
const CH_MIN = 0.4; // how narrow a Studio Sans letter may get (width / height) when a Latin row grows tall

/**
 * Draws one slide. p: { width, height, ground: { bg, fg, accent, logo }, band: { x, y, w, h }, slide, footer, label,
 *   asset?: PNG data URL (a trimmed 3D still, studio-stills.mjs), assetSize, textShare, gap, minAsset, signoff?: bool }
 * With an asset the lettering keeps to the top textShare of the band and the still fills the room left under it;
 * the sign-off (last slide) carries the square lockup, with the still beside it. Returns { png, size, issues }.
 */
export async function slide(p) {
  const { width: W, height: H, ground: g } = p;
  const band = p.asset ? { ...p.band, h: p.band.h * p.textShare } : p.band;
  let textBottom = band.y;
  canvas.width = W; canvas.height = H;
  ctx.fillStyle = g.bg; ctx.fillRect(0, 0, W, H);
  const issues = [];
  const scene = { width: W, height: H, background: "rgba(0,0,0,0)", ops: [] };
  let size = 0;

  if (p.slide.stat) {
    // A stat: the numeral as large as the band's upper part allows, the label beneath in plain type.
    // Tall and condensed like the Latin rows: as high as 0.62 of the band, letters no narrower than CH_MIN.
    const n = String(p.slide.stat), h = Math.min(band.h * 0.62, band.w / (n.length * CH_MIN));
    size = h;
    const rect = { x: band.x, y: band.y, w: Math.min(band.w, n.length * CH * h), h };
    const L = layoutTreatment(n, rect, "air", 0, 1, { font: "original", layout: "stack" }, "smooth");
    appendTreatmentArtwork(scene, L, { fg: g.fg, bg: g.bg }, rect);
    drawPosterScene(ctx, scene);
    ctx.fillStyle = g.accent;
    ctx.font = '500 56px "IBM Plex Mono", "Noto Sans Malayalam"';
    const parts = p.slide.label.split("/").map((s) => s.trim());
    parts.forEach((s, i) => ctx.fillText(s.toUpperCase(), band.x, band.y + h + 110 + i * 72));
    textBottom = band.y + h + 110 + (parts.length - 1) * 72 + 16;
  } else {
    const rows = p.slide.lines.map(parse);
    // The field: each row as large as the band's width allows (a short row sets bigger, as on the studio's
    // posters), no row taller than ROW_MAX of the band; if the rows don't fit the band's height they all scale
    // down together. Rows sit close (LEAD), as the user asked (2026-11-02).
    // 0.97: the studio's letters run a little wider than its average-width estimate.
    const ROW_MAX = 0.34;
    // A row of Latin letters only may grow taller than its natural width allows, its letters narrowing to CH_MIN
    // (the studio's tall, condensed field); a row with Malayalam keeps Baloo's true proportions.
    const latinOnly = rows.map((ws) => ws.every((w) => w.runs.every((r) => !r.ml)));
    let hs = rows.map((ws, i) => Math.min(0.97 * band.w / lineWidth(ws, 1, latinOnly[i] ? CH_MIN : CH), band.h * ROW_MAX));
    // How far each row's Malayalam signs hang below its baseline (ു, ൂ, conjuncts), per pixel of row height.
    const desc = rows.map((ws) => Math.max(0, ...ws.flatMap((w) => w.runs.filter((r) => r.ml).map((r) => {
      ctx.font = `800 ${mlSize(100)}px "Baloo Chettan 2"`;
      return ctx.measureText(r.text).actualBoundingBoxDescent / 100;
    }))));
    // The gap under a row: tight (LEAD of the mean row), or deep enough to clear its hanging signs.
    const gaps = (a) => { const m = LEAD * (a.reduce((n, h) => n + h, 0) / a.length); return a.slice(0, -1).map((h, i) => Math.max(m, desc[i] * h + 0.06 * a[i + 1])); };
    const total = (a) => a.reduce((n, h) => n + h, 0) + gaps(a).reduce((n, g) => n + g, 0);
    if (total(hs) > band.h) { const k = band.h / total(hs); hs = hs.map((h) => h * k); }
    const gs = gaps(hs); // leftover height stays below the field
    size = Math.min(...hs);
    let y = band.y;
    const strikes = [];
    for (const [ri, ws] of rows.entries()) {
      const h = hs[ri];
      // Latin letter width for this row: natural, or narrowed so a tall Latin row still fits the band.
      const cw = latinOnly[ri] ? Math.min(CH, Math.max(CH_MIN, (CH * 0.97 * band.w) / lineWidth(ws, h, CH))) : CH;
      let x = band.x;
      for (const w of ws) {
        const color = w.accent ? g.accent : g.fg, x0 = x;
        for (const run of w.runs) {
          const rw = runWidth(run, h, cw);
          if (run.ml) {
            ctx.font = `800 ${mlSize(h)}px "Baloo Chettan 2"`;
            ctx.fillStyle = color;
            ctx.textBaseline = "alphabetic";
            ctx.fillText(run.text, x, y + h);
            if (rw <= 0) issues.push(`Malayalam run "${run.text}" has no width (not shaped?)`);
          } else {
            const text = run.text.toUpperCase(), rect = { x, y, w: rw, h };
            const L = layoutTreatment(text, rect, "air", 0, 1, { font: "original", layout: "stack" }, "smooth");
            const dots = L.cells.filter((c) => MARKS.has(c.char));
            L.cells = L.cells.filter((c) => !dots.includes(c));
            for (const lr of L.rows) lr.cells = L.cells.filter((c) => c.row === lr.index);
            const sc = { width: W, height: H, background: "rgba(0,0,0,0)", ops: [] };
            appendTreatmentArtwork(sc, L, { fg: color, bg: g.bg }, rect);
            for (const c of dots) for (const d of mark(c)) sc.ops.push({ kind: "path", d, fill: color });
            for (const c of L.cells.filter((c) => c.char === "?" || c.char === "!")) {
              const d = Math.min(c.h * 0.075, c.w * 0.32);
              sc.ops.push({ kind: "path", d: disc(c.x + c.w / 2, c.y + c.h + d * 0.2, d), fill: color });
            }
            drawPosterScene(ctx, sc);
          }
          x += rw;
        }
        if (w.strike) strikes.push({ x0, x1: x, y: y + h * 0.52, th: Math.max(8, h * 0.09) });
        x += GAP * h;
      }
      if (x - GAP * h > band.x + band.w + 2) issues.push(`row overflows the band (${Math.round(x - GAP * h - band.x - band.w)} px)`);
      y += h + (gs[ri] ?? 0);
    }
    ctx.fillStyle = g.strike;
    for (const s of strikes) ctx.fillRect(s.x0 - s.th, s.y - s.th / 2, s.x1 - s.x0 + s.th * 2, s.th);
    if (y > band.y + band.h + 2) issues.push("rows run past the band");
    textBottom = y + desc.at(-1) * hs.at(-1); // the last row's bottom, plus any Malayalam signs hanging below it
  }
  if (size < p.minSize) issues.push(`type ${Math.round(size)} px, under ${p.minSize}`);

  // Identity: one lockup and one small label line. Inner slides: border on red, long on paper. The sign-off: the
  // square lockup (stacked sign-offs, guidelines), the illustration beside it.
  const f = p.footer;
  let footTop;
  if (p.signoff) {
    ctx.drawImage(logos.square, f.pad, f.base - f.squareW, f.squareW, f.squareW);
    footTop = f.base - f.squareW;
  } else {
    const l = logos[g.logo], lh = f.logoW * (l.naturalHeight / l.naturalWidth);
    ctx.drawImage(l, f.pad, f.base - lh, f.logoW, lh);
    footTop = f.base - lh;
  }
  if (p.asset) {
    const img = new Image();
    img.src = p.asset;
    await img.decode();
    const top = textBottom + p.gap;
    // Inner slides: the room between the lettering and the footer, the still centred in it. The sign-off: right of
    // the square lockup, down to just above the label line, the still standing on that line.
    const left = f.pad + f.squareW + p.gap;
    const r = p.signoff
      ? { x: left, y: top, w: W - f.pad - left, h: f.base - f.labelSize - 28 - top }
      : { x: band.x, y: top, w: band.w, h: footTop - p.gap - top };
    if (r.h < p.minAsset) issues.push(`no room for the illustration (${Math.round(r.h)} px)`);
    else {
      // Size by visual weight, not by the room: every illustration covers about the same area (p.assetSize² px),
      // whether it is one tall object or a row of four, so it supports the lettering instead of competing with it.
      // On the sign-off Makey stands a little taller than the square lockup beside it.
      const weight = p.signoff ? (p.footer.squareW * 1.6) / img.height : p.assetSize / (img.width ** 0.4 * img.height ** 0.6); // weighted to height: a wide row gets a little more width
      const k = Math.min(weight, (p.signoff ? 1 : 0.85) * r.w / img.width, r.h / img.height); // a wide row keeps a margin on its left
      const w = img.width * k, h = img.height * k;
      // Text top left, picture bottom right: one diagonal reading order. The picture stands on the line above the
      // footer, right-aligned with the lettering's edge.
      const x = r.x + r.w - w, y = r.y + r.h - h;
      ctx.drawImage(img, x, y, w, h);
      if (k > 1.35) issues.push(`illustration upscaled ${k.toFixed(2)}×`);
    }
  }
  ctx.fillStyle = g.fg;
  ctx.textAlign = "right";
  ctx.font = `500 ${f.labelSize}px "IBM Plex Mono", "Noto Sans Malayalam"`;
  ctx.fillText(p.label, W - f.pad, f.base);
  ctx.textAlign = "left";
  return { png: canvas.toDataURL("image/png"), size: Math.round(size), issues };
}
