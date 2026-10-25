import { ask } from "./llm.js";
import * as S from "./prompts-story.js";
import { arr, stage } from "./graph.js";
import { typeOf } from "./suno.js";
import { relateFindings } from "./relate.js";

// Sections whose job is to move the story; intros, choruses and instrumentals are judged elsewhere.
const MOVING = new Set(["verse", "rap", "bridge", "breakdown"]);
const bag = (s) => new Set(String(s).toLowerCase().match(/[a-z']{3,}/g) ?? []);
const jaccard = (a, b) => {
  const A = bag(a), B = bag(b);
  const i = [...A].filter((x) => B.has(x)).length;
  return i / Math.max(1, A.size + B.size - i);
};
const none = (e) => !e || /^none\b/i.test(e);

// Deterministic verdicts over the audit: static sections, repeated events, flat chorus, unchanged ending.
export function storyFindings(song, a) {
  const out = [];
  const add = (where, msg) => out.push({ sev: "warn", where, msg, gate: true, story: true, sid: null });
  const by = new Map(arr(a?.sections).map((x) => [x.sid, x]));
  let prev = "";
  for (const s of song.sections) {
    if (!MOVING.has(typeOf(s.tag)) || !s.lines.length) continue;
    const x = by.get(s.id);
    if (!x) continue;
    const ev = String(x.event ?? "").trim();
    if (none(ev) || Number(x.progress) === 0) out.push({ sev: "warn", where: `[${s.tag}]`, msg: "static: describes a scene, nothing happens", gate: true, story: true, sid: s.id });
    else if (prev && jaccard(prev, ev) >= 0.6) out.push({ sev: "warn", where: `[${s.tag}]`, msg: `repeats the previous event: "${ev}"`, gate: true, story: true, sid: s.id });
    if (!none(ev)) prev = ev;
  }
  // Relatability: sung sections must hold a moment people have lived, without preaching.
  const seen = new Set(relateFindings(song).map((f) => f.msg));
  for (const s of song.sections) {
    const x = by.get(s.id);
    if (!x || !s.lines.length || typeOf(s.tag) === "inst") continue;
    const flag = (msg) => out.push({ sev: "warn", where: `[${s.tag}]`, msg, gate: true, story: true, sid: s.id });
    if (Number(x.relatable) === 0) flag("not relatable: no moment a listener has lived");
    if (x.pressure === true && ![...seen].some((m) => m.startsWith("pressures") && s.lines.some((l) => m.includes(l)))) flag("pressures the listener to feel or act");
    if (Number(x.voice) === 0) flag("outsider voice: describes the narrator instead of speaking as them");
    if (x.judged === true) flag("judges or glamorizes the narrator's life");
    for (const q of arr(x.objects).map(String).filter(Boolean).slice(0, 3)) {
      if (![...seen].some((m) => m.includes(q) || q.includes(m.split('"')[1] ?? "\0"))) flag(`object given human agency: "${q}"`);
    }
  }
  out.push(...relateFindings(song));
  const ch = song.sections.filter((s) => typeOf(s.tag) === "chorus");
  if (ch.length > 1 && a?.chorus_shift === false) add("[Chorus]", "means the same thing every time it returns");
  if (a?.ending_changed === false) add("Arc", "the ending leaves things where they started");
  if (none(String(a?.meaning ?? ""))) add("Arc", "no clear meaning");
  return out;
}

// One STORY audit as a promise in the graph; a failed audit yields no findings rather than false ones.
export async function auditStory(store, root, ctx, song, slot, after) {
  const p = stage(store, root, "Audit what actually happens in each section", "STORY", after ? [after.id] : []);
  try {
    const a = await slot(() => ask(store, { agent: "STORY", parent: p.id, temperature: 0.2, ...S.audit(ctx, song) }));
    const findings = storyFindings(song, a);
    const events = Object.fromEntries(arr(a.sections).map((x) => [x.sid, `${x.event ?? ""}`]));
    store.set(p.id, { status: "kept", data: { output: `meaning: ${a.meaning ?? ""}\n` + findings.map((f) => `${f.where} ${f.msg}`).join("\n") } });
    for (const f of findings) store.add("reason", `${f.where} ${f.msg}`, { agent: "STORY", parent: p.id });
    return { findings, events, meaning: String(a.meaning ?? "") };
  } catch (e) {
    store.set(p.id, { status: "broken", data: { error: e.message } });
    return { findings: relateFindings(song), events: {}, meaning: "" }; // deterministic checks still stand
  }
}
