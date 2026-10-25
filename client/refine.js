import { ask } from "./llm.js";
import * as P from "./prompts.js";
import { arr, stage } from "./graph.js";
import { normalize } from "./song.js";
import { lint, gateOf, metrics, lintText } from "./suno.js";
import { enforce } from "./enforce.js";
import { auditStory } from "./arc.js";
import { designFindings } from "./design.js";

// Applies a COMPOSER reply under the directive's guarantees and records each repair as a reason.
export function accept(store, prom, prev, raw, d) {
  const next = normalize(raw, prev);
  if (!next.sections.some((s) => s.lines.length)) throw new Error("no sung lines in reply");
  const { song, repairs } = enforce(prev, next, d ?? {});
  for (const r of repairs) store.add("reason", r, { agent: "COMPOSER", parent: prom.id, status: "repair" });
  return song;
}

// Scoped passes only answer for their sections; whole-song findings (arc, chorus) always count.
const inScope = (d) => (f) => !d?.scope?.length || !f.sid || d.scope.includes(f.sid);

// CRITIC → COMPOSER rounds against three gates: measured form (Suno/prosody lint), the STORY audit of
// what happens and whether people can relate, and the writer's chosen design. Stops once a revision
// passes all three. The section list is frozen: rounds fix lines and beats, they do not restructure.
export async function refine(store, root, ctx, song, { slot, rounds = 2, after = null, d = null }) {
  let cur = song, prev = after, L = lint(cur);
  let A = await auditStory(store, root, ctx, cur, slot, prev);
  const failing = () => [...gateOf(L), ...A.findings.filter(inScope(d)), ...designFindings(cur, ctx.design)];
  for (let round = 1; round <= rounds; round++) {
    const fails = lintText(failing());
    const cp = stage(store, root, `Round ${round}: name the dismissal and flag what fits it`, "CRITIC", prev ? [prev.id] : []);
    let notes = "";
    try {
      const c = await slot(() => ask(store, { agent: "CRITIC", parent: cp.id, temperature: 0.6, ...P.critique(ctx, cur, metrics(cur), fails, d) }));
      const flags = arr(c.flags).map((f) => `- ${f.sid ?? ""} "${f.line}": ${f.why} → ${f.fix}`).join("\n");
      notes = `Dismissal: ${c.dismissal ?? ""}\n${flags}${arr(c.keep).length ? `\nKeep:\n${arr(c.keep).join("\n")}` : ""}`;
      store.set(cp.id, { status: "kept", data: { output: notes } });
      for (const f of arr(c.flags)) store.add("reason", `"${f.line}": ${f.why}`, { agent: "CRITIC", parent: cp.id, data: { fix: f.fix } });
    } catch (e) {
      store.set(cp.id, { status: "broken", data: { error: e.message } });
    }
    const heard = Object.entries(A.events).map(([sid, ev]) => `${sid}: ${ev}`).join("\n");
    if (heard) notes += `\nWhat a listener hears happen per section (fix the static ones):\n${heard}`;
    const rp = stage(store, root, `Round ${round}: revise against critique, story audit and measurements`, "COMPOSER", [cp.id]);
    try {
      const r = await slot(() => ask(store, { agent: "COMPOSER", parent: rp.id, temperature: 0.8, maxTokens: 8000, ...P.revise(ctx, cur, notes, fails, d) }));
      cur = accept(store, rp, cur, r, { ...(d ?? {}), layout: cur.sections.map((s) => ({ id: s.id, tag: s.tag })) });
      L = lint(cur);
      store.set(rp.id, { status: "kept", data: { output: lintText(gateOf(L)) || "form gate passed" } });
    } catch (e) {
      store.set(rp.id, { status: "broken", data: { error: e.message } });
    }
    prev = rp;
    A = await auditStory(store, root, ctx, cur, slot, rp);
    const open = failing();
    if (!open.length) break;
    store.add("reminder", `${open.length} gate failures after round ${round}`, {
      agent: "CRITIC", parent: rp.id, status: round < rounds ? "fired" : "pending", data: { failures: open.map((x) => `${x.where} ${x.msg}`) },
    });
  }
  return { song: cur, lint: L, story: { findings: [...A.findings, ...designFindings(cur, ctx.design)], events: A.events, meaning: A.meaning }, last: prev };
}
