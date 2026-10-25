import { ask } from "./llm.js";
import * as A from "./agents.js";
import * as P from "./prompts.js";
import { finale } from "./finale.js";
import { clarify } from "./clarify.js";
import { arr, limiter, addQuestion } from "./graph.js";
import { buildPlan } from "./plan.js";
import { specialistsFor } from "./persona.js";

// input = { brief, layout:[tag], styleDir, exclude, clarify:boolean, rounds }
export async function run(store, input, { concurrency = 3, askUser }) {
  store.reset();
  const slot = limiter(concurrency);
  const ctx = { brief: input.brief, layout: input.layout ?? [], styleDir: input.styleDir ?? "", exclude: input.exclude ?? "", answers: [], taste: input.taste ?? "", design: input.design ?? null };
  const root = store.add("intent", input.brief.slice(0, 160), { agent: "USER", status: "active", data: { input } });
  if (input.clarify) ctx.answers = await clarify(store, root, P.clarifyBrief(ctx), askUser, slot);

  const dirP = store.add("promise", "Decompose the brief into intentions, promises, groups and questions", {
    agent: "DIRECTOR", parent: root.id, status: "running", refs: [{ rel: "serves", to: root.id }],
  });
  let plan;
  try {
    plan = await slot(() => ask(store, { agent: "DIRECTOR", parent: dirP.id, temperature: 0.7, ...A.director(ctx) }));
  } catch (e) {
    store.set(dirP.id, { status: "broken", data: { error: e.message } });
    throw e;
  }
  store.set(dirP.id, { status: "kept", data: { output: JSON.stringify(plan, null, 1) } });
  store.set(root.id, { label: plan.title || root.label, data: { thesis: plan.thesis, risk: plan.dismissal_risk } });
  Object.assign(ctx, { thesis: plan.thesis ?? "", risk: plan.dismissal_risk ?? "", title: plan.title ?? "" });

  const deps = buildPlan(store, root, plan, specialistsFor(ctx.design));

  const runs = new Map();
  const start = (id) => {
    if (!runs.has(id)) runs.set(id, exec(store.get(id)));
    return runs.get(id);
  };
  async function exec(pn) {
    await Promise.all(deps.get(pn.id).map((d) => start(d).then(() => {
      const w = store.children(pn.id).find((n) => n.kind === "waiter" && n.refs[0]?.to === d);
      if (w) store.set(w.id, { status: store.get(d).status === "kept" ? "released" : "starved" });
    })));
    store.set(pn.id, { status: "running" });
    const upstream = deps.get(pn.id).map((d) => {
      const u = store.get(d);
      return `${u.agent} (${u.label}):\n${String(u.data.output ?? "(broken promise)").slice(0, 1800)}`;
    }).join("\n\n");
    try {
      const out = await slot(() => ask(store, { agent: pn.agent, parent: pn.id, ...A.work(pn.agent, pn.label, store.get(pn.parent)?.label ?? "", upstream, ctx) }));
      store.set(pn.id, { status: "kept", data: { output: String(out.deliver ?? "") } });
      for (const r of arr(out.reasons)) store.add("reason", r, { agent: pn.agent, parent: pn.id, refs: [{ rel: "justifies", to: pn.id }] });
      for (const s of arr(out.subintents)) store.add("intent", s, { agent: pn.agent, parent: pn.parent, status: "emergent" });
      for (const q of arr(out.questions)) addQuestion(store, { ...q, from: pn.agent }, pn.agent);
    } catch (e) {
      store.set(pn.id, { status: "broken", data: { error: e.message } });
    }
  }
  await Promise.all([...deps.keys()].map(start));
  return finale(store, root, ctx, slot, input.rounds ?? 2);
}
