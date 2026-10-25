import { $, store, history } from "./state.js";
import { runPass } from "./pass.js";
import { askUser } from "./ask.js";
import { learnResult, tasteForPrompt } from "./learn.js";

export const concurrency = () => Number($("#conc").value) || 4;

// One pass on a fresh graph: the store only ever holds the run in flight.
export function execPass(ver, d) {
  store.reset();
  return runPass(store, ver, d, { concurrency: concurrency(), askUser: (q) => askUser($("#ask"), q), taste: tasteForPrompt() });
}

// Appends the pass result as a child version. Only human directions join ctx.directions: automatic
// picks are not the writer's words and must not be replayed to later prompts as if they were.
export function commitPass(ver, out, label, { source = "pass", human = true } = {}) {
  const ctx = {
    ...ver.ctx, design: out.design,
    answers: [...(ver.ctx.answers ?? []), ...(out.answers ?? [])],
    directions: human ? [...(ver.ctx.directions ?? []), label] : [...(ver.ctx.directions ?? [])],
  };
  const v = history.add(out.song, { label: label.slice(0, 60), parent: ver.n, ctx, source, story: out.story });
  learnResult(source, out.song, out.story);
  return v;
}
