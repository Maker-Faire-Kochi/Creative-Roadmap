// The lettering for a beat: the slide's full sentence, one carousel line per row (design-system/copy.md).
// The slide copy in ../awareness-carousels/content/topics.mjs is the source; a storyboard beat may replace it with
// `say` (rows, same *accent* / ~struck~ marks) only with a `why`, and every replacement is listed in the wording
// table for approval. Studio Sans and the studio's Dela/Anton outlines set A–Z 0–9 and the punctuation the copy
// uses (’ “ ” , : = ? ! . - /); "…" is set as three full stops.

/** Characters the lettering can set. */
export const SETTABLE = /^[A-Z0-9 ’'“”",:;=?!.\-–/&()+]*$/;

/**
 * Rows for a slide (or its override): [{ words: [{ text, accent, struck }], stat }]. Marks may run across lines
 * ("*How did you", "make that?*"), so they are tracked through the whole sentence.
 */
export function beatRows(slide, say) {
  const lines = say ?? (slide.stat ? [`*${slide.stat}*`, ...slide.label.split(/\s*\/\s*/)] : slide.lines);
  let accent = false, struck = false;
  return lines.map((line, i) => {
    const words = [];
    for (const raw of line.split(/\s+/).filter(Boolean)) {
      let text = "", a = accent, s = struck;
      for (const ch of raw) {
        if (ch === "*") { accent = !accent; a = a || accent; continue; }
        if (ch === "~") { struck = !struck; s = s || struck; continue; }
        text += ch;
      }
      if (text) words.push({ text: text.toUpperCase().replace(/…/g, "..."), accent: a, struck: s });
    }
    return { words, stat: Boolean(slide.stat && i === 0) };
  });
}

export const rowText = (row) => row.words.map((w) => w.text).join(" ");
export const wordCount = (rows) => rows.reduce((n, r) => n + r.words.length, 0);
/** The sentence as one string, marks kept: for the gallery and the wording table. */
export const sentence = (rows) => rows.map((r) => r.words.map((w) => (w.struck ? `~${w.text}~` : w.accent ? `*${w.text}*` : w.text)).join(" ")).join(" / ");
