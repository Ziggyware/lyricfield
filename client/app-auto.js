import { $, ui, current, resetTargets } from "./state.js";
import { esc } from "./esc.js";
import { PICKS } from "./picks.js";
import { autoImprove, PROGRAMS, cost, planLength } from "./auto.js";
import { execPass, commitPass } from "./app-pass.js";
import { learnPass, learnAuto } from "./learn.js";

const ACCEPTS = { same: "not worse", better: "only improvements", always: "every pass" };
const fmt = (c) => (c === Infinity ? "?" : String(c));
const opt = (v, cur, label = v) => `<option value="${v}"${String(v) === String(cur) ? " selected" : ""}>${label}</option>`;

function logLine(x) {
  if (x.end) return `<li class="mt">${esc(x.end)}</li>`;
  const name = PICKS[x.key]?.label ?? x.key;
  if (x.error) return `<li class="sev-error">${x.step + 1}. ${esc(name)}: failed, ${esc(x.error)}</li>`;
  return `<li class="${x.kept ? "ok" : "mt"}">${x.step + 1}. ${esc(name)}: ${fmt(x.before)} → ${fmt(x.after)} ${x.kept ? `kept as v${x.v}` : "discarded"}</li>`;
}

export function autoHTML(ver) {
  const c = ui.autoCfg, running = ui.busy && ui.auto;
  return `<details class="lay-box auto"${ui.autoOpen ? " open" : ""}><summary>Auto passes</summary><div class="direct">` +
    `<div class="chips" role="group" aria-label="Program">${Object.entries(PROGRAMS).map(([k, p]) =>
      `<button type="button" class="chip" data-aprog="${k}" aria-pressed="${c.program === k}" title="${esc(p.hint)}">${p.label}</button>`).join("")}</div>` +
    `<p class="mt">${esc(PROGRAMS[c.program].hint)}. Failure cost now: ${fmt(cost(ver.song, ver.story))}.</p>` +
    (c.program === "custom" ? `<div class="chips" role="group" aria-label="Order">${Object.entries(PICKS).map(([k, p]) =>
      `<button type="button" class="chip" data-aord="${k}">${p.label}</button>`).join("")}</div>` +
      `<div class="row"><b>Order</b> ${c.order.length ? c.order.map((k, i) => `${i + 1} ${esc(PICKS[k].label)}`).join(" → ") : "none"}` +
      (c.order.length ? ` <button type="button" class="lnk" data-aclear="1">clear</button>` : "") + `</div>` : "") +
    `<div class="row opts2"><label class="chk">Passes <select data-acfg="max">${[1, 2, 3, 4, 6, 8].map((n) => opt(n, c.max)).join("")}</select></label>` +
    `<label class="chk">Rounds each <select data-acfg="rounds">${[1, 2, 3].map((n) => opt(n, c.rounds)).join("")}</select></label>` +
    `<label class="chk">Keep <select data-acfg="accept">${Object.entries(ACCEPTS).map(([k, l]) => opt(k, c.accept, l)).join("")}</select></label></div>` +
    (running ? `<button type="button" class="btn" data-auto="stop"${ui.stop ? " disabled" : ""}>${ui.stop ? "Stopping after this pass" : "Stop after this pass"}</button>`
      : `<button type="button" class="btn pri" data-auto="run"${ui.busy || (c.program === "custom" && !c.order.length) ? " disabled" : ""}>Auto-improve v${ver.n}</button>`) +
    (ui.autoLog.length ? `<ol class="alog">${ui.autoLog.map(logLine).join("")}</ol>` : "") + `</div></details>`;
}

// Runs the program from `ver`; each kept candidate is shown at once.
export async function runAuto(ver, cfg, paintAll) {
  Object.assign(ui, { busy: true, error: "", stop: false, autoLog: [], auto: { step: 0, max: planLength(ver, cfg) } });
  paintAll();
  const locks = ver.n === current()?.n ? [...ui.locks.values()] : [];
  let kept = 0;
  try {
    await autoImprove(ver, { ...cfg, locks }, {
      stopped: () => ui.stop,
      pass: (v, d, key) => {
        ui.auto = { ...ui.auto, step: ui.autoLog.filter((x) => !x.end).length + 1, key };
        learnPass(d, v.song, key, PICKS[key].text);
        paintAll();
        return execPass(v, d);
      },
      keep: (v, out, d, key) => {
        const nv = commitPass(v, out, `auto · ${PICKS[key].label}`, { source: "auto", human: false });
        ui.cur = nv.n; kept++;
        return nv;
      },
      log: (x) => { ui.autoLog.push(x.kept ? { ...x, v: ui.cur } : x); paintAll(); },
    });
  } catch (e) {
    ui.error = `Auto stopped: ${e.message}`;
  } finally {
    learnAuto(cfg, ui.autoLog.filter((x) => !x.end).length, kept);
    Object.assign(ui, { busy: false, auto: null, stop: false });
    resetTargets();
    paintAll();
  }
}

export function bindAuto(dir, paintSong, paintAll) {
  dir.addEventListener("toggle", (e) => { if (e.target.classList?.contains("auto")) ui.autoOpen = e.target.open; }, true);
  dir.addEventListener("change", (e) => {
    const k = e.target.dataset?.acfg;
    if (k) ui.autoCfg[k] = k === "accept" ? e.target.value : Number(e.target.value);
  });
  dir.addEventListener("click", (e) => {
    const t = e.target.closest("[data-aprog],[data-aord],[data-aclear],[data-auto]");
    if (!t) return;
    const c = ui.autoCfg;
    if (t.dataset.aprog) c.program = t.dataset.aprog;
    if (t.dataset.aord) c.order.push(t.dataset.aord);
    if (t.dataset.aclear) c.order = [];
    if (t.dataset.auto === "stop") ui.stop = true;
    if (t.dataset.auto === "run") { runAuto(current(), { ...c, order: [...c.order] }, paintAll); return; }
    paintSong();
  });
}
