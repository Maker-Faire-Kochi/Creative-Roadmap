// Writes 3d/CREDITS.md from 3d/manifest.json, so the credits always match the library.
// usage: node 3d/tools/credits.mjs (run after adding a model)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const m = JSON.parse(fs.readFileSync(path.join(D, "manifest.json"), "utf8"));
const byPack = new Map();
for (const [id, e] of Object.entries(m.models)) {
  const k = `${e.source.pack}|${e.source.author}`;
  if (!byPack.has(k)) byPack.set(k, []);
  byPack.get(k).push({ id, e });
}
let md = `# Credits\n\nEvery third-party model in \`models/\` is **CC0-1.0** (public domain dedication). CC0 asks for no attribution; we credit the makers anyway and record where each file came from (generated from \`manifest.json\` by \`tools/credits.mjs\`).\n\n`;
for (const [k, list] of [...byPack].sort()) {
  const [pack, author] = k.split("|");
  md += `## ${pack} — ${author}\n\n| Model | Title | Source |\n|---|---|---|\n`;
  for (const { id, e } of list) md += `| \`${id}\` | ${e.title} | [${e.source.page.replace(/^https:\/\//, "")}](${e.source.page})${e.source.path ? ` · \`${e.source.path}\`` : ""} |\n`;
  md += "\n";
}
md += `## Our own\n\nThe beam kit (\`src/beams.ts\`) is procedural and made for this design system, after the guidelines' straight-beam baseline. The makerfaire.in actors used by the motion posters (Makey, the people) stay in their own repository, [Maker-Faire-Kochi/Website](https://github.com/Maker-Faire-Kochi/Website) by Shaan Shoukath and twilighty-abhi, as a pinned submodule; they are not part of this library.\n`;
fs.writeFileSync(path.join(D, "CREDITS.md"), md);
console.log(`3d/CREDITS.md: ${Object.keys(m.models).length} models`);
