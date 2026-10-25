import { spellNumbers } from "./numwords.js";
import { ARC } from "./narrative.js";

// Canonical song: { title, backstory, arc{want..meaning}, sections:[{id, tag, beat, desc, note, lines[]}], style, exclude }.
// The model writes JSON; every field passes through these sanitizers so Suno-facing text is deterministic.
const flat = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const clip = (s, n) => {
  const t = flat(s);
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") : t;
};
export const cleanTag = (t) => clip(String(t ?? "").replace(/[[\]*:()]/g, " "), 32);
// Bar counts and bare numbers in a cue are noise Suno does not follow; drop those items.
const COUNT = /^(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|sixteen)(?:\s*bars?)?$/i;
export const cleanDesc = (d) => clip(String(d ?? "").replace(/[[\]*()]/g, " ").split(/\s*[,;]\s*/)
  .map(flat).filter((x) => x && !COUNT.test(x)).join("; "), 60).replace(/;\s*$/, "");
export const cleanNote = (n) => clip(String(n ?? "").replace(/\*+/g, ""), 240);
export const cleanLine = (l) => spellNumbers(flat(String(l ?? "").replace(/\*+/g, "").replace(/^[-•]\s*/, "")));
const cleanStyle = (s, n) => clip(String(s ?? "").replace(/[[\]*\n]/g, " ").replace(/\s*,\s*/g, ", "), n).replace(/^,\s*|,\s*$/g, "");

const linesOf = (x) => (Array.isArray(x) ? x : String(x ?? "").split("\n"))
  .map(cleanLine).filter((l) => l && !/^\[[^\]]*\]$/.test(l));

// Section ids are the anchors for scope, locks and layout. Keep a model-echoed id only when it names a
// section of `prev` (or, for a first draft, is well-formed and unused); anything else gets a fresh id.
export function normalize(raw, prev = null) {
  const prevIds = new Set(prev?.sections.map((s) => s.id) ?? []);
  const used = new Set();
  let k = Math.max(0, ...[...prevIds].map((id) => Number(id.slice(1)) || 0));
  const fresh = () => {
    let id;
    do id = `s${++k}`; while (used.has(id) || prevIds.has(id));
    return id;
  };
  const sections = (Array.isArray(raw?.sections) ? raw.sections : []).map((s) => {
    const want = typeof s?.id === "string" ? s.id : "";
    const ok = /^s\d+$/.test(want) && !used.has(want) && (prev ? prevIds.has(want) : true);
    const id = ok ? want : fresh();
    used.add(id);
    return { id, tag: cleanTag(s?.tag) || "Verse", beat: clip(s?.beat, 200), desc: cleanDesc(s?.desc), note: cleanNote(s?.note), lines: linesOf(s?.lines) };
  });
  return {
    title: clip(raw?.title, 80) || prev?.title || "Untitled",
    backstory: clip(raw?.backstory, 1500) || prev?.backstory || "",
    arc: Object.fromEntries(ARC.map((k) => [k, clip(raw?.arc?.[k], 300) || prev?.arc?.[k] || ""])),
    sections,
    style: cleanStyle(raw?.style, 1000) || prev?.style || "",
    exclude: cleanStyle(raw?.exclude, 500) || prev?.exclude || "",
  };
}

export const tagLine = (s) => `[${s.tag}${s.desc ? `: ${s.desc}` : ""}]`;

// The ** block: the section's story beat, then how it is performed.
export const noteLine = (s) => [s.beat, s.note].filter(Boolean).join(" · ");
const arcText = (a) => ARC.filter((k) => a?.[k]).map((k) => `${k[0].toUpperCase() + k.slice(1)}: ${a[k]}`).join("\n");

// Suno Lyrics field: bracket cues + sung lines. ** notes are opt-in: Suno documents no asterisk syntax and
// planning prose in Lyrics can be sung.
export const lyricsText = (song, notes = false) =>
  song.sections.map((s) => [notes && noteLine(s) ? `**${noteLine(s)}**` : "", tagLine(s), ...s.lines].filter(Boolean).join("\n")).join("\n\n");

// Annotated sheet: backstory, a ** block before each section that has a note, then style and exclude.
export const sheetText = (song) => [
  `**${song.title}**`, "", "**Backstory**", song.backstory, "", "**Arc**", arcText(song.arc), "",
  lyricsText(song, true), "", "**Style**", song.style, "", "**Exclude**", song.exclude,
].join("\n");

// Inverse of the editor textarea: one sung line per row.
export const parseLines = (text) => linesOf(text);

export const clone = (song) => JSON.parse(JSON.stringify(song));

// Compact JSON for prompts: ids kept so the model can echo them.
export const songJSON = (song) => JSON.stringify({
  title: song.title, backstory: song.backstory, arc: song.arc,
  sections: song.sections.map(({ id, tag, beat, desc, note, lines }) => ({ id, tag, beat, desc, note, lines })),
  style: song.style, exclude: song.exclude,
});
