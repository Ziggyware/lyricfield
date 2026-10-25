import { $, store, history, ui, ls, resetTargets } from "./state.js";
import { run } from "./engine.js";
import { LAYOUTS } from "./roster.js";
import { esc } from "./esc.js";
import { PICKS } from "./picks.js";
import { layoutHTML } from "./layout.js";
import { paintSong, bindSong } from "./app-song.js";
import { askUser } from "./ask.js";
import { runAuto } from "./app-auto.js";
import { concurrency } from "./app-pass.js";
import { taste } from "./taste.js";
import { learnWrite, learnResult, tasteForPrompt } from "./learn.js";
import { applyDefaults, paintFormDesign, bindFormDesign, bindFormLayout } from "./app-design.js";
import { cloneDesign, hasDesign } from "./design.js";

const brief = $("#brief");
brief.value = ls.get("lf.brief") ?? brief.value;
brief.addEventListener("input", () => ls.set("lf.brief", brief.value));
$("#preset").innerHTML = Object.entries(LAYOUTS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("");
const paintForm = () => { $("#flayout").innerHTML = layoutHTML("form", ui.formLayout); };

// One status line while work runs: automatic step, kept/total steps, live agents, inference totals.
function paintProg() {
  const el = $("#prog");
  el.hidden = !ui.busy;
  if (!ui.busy) return;
  const ps = store.of("promise"), s = store.stats;
  const live = ps.filter((p) => p.status === "running").slice(-3).map((p) => `${p.agent}: ${p.label}`);
  el.innerHTML = (ui.auto ? `<b>Auto ${ui.auto.step}/${ui.auto.max}</b> ${esc(PICKS[ui.auto.key]?.label ?? "")} · ` : "") +
    `<b>${ps.filter((p) => p.status === "kept").length}/${ps.length}</b> steps · ${s.calls} calls · ${s.tokens} tokens` +
    (s.fails ? ` · ${s.fails} retried` : "") + (live.length ? `<span class="live">${live.map(esc).join("<br>")}</span>` : "");
}

function paint() {
  paintProg();
  $("#err").hidden = !ui.error;
  $("#err").textContent = ui.error;
  $("#go").disabled = ui.busy;
  $("#go").textContent = ui.busy ? "Working" : "Write song";
}
store.subscribe(paintProg);
const paintAll = () => { paint(); paintSong(); };

$("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = brief.value.trim();
  if (!text || ui.busy) return;
  Object.assign(ui, { busy: true, error: "", autoLog: [] });
  $("#dir").open = false;
  paintAll();
  const input = {
    brief: text, layout: ui.formLayout.map((x) => x.tag), styleDir: $("#styleDir").value.trim(),
    exclude: $("#excl").value.trim(), clarify: $("#clar").checked, rounds: Number($("#rounds").value),
    design: hasDesign(ui.design) ? cloneDesign(ui.design) : null,
  };
  learnWrite(input, $("#preset").value);
  input.taste = tasteForPrompt();
  let v = null;
  try {
    const out = await run(store, input, { concurrency: concurrency(), askUser: (q) => askUser($("#ask"), q) });
    v = history.add(out.song, { label: out.song.title, parent: null, ctx: out.ctx, source: "write", story: out.story });
    learnResult("write", out.song, out.story);
    ui.cur = v.n; resetTargets();
  } catch (err) {
    ui.error = `Stopped: ${err.message}`;
  } finally {
    ui.busy = false;
    paintAll();
  }
  const n = Number($("#autoN").value);
  if (v && n) await runAuto(v, { program: "adaptive", order: [], max: n, rounds: 1, accept: "same" }, paintAll);
});

$("#tasteOn").checked = taste.on;
$("#tasteOn").addEventListener("change", (e) => { taste.on = e.target.checked; });
let confirmForget = false;
$("#forget").addEventListener("click", (e) => {
  if (confirmForget) taste.forgetAll();
  confirmForget = !confirmForget;
  e.target.textContent = confirmForget ? "Confirm: forget everything" : "Forgotten";
});

applyDefaults(paintForm);
paintFormDesign();
bindFormDesign();
bindFormLayout(paintForm);
bindSong(paintAll);
paintForm();
paintAll();
