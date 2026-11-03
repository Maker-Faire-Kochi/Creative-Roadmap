// Opens headless Chrome on a blank page that can import the Poster Studio (vendor submodule of the motion-posters
// workflow, used unmodified) and this workflow's browser-side modules. Returns { browser, page, png }.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const SRC = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(SRC, "../../..");
export const STUDIO = path.join(REPO, "workflows/motion-posters/vendor/poster-studio");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function openStudioPage() {
  if (!fs.existsSync(path.join(STUDIO, "src/scene.js"))) throw new Error("Poster Studio missing: run git submodule update --init (workflows/motion-posters/vendor/poster-studio)");
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  const ROOTS = { "/studio/": STUDIO, "/x/": path.join(SRC, "browser") };
  await page.route("http://mfk.local/**", (r) => {
    const u = decodeURIComponent(new URL(r.request().url()).pathname);
    if (u === "/r.html") return r.fulfill({ body: "<!doctype html><meta charset=utf-8>", contentType: "text/html" });
    const root = Object.keys(ROOTS).find((k) => u.startsWith(k)), file = root && path.join(ROOTS[root], u.slice(root.length));
    if (!file || !file.startsWith(ROOTS[root]) || !fs.existsSync(file)) return r.fulfill({ status: 404 });
    r.fulfill({ path: file, contentType: /\.m?js$/.test(file) ? "text/javascript" : "application/octet-stream" });
  });
  await page.goto("http://mfk.local/r.html");
  return { browser, page, png: (url) => Buffer.from(url.split(",")[1], "base64") };
}
