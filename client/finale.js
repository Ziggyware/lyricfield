import { ask } from "./llm.js";
import * as P from "./prompts.js";
import { route, convene, kept } from "./groups.js";
import { stage, settle } from "./graph.js";
import { tournament } from "./tournament.js";
import { refine, accept } from "./refine.js";
import { spineText } from "./narrative.js";
import * as S from "./prompts-story.js";

const EMPTY = { title: "", backstory: "", arc: {}, sections: [], style: "", exclude: "" };

function digest(store) {
  const parts = kept(store).map((p) => `## ${p.agent}: ${p.label}\n${String(p.data.output).slice(0, 1400)}`);
  for (const g of store.of("group")) if (g.data.decision) parts.push(`## Group ${g.label} decided\n${g.data.decision}`);
  for (const a of store.of("answer")) parts.push(`## ${a.agent} answered "${store.get(a.parent)?.label}"\n${a.label}`);
  return parts.join("\n\n");
}

// STORY plans the spine: the arc and one event per section, before any hook or line exists.
async function buildSpine(store, root, ctx, slot) {
  const sp = stage(store, root, "Plan the story spine: want, obstacle, stakes, turn, change, one event per section", "STORY");
  try {
    const r = await slot(() => ask(store, { agent: "STORY", parent: sp.id, temperature: 0.85, ...S.spine(ctx, digest(store)) }));
    const beats = (Array.isArray(r.beats) ? r.beats : []).filter((b) => b?.event).map((b) => ({ tag: String(b.tag ?? ""), event: String(b.event), shift: String(b.shift ?? "") }));
    if (!beats.length) throw new Error("no beats in reply");
    ctx.spine = { arc: r.arc ?? {}, beats };
    store.set(sp.id, { status: "kept", data: { output: spineText(ctx.spine) } });
    if (r.arc?.meaning) store.add("reason", `Meaning: ${r.arc.meaning}`, { agent: "STORY", parent: sp.id });
  } catch (e) {
    store.set(sp.id, { status: "broken", data: { error: e.message } });
  }
}

// Groups → story spine → hook tournament → first draft (layout enforced) → critique rounds gated on
// form and story. Returns { song, lint, story, ctx }; ctx is what later passes need to stay on-brief.
export async function finale(store, root, ctx, slot, rounds) {
  route(store);
  await Promise.all(store.of("group").map((g) => convene(store, g, ctx, slot)));
  await buildSpine(store, root, ctx, slot);

  const hook = await tournament(store, root, ctx, digest(store), slot);
  if (hook) ctx.hook = hook.text;

  const upstream = [...kept(store), ...store.of("group")].map((n) => n.id);
  const dp = stage(store, root, "Assemble the first full draft", "COMPOSER", upstream);
  let draft;
  try {
    const r = await slot(() => ask(store, { agent: "COMPOSER", parent: dp.id, temperature: 0.95, maxTokens: 8000, ...P.compose(ctx, digest(store)) }));
    const layout = ctx.layout.length ? ctx.layout.map((tag) => ({ id: null, tag })) : null;
    draft = accept(store, dp, EMPTY, r, layout ? { layout } : null);
  } catch (e) {
    store.set(dp.id, { status: "broken", data: { error: e.message } });
    throw new Error(`COMPOSER: ${e.message}`);
  }
  store.set(dp.id, { status: "kept", data: { output: draft.sections.map((s) => `[${s.tag}]\n${s.lines.join("\n")}`).join("\n\n") } });
  store.add("lyric", `Draft: ${draft.title}`, { agent: "COMPOSER", parent: dp.id, status: "draft" });

  const out = await refine(store, root, ctx, draft, { slot, rounds, after: dp });
  store.add("lyric", out.song.title, { agent: "COMPOSER", parent: out.last.id, status: "final" });
  settle(store, root);
  const { brief, layout, styleDir, exclude, answers, thesis, risk, title, spine, design } = ctx;
  return { song: out.song, lint: out.lint, story: out.story, ctx: { brief, layout, styleDir, exclude, answers, thesis, risk, title, spine, design, hook: ctx.hook ?? "" } };
}
