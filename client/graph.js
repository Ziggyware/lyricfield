import { IDS } from "./roster.js";

export const arr = (x) => (Array.isArray(x) ? x : []);

// FIFO semaphore: at most n inference calls in flight.
export function limiter(n) {
  let active = 0;
  const q = [];
  const next = () => {
    if (active >= n || !q.length) return;
    active++;
    const [f, res, rej] = q.shift();
    Promise.resolve().then(f).then(res, rej).finally(() => { active--; next(); });
  };
  return (f) => new Promise((res, rej) => { q.push([f, res, rej]); next(); });
}

// Does `from` already reach `to` through dependency edges?
export function reaches(deps, from, to, seen = new Set()) {
  if (from === to) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return (deps.get(from) ?? []).some((d) => reaches(deps, d, to, seen));
}

export function addQuestion(store, q, fallbackFrom) {
  const from = IDS.includes(q?.from) ? q.from : fallbackFrom;
  if (!IDS.includes(q?.to) || !q?.q || q.to === from) return null;
  return store.add("question", q.q, { agent: from, status: "open", data: { to: q.to } });
}

// A promise under `root` whose waiters are already satisfied by `awaits`.
export function stage(store, root, label, agent, awaits = []) {
  const p = store.add("promise", label, { agent, parent: root.id, refs: [{ rel: "serves", to: root.id }] });
  for (const id of awaits) {
    const t = store.get(id);
    if (t) store.add("waiter", `${agent} awaits ${t.agent ?? t.label}`, { agent, parent: p.id, status: "released", refs: [{ rel: "awaits", to: id }] });
  }
  store.set(p.id, { status: "running" });
  return p;
}

// Intentions under `root` are served when every promise serving them was kept, partial when one broke.
export function settle(store, root) {
  const under = (n) => store.isAncestor(root.id, n.id);
  for (const i of store.of("intent").filter(under)) {
    if (i.id === root.id || i.status === "emergent") continue;
    const ps = store.refsTo(i.id, "serves").filter((n) => n.kind === "promise");
    if (ps.length) store.set(i.id, { status: ps.every((p) => p.status === "kept") ? "served" : "partial" });
  }
  const broken = store.of("promise").filter(under).some((p) => p.status === "broken");
  store.set(root.id, { status: broken ? "partial" : "fulfilled" });
}
