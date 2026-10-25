import { lint, gateOf } from "./suno.js";
import { PICKS, FAMILY, pickScope } from "./picks.js";
import { hasPersona } from "./persona.js";

// Automatic multi-pass improvement: a greedy local search over versions. Each step runs one directed
// pass (a quick pick scoped to what is failing), re-measures, and keeps the result only when it meets the
// acceptance rule against the best version so far. Rejected candidates never become the base.

// Open-failure cost, lower is better: Suno/prosody gate errors 3, gate warnings 1, story/relate/voice
// findings 2, design findings 1. Infinity marks an unaudited version (no story measurement to compare).
const W = { error: 3, warn: 1 };
export function cost(song, story) {
  if (!story) return Infinity;
  const g = gateOf(lint(song)).reduce((s, x) => s + (W[x.sev] ?? 1), 0);
  return g + (story.findings ?? []).reduce((s, f) => s + (f.story ? 2 : 1), 0);
}

// Which picks have something to fix on this version.
export function needs(ver) {
  const fam = new Set((ver.story?.findings ?? []).map(FAMILY));
  const gate = gateOf(lint(ver.song));
  if (gate.some((x) => x.where === "Style")) fam.add("style");
  if (gate.some((x) => x.where.startsWith("["))) fam.add("fix");
  return fam;
}

export const PROGRAMS = {
  adaptive: { label: "Adaptive", hint: "fix whatever fails worst, until clean" },
  polish: { label: "Full polish", hint: "story, relatability, voice, form, hook, style in order" },
  custom: { label: "Custom order", hint: "your picks, in the order chosen" },
};
const PRIORITY = ["move", "relate", "voice", "fix", "style"];
const polish = (ver) => ["move", "relate", ...(hasPersona(ver.ctx?.design) ? ["voice"] : []), "fix", "hook", "style"];
const sequence = (ver, o) => (o.program === "polish" ? polish(ver) : o.program === "custom" ? o.order : null);
export const planLength = (ver, o) => Math.min(o.max, sequence(ver, o)?.length ?? Infinity);
const ACCEPT = { better: (a, b) => a < b, same: (a, b) => a <= b, always: () => true };

// o = { program, order:[pick], max, rounds, accept: better|same|always, locks:[{sid,i,text}] }
// h = { pass(ver, d, key) → candidate {song, story, …}, keep(ver, cand, d, key) → new version,
//       log({step, key, before, after, kept, error}), stopped() → bool }
export async function autoImprove(base, o, h) {
  let best = base, bestCost = cost(base.song, base.story);
  const fails = new Map();
  const seq = sequence(base, o), max = planLength(base, o);
  for (let step = 0; step < max; step++) {
    if (h.stopped()) { h.log({ step, end: "stopped" }); break; }
    let key = seq?.[step];
    if (!seq) {
      const open = needs(best);
      key = PRIORITY.find((k) => open.has(k) && (fails.get(k) ?? 0) < 2);
      if (!key) { h.log({ step, end: open.size ? "remaining failures resisted two attempts each" : "clean" }); break; }
    }
    const d = {
      text: PICKS[key].text, aspects: [...PICKS[key].aspects], scope: pickScope(key, best), locks: o.locks ?? [],
      layout: null, clarify: false, rounds: Math.max(1, o.rounds),
    };
    let cand;
    try {
      cand = await h.pass(best, d, key);
    } catch (e) {
      fails.set(key, (fails.get(key) ?? 0) + 1);
      h.log({ step, key, before: bestCost, error: e.message });
      continue;
    }
    const c = cost(cand.song, cand.story), before = bestCost;
    const kept = before === Infinity || ACCEPT[o.accept](c, before);
    if (kept) { best = h.keep(best, cand, d, key); bestCost = c; fails.delete(key); }
    else fails.set(key, (fails.get(key) ?? 0) + 1);
    h.log({ step, key, before, after: c, kept });
  }
  return best;
}
