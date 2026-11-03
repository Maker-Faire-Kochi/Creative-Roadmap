// Browser side of the Studio track's illustrations (content/studio-assets.mjs): draws one still of the motion
// posters' 3D tableau (workflows/motion-posters/build/stage.js) on a transparent canvas and returns it as a PNG,
// trimmed to the drawing. The stage is deterministic (fixed simulation steps), so a still is reproducible.
import * as stage from "/stage/stage.js";

const STEPS = 200; // simulation steps per second (the website's DT = 1/200)

/** p: { spec, size, manifest } → { png, w, h } (trimmed), or { error }. */
export async function still(p) {
  const s = p.spec;
  const beat = { start: 0, end: 1e4, final: true, props: s.props ?? [], actors: s.actors ?? [], do: s.do ?? [], act: s.act ?? [], fx: s.fx ?? [], frame: s.frame };
  await stage.init({ set: "tableau", width: p.size, height: p.size, focus: [0, 1, 0, 1], opts: { beats: [beat], manifest: p.manifest, base: "/ds/3d/models", warm: 0, fill: s.fill ?? 1 } });
  stage.cue("edges", true); // ink hairlines: both Studio grounds (red, paper) show them
  stage.advance(Math.round((s.t ?? 1.2) * STEPS));
  stage.render();
  // Trim to the drawn pixels so the slide can place the drawing exactly.
  const src = stage.canvas;
  const tmp = document.createElement("canvas");
  tmp.width = src.width; tmp.height = src.height;
  const c = tmp.getContext("2d");
  c.drawImage(src, 0, 0);
  const { data, width, height } = c.getImageData(0, 0, tmp.width, tmp.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return { error: "the still is empty" };
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext("2d").drawImage(tmp, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return { png: out.toDataURL("image/png"), w: out.width, h: out.height };
}
