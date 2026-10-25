import { designChips } from "./design.js";

// Learns this writer's taste from what they do: answers, directions, locks, rewrites, restores, copies.
// Full events stay in this browser. Only categorical fields (no lyric text, no free-text answers) are sent
// to the server, where they aggregate into app-wide insights.
const KEY = "lyricfield.taste.v1";
const MAX = 500;

const ls = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const rid = () => globalThis.crypto?.randomUUID?.() ?? `p${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

function load() {
  try {
    const v = JSON.parse(ls()?.getItem(KEY) ?? "null");
    if (v && Array.isArray(v.events)) return v;
  } catch { /* corrupt or blocked storage: start fresh */ }
  return { id: rid(), on: true, seq: 0, events: [] };
}

let T = load();
const save = () => { try { ls()?.setItem(KEY, JSON.stringify(T)); } catch { /* quota or blocked storage */ } };

// Server payload per kind: categorical only.
const SERVER = {
  answer: (d) => ({ skipped: !d.a, option: !!d.option }),
  pass: (d) => ({ aspects: d.aspects ?? [], types: d.types ?? [], pick: d.pick ?? null, layout: !!d.layout, rounds: d.rounds ?? 0, text: !!d.text, design: !!d.design }),
  lock: (d) => ({ type: d.type }),
  rewrite: (d) => ({ type: d.type }),
  restore: () => ({}),
  copy: (d) => ({ what: d.what, source: d.source }),
  write: (d) => ({ preset: d.preset ?? "auto", sections: d.layout?.length ?? 0, clarify: !!d.clarify, rounds: d.rounds ?? 0, style: !!d.styleDir, exclude: !!d.exclude, ...designChips(d.design) }),
  auto: (d) => ({ program: d.program, order: d.order ?? [], max: d.max, rounds: d.rounds, accept: d.accept, steps: d.steps, kept: d.kept }),
  result: (d) => ({ source: d.source, gate: d.gate ?? [], story: d.story ?? [] }),
};

export function record(kind, data = {}) {
  const e = { id: ++T.seq, t: Date.now(), kind, ...data };
  T.events.push(e);
  if (T.events.length > MAX) T.events = T.events.slice(-MAX);
  save();
  const body = SERVER[kind]?.(data);
  if (body && typeof location !== "undefined" && typeof fetch === "function") {
    fetch("/api/event", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ profile: T.id, kind, data: body }),
    }).catch(() => { /* insights are best-effort */ });
  }
  return e;
}

export const taste = {
  get on() { return T.on; },
  set on(v) { T.on = !!v; save(); },
  get id() { return T.id; },
  events: () => T.events,
  forget(ids) {
    const s = new Set(ids);
    T.events = T.events.filter((e) => !s.has(e.id));
    save();
  },
  forgetAll() {
    T = { id: T.id, on: T.on, seq: T.seq, events: [] };
    save();
  },
};
