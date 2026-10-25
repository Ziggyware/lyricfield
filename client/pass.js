import { ask } from "./llm.js";
import * as P from "./prompts.js";
import { ASPECTS } from "./roster.js";
import { arr, limiter, stage, settle } from "./graph.js";
import { clarify } from "./clarify.js";
import { refine, accept } from "./refine.js";
import { metrics } from "./suno.js";

// One directed pass over a version. d = { text, aspects:[], scope:[sid], locks:[{sid,i,text}],
// layout:[{id|null,tag}]|null, clarify:boolean, rounds }. The store is not reset: each pass is a new
// root intention beside the earlier ones, so the mind tree shows the song's whole history.
export async function runPass(store, base, d, { concurrency = 3, askUser, taste = "" }) {
  const slot = limiter(concurrency);
  // The song itself now carries the layout; a hook redirect frees the tournament's choice.
  // The song's own arc and beats now carry the story, so the original spine would only pull backward.
  const ctx = { ...base.ctx, layout: [], spine: null, taste, design: d.design ?? base.ctx.design ?? null, hook: d.aspects.includes("hook") ? "" : base.ctx.hook };
  const what = d.text || d.aspects.map((a) => ASPECTS[a]?.label).join(", ") || "Revise";
  const root = store.add("intent", `v${base.n} → ${what}`.slice(0, 160), { agent: "USER", status: "active", data: { directive: d } });
  const dir = { ...d, answers: [] };
  if (d.clarify) dir.answers = await clarify(store, root, P.clarifyPass(ctx, base.song, dir), askUser, slot);

  const agents = [...new Set(d.aspects.map((a) => ASPECTS[a]?.agent).filter(Boolean))];
  const m = metrics(base.song);
  const studies = await Promise.all(agents.map(async (agent) => {
    const p = stage(store, root, `Study ${d.aspects.filter((a) => ASPECTS[a].agent === agent).map((a) => ASPECTS[a].label).join(" + ")}`, agent);
    try {
      const out = await slot(() => ask(store, { agent, parent: p.id, temperature: 0.8, ...P.aspectWork(agent, ctx, base.song, dir, m) }));
      store.set(p.id, { status: "kept", data: { output: String(out.deliver ?? "") } });
      for (const r of arr(out.reasons)) store.add("reason", r, { agent, parent: p.id, refs: [{ rel: "justifies", to: p.id }] });
      return { p, text: `## ${agent}\n${out.deliver ?? ""}` };
    } catch (e) {
      store.set(p.id, { status: "broken", data: { error: e.message } });
      return { p, text: "" };
    }
  }));

  const rp = stage(store, root, "Apply the direction", "COMPOSER", studies.map((s) => s.p.id));
  let song;
  try {
    const notes = studies.map((s) => s.text).filter(Boolean).join("\n\n");
    const r = await slot(() => ask(store, { agent: "COMPOSER", parent: rp.id, temperature: 0.8, maxTokens: 8000, ...P.revise(ctx, base.song, notes, "", dir) }));
    song = accept(store, rp, base.song, r, dir);
    store.set(rp.id, { status: "kept", data: { output: song.sections.map((s) => `[${s.tag}]\n${s.lines.join("\n")}`).join("\n\n") } });
  } catch (e) {
    store.set(rp.id, { status: "broken", data: { error: e.message } });
    settle(store, root);
    throw new Error(`COMPOSER: ${e.message}`);
  }

  // Layout is now applied; refinement keeps scope, and sections the layout added join it.
  const before = new Set(base.song.sections.map((s) => s.id));
  const added = song.sections.filter((s) => !before.has(s.id)).map((s) => s.id);
  const d2 = { ...dir, layout: null, scope: d.scope.length ? [...d.scope, ...added] : [] };
  const out = d.rounds > 0 ? await refine(store, root, ctx, song, { slot, rounds: d.rounds, after: rp, d: d2 }) : { song, lint: null, story: null, last: rp };
  store.add("lyric", out.song.title, { agent: "COMPOSER", parent: out.last.id, status: "final" });
  settle(store, root);
  return { song: out.song, story: out.story, answers: dir.answers, design: ctx.design };
}
