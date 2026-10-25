import { $, ui, current } from "./state.js";
import { LAYOUTS } from "./roster.js";
import { applyLayout } from "./layout.js";
import { designHTML, designEvent, cloneDesign, emptyDesign, sameDesign, hasDesign } from "./design.js";
import { currentProfile } from "./learn.js";

// The last writing setup becomes the default; an explicit choice on the page always wins.
export function applyDefaults(paintForm) {
  const p = currentProfile(), w = p.lastWrite;
  if (w) {
    if (p.preset && LAYOUTS[p.preset] && !ui.formLayout.length) {
      $("#preset").value = p.preset;
      const tags = w.preset === p.preset && w.layout?.length ? w.layout : LAYOUTS[p.preset].tags;
      ui.formLayout = tags.map((tag) => ({ id: null, tag }));
      paintForm();
    }
    if (!$("#styleDir").value && w.styleDir) $("#styleDir").value = w.styleDir;
    if (!$("#excl").value && w.exclude) $("#excl").value = w.exclude;
    if (w.rounds) $("#rounds").value = String(w.rounds);
    if (typeof w.clarify === "boolean") $("#clar").checked = w.clarify;
    if (w.design && !hasDesign(ui.design)) ui.design = cloneDesign(w.design);
  }
  if (p.lastPass?.rounds != null) ui.draft.rounds = p.lastPass.rounds;
}

// Song design in the brief form (ui.design) and in the pass panel (ui.passDesign, null = unchanged).
export function paintFormDesign() {
  $("#fdesign").innerHTML = designHTML("fd", ui.design);
}

export function bindFormDesign() {
  const el = $("#fdesign");
  for (const type of ["click", "input"]) el.addEventListener(type, (e) => designEvent(e, ui.design));
}

// Pass panel: first touch copies the version's design so edits never mutate history.
export function bindPassDesign(dir) {
  for (const type of ["click", "input"]) {
    dir.addEventListener(type, (e) => {
      if (!e.target.closest?.(".pdesign")) return;
      const base = current()?.ctx?.design ?? emptyDesign();
      ui.passDesign ??= cloneDesign(base);
      designEvent(e, ui.passDesign);
      if (sameDesign(ui.passDesign, base)) ui.passDesign = null;
      const s = dir.querySelector(".pdesign summary");
      if (s) s.textContent = ui.passDesign ? "Design (changed)" : "Design";
    });
  }
}

// The design a pass carries, and whether its sound changed (which unlocks the Style field).
export function passDesign(ver) {
  if (!ui.passDesign || sameDesign(ui.passDesign, ver.ctx?.design)) return { design: null, sound: false };
  const a = cloneDesign(ver.ctx?.design), b = ui.passDesign;
  const sound = ["feel", "instruments", "effects", "tone"].some((k) => a[k].join() !== b[k].join()) || a.bpm !== b.bpm;
  return { design: cloneDesign(b), sound };
}

// Brief form layout: preset choice and the editable section list.
export function bindFormLayout(paintForm) {
  $("#preset").addEventListener("change", (e) => {
    ui.formLayout = LAYOUTS[e.target.value].tags.map((tag) => ({ id: null, tag }));
    paintForm();
  });
  $("#flayout").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lay]");
    if (!b) return;
    ui.formLayout = applyLayout(ui.formLayout, b.dataset.lay, Number(b.dataset.i), $("#lay-type-form").value);
    paintForm();
  });
  $("#flayout").addEventListener("input", (e) => {
    const i = Number(e.target.dataset.i);
    if (e.target.classList.contains("lay-tag") && ui.formLayout[i]) ui.formLayout[i].tag = e.target.value.trim() || ui.formLayout[i].tag;
  });
}
