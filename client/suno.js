import { measure } from "./prosody.js";
import { lyricsText } from "./song.js";

// Suno v6 limits and conventions as reported by users (Suno publishes no official tag list):
// Lyrics ≈5000 chars, Style ≈1000 chars, [brackets] read not sung, (parentheses) sung as backing vocals,
// artist names refused in Style, sections over ~8 lines tend to rush.
const TYPES = [[/rap/i, "rap"], [/pre[- ]?chorus/i, "pre"], [/post[- ]?chorus/i, "post"], [/chorus|refrain/i, "chorus"],
  [/hook/i, "hook"], [/verse/i, "verse"], [/bridge/i, "bridge"], [/intro/i, "intro"], [/outro|^end$|fade/i, "outro"],
  [/breakdown/i, "breakdown"], [/break|instrumental|drop|build|solo|interlude/i, "inst"]];
export const typeOf = (tag) => (TYPES.find(([r]) => r.test(tag)) ?? [null, "verse"])[1];
const LINES = { verse: [4, 8], pre: [2, 4], chorus: [4, 6], post: [1, 4], hook: [1, 4], rap: [4, 16], bridge: [2, 4], breakdown: [0, 8],
  intro: [0, 4], outro: [0, 4], inst: [0, 4] };
const SYL = { rap: [10, 16], breakdown: [2, 14], inst: [0, 99], intro: [2, 12], outro: [2, 12], hook: [2, 12], post: [2, 12] };
const SD = { rap: 2.5 };
const INSTR = /\b(softly|whisper(ed)?|spoken|guitar|drums?|piano|synth|bass|fade|instrumental|repeat|x\d|solo|vocals?|beat)\b/i;

export const syllableRange = (t) => SYL[t] ?? [5, 12];

export function lint(song) {
  const out = [];
  const add = (sev, where, msg, gate = sev === "error") => out.push({ sev, where, msg, gate });
  const lyr = lyricsText(song);
  if (lyr.length > 5000) add("error", "Lyrics", `${lyr.length} chars over the ~5000 field limit`);
  if (song.style.length > 1000) add("error", "Style", `${song.style.length} chars over the ~1000 field limit`);
  const items = song.style.split(",").map((s) => s.trim()).filter(Boolean);
  if (items.length < 4 || items.length > 9) add("warn", "Style", `${items.length} descriptors; 4–9 steer best`);
  const names = song.style.match(/\b[A-Z][a-z]+(?:[ -][A-Z][a-z]+)+\b/g) ?? [];
  if (names.length) add("warn", "Style", `possible artist names: ${names.join(", ")}; v6 refuses imitation, describe the sound`, true);
  if (!song.backstory) add("warn", "Backstory", "missing");
  if (!song.sections.length) add("error", "Lyrics", "no sections");

  const seen = new Map();
  for (const s of song.sections) {
    const t = typeOf(s.tag), m = measure(s.lines), h = `[${s.tag}]`;
    const [lo, hi] = LINES[t];
    if (s.lines.length < lo) add(t === "verse" || t === "chorus" ? "error" : "warn", h, `${s.lines.length} lines; ${t} wants ${lo}–${hi}`, true);
    else if (s.lines.length > hi) add("warn", h, `${s.lines.length} lines; over ${hi} tends to rush`, s.lines.length > 8);
    const [a, b] = syllableRange(t);
    const off = m.lines.filter((l) => l.syl < a || l.syl > b).length;
    if (off) add("warn", h, `${off}/${m.lines.length} lines outside ${a}–${b} syllables`, off * 3 > m.lines.length);
    if (m.lines.length > 1 && m.sd > (SD[t] ?? 1.5)) add("warn", h, `syllable sd ${m.sd.toFixed(1)} > ${SD[t] ?? 1.5}`, true);
    if (m.lines.length >= 4 && m.density < 0.5) add("warn", h, `rhyme density ${m.density.toFixed(2)} < 0.50`, true);
    for (const l of m.lines) if (l.banned.length) add("error", h, `banned "${l.banned.join(", ")}" in "${l.text}"`);
    for (const l of s.lines) {
      if (/[[\]]/.test(l)) add("error", h, `bracket inside a sung line: "${l}"`);
      if (/\d/.test(l)) add("warn", h, `digits in "${l}"`);
      if ((l.match(/\([^)]*\)/g) ?? []).some((p) => INSTR.test(p))) add("warn", h, `instruction in parentheses gets sung: "${l}"`, true);
    }
    if (s.desc.length > 48) add("warn", h, "long bracket cue may be sung; keep it to a few words");
    const key = s.lines.join("|").toLowerCase();
    if (t === "verse" && key && seen.has(key)) add("warn", h, `repeats [${seen.get(key)}] word for word`, true);
    if (key && !seen.has(key)) seen.set(key, s.tag);
  }
  return out;
}

export const gateOf = (l) => l.filter((x) => x.gate);

// Measured prosody per section, one line each, for prompts.
export const metrics = (song) => song.sections.map((s) => {
  const m = measure(s.lines);
  return `${s.id} [${s.tag}] syl ${m.lines.map((l) => l.syl).join(" ") || "-"} sd ${m.sd.toFixed(1)} ` +
    `scheme ${m.lines.map((l) => l.scheme).join("") || "-"} density ${m.density.toFixed(2)}`;
}).join("\n");

export const lintText = (l) => l.map((x) => `${x.sev} ${x.where}: ${x.msg}`).join("\n");
