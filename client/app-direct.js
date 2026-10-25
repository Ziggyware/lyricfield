import { $, ui, current, resetTargets } from "./state.js";
import { PICKS, pickScope } from "./picks.js";
import { applyLayout, sameLayout } from "./layout.js";
import { execPass, commitPass } from "./app-pass.js";
import { learnPass } from "./learn.js";
import { bindPassDesign, passDesign } from "./app-design.js";

const toggle = (set, key) => (set.has(key) ? set.delete(key) : set.add(key));

// Direct panel: aspects, scope/lock clearing, quick picks, layout edits, and running a pass.
export function bindDirect(paintSong, paintAll) {
  const dir = $("#direct");
  bindPassDesign(dir);
  dir.addEventListener("input", (e) => {
    if (e.target.id === "dtext") ui.draft.text = e.target.value;
    if (e.target.classList.contains("lay-tag")) {
      const ver = current();
      ui.passLayout ??= ver.song.sections.map((s) => ({ id: s.id, tag: s.tag }));
      ui.passLayout[Number(e.target.dataset.i)].tag = e.target.value.trim() || ui.passLayout[Number(e.target.dataset.i)].tag;
    }
  });
  dir.addEventListener("change", (e) => {
    if (e.target.id === "dclar") ui.draft.clarify = e.target.checked;
    if (e.target.id === "drounds") ui.draft.rounds = Number(e.target.value);
  });
  dir.addEventListener("click", (e) => {
    const ver = current();
    if (e.target.closest(".pdesign")) return; // handled by bindPassDesign without a re-render
    const t = e.target.closest("[data-aspect],[data-clear],[data-pick],[data-lay]");
    if (!t) return;
    if (t.dataset.aspect) { toggle(ui.aspects, t.dataset.aspect); ui.pick = null; }
    if (t.dataset.clear === "scope") ui.scope.clear();
    if (t.dataset.clear === "locks") ui.locks.clear();
    if (t.dataset.clear === "layout") ui.passLayout = null;
    if (t.dataset.pick) {
      const p = PICKS[t.dataset.pick];
      ui.aspects = new Set(p.aspects);
      ui.scope = new Set(pickScope(t.dataset.pick, ver));
      ui.draft.text = p.text;
      ui.pick = t.dataset.pick;
    }
    if (t.dataset.lay) {
      const items = ui.passLayout ?? ver.song.sections.map((s) => ({ id: s.id, tag: s.tag }));
      ui.passLayout = applyLayout(items, t.dataset.lay, Number(t.dataset.i), $("#lay-type-pass")?.value);
      if (sameLayout(ui.passLayout, ver.song)) ui.passLayout = null;
    }
    paintSong();
  });
  dir.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (ui.busy) return;
    const ver = current();
    const layout = ui.passLayout && !sameLayout(ui.passLayout, ver.song) ? ui.passLayout : null;
    const d = {
      text: ui.draft.text.trim(), aspects: [...ui.aspects], scope: [...ui.scope], locks: [...ui.locks.values()],
      layout, clarify: ui.draft.clarify, rounds: ui.draft.rounds,
    };
    const pd = passDesign(ver);
    if (pd.design) {
      d.design = pd.design;
      if (pd.sound && d.aspects.length && !d.aspects.includes("style")) d.aspects.push("style");
    }
    if (!d.text && !d.aspects.length && !layout && !d.design) { ui.status = "Pick an aspect, change the layout or design, or write a direction first."; paintSong(); return; }
    learnPass(d, ver.song, ui.pick, ui.pick ? PICKS[ui.pick].text : null);
    Object.assign(ui, { busy: true, error: "", status: "" });
    paintAll();
    try {
      const out = await execPass(ver, d);
      const v = commitPass(ver, out, d.text || d.aspects.join(", ") || "layout");
      ui.cur = v.n; resetTargets(); ui.draft.text = ""; ui.pick = null;
    } catch (err) {
      ui.error = `Pass stopped: ${err.message}`;
    } finally {
      ui.busy = false;
      paintAll();
    }
  });
}
