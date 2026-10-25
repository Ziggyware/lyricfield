// Event-sourced intention graph: every node is append-only except status/data patches.
const QUIET = new Set(["reason", "message", "answer"]);

export function createStore() {
  const nodes = new Map(), subs = new Set();
  const stats = { calls: 0, ms: 0, tokens: 0, fails: 0 };
  let seq = 0, queued = false, t0 = performance.now();

  const now = () => Math.round(performance.now() - t0);
  const emit = () => {
    if (queued) return;
    queued = true;
    const flush = () => { queued = false; for (const f of subs) f(); };
    typeof requestAnimationFrame === "function" ? requestAnimationFrame(flush) : setTimeout(flush, 0);
  };

  function add(kind, label, o = {}) {
    const id = kind.slice(0, 2) + (++seq).toString(36);
    const n = {
      id, kind, label: String(label ?? "").trim(),
      agent: o.agent ?? null, parent: o.parent ?? null,
      status: o.status ?? (QUIET.has(kind) ? "" : "open"), t: now(), tu: now(),
      data: o.data ?? {}, refs: o.refs ?? [],
    };
    nodes.set(id, n);
    emit();
    return n;
  }

  function set(id, patch) {
    const n = nodes.get(id);
    if (!n) return null;
    const data = patch.data ? { ...n.data, ...patch.data } : n.data;
    Object.assign(n, patch, { data, tu: now() });
    emit();
    return n;
  }

  // True when `anc` is `id` or an ancestor of it along parent links.
  function isAncestor(anc, id) {
    for (let n = nodes.get(id), hops = 0; n && hops < 1e4; n = nodes.get(n.parent), hops++) {
      if (n.id === anc) return true;
    }
    return false;
  }

  const get = (id) => nodes.get(id);
  const all = () => [...nodes.values()];
  const of = (kind) => all().filter((n) => n.kind === kind);
  const children = (id) => all().filter((n) => n.parent === id);
  const refsTo = (id, rel) =>
    all().filter((n) => n.refs.some((r) => r.to === id && (!rel || r.rel === rel)));
  const reset = () => {
    nodes.clear();
    seq = 0;
    t0 = performance.now();
    Object.assign(stats, { calls: 0, ms: 0, tokens: 0, fails: 0 });
    emit();
  };
  const subscribe = (f) => (subs.add(f), () => subs.delete(f));

  return { add, set, get, all, of, children, refsTo, isAncestor, reset, subscribe, now, stats, emit };
}
