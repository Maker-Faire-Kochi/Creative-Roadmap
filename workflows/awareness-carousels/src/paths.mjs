// Shared paths and config for the awareness-carousel scripts.
//   MFK_OUT      where artwork and working files are written (absolute, or relative to the repo root).
//                Default: output/awareness-carousels-<look> when --look= is passed, else output/awareness-carousels
//                (the archived Open Workshop set that the scheduling ledger hashes; git-ignored either way).
//   CHROME_PATH  Chrome/Chromium binary used for rendering. Default: the macOS Google Chrome app.
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
export const PKG = path.resolve(SRC, ".."); // workflows/awareness-carousels
export const REPO = path.resolve(PKG, "../..");
export const BRAND = path.join(REPO, "brand"); // active tokens, fonts and official logos
export const KIT = path.join(REPO, "archive/open-workshop/assets/kit"); // archived kit SVGs, used as carousel art
export const KIT_JSON = path.join(REPO, "archive/open-workshop/kit.json");
export const CONTENT = path.join(PKG, "content");
const LOOK_ARG = process.argv.find((a) => a.startsWith("--look="));
export const OUT = path.resolve(REPO, process.env.MFK_OUT || (LOOK_ARG ? `output/awareness-carousels-${LOOK_ARG.slice(7)}` : "output/awareness-carousels"));
export const WORK = path.join(OUT, "build"); // editable fitted HTML, QA reports
export const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const posix = (p) => p.split(path.sep).join("/");
export const relFrom = (from, to) => posix(path.relative(from, to));
