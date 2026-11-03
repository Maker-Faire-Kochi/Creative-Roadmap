// Reproduces 3d/models/ from the sources recorded in 3d/manifest.json and checks every file: the licence must be
// CC0-1.0, the sha256 must match, and a model must stay within the triangle budget (3d/STANDARD.md).
// Kenney packs are downloaded once into .cache/ (git-ignored) and only the listed files are extracted; Poly Pizza
// models are single files.
// usage: node 3d/fetch.mjs            fetch what is missing, then check everything
//        node 3d/fetch.mjs --check    check only (exit 1 on any problem)
//        node 3d/fetch.mjs --record   write the sha256 and triangle count of the files present into the manifest
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODELS = path.join(HERE, "models"), CACHE = path.resolve(HERE, "../.cache");
const MAX_TRIANGLES = 5000;
const file = path.join(HERE, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
const mode = process.argv[2] ?? "";

const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
/** Triangles in a .glb, read from its JSON chunk (indices or positions / 3). */
function triangles(f) {
  const b = fs.readFileSync(f), j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
  return (j.meshes ?? []).reduce((n, m) => n + m.primitives.reduce((k, p) => k + j.accessors[p.indices ?? p.attributes.POSITION].count / 3, 0), 0);
}

async function download(url, to) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, Buffer.from(await r.arrayBuffer()));
}

async function obtain(rel, src) {
  const to = path.join(MODELS, rel);
  if (fs.existsSync(to)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (src.path) {
    const zip = path.join(CACHE, path.basename(new URL(src.url).pathname));
    if (!fs.existsSync(zip)) { console.log(`downloading ${src.url}`); await download(src.url, zip); }
    fs.writeFileSync(to, execFileSync("unzip", ["-p", zip, src.path], { maxBuffer: 64 << 20 }));
  } else {
    console.log(`downloading ${src.url}`);
    await download(src.url, to);
  }
  console.log(`  ${rel}`);
}

// Every file: the models, plus shared files they reference (a Kenney pack's colour atlas).
const files = [
  ...Object.entries(manifest.models).map(([id, m]) => ({ id, rel: m.file, src: m.source, model: m })),
  ...Object.entries(manifest.files ?? {}).map(([rel, src]) => ({ id: rel, rel, src })),
];
const problems = [];
for (const f of files) {
  if (mode !== "--check" && mode !== "--record") {
    try { await obtain(f.rel, f.src); } catch (e) { problems.push(`${f.id}: ${e.message}`); continue; }
  }
  const at = path.join(MODELS, f.rel);
  if (!fs.existsSync(at)) { problems.push(`${f.id}: ${f.rel} missing`); continue; }
  if (f.src.licence !== "CC0-1.0") problems.push(`${f.id}: licence ${f.src.licence}, only CC0-1.0 is allowed`);
  if (mode === "--record") {
    f.src.sha256 = sha(at);
    if (f.model) f.model.triangles = Math.round(triangles(at));
    continue;
  }
  if (sha(at) !== f.src.sha256) problems.push(`${f.id}: sha256 differs from the manifest`);
  if (f.model) {
    const t = Math.round(triangles(at));
    if (t > MAX_TRIANGLES) problems.push(`${f.id}: ${t} triangles, over ${MAX_TRIANGLES}`);
    if (t !== f.model.triangles) problems.push(`${f.id}: ${t} triangles, manifest says ${f.model.triangles}`);
  }
}
if (mode === "--record") { fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n"); console.log(`recorded ${files.length} files`); }
else if (problems.length) { console.error(problems.join("\n")); process.exitCode = 1; }
else console.log(`${files.length} files ok (${Object.keys(manifest.models).length} models)`);
