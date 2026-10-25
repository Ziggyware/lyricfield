import * as A from "./agents.js";
import { arr, reaches, addQuestion } from "./graph.js";

// Materializes DIRECTOR's plan as graph nodes: intent tree, promises with dependency waiters (cycles
// dropped), conversation groups and agent-to-agent questions. Returns the promise dependency map.
export function buildPlan(store, root, plan, team = A.SPECIALISTS) {
  const iMap = new Map();
  for (const it of arr(plan.intents)) {
    if (!it?.label || iMap.has(it.id)) continue;
    const n = store.add("intent", it.label, { agent: "DIRECTOR", parent: root.id });
    iMap.set(it.id, n);
    if (it.reason) store.add("reason", it.reason, { agent: "DIRECTOR", parent: n.id, refs: [{ rel: "justifies", to: n.id }] });
  }
  for (const it of arr(plan.intents)) {
    const c = iMap.get(it.id), p = iMap.get(it.parent);
    if (c && p && !store.isAncestor(c.id, p.id)) store.set(c.id, { parent: p.id });
  }

  const specs = arr(plan.promises).filter((p) => team.includes(p?.agent) && p.deliver);
  for (const a of team) {
    if (!specs.some((p) => p.agent === a)) specs.push({ id: `auto-${a}`, agent: a, deliver: A.DEFAULT_DELIVER[a], auto: true });
  }
  const pMap = new Map(), deps = new Map();
  for (const p of specs) {
    const home = iMap.get(p.intent) ?? root;
    const n = store.add("promise", p.deliver, { agent: p.agent, parent: home.id, refs: [{ rel: "serves", to: home.id }] });
    if (p.auto) store.add("reason", "Roster coverage: the plan left this agent idle", { agent: "DIRECTOR", parent: n.id, refs: [{ rel: "justifies", to: n.id }] });
    if (!pMap.has(p.id)) pMap.set(p.id, n);
    deps.set(n.id, []);
  }
  for (const p of specs) {
    const a = pMap.get(p.id);
    for (const need of arr(p.needs)) {
      const b = pMap.get(need);
      if (!a || !b || a === b || reaches(deps, b.id, a.id)) continue;
      deps.get(a.id).push(b.id);
      store.add("waiter", `${a.agent} awaits ${b.agent}`, { agent: a.agent, parent: a.id, status: "waiting", refs: [{ rel: "awaits", to: b.id }] });
    }
  }
  for (const g of arr(plan.groups)) {
    const members = [...new Set(arr(g?.members).filter((m) => A.IDS.includes(m)))];
    if (members.length >= 2) store.add("group", g.label || members.join(" + "), { status: "forming", data: { members, topic: g.topic } });
  }
  for (const q of arr(plan.questions)) addQuestion(store, q, "DIRECTOR");

  return deps;
}
