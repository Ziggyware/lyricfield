import { ask } from "./llm.js";
import * as P from "./prompts.js";
import { arr, stage } from "./graph.js";

// Weighted rubric; the model scores axes, the ranking is computed here.
const W = { memorable: 0.3, singable: 0.2, entendre: 0.2, specific: 0.15, fresh: 0.15 };
const num = (x) => Math.min(10, Math.max(0, Number(x) || 0));
export const scoreOf = (s, words) =>
  Object.entries(W).reduce((a, [k, w]) => a + w * num(s?.[k]), 0) - (words > 10 ? 2 : 0);

// HOOKSMITH drafts ten hooks through ten mechanisms; the first two are discarded as the most probable
// ideas; CRITIC scores the rest; the best enters ctx.hook. Returns null when the stage fails.
export async function tournament(store, root, ctx, digest, slot) {
  const gen = stage(store, root, "Draft ten hooks through ten mechanisms", "HOOKSMITH");
  let cands;
  try {
    const out = await slot(() => ask(store, { agent: "HOOKSMITH", parent: gen.id, temperature: 1, ...P.hooks(ctx, digest) }));
    cands = arr(out.hooks).map((h) => ({ text: String(h?.text ?? "").trim(), mech: String(h?.mechanism ?? "").trim() })).filter((h) => h.text);
    if (!cands.length) throw new Error("no hooks in reply");
  } catch (e) {
    store.set(gen.id, { status: "broken", data: { error: e.message } });
    return null;
  }
  const pool = cands.length > 4 ? cands.slice(2) : cands;
  store.set(gen.id, { status: "kept", data: { output: cands.map((h, i) => `${i < cands.length - pool.length ? "✗ " : ""}${h.text} — ${h.mech}`).join("\n") } });
  if (pool !== cands) store.add("reason", "First two candidates discarded: the most probable ideas are the least distinctive", { agent: "HOOKSMITH", parent: gen.id });

  const jp = stage(store, root, "Score the hooks and keep one", "CRITIC", [gen.id]);
  try {
    const out = await slot(() => ask(store, { agent: "CRITIC", parent: jp.id, temperature: 0.3, ...P.judge(ctx, pool) }));
    const ranked = pool.map((h, i) => {
      const s = arr(out.scores).find((x) => Number(x?.i) === i);
      return { ...h, score: scoreOf(s, h.text.split(/\s+/).length) };
    }).sort((a, b) => b.score - a.score);
    store.set(jp.id, { status: "kept", data: { output: ranked.map((h) => `${h.score.toFixed(2)}  ${h.text}`).join("\n") } });
    for (const h of ranked.slice(0, 3)) store.add("reason", `${h.score.toFixed(2)}: ${h.text} (${h.mech})`, { agent: "CRITIC", parent: jp.id });
    return ranked[0];
  } catch (e) {
    store.set(jp.id, { status: "broken", data: { error: e.message } });
    return pool[0];
  }
}
