import { record, taste } from "./taste.js";
import { profile, tasteText, rewritesOf, codeOf } from "./taste-profile.js";
import { lint, gateOf, typeOf } from "./suno.js";

// App-side learning hooks: what the UI records, and the taste block each run or pass carries.
export const currentProfile = () => profile(taste.events());
export const tasteForPrompt = () => (taste.on ? tasteText(currentProfile()) : "");

export const learnWrite = (input, preset) => record("write", { ...input, brief: undefined, preset });

// A quick pick's canned text is not the writer's own direction; only their words are learned as such.
export function learnPass(d, song, pick, pickText = null) {
  const types = [...new Set(song.sections.filter((s) => d.scope.includes(s.id)).map((s) => typeOf(s.tag)))];
  record("pass", { aspects: d.aspects, types, pick: pick ?? null, layout: !!d.layout, rounds: d.rounds, text: d.text === pickText ? "" : d.text, design: d.design ?? null });
}

// What the checks still flagged when a version landed; categories only.
export function learnResult(source, song, story) {
  const gate = [...new Set(gateOf(lint(song)).map((x) => codeOf(x.msg)))];
  const st = [...new Set((story?.findings ?? []).map((x) => codeOf(x.msg)))];
  record("result", { source, gate, story: st });
}

// Automatic program settings and how many of its candidates survived acceptance.
export const learnAuto = (c, steps, kept) =>
  record("auto", { program: c.program, order: c.order, max: c.max, rounds: c.rounds, accept: c.accept, steps, kept });

export const learnLock = (song, sid, line) =>
  record("lock", { line, type: typeOf(song.sections.find((s) => s.id === sid)?.tag ?? "") });

export const learnCopy = (what, ver) => record("copy", { what, source: ver.source ?? "write", n: ver.n });

export const learnRestore = (rejected) => record("restore", { rejected });

export function learnEdit(prev, next) {
  for (const r of rewritesOf(prev, next)) record("rewrite", r);
}
