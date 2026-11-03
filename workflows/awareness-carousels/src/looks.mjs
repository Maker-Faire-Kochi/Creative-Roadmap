// The two looks a carousel can render in (guidelines/docs/creative-guidelines.md; values from brand/tokens.css).
//   general — Anton + IBM Plex Mono, neutral structure, official red/cyan only for emphasis
//   noise   — Loud Design / Make Some Noise: warm yellow + electric blue, Dela Gothic One + Inter
// Each design reads colour roles from here; it never names a hex itself.
//   accent: "colour" paints *accent* words in `ac`; "invert" sets them on a block of `ac` in the ground colour
//   (Make Some Noise has only two colours, so emphasis is an inverted block, not a third colour).
//   rebreak: lines that would fit below the minimum headline size split at a word boundary (words unchanged)
//   art: the single ink the archived Open Workshop kit is tinted to (whole object); hi: the newly added step in A.
const P = "#f6f6f3", INK = "#222222", DARK = "#181818", RED = "#ed1c24", CYAN = "#00aeef", WHITE = "#ffffff";
const Y = "#ffe86c", B = "#2b19d9";

export const LOOKS = {
  general: {
    name: "General / Anton + IBM Plex Mono",
    accent: "colour",
    font: { display: '"Anton"', label: '"IBM Plex Mono"', body: '"IBM Plex Mono"', displayWeight: 400, labelWeight: 500, tracking: "0", lh: 0.92 },
    checks: ['400 100px "Anton"', '500 28px "IBM Plex Mono"'],
    page: { bg: P, fg: INK, link: RED, rule: INK },
    A: { bg: P, fg: INK, ac: RED, art: INK, hi: RED, tag: [INK, P] },
    B: { bg: DARK, fg: P, ac: CYAN, art: P, track: P, tag: [CYAN, DARK] },
    C: [
      { bg: P, fg: INK, ac: RED, art: INK },
      { bg: RED, fg: WHITE, ac: INK, art: INK },
      { bg: DARK, fg: P, ac: CYAN, art: CYAN },
      { bg: P, fg: INK, ac: RED, art: INK },
      { bg: DARK, fg: P, ac: CYAN, art: P },
      { bg: P, fg: INK, ac: RED, art: INK },
    ],
    Ctag: [INK, P],
    D: { bg: DARK, fg: P, ac: CYAN, art: P, tag: [CYAN, DARK] },
    E: { bg: P, fg: INK, plate: DARK, plateFg: P, plateAc: CYAN, last: { plate: RED, fg: WHITE, ac: INK }, strike: RED, art: INK, tag: [INK, P] },
    // [cover header, sign-off]: long on light grounds, border on coloured/dark, square for stacked sign-offs
    logo: { "A-assembly": ["long", "long"], "B-panorama": ["border", "border"], "C-colour-blocks": ["long", "square"], "D-board": ["border", "border"], "E-signage": ["long", null] },
  },
  noise: {
    name: "Loud Design / Make Some Noise",
    accent: "invert",
    rebreak: true, // Dela Gothic One is wide: long lines split at a word boundary rather than drop below the 65px minimum
    font: { display: '"Dela Gothic One"', label: '"Inter"', body: '"Inter"', displayWeight: 400, labelWeight: 700, tracking: "-.03em", lh: 1.05 },
    checks: ['400 100px "Dela Gothic One"', '700 28px "Inter"'],
    page: { bg: Y, fg: B, link: B, rule: B },
    A: { bg: Y, fg: B, ac: B, art: B, hi: B, tag: [B, Y] },
    B: { bg: B, fg: Y, ac: Y, art: Y, track: Y, tag: [Y, B] },
    C: [
      { bg: Y, fg: B, ac: B, art: B },
      { bg: B, fg: Y, ac: Y, art: Y },
      { bg: Y, fg: B, ac: B, art: B },
      { bg: B, fg: Y, ac: Y, art: Y },
      { bg: Y, fg: B, ac: B, art: B },
      { bg: Y, fg: B, ac: B, art: B },
    ],
    Ctag: [B, Y],
    D: { bg: B, fg: Y, ac: Y, art: Y, tag: [Y, B] },
    E: { bg: Y, fg: B, plate: B, plateFg: Y, plateAc: Y, last: { plate: B, fg: Y, ac: Y }, strike: Y, art: B, tag: [B, Y] },
    logo: { "A-assembly": ["border", "border"], "B-panorama": ["border", "border"], "C-colour-blocks": ["border", "square"], "D-board": ["border", "border"], "E-signage": ["border", null] },
  },
};

// Reads --look=general|noise from argv. Required, so nothing renders in the archived Open Workshop look by accident.
export function lookFromArgs(argv = process.argv.slice(2)) {
  const a = argv.find((x) => x.startsWith("--look="));
  const name = a && a.slice(7);
  if (!LOOKS[name]) { console.error(`Pass --look=${Object.keys(LOOKS).join("|")}`); process.exit(2); }
  return { key: name, ...LOOKS[name] };
}
