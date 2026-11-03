// Shared by the build (Node) and the browser-side subtitle card (src/browser/subtitle.mjs): wraps a card's words
// into rows at the largest type size that fits. `ch` is a letter's advance over the size: 0.74 for Studio Sans
// (size = letter height), 0.6 for IBM Plex Mono (size = font size; monospaced, so a row's width is exact). A
// proportional face (Anton) passes `measure(text, size)` → px, from its measured advance widths.

/** Greedy word wrap into at most maxRows rows of maxW px, from size maxH down to minH (step 2). Returns { rows, h }. */
export function wrap(text, { maxW, maxH, maxRows, ch, minH = 30, measure }) {
  const width = measure ?? ((s, h) => s.length * ch * h);
  // "/" in the copy forces the line breaks; the type is then as large as the longest line allows.
  if (text.includes("/")) {
    const rows = text.split("/").map((r) => r.trim().replace(/\s+/g, " ")).filter(Boolean);
    return { rows, h: Math.min(maxH, Math.floor(maxW / Math.max(...rows.map((r) => width(r, 1))))) };
  }
  // "MAKER FAIRE" wraps as one word: the name never breaks across two rows.
  const words = text.replace(/MAKER FAIRE/gi, (m) => m.replace(" ", "\u0001")).split(/\s+/).filter(Boolean);
  for (let h = maxH; h >= minH; h -= 2) {
    const fits = (s) => width(s.replace(/\u0001/g, " "), h) <= maxW, rows = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (fits(next)) cur = next;
      else { if (cur) rows.push(cur); cur = w; }
    }
    if (cur) rows.push(cur);
    if (rows.length <= maxRows && rows.every(fits)) return { rows: rows.map((r) => r.replace(/\u0001/g, " ")), h };
  }
  throw new Error(`cannot fit: ${text}`);
}
