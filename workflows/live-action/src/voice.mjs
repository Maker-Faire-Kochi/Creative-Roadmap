// Voice analysis shared by breaks.mjs (proposing cards) and build.mjs (splitting long cards).
// Workshop footage rarely falls silent, so a fixed silence threshold finds nothing: breaks are measured against the
// clip's own noise floor (10th percentile of a 25 ms RMS envelope) and speech level (70th percentile).
import { execFileSync } from "node:child_process";

const RATE = 16000, MIN_PAUSE = 0.18;
const MIN_PIECE = 0.6; // a split card stays on at least this long, so it can be read
const cache = new Map();

/** The clip's speech band as mono 16 kHz samples. */
function samples(file) {
  if (cache.has(file)) return cache.get(file);
  const pcm = execFileSync("ffmpeg", ["-loglevel", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(RATE), "-af", "highpass=f=120,lowpass=f=3800", "-f", "s16le", "-"], { maxBuffer: 1 << 30 });
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
  cache.set(file, s);
  return s;
}
const db = (s, from, n) => { let q = 0; for (let i = from; i < from + n; i++) q += s[i] * s[i]; return 20 * Math.log10(Math.sqrt(q / n) / 32768 + 1e-9); };
const smooth = (a, k) => a.map((_, i) => { const w = a.slice(Math.max(0, i - k), i + k + 1); return w.reduce((x, y) => x + y, 0) / w.length; });

/** A smoothed 10 ms loudness envelope (dB): env[i] is the level at i / 100 s. */
export function envelope(file) {
  const s = samples(file), F = RATE / 100, fine = [];
  for (let i = 0; i + F <= s.length; i += F) fine.push(db(s, i, F));
  return smooth(fine, 8);
}

/** The quietest moment in [a, b] seconds (the envelope's minimum), or null when the window is empty. */
export function deepestDip(env, a, b) {
  let best = null;
  for (let i = Math.round(a * 100); i < Math.round(b * 100); i++) if (i >= 0 && i < env.length && (best === null || env[i] < env[best])) best = i;
  return best === null ? null : best / 100;
}

/** Pauses and proposed cards: speech runs between pauses, runs over `max` s split at their deepest dip. */
export function voiceBreaks(file, { max = 2.6 } = {}) {
  const s = samples(file), W = RATE / 40, env = [];
  for (let i = 0; i + W <= s.length; i += W) env.push(db(s, i, W));
  const sm = smooth(env, 2), sorted = [...sm].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)], speech = sorted[Math.floor(sorted.length * 0.7)], thr = floor + (speech - floor) * 0.35;
  const pauses = [];
  let start = null;
  sm.forEach((v, i) => {
    const t = i / 40;
    if (v < thr) start ??= t;
    else { if (start !== null && t - start >= MIN_PAUSE) pauses.push([start, t]); start = null; }
  });
  const end = sm.length / 40;
  if (start !== null) pauses.push([start, end]);
  const phrases = [];
  let cur = 0;
  for (const [a, b] of pauses) { if (a - cur > 0.15) phrases.push([cur, a]); cur = b; }
  if (end - cur > 0.15) phrases.push([cur, end]);
  const fenv = envelope(file), cards = [];
  const split = (a, b) => {
    if (b - a <= max) return cards.push([a, b]);
    const t = deepestDip(fenv, a + 0.9, b - 0.9);
    if (t === null) return cards.push([a, b]);
    split(a, t); split(t, b);
  };
  for (const [a, b] of phrases) split(a, b);
  return { floor, speech, threshold: thr, pauses, cards: cards.map(([a, b]) => ({ start: +a.toFixed(2), end: +b.toFixed(2) })) };
}

/** Rows a card's words wrap into at `perRow` characters a row (greedy, as the subtitle renderer wraps). */
export function rowsFor(words, perRow) {
  let rows = 0, cur = 0;
  for (const w of words) {
    if (cur && cur + 1 + w.length <= perRow) cur += 1 + w.length;
    else { rows++; cur = w.length; }
  }
  return rows;
}

/**
 * The character break: a card whose words don't fit in `fit.rows` rows of `fit.perRow` characters (two rows of the
 * subtitle letters at their smallest allowed size) is split into the fewest pieces that do, its words shared out
 * evenly by length. With no word timings for Manglish, each cut is placed where the words divide (time in
 * proportion to letters) and moved to the quietest moment within ±0.35 s of it, so it falls between words; every
 * piece stays on at least MIN_PIECE s. A card with a "/" (forced rows) that fits is left as written.
 * Returns [{ start, end, say }].
 */
export function characterBreak(card, env, fit) {
  if (!fit?.rows) return [card];
  // "MAKER FAIRE" is one word here: a card never ends between the two.
  const words = card.say.replace(/\s*\/\s*/g, " ").replace(/MAKER FAIRE/gi, (m) => m.replace(" ", "\u0001")).split(/\s+/).filter(Boolean);
  const len = (ws) => ws.join(" ").length;
  const text = (ws) => ws.join(" ").replace(/\u0001/g, " ");
  const fits = (ws) => rowsFor(ws, fit.perRow) <= fit.rows;
  // Fits: kept whole; forced rows ("/") that would make more than fit.rows rows are dropped for the normal wrap.
  if (words.length < 2 || fits(words) || fit.split === false) return [card.say.split("/").length > fit.rows ? { ...card, say: text(words) } : card];
  // The fewest pieces whose even share of the words all fit.
  const share = (n) => {
    const target = len(words) / n, groups = [];
    let cur = [];
    for (const w of words) {
      if (cur.length && groups.length < n - 1 && len([...cur, w]) > target + w.length / 2) { groups.push(cur); cur = []; }
      cur.push(w);
    }
    groups.push(cur);
    return groups;
  };
  let groups = share(2);
  for (let n = 2; n <= words.length; n++) { groups = share(n); if (groups.every(fits)) break; }
  const total = groups.reduce((k, g) => k + len(g), 0), dur = card.end - card.start, out = [];
  let before = 0, at = card.start;
  groups.forEach((g, i) => {
    before += len(g);
    let to = card.end;
    if (i < groups.length - 1) {
      const t = card.start + (dur * before) / total;
      to = deepestDip(env, Math.max(at + MIN_PIECE, t - 0.35), Math.min(card.end - MIN_PIECE, t + 0.35)) ?? Math.min(Math.max(t, at + MIN_PIECE), card.end - MIN_PIECE);
    }
    out.push({ ...card, start: +at.toFixed(2), end: +to.toFixed(2), say: text(g), split: `${i + 1}/${groups.length}` });
    at = to;
  });
  return out;
}
