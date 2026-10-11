// Shared paths and config for the awareness-carousel scripts.
//   MFK_OUT      where artwork and working files are written (absolute, or relative to the repo root).
//                Default: output/awareness-carousels (git-ignored).
//   CHROME_PATH  Chrome/Chromium binary used for rendering. Default: the macOS Google Chrome app.
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
export const PKG = path.resolve(SRC, ".."); // workflows/awareness-carousels
export const REPO = path.resolve(PKG, "../..");
export const DS = path.join(REPO, "design-system");
export const CONTENT = path.join(PKG, "content");
export const OUT = path.resolve(REPO, process.env.MFK_OUT || "output/awareness-carousels");
export const WORK = path.join(OUT, "build"); // editable fitted HTML, QA reports
export const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const posix = (p) => p.split(path.sep).join("/");
export const relFrom = (from, to) => posix(path.relative(from, to));
