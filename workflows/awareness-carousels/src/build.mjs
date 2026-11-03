// Awareness carousels — 19 topics × 5 styles × post + story, in English or Manglish (--lang=ml).
// Guidelines: guidelines/ (upstream) + brand/ (tokens, fonts, logos); colours and fonts per look from src/looks.mjs.
// Art: the archived Open Workshop kit (archive/open-workshop/assets/kit), tinted whole to the look's ink, until straight-beam illustrations replace it.
// Copy: content/topics.mjs (+ topics-ml.mjs), grounded in index.html (Awareness stage).
// Output goes to $MFK_OUT (default output/awareness-carousels-<look>); see src/paths.mjs and the workflow README.
// Each carousel renders as ONE wide page (slide count × 1080) so graphics can cross slide seams; slides are clipped out of it.
// usage: node build.mjs --look=general|noise [topicPrefix|stylePrefix ...] [--review] [--no-logo] [--lang=ml]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { OUT, WORK, BRAND, KIT, CHROME } from "./paths.mjs";
import { lookFromArgs } from "./looks.mjs";

const LOOK = lookFromArgs();
fs.mkdirSync(WORK, { recursive: true });
fs.writeFileSync(path.join(WORK, "look.json"), JSON.stringify({ look: LOOK.key, name: LOOK.name }, null, 2) + "\n"); // package.mjs reads it
const rel = (abs) => path.relative(WORK, abs).split(path.sep).join("/");

// ---------- copy ----------
// Line markup: *accent*  ~strike~ . Each slide: { lines:[...], stat?, label?, cta? }
import { TOPICS } from "../content/topics.mjs";
import { TOPICS_ML } from "../content/topics-ml.mjs";
const CTA = "Maker Faire Kochi · Coming soon";
const ARGS = process.argv.slice(2);
const LOGO_ON = !ARGS.includes("--no-logo"); // official logo on covers + sign-offs by default
const REVIEW = ARGS.includes("--review"); // write to _logo-review/ instead of the live topic folders
// Malayalam edition (Manglish): copy from topics-ml.mjs; Malayalam letters fall back to Baloo Chettan 2, Latin stays in the look's display face; output under ml/
const ML = ARGS.includes("--lang=ml");
const SRC = ML ? Object.fromEntries(Object.entries(TOPICS).map(([k, t]) => [k, { ...t, ...TOPICS_ML[k] }])) : TOPICS;
// Official Maker Faire Kochi lockups (white plate is part of each mark; never recolour or crop).
const LOGO_DIR = path.join(BRAND, "logo/official");
const LOGO = { long: { file: "MF_Kochi_Logo_long.png", ratio: 3871 / 646 }, border: { file: "MF_Kochi_Logo_border.png", ratio: 4092 / 859 }, square: { file: "MF_Kochi_Logo_square.png", ratio: 1 } };
// per style: cover-header variant + sign-off variant, per look (long on light grounds, border on coloured/dark)
// E keeps its original text sign-off ("Maker Faire Kochi · Coming soon") — logo on the cover only
const LOGO_PLAN = LOOK.logo;
const signoffLogo = () => LOGO_ON && LOGO_PLAN[CUR.style][1];
// header heights (px) chosen so the visible lockup reads the same across variants; border carries its own clearspace
const HDR_H = { long: { post: 84, story: 108 }, border: { post: 108, story: 138 } };
const SIGN_W = { long: { post: 560, story: 680 }, border: { post: 600, story: 720 }, square: { post: 280, story: 340 } };
const logoImg = (v, { h, w }, cls = "logo") => { const L = LOGO[v]; const W = w || h * L.ratio, H = h || w / L.ratio;
  return `<img class="${cls}" src="${path.relative(WORK, path.join(LOGO_DIR, L.file)).split(path.sep).join("/")}" width="${W.toFixed(0)}" height="${H.toFixed(0)}" alt="Maker Faire Kochi">`; };
let CUR = { style: "", fmt: "post" }; // set by the render loop
let N = 6; // set per carousel (2–6 slides)

// progressive assembly (path indices visible per slide) — roles from kit.json
// Assembly track: the asset is chosen by slide count so each slide adds ONE clearly visible step.
// Steps group a part with its own bolts (path indices from kit.json roles).
const STEPS = {
  arrow: [[1, 5], [2, 3, 4, 6, 7]],                                           // shaft → both heads
  wheelarm: [[2], [1], [3, 4, 5]],                                            // elbow bracket → wheel → beam bolted across both
  crank: [[2, 7, 8], [1], [3, 5], [4, 6]],                                    // base → stand → wheel → crank arm + handle
  crane: [[3, 10], [4, 9], [6, 7, 11], [5, 8], [12, 13, 1, 2]],               // base → mast → boom → strut → pulley, cable, hook
  crane6: [[3, 10], [4, 9], [6, 7, 11], [5, 8], [12, 13], [1, 2]],
};
const ASM_BY_N = { 2: ["arrow", "arrow"], 3: ["wheelarm", "wheelarm"], 4: ["crank", "crank"], 5: ["crane", "crane"], 6: ["crane", "crane6"] };
const reveal = (steps, i) => steps.slice(0, i + 1).flat();

// The "wheel arm" is a derived kit assembly kept in archive/open-workshop/assets/kit/assemblies (provenance in archive/open-workshop/kit.json).
// Art always starts from the single-ink variant and is tinted whole: one colour per object, never part by part.
const asmSrc = (asm) => path.join(KIT, "assemblies", `${asm}-ink.svg`);

// ---------- helpers ----------
let uid = 0;
// tint: every filled path takes `ink`; `visible` (path indices) ghosts the rest; `hi` paths take `hiInk` (A's newest step)
function tint(absFile, ink, { visible = null, ghost = 0.12, hi = [], hiInk = ink } = {}) {
  let s = fs.readFileSync(absFile, "utf8");
  s = s.replace(/ id="[^"]*"/g, "");
  let i = 0;
  return s.replace(/<path ([^>]*?)fill="(?!none)[^"]*"/g, (_, attrs) => { i++; const on = !visible || visible.includes(i);
    return `<path data-i="${i}" style="opacity:${on ? 1 : ghost}" ${attrs}fill="${hi.includes(i) ? hiInk : ink}"`; });
}
function inlineSvg(absFile, ink, opts) {
  return tint(absFile, ink, opts).replace("<svg ", `<svg class="art" data-p="s${++uid}" `);
}
const svgImg = (absFile, ink, size, style = "", flex = false) => `<img ${flex ? 'class="flex" ' : ""}src="data:image/svg+xml;base64,${Buffer.from(tint(absFile, ink)).toString("base64")}" width="${size}" height="${size}" style="position:absolute;${style}" alt="">`;
const asmImg = (asm, ink, size, style = "", flex = false) => svgImg(asmSrc(asm), ink, size, style, flex);
const img = (file, ink, size, style = "", flex = false) => svgImg(path.join(KIT, file), ink, size, style, flex);
const box = (svg, size, style = "") => `<div class="flex" style="position:absolute;width:${size}px;height:${size}px;${style}">${svg}</div>`;

// accent: LOOK.accent "colour" paints the word; "invert" sets it on a block of the accent colour in the ground colour
function markup(line, { accent, ground, strike = accent, strikeHole = ground }) {
  const em = LOOK.accent === "invert" ? (t) => `<span class="inv" style="background:${accent};color:${ground}">${t}</span>` : (t) => `<span style="color:${accent}">${t}</span>`;
  return line
    .replace(/~([^~]+)~/g, (_, t) => `<span class="strk">${t}<i class="bar" style="background:${strike}"><b style="background:${strikeHole}"></b><b style="background:${strikeHole};left:auto;right:3%"></b></i></span>`)
    .replace(/\*([^*]+)\*/g, (_, t) => em(t));
}
// text block: all lines share one fitted size (min of per-line fits), capped
function lines(sl, { color, accent, ground, max, width = 920, strike, strikeHole, transform = "uppercase", lh = LOOK.font.lh, h = 9999 }) {
  if (ML) { lh *= 1.3; transform = "none"; } // Malayalam needs more leading; Manglish lines read better in sentence case
  return `<div class="tb" data-w="${width}" data-max="${Math.min(max, h / (sl.lines.length * lh))}" data-cap="${max}" data-h="${h}" data-lh="${lh}" style="color:${color};text-transform:${transform};line-height:${lh}">` +
    sl.lines.map((l) => `<div class="ln"><span class="fit">${markup(l, { accent, ground, strike, strikeHole })}</span></div>`).join("") + `</div>`;
}
function stat(sl, { color, accent, max, labelColor, width = 920 }) {
  const c = LOOK.accent === "invert" ? color : accent; // a two-colour look sets the figure in the text colour
  return `<div class="tb" data-w="${width}" data-max="${max}" style="color:${c};line-height:.86"><div class="ln"><span class="fit">${sl.stat}</span></div></div>` +
    `<div class="mf-label" style="font-size:56px;color:${labelColor || color};margin-top:24px">${sl.label}</div>`;
}
const tag = (bg, fg) => {
  if (!signoffLogo()) return `<span class="tagx" style="background:${bg};color:${fg}">${CTA}</span>`;
  const v = LOGO_PLAN[CUR.style][1];
  return `<div class="signoff">${logoImg(v, { w: SIGN_W[v][CUR.fmt] }, "logo signlogo")}<span class="tagx" style="background:${bg};color:${fg}">Coming soon</span></div>`;
};
function chrome(i, T, fg, rule, last) {
  let left = "<span>Maker Faire Kochi</span>";
  if (LOGO_ON && i === 0) { const v = LOGO_PLAN[CUR.style][0]; left = logoImg(v, { h: HDR_H[v][CUR.fmt] }); }
  else if (signoffLogo() && last) left = "<span></span>";
  const right = LOGO_ON && i === 0 ? "" : `<span>${T.label}</span>`; // cover: the logo alone — the headline already names the topic
  return `<div class="hdr mf-label" style="color:${fg}">${left}${right}</div>
  <div class="ftr" style="color:${fg}"><i class="rule" style="background:${rule || fg}"></i><div class="row mf-label"><span>${last ? "Coming soon" : "Swipe →"}</span><span>${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}</span></div></div>`;
}

// ---------- styles ----------
const STYLES = {
  // A — the topic's kit assembly builds itself across the carousel (ghosted parts still to come)
  "A-assembly": (T, f) => {
    const s = f.story, [asm, stepKey] = ASM_BY_N[N], steps = STEPS[stepKey], L = LOOK.A;
    return T.slides.map((sl, i) => {
      const accent = L.ac, color = L.fg;
      const size = s ? 700 : 470;
      // the step this slide adds takes the highlight colour (colour marks the action); earlier steps stay neutral
      const art = box(inlineSvg(asmSrc(asm), L.art, { visible: reveal(steps, i), hi: steps[i], hiInk: L.hi }), size, `right:${s ? 20 : 30}px;bottom:${s ? 380 : 120}px`);
      const body = sl.stat ? stat(sl, { color, accent, max: s ? 520 : 400 }) : lines(sl, { color, accent, ground: L.bg, max: s ? 210 : 165, h: s ? 580 : 540 });
      return { bg: L.bg, html: `${art}<div class="main">${body}${sl.cta ? `<div class="ctawrap">${tag(...L.tag)}</div>` : ""}</div>${chrome(i, T, color, null, i === N - 1)}` };
    });
  },

  // B — one continuous strip: a rule runs through every slide and gears sit ON the seams
  "B-panorama": (T, f) => {
    const s = f.story, y = s ? 1300 : 1020, W = s ? 380 : 240, L = LOOK.B;
    return T.slides.map((sl, i) => {
      const color = L.fg, accent = L.ac;
      let deco = `<i class="track" style="top:${y}px;background:${L.track}"></i>`;
      if (i > 0) deco += img("parts/wheel-ink.svg", L.art, W, `left:${-W / 2}px;top:${y - W / 2}px;transform:rotate(${i * 17}deg)`);
      if (i < N - 1) deco += img("parts/wheel-ink.svg", L.art, W, `left:${1080 - W / 2}px;top:${y - W / 2}px;transform:rotate(${(i + 1) * 17}deg)`);
      if (i === N - 1) deco += asmImg(T.asm, L.art, s ? 600 : 400, `right:40px;top:${y - (s ? 545 : 360)}px`, true);
      const body = sl.stat ? stat(sl, { color, accent, max: s ? 520 : 380 }) : lines(sl, { color, accent, ground: L.bg, max: s ? 200 : 150, width: 920, h: s ? 680 : 660 });
      return { bg: L.bg, html: `${deco}<div class="main">${body}${sl.cta ? `<div class="ctawrap">${tag(...L.tag)}</div>` : ""}</div>${chrome(i, T, color, null, i === N - 1)}` };
    });
  },

  // C — colour blocks: a new ground per slide, one statement, a single-ink assembly bleeding off the corner
  "C-colour-blocks": (T, f) => {
    const s = f.story, G = LOOK.C;
    return T.slides.map((sl, i) => {
      const g = i === N - 1 ? (N === 2 ? G[1] : G[5]) : G[i];
      const size = s ? 700 : 560;
      // on the sign-off slide the stacked logo is the focal point, so the corner assembly steps aside
      const art = signoffLogo() && sl.cta ? "" : asmImg(T.asm, g.art, size, `right:${-size * 0.24}px;bottom:${s ? 340 : 120}px;transform:rotate(${i % 2 ? 8 : -6}deg)`, true);
      const body = sl.stat ? stat(sl, { color: g.fg, accent: g.ac, max: s ? 520 : 400 }) : lines(sl, { color: g.fg, accent: g.ac, ground: g.bg, max: s ? 220 : 170, h: s ? 560 : 520 });
      return { bg: g.bg, html: `${art}<div class="main">${body}${sl.cta ? `<div class="ctawrap">${tag(...(g.bg === LOOK.Ctag[0] ? [...LOOK.Ctag].reverse() : LOOK.Ctag))}</div>` : ""}</div>${chrome(i, T, g.fg, null, i === N - 1)}` };
    });
  },

  // D — editorial board: dark/coloured ground, accent mono numbers, sentence case
  "D-board": (T, f) => {
    const s = f.story, L = LOOK.D;
    return T.slides.map((sl, i) => {
      const color = L.fg, accent = L.ac;
      const ghost = `<div class="ghostnum" style="font-size:${s ? 760 : 560}px;bottom:${s ? 260 : 40}px;color:${L.fg}">${String(i + 1).padStart(2, "0")}</div>`;
      const art = asmImg(T.asm, L.art, s ? 520 : 300, `right:40px;bottom:${s ? 380 : 110}px`, true);
      const head = `<div class="mf-label" style="color:${accent};font-size:30px">${String(i + 1).padStart(2, "0")}</div><i class="rule2" style="background:${color}"></i>`;
      const body = sl.stat ? stat(sl, { color, accent, max: s ? 480 : 380 }) : lines(sl, { color, accent, ground: L.bg, max: s ? 150 : 120, transform: "none", lh: Math.max(1.0, LOOK.font.lh) });
      return { bg: L.bg, html: `${ghost}${art}<div class="main">${head}${body}${sl.cta ? `<div class="ctawrap">${tag(...L.tag)}</div>` : ""}</div>${chrome(i, T, color, null, i === N - 1)}` };
    });
  },

  // E — signage: each statement on a bolted plate, the wayfinding arrow points to the next slide
  "E-signage": (T, f) => {
    const s = f.story, L = LOOK.E;
    return T.slides.map((sl, i) => {
      const last = i === N - 1;
      const plate = last ? L.last.plate : L.plate;
      const color = last ? L.last.fg : L.plateFg, accent = last ? L.last.ac : L.plateAc;
      const bolts = ["left:22px;top:22px", "right:22px;top:22px", "left:22px;bottom:22px", "right:22px;bottom:22px"].map((p) => `<i class="bolt" style="${p};background:${L.bg}"><b style="background:${plate}"></b></i>`).join("");
      const body = sl.stat ? stat(sl, { color, accent, max: s ? 440 : 330, labelColor: color, width: 790 }) : lines(sl, { color, accent, ground: plate, max: s ? 190 : 150, width: 790, strike: L.strike, strikeHole: plate, h: s ? 520 : 600 });
      const arrow = last ? "" : img("wayfinding/wayfinding-arrow-ink.svg", L.art, s ? 300 : 210, `right:60px;bottom:${s ? 360 : 120}px`, true);
      return { bg: L.bg, html: `${arrow}<div class="main" style="${s ? `top:${sl.cta && signoffLogo() ? 420 : 560}px` : ""}"><div class="plate" style="background:${plate};transform:rotate(${i % 2 ? 1.6 : -2}deg)">${bolts}${body}</div>${sl.cta ? `<div class="ctawrap">${tag(...L.tag)}</div>` : ""}</div>${chrome(i, T, L.fg, null, last)}` };
    });
  },
};

const FORMATS = { story: { h: 1920, pt: 250, pb: 300, story: true }, post: { h: 1350, pt: 80, pb: 80, story: false } };

const F = LOOK.font;
const CSS = (f) => `
:root{--display:${F.display},sans-serif;--label:${F.label},sans-serif;--malayalam-display:var(--mf-font-malayalam-display)}
*{box-sizing:border-box;margin:0;padding:0}
.mf-label{font-family:var(--label);font-weight:${F.labelWeight};text-transform:uppercase;line-height:1.12}
body{width:${N * 1080}px;height:${f.h}px;overflow:hidden;display:flex}
.slide{position:relative;width:1080px;height:${f.h}px;overflow:hidden;flex:none}
.main{position:absolute;left:80px;right:80px;top:${f.pt + (f.story ? 120 : 90)}px}
.hdr{position:absolute;left:80px;right:80px;top:${f.pt}px;display:flex;justify-content:space-between;font-size:28px}
.ftr{position:absolute;left:80px;right:80px;bottom:${f.pb}px}
.ftr .rule{display:block;height:3px}
.ftr .row{display:flex;justify-content:space-between;margin-top:18px;font-size:24px}
.tb{font-family:var(--display);font-weight:${F.displayWeight};letter-spacing:${F.tracking}}
.inv{display:inline-block;line-height:inherit;padding:0 .06em;margin:0 -.02em} /* one line tall, so the block never covers the line above */
.ln{white-space:nowrap}
.fit{display:inline-block}
.strk{position:relative;display:inline-block}
.strk .bar{position:absolute;left:-2%;right:-2%;top:40%;height:.2em;border-radius:.1em;transform:rotate(-3deg)}
.strk .bar b{position:absolute;left:3%;top:30%;width:.08em;height:.08em;border-radius:50%}
.ctawrap{margin-top:${f.story ? 56 : 36}px}
.hdr{align-items:center}
.logo{display:block;flex:none}
.signoff{display:flex;flex-direction:column;align-items:flex-start;gap:${f.story ? 28 : 20}px}
.signoff .tagx{font-size:${f.story ? 38 : 34}px}
.tagx{display:inline-block;white-space:nowrap;padding:24px 32px 20px;font:${F.labelWeight} 38px/1 var(--label);text-transform:uppercase;letter-spacing:.02em}
.art{width:100%;height:100%;display:block;overflow:visible}
.track{position:absolute;left:0;right:0;height:8px;display:block}
.rule2{display:block;height:3px;width:100%;margin:22px 0 44px}
.ghostnum{position:absolute;right:-30px;font:${F.displayWeight} 760px/0.8 var(--display);opacity:.08;letter-spacing:-.02em}
.plate{position:relative;padding:${f.story ? 70 : 54}px 64px ${f.story ? 64 : 48}px}
.bolt{position:absolute;width:40px;height:40px;border-radius:50%}
.bolt b{position:absolute;left:14px;top:14px;width:12px;height:12px;border-radius:50%}
${ML ? `.tb{font-family:var(--display),var(--malayalam-display);letter-spacing:0}.mf-label{font-family:var(--label),var(--malayalam-display)}.strk .bar{height:.11em;top:47%}` : ""}
`;

const only = ARGS.filter((a) => !a.startsWith("--"));
const b = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb", "--disable-gpu"] });
const report = [];
for (const [tk, T] of Object.entries(SRC)) for (const [sk, style] of Object.entries(STYLES)) {
  N = T.slides.length;
  if (only.length && !only.some((o) => tk.startsWith(o) || sk.startsWith(o))) continue;
  for (const [fk, f] of Object.entries(FORMATS)) {
    CUR = { style: sk, fmt: fk };
    let slides = style(T, f);
    if (LOGO_ON) { const v = LOGO_PLAN[sk][0], top = f.pt + HDR_H[v][fk] + (f.story ? 64 : 44);
      slides = slides.map((sl, i) => i ? sl : { ...sl, html: sl.html.replace(/<div class="main"( style="([^"]*)")?>/, (m, _a, st = "") => {
        const cur = /top:(\d+)px/.exec(st); const t = Math.max(top, cur ? +cur[1] : 0);
        return `<div class="main" style="${st.replace(/top:\d+px;?/, "")};top:${t}px">`; }) }); }
    const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${rel(path.join(BRAND, "tokens.css"))}"><style>${CSS(f)}</style></head><body>` +
      slides.map((s) => `<section class="slide" style="background:${s.bg}">${s.html}</section>`).join("") + `</body></html>`;
    const file = path.join(WORK, `${REVIEW ? "_review__" : ""}${ML ? "ml__" : ""}${tk}__${sk}__${fk}.html`);
    fs.writeFileSync(file, html);
    let issues = [], tries = 0;
    for (;;) { try { issues = await renderOne(file, f, tk, sk, fk); break; } catch (e) { if (++tries >= 3) throw e; console.error(`retry ${tk} ${sk} ${fk}: ${e.message.split("\n")[0]}`); } }
    const result = { topic: tk, style: sk, format: fk, slides: N, issues };
    report.push(result);
    console.log(`${tk} ${sk} ${fk}: ${issues.length ? "ISSUES " + issues.join(" | ") : "ok"}`);
  }
}
await b.close();
if (!REVIEW) fs.writeFileSync(path.join(WORK, ML ? "qa-report-ml.json" : "qa-report.json"), JSON.stringify({ generated: new Date().toISOString(), renders: report, issues: report.reduce((sum, r) => sum + r.issues.length, 0) }, null, 2));
if (report.some(r => r.issues.length)) process.exitCode = 1;

async function renderOne(file, f, tk, sk, fk) {
    const p = await b.newPage({ viewport: { width: N * 1080, height: f.h } });
    p.setDefaultTimeout(120000);
    try {
    await p.goto("file://" + file, { timeout: 120000 });
    await p.evaluate(() => document.fonts.ready);
    const resourceErrors = await p.evaluate(() => [...document.images].filter(im => !im.complete || !im.naturalWidth).map(im => `Missing image: ${im.src}`));
    // fit: every line in a block shares the smallest fitted size, capped by data-max
    // rebreak (looks with a wide display face): a block that fits below MIN splits its widest line at the space
    // nearest its middle, while that makes the type bigger. The words never change; struck-through words stay whole.
    const issues = await p.evaluate(({ h, pb, checks, rebreak, MIN }) => {
      const fit = (tb) => {
        const W = +tb.dataset.w, fits = [...tb.querySelectorAll(".fit")];
        const max = tb.dataset.h ? Math.min(+tb.dataset.cap, +tb.dataset.h / (fits.length * +tb.dataset.lh)) : +tb.dataset.max;
        tb.style.fontSize = "100px"; const size = Math.min(max, ...fits.map((e) => (100 * W) / e.scrollWidth)); tb.style.fontSize = size.toFixed(1) + "px";
        return size;
      };
      const split = (tb) => {
        tb.style.fontSize = "100px";
        const f = [...tb.querySelectorAll(".fit")].sort((a, b) => b.scrollWidth - a.scrollWidth)[0];
        const spaces = [], walk = document.createTreeWalker(f, NodeFilter.SHOW_TEXT); let total = 0;
        for (let n; (n = walk.nextNode());) { if (!n.parentElement.closest(".strk")) for (const m of n.data.matchAll(/ /g)) spaces.push({ n, i: m.index, at: total + m.index }); total += n.data.length; }
        const inner = spaces.filter((s) => s.at > 0 && s.at < total - 1);
        if (!inner.length) return false;
        const s = inner.sort((a, b) => Math.abs(a.at - total / 2) - Math.abs(b.at - total / 2))[0];
        const r = document.createRange(); r.setStart(f, 0); r.setEnd(s.n, s.i);
        const head = f.cloneNode(false); head.append(r.extractContents()); // partial spans (accent blocks) split with their attributes
        const first = document.createTreeWalker(f, NodeFilter.SHOW_TEXT).nextNode(); if (first) first.data = first.data.replace(/^ /, "");
        const ln = f.parentElement, nl = ln.cloneNode(false); nl.append(head); ln.before(nl);
        return true;
      };
      document.querySelectorAll(".tb").forEach((tb) => {
        let size = fit(tb);
        while (rebreak && size < MIN && tb.dataset.h) {
          const before = tb.innerHTML;
          if (!split(tb)) { fit(tb); break; }
          const next = fit(tb);
          if (next <= size) { tb.innerHTML = before; fit(tb); break; }
          size = next;
        }
      });
      document.querySelectorAll(".slide").forEach((sl) => {
        const r0 = sl.getBoundingClientRect(), m = sl.querySelector(".main").getBoundingClientRect(), ft = sl.querySelector(".ftr").getBoundingClientRect();
        const minTop = m.bottom - r0.top + 36, maxBottom = ft.top - r0.top - 24;
        sl.querySelectorAll(".flex").forEach((g) => {
          const r = g.getBoundingClientRect(); let top = r.top - r0.top, size = g.offsetWidth;
          if (top >= minTop) return;
          top = minTop; if (top + size > maxBottom) size = Math.max(size * 0.45, maxBottom - top);
          g.style.top = top + "px"; g.style.bottom = "auto"; g.style.width = size + "px"; g.style.height = size + "px";
          if (g.tagName === "IMG") { g.width = size; g.height = size; }
        });
      });
      const bad = [];
      document.querySelectorAll(".slide").forEach((sl, i) => {
        const r0 = sl.getBoundingClientRect(); const ftr = sl.querySelector(".ftr").getBoundingClientRect();
        sl.querySelectorAll(".main").forEach((m) => { const r = m.getBoundingClientRect(); if (r.bottom > ftr.top - 24) bad.push(`slide ${i + 1}: text block ends ${Math.round(r.bottom - r0.top)} > footer ${Math.round(ftr.top - r0.top)}`); });
        const tbr = sl.querySelector(".main").getBoundingClientRect();
        sl.querySelectorAll(".flex").forEach((g) => { const rr = g.getBoundingClientRect();
          const ix = Math.min(tbr.right, rr.right) - Math.max(tbr.left, rr.left), iy = Math.min(tbr.bottom, rr.bottom) - Math.max(tbr.top, rr.top);
          if (ix > 40 && iy > 40 && !g.closest(".plate")) bad.push(`slide ${i + 1}: text box overlaps graphic box by ${Math.round(iy)}px`); });
        sl.querySelectorAll(".fit").forEach((e) => { const r = e.getBoundingClientRect(); if (r.right - r0.left > 1080 - 60) bad.push(`slide ${i + 1}: line overflows "${e.textContent.slice(0, 20)}"`); });
      });
      document.querySelectorAll(".slide").forEach((sl, i) => {
        const r0 = sl.getBoundingClientRect();
        const hs = [...sl.querySelectorAll(".hdr > *")].map(e => e.getBoundingClientRect());
        if (hs.length > 1 && hs[0].right + 16 > hs[1].left) bad.push(`slide ${i + 1}: header collision`);
        sl.querySelectorAll(".tagx, .main .mf-label, .plate").forEach(e => {
          const r = e.getBoundingClientRect();
          if (r.left < r0.left + 35 || r.right > r0.right - 35) bad.push(`slide ${i + 1}: ${e.className} outside safe width`);
        });
        sl.querySelectorAll(".tb").forEach(e => {
          if (parseFloat(getComputedStyle(e).fontSize) < MIN) bad.push(`slide ${i + 1}: headline too small`);
        });
      });
      if (checks.some((c) => !document.fonts.check(c))) bad.push('Font load failure');
      if (document.body.innerText.match(/[\u0D00-\u0D7F]/) && !document.fonts.check('800 100px "Baloo Chettan 2"', 'മ')) bad.push('Malayalam font load failure');
      return bad;
    }, { ...f, checks: LOOK.checks, rebreak: !!LOOK.rebreak, MIN: 65 });
    issues.push(...resourceErrors);
    fs.writeFileSync(file, await p.content()); // preserve fitted, editable local artwork
    const base = REVIEW ? path.join(OUT, "_logo-review", tk) : ML ? path.join(OUT, "ml", tk) : path.join(OUT, tk);
    const dir = path.join(base, sk, fk); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < N; i++) await p.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, "0")}.png`), clip: { x: i * 1080, y: 0, width: 1080, height: f.h } });
    await p.screenshot({ path: path.join(base, sk, `_strip-${fk}.jpg`), type: "jpeg", quality: 82 });
    return issues;
    } finally { await p.close(); }
}
