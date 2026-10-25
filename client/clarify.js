import { ask } from "./llm.js";
import { arr } from "./graph.js";
import { record } from "./taste.js";

// CLARIFIER → USER round trip. The question nodes stay in the graph; the pass waits on the human through
// `askUser(questions) → Promise<(string|null)[]>`. Returns answer strings ("question → answer").
export async function clarify(store, root, prompt, askUser, slot) {
  const p = store.add("promise", "Ask the human what would change the song", {
    agent: "CLARIFIER", parent: root.id, status: "running", refs: [{ rel: "serves", to: root.id }],
  });
  let out;
  try {
    out = await slot(() => ask(store, { agent: "CLARIFIER", parent: p.id, temperature: 0.4, ...prompt }));
  } catch (e) {
    store.set(p.id, { status: "broken", data: { error: e.message } });
    return [];
  }
  if (out.interpretation) store.add("reason", out.interpretation, { agent: "CLARIFIER", parent: p.id, refs: [{ rel: "justifies", to: p.id }] });
  const qs = arr(out.questions).filter((q) => q?.q).slice(0, 3)
    .map((q) => ({ q: String(q.q).trim(), options: arr(q.options).map((o) => String(o).trim()).filter(Boolean).slice(0, 4) }));
  if (!qs.length) {
    store.set(p.id, { status: "kept", data: { output: out.interpretation ?? "" } });
    return [];
  }
  const nodes = qs.map((q) => store.add("question", q.q, { agent: "CLARIFIER", parent: p.id, status: "open", data: { to: "USER", options: q.options } }));
  const w = store.add("waiter", "CLARIFIER awaits USER", {
    agent: "CLARIFIER", parent: p.id, status: "waiting", refs: nodes.map((n) => ({ rel: "awaits", to: n.id })),
  });
  const replies = await askUser(qs);
  const answers = [];
  nodes.forEach((n, i) => {
    const a = String(replies?.[i] ?? "").trim();
    record("answer", { q: qs[i].q, a, option: qs[i].options.includes(a) });
    if (!a) { store.set(n.id, { status: "skipped" }); return; }
    store.add("answer", a, { agent: "USER", parent: n.id, refs: [{ rel: "answers", to: n.id }] });
    store.set(n.id, { status: "answered" });
    answers.push(`${qs[i].q} → ${a}`);
  });
  store.set(w.id, { status: "released" });
  store.set(p.id, { status: "kept", data: { output: answers.join("\n") || "(all skipped)" } });
  return answers;
}
