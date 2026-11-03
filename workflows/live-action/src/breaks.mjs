// Proposes subtitle cards for a clip: one per phrase between voice breaks (src/voice.mjs), phrases over --max
// seconds split at their deepest dip, then any card that won't fit in --rows rows split again between words (the two-row rule).
//
// --whisper transcribes each card on its own: the card is cut out (±0.1 s) and run through whisper.cpp (large-v3)
// in English mode with a Manglish example prompt. That romanises a Malayalam/English mix as spoken ("Super Fab Lab
// aanenkil, Tinker space aanenkil, allam actually Kochiyil aana."), where Malayalam mode returns an English
// translation and Hindi mode phonetic Devanagari. The words still need cleaning (names, doubled consonants).
// With --transcript (npx hyperframes transcribe … --json) each card instead lists the words that fall inside it
// (for Malayalam those are a translation: meaning, not wording).
//
// usage: node src/breaks.mjs <clip> [--whisper] [--transcript t.json] [--max 2.6] [--rows 2] [--json]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { voiceBreaks, envelope, characterBreak } from "./voice.mjs";

export const WHISPER_MODEL = process.env.MFK_WHISPER_MODEL || path.join(os.homedir(), ".cache/hyperframes/whisper/models/ggml-large-v3.bin");
export const MANGLISH_PROMPT = "Ningal oru maker aanenkil, Kochiyil vech nadakkunna Maker Faire-il pankedukkan thalparyam undenkil, ee link-il register cheyyu.";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const valued = new Set(["--transcript", "--max", "--rows"]);
const file = args.find((a, i) => !a.startsWith("--") && !valued.has(args[i - 1]));
if (!file) { console.error("usage: node src/breaks.mjs <clip> [--whisper] [--transcript t.json] [--max 2.6] [--rows 2] [--json]"); process.exit(2); }
const MAX = Number(opt("max", 2.6)), ROWS = Number(opt("rows", 2));
// The build's two-row rule: SUB maxW 760 px at the 48 px minimum (src/build.mjs) is 21 characters a row.
const FIT = ROWS ? { rows: ROWS, perRow: 21 } : null;

/** Transcribes one stretch of the clip (seconds) in Manglish, as spoken. */
function manglish(clip, start, end, tmp, id) {
  const wav = path.join(tmp, `${id}.wav`), base = path.join(tmp, id);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(Math.max(0, start - 0.1)), "-to", String(end + 0.1), "-i", clip, "-vn", "-ac", "1", "-ar", "16000", wav]);
  execFileSync("whisper-cli", ["-m", WHISPER_MODEL, "-l", "en", "--prompt", MANGLISH_PROMPT, "-f", wav, "-np", "-nt", "-otxt", "-of", base], { stdio: "ignore" });
  return fs.readFileSync(`${base}.txt`, "utf8").replace(/\s+/g, " ").trim();
}

const r = voiceBreaks(file, { max: MAX });
let cards = r.cards.map((c) => ({ ...c, say: "" }));
if (args.includes("--whisper")) {
  if (!fs.existsSync(WHISPER_MODEL)) { console.error(`whisper model missing: ${WHISPER_MODEL} (run npx hyperframes transcribe … --model large-v3 once, or set MFK_WHISPER_MODEL)`); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mfk-breaks-"));
  cards.forEach((c, i) => { c.say = manglish(file, c.start, c.end, tmp, `s${i + 1}`); });
  fs.rmSync(tmp, { recursive: true, force: true });
  // The character break: long cards split again between words (the build does the same with the final wording).
  const env = envelope(file);
  cards = cards.flatMap((c) => characterBreak(c, env, FIT));
}
const tPath = opt("transcript");
if (tPath) {
  const t = JSON.parse(fs.readFileSync(tPath, "utf8")), words = Array.isArray(t) ? t : t.words;
  for (const c of cards) c.heard = words.filter((w) => { const m = (w.start + w.end) / 2; return m >= c.start && m < c.end; }).map((w) => w.text).join(" ");
}
if (args.includes("--json")) console.log(JSON.stringify(cards.map(({ start, end, say, heard }) => ({ start, end, say: say.toUpperCase(), means: "", ...(heard ? { heard } : {}) })), null, 2));
else {
  console.log(`noise floor ${r.floor.toFixed(1)} dB · speech ${r.speech.toFixed(1)} dB · break below ${r.threshold.toFixed(1)} dB`);
  console.log("pauses:", r.pauses.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)}`).join(", "));
  cards.forEach((c, i) => console.log(`s${i + 1}  ${c.start.toFixed(2)}–${c.end.toFixed(2)}${c.say ? `  ${c.say}` : ""}${c.heard ? `  [${c.heard}]` : ""}`));
}
