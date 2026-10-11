// Writes $MFK_OUT/ml/copy-deck.md (English → Manglish, slide by slide) and ml/captions-ml.md from content/topics*.mjs.
// Keyword tags per topic are read from content/captions.md (the English caption source of truth).
// usage: node src/ml-docs.mjs
import fs from "node:fs";
import path from "node:path";
import { TOPICS } from "../content/topics.mjs";
import { TOPICS_ML } from "../content/topics-ml.mjs";
import { OUT, CONTENT } from "./paths.mjs";

// "## 05 · Title" sections of captions.md; the keyword line is the last "[...]" line of each section.
const tags = {};
for (const sec of fs.readFileSync(path.join(CONTENT, "captions.md"), "utf8").split(/^## /m).slice(1)) {
  const line = sec.trim().split("\n").filter((l) => /^\[[^\]]+\]$/.test(l.trim())).pop();
  if (!line) throw new Error(`captions.md: section "${sec.slice(0, 30)}" has no [keyword] line`);
  tags[parseInt(sec, 10)] = line.trim();
}
for (const k of Object.keys(TOPICS)) if (!tags[+k.slice(0, 2)]) throw new Error(`captions.md: no keywords for topic ${k}`);
fs.mkdirSync(path.join(OUT, "ml"), { recursive: true });
const clean = (s) => s.replace(/[*~]/g, "");
const slide = (s) => (s.lines ? s.lines.map(clean).join(" / ") : `${s.stat} · ${s.label}`);

let deck = "# Malayalam (Manglish) copy deck\n\nEnglish slide → Manglish slide, for review. Malayalam grammar with the English maker words kept in English; \"Maker Faire Kochi\" stays in English. Line breaks are shown as \" / \".\n";
let caps = "# Malayalam (Manglish) captions\n\nKeywords stay as English bracketed tags (same as the English schedule).\n";
for (const [k, t] of Object.entries(TOPICS)) {
  const m = TOPICS_ML[k], n = +k.slice(0, 2);
  deck += `\n## ${k.slice(0, 2)} · ${t.label}\n\n| # | English | Manglish |\n|---|---|---|\n`;
  for (let i = 0; i < Math.max(t.slides.length, m.slides.length); i++)
    deck += `| ${i + 1} | ${t.slides[i] ? slide(t.slides[i]) : "—"} | ${m.slides[i] ? slide(m.slides[i]) : "—"} |\n`;
  caps += `\n## ${k.slice(0, 2)} · ${t.label}\n\n${m.caption}\n\n${tags[n]}\n`;
}
fs.writeFileSync(path.join(OUT, "ml/copy-deck.md"), deck);
fs.writeFileSync(path.join(OUT, "ml/captions-ml.md"), caps);
console.log("Wrote ml/copy-deck.md and ml/captions-ml.md");
