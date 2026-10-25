import { ask } from "./llm.js";
import * as A from "./agents.js";

const arr = (x) => (Array.isArray(x) ? x : []);
export const kept = (store) => store.of("promise").filter((p) => p.status === "kept" && p.agent !== "DIRECTOR");

// Route each open question to a group holding both parties, else one holding the addressee,
// else an open-floor group created for the leftovers.
export function route(store) {
  const groups = store.of("group");
  const stray = [];
  for (const q of store.of("question").filter((q) => q.status === "open")) {
    const has = (g, id) => g.data.members.includes(id);
    const g = groups.find((g) => has(g, q.agent) && has(g, q.data.to)) ?? groups.find((g) => has(g, q.data.to));
    g ? store.set(q.id, { data: { group: g.id } }) : stray.push(q);
  }
  if (stray.length) {
    const members = [...new Set(stray.flatMap((q) => [q.agent, q.data.to]))];
    const g = store.add("group", "Open floor", { status: "forming", data: { members, topic: "questions no standing group owns" } });
    for (const q of stray) store.set(q.id, { data: { group: g.id } });
  }
}

export async function convene(store, g, ctx, slot) {
  const qs = store.of("question").filter((q) => q.data.group === g.id);
  const deliveries = kept(store).filter((p) => g.data.members.includes(p.agent))
    .map((p) => `${p.agent}: ${String(p.data.output).slice(0, 1500)}`).join("\n\n");
  const questions = qs.map((q) => `${q.id} ${q.agent} to ${q.data.to}: ${q.label}`).join("\n");
  store.set(g.id, { status: "convening" });
  for (const q of qs) store.add("waiter", `${q.data.to} owes an answer`, { agent: q.data.to, parent: q.id, status: "waiting", refs: [{ rel: "awaits", to: g.id }] });
  try {
    const out = await slot(() => ask(store, { agent: "MODERATOR", parent: g.id, ...A.convene(g, deliveries, questions, ctx) }));
    for (const m of arr(out.messages)) {
      if (m?.text) store.add("message", m.text, { agent: A.IDS.includes(m.from) ? m.from : null, parent: g.id, data: { to: m.to ?? "ALL" } });
    }
    for (const a of arr(out.answers)) {
      const q = qs.find((q) => q.id === a?.qid);
      if (!q || !a.text) continue;
      store.add("answer", a.text, { agent: A.IDS.includes(a.by) ? a.by : q.data.to, parent: q.id, refs: [{ rel: "answers", to: q.id }] });
      store.set(q.id, { status: "answered" });
    }
    if (out.decision) store.add("reason", out.decision, { agent: "MODERATOR", parent: g.id, status: "decision", refs: [{ rel: "justifies", to: g.id }] });
    for (const r of arr(out.reasons)) store.add("reason", r, { parent: g.id, refs: [{ rel: "justifies", to: g.id }] });
    store.set(g.id, { status: "convened", data: { decision: out.decision ?? "" } });
  } catch (e) {
    store.set(g.id, { status: "dissolved", data: { error: e.message } });
  }
  for (const q of qs) {
    const w = store.children(q.id).find((n) => n.kind === "waiter");
    if (w) store.set(w.id, { status: store.get(q.id).status === "answered" ? "released" : "starved" });
    if (store.get(q.id).status === "open") store.set(q.id, { status: "unanswered" });
  }
}
