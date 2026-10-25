import { esc } from "./esc.js";
import { ASPECTS } from "./roster.js";
import { layoutHTML } from "./layout.js";
import { designHTML, emptyDesign } from "./design.js";
import { PICKS } from "./picks.js";

// Learned usage reorders the quick picks and marks the writer's habitual aspects.
export function directHTML(ui, ver, draft, prof = null) {
  const used = new Map(prof?.picks ?? []);
  const picks = Object.entries(PICKS).sort((a, b) => (used.get(b[0]) ?? 0) - (used.get(a[0]) ?? 0));
  const fav = new Set((prof?.aspects ?? []).slice(0, 3).map(([k]) => k));
  const items = ui.passLayout ?? ver.song.sections.map((s) => ({ id: s.id, tag: s.tag }));
  const tags = new Map(ver.song.sections.map((s) => [s.id, s.tag]));
  return `<form id="dform" class="direct">` +
    `<div class="picks">${picks.map(([k, p]) => `<button type="button" class="btn" data-pick="${k}">${p.label}</button>`).join("")}</div>` +
    `<div class="row"><b>Scope</b> ${ui.scope.size ? [...ui.scope].map((id) => esc(tags.get(id) ?? id)).join(", ") : "whole song"}` +
    (ui.scope.size ? ` <button type="button" class="lnk" data-clear="scope">clear</button>` : "") + `</div>` +
    `<div class="row"><b>Locked</b> ${ui.locks.size} line${ui.locks.size === 1 ? "" : "s"}` +
    (ui.locks.size ? ` <button type="button" class="lnk" data-clear="locks">clear</button>` : "") + `</div>` +
    `<div class="chips" role="group" aria-label="Aspects">${Object.entries(ASPECTS).map(([k, a]) =>
      `<button type="button" class="chip${fav.has(k) ? " fav" : ""}" data-aspect="${k}" aria-pressed="${ui.aspects.has(k)}">${a.label}</button>`).join("")}</div>` +
    `<details class="lay-box"${ui.passLayout ? " open" : ""}><summary>Layout${ui.passLayout ? " (changed)" : ""}</summary>` +
    layoutHTML("pass", items) +
    (ui.passLayout ? `<button type="button" class="lnk" data-clear="layout">reset layout</button>` : "") + `</details>` +
    `<details class="lay-box pdesign"${ui.passDesign ? " open" : ""}><summary>${ui.passDesign ? "Design (changed)" : "Design"}</summary>` +
    designHTML("pd", ui.passDesign ?? ver.ctx?.design ?? emptyDesign()) + `</details>` +
    `<label class="ef"><span>Direction</span><textarea id="dtext" rows="4">${esc(draft.text)}</textarea></label>` +
    `<div class="row opts2"><label class="chk"><input type="checkbox" id="dclar"${draft.clarify ? " checked" : ""}> Ask me first</label>` +
    `<label class="chk">Rounds <select id="drounds">${[0, 1, 2, 3].map((n) => `<option${n === draft.rounds ? " selected" : ""}>${n}</option>`).join("")}</select></label></div>` +
    `<button type="submit" class="btn pri" id="drun"${ui.busy ? " disabled" : ""}>${ui.busy ? "Working" : `Run pass on v${ver.n}`}</button>` +
    (ui.status ? `<p class="mt">${esc(ui.status)}</p>` : "") +
    `</form>`;
}
