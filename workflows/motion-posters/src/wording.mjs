// The wording table: every beat of every topic as the motion posters will letter it, beside the carousel slide it
// comes from, with each rewrite and its reason highlighted. This is what gets approved before a full render.
// usage: node src/wording.mjs   → output/motion-posters-wording.html (git-ignored)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOPICS } from "../../awareness-carousels/content/topics.mjs";
import { STORYBOARDS, END_SAY } from "../content/storyboards.mjs";
import { beatRows, rowText, SETTABLE } from "./copy.mjs";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(PKG, "../..");
const out = path.join(REPO, process.env.MFK_WORDING || "output/motion-posters-wording.html");
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const marked = (rows) => rows.map((r) => r.words.map((w) => `<span class="${w.struck ? "s" : w.accent ? "a" : ""}">${esc(w.text)}</span>`).join(" ")).join("<br>");
const slideText = (slide) => (slide.stat ? `${slide.stat} — ${slide.label}` : slide.lines.join(" ")).replace(/[*~]/g, "");

let rewrites = 0, problems = 0;
const sections = Object.entries(TOPICS).map(([key, t]) => {
  const sb = STORYBOARDS[key];
  const rows = t.slides.map((slide, i) => {
    const b = sb?.beats?.[i] ?? {}, lettering = beatRows(slide, b.say);
    const bad = lettering.some((r) => !SETTABLE.test(rowText(r))) || (b.say && !b.why);
    if (b.say) rewrites++;
    if (bad) problems++;
    return `<tr class="${b.say ? "rw" : ""}${bad ? " bad" : ""}"><td>${i + 1}</td><td>${esc(slideText(slide))}</td><td class="l">${marked(lettering)}</td><td>${b.say ? `<b>Rewrite.</b> ${esc(b.why ?? "no reason given")}` : "As the slide"}${b.means ? `<div class="m">3D: ${esc(b.means)}</div>` : ""}</td></tr>`;
  }).join("");
  const status = sb?.beats?.some((b) => b.stage || b.set) ? "staged" : "wording only";
  return `<section><h2>${esc(key.slice(0, 2))} · ${esc(t.label)} <span class="st">${status}</span></h2><table><thead><tr><th>#</th><th>Carousel slide</th><th>Motion poster lettering</th><th>Note</th></tr></thead><tbody>${rows}<tr><td>end</td><td>—</td><td class="l">${esc(END_SAY)}</td><td>Every poster</td></tr></tbody></table></section>`;
}).join("");

fs.mkdirSync(path.dirname(out), { recursive: true });
const tokens = path.relative(path.dirname(out), path.join(REPO, "brand/tokens.css")).split(path.sep).join("/");
fs.writeFileSync(out, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion poster wording</title><link rel="stylesheet" href="${tokens}"><style>
body{margin:0;background:#f6f6f3;color:#222;font-family:var(--mf-font-body)}main{max-width:1100px;margin:auto;padding:32px 20px}h1{font:400 clamp(36px,6vw,64px)/1 var(--mf-font-display);margin:8px 0 16px}
h2{font:500 15px/1.4 var(--mf-font-label);text-transform:uppercase;border-top:2px solid;padding-top:16px;margin-top:32px}.st{color:#777;margin-left:8px}
table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.45}th,td{text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid #ccc}th{font:500 12px var(--mf-font-label);text-transform:uppercase}
td.l{font:400 20px/1.15 var(--mf-font-display);text-transform:uppercase}.a{color:#ED1C24}.s{text-decoration:line-through;text-decoration-color:#ED1C24;text-decoration-thickness:3px}
tr.rw{background:#fff6c8}tr.bad{outline:2px solid #ED1C24}.m{color:#666;margin-top:6px;font-size:13px}.k{font:500 13px var(--mf-font-label);text-transform:uppercase}
</style></head><body><main><p class="k">Maker Faire Kochi / Awareness / Motion posters</p><h1>Wording for approval</h1>
<p>Each beat letters its slide's full sentence, one carousel line per row (rows may re-break on screen to keep the type large). Red: the slide's accent; struck: its strike. Highlighted rows are rewrites (${rewrites}), each with its reason. Source: <code>workflows/awareness-carousels/content/topics.mjs</code> and <code>workflows/motion-posters/content/storyboards.mjs</code>.${problems ? ` <b>${problems} beat(s) need attention (outlined).</b>` : ""}</p>${sections}</main></body></html>`);
console.log(`${path.relative(REPO, out)}: ${Object.keys(TOPICS).length} topics, ${rewrites} rewrites${problems ? `, ${problems} problems` : ""}`);
if (problems) process.exitCode = 1;
