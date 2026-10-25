import { createStore } from "./store.js";
import { createHistory } from "./versions.js";
import { emptyDesign } from "./design.js";

export const $ = (s) => document.querySelector(s);
export const store = createStore();     // the run in flight: intentions, promises, timers (drives progress)
export const history = createHistory();

export const ui = {
  busy: false, error: "",
  cur: history.latest()?.n ?? null,      // version shown on the sheet
  scope: new Set(), locks: new Map(),    // pass targets on the shown version
  aspects: new Set(), passLayout: null,  // null = keep the version's layout
  formLayout: [], diff: false, edit: false, notes: false, status: "", pick: null,
  draft: { text: "", clarify: true, rounds: 1 }, // pass panel inputs survive re-renders
  design: emptyDesign(), passDesign: null,       // song design: brief form / pass panel (null = unchanged)
  autoCfg: { program: "adaptive", order: [], max: 4, rounds: 1, accept: "same" },
  autoLog: [], auto: null, stop: false, autoOpen: false,
};

export const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

export const current = () => history.get(ui.cur) ?? history.latest();

export function resetTargets() {
  ui.scope.clear();
  ui.locks.clear();
  ui.aspects.clear();
  ui.passLayout = null;
  ui.passDesign = null;
  ui.edit = false;
}

export async function copyText(btn, text, selectEl) {
  const label = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied";
  } catch {
    if (selectEl) getSelection().selectAllChildren(selectEl);
    btn.textContent = "Selected";
  }
  setTimeout(() => { btn.textContent = label; }, 1400);
}
