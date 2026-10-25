import { diff } from "./versions.js";
import { typeOf } from "./suno.js";
import { DESIGN } from "./design-data.js";

// Derives a taste profile from the event log. Weights decay exponentially with age (τ = 14 days) so
// recent choices dominate without forgetting long-standing ones.
const TAU = 14 * 864e5;
const w = (e, now) => Math.exp(-(now - e.t) / TAU);
const tally = (pairs) => [...pairs.reduce((m, [k, v]) => (k ? m.set(k, (m.get(k) ?? 0) + v) : m), new Map())].sort((a, b) => b[1] - a[1]);
const tokens = (s) => String(s ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

// Most recent events of a kind, deduplicated by key (newest wins).
function recent(evs, kind, n, key) {
  const seen = new Set(), out = [];
  for (let i = evs.length - 1; i >= 0 && out.length < n; i--) {
    const e = evs[i];
    if (e.kind !== kind) continue;
    const k = key(e);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

export function profile(evs, now = Date.now()) {
  const of = (k) => evs.filter((e) => e.kind === k);
  return {
    aspects: tally(of("pass").flatMap((e) => (e.aspects ?? []).map((a) => [a, w(e, now)]))),
    picks: tally(of("pass").map((e) => [e.pick, w(e, now)])),
    types: tally(of("pass").flatMap((e) => (e.types ?? []).map((t) => [t, w(e, now)]))),
    directions: recent(evs, "pass", 6, (e) => e.text?.toLowerCase()),
    answers: recent(evs, "answer", 10, (e) => (e.a ? e.q?.toLowerCase() : null)),
    skips: of("answer").filter((e) => !e.a).length,
    locks: recent(evs, "lock", 8, (e) => e.line?.toLowerCase()),
    rewrites: recent(evs, "rewrite", 6, (e) => e.to?.toLowerCase()),
    rejected: recent(evs, "restore", 4, (e) => e.rejected?.toLowerCase()),
    style: tally(of("write").flatMap((e) => tokens(e.styleDir).map((t) => [t, w(e, now)]))).slice(0, 8),
    exclude: tally(of("write").flatMap((e) => tokens(e.exclude).map((t) => [t, w(e, now)]))).slice(0, 8),
    preset: tally(of("write").map((e) => [e.preset, w(e, now)]))[0]?.[0] ?? null,
    design: Object.keys(DESIGN).map((k) =>
      [k, tally([...of("write"), ...of("pass")].flatMap((e) => (e.design?.[k] ?? []).map((v) => [v, w(e, now)]))).slice(0, 4)]).filter(([, t]) => t.length),
    lastWrite: of("write").at(-1) ?? null,
    lastPass: of("pass").at(-1) ?? null,
    shipped: of("copy").filter((e) => e.what === "lyrics").length,
    n: evs.length,
  };
}

// Prompt block. The brief and the current direction always outrank learned taste.
export function tasteText(p) {
  const L = [];
  if (p.locks.length) L.push(`Lines they kept (match this voice): ${p.locks.map((e) => `"${e.line}"`).join(" ; ")}`);
  if (p.rewrites.length) L.push(`Their rewrites of our lines (learn the move): ${p.rewrites.map((e) => `"${e.from}" → "${e.to}"`).join(" ; ")}`);
  if (p.answers.length) L.push(`Settled answers (do not ask again unless the brief changes them): ${p.answers.map((e) => `${e.q} → ${e.a}`).join(" ; ")}`);
  if (p.directions.length) L.push(`Directions they keep giving: ${p.directions.map((e) => e.text).join(" ; ")}`);
  if (p.aspects.length) L.push(`Aspects they push on most: ${p.aspects.slice(0, 4).map(([a]) => a).join(", ")}`);
  if (p.rejected.length) L.push(`Changes they rejected (restored away): ${p.rejected.map((e) => e.rejected).join(" ; ")}`);
  if (p.style.length) L.push(`Sound they reach for: ${p.style.map(([t]) => t).join(", ")}`);
  if (p.design.length) L.push(`Design choices they favor: ${p.design.map(([k, t]) => `${k} ${t.map(([v]) => v).join("/")}`).join("; ")}`);
  if (p.exclude.length) L.push(`They keep out: ${p.exclude.map(([t]) => t).join(", ")}`);
  return L.length ? `Learned from this writer's past choices (weigh it; the brief and the current direction win):\n${L.join("\n")}` : "";
}

// Our line → their line pairs from a manual edit, per section, via the line diff.
export function rewritesOf(prev, next) {
  const out = [];
  for (const s of next.sections) {
    const p = prev.sections.find((x) => x.id === s.id);
    if (!p) continue;
    const d = diff(p.lines.join("\n"), s.lines.join("\n"));
    for (let i = 0; i < d.length; i++) {
      if (d[i].op !== "-") continue;
      let j = i;
      while (j < d.length && d[j].op === "-") j++;
      let k = j;
      while (k < d.length && d[k].op === "+") k++;
      for (let m = 0; m < Math.min(j - i, k - j); m++) out.push({ from: d[i + m].text, to: d[j + m].text, type: typeOf(s.tag) });
      i = k - 1;
    }
  }
  return out;
}

export { codeOf } from "./codes.js";
