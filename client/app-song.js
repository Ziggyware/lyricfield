import { $, history, ui, current, resetTargets, copyText } from "./state.js";
import { sheetHTML } from "./sheet.js";
import { editorHTML, readEditor } from "./editor.js";
import { directHTML } from "./direct.js";
import { lyricsText, sheetText } from "./song.js";
import { bindDirect } from "./app-direct.js";
import { autoHTML, bindAuto } from "./app-auto.js";
import { learnLock, learnCopy, learnRestore, learnEdit, currentProfile } from "./learn.js";

export function paintSong() {
  const ver = current();
  const sheet = $("#sheet"), dir = $("#direct");
  if (!ver) {
    sheet.innerHTML = `<p class="empty">Write a song to start; each pass adds a version here.</p>`;
    dir.innerHTML = "";
    return;
  }
  const parent = history.get(ver.parent);
  sheet.innerHTML = ui.edit ? editorHTML(ver.song) : sheetHTML(ui, ver, history.all(), parent);
  dir.innerHTML = directHTML(ui, ver, ui.draft, currentProfile()) + autoHTML(ver);
}

const COPY = {
  lyrics: (s) => lyricsText(s, ui.notes), style: (s) => s.style, exclude: (s) => s.exclude,
  backstory: (s) => s.backstory, sheet: (s) => sheetText(s),
};

const toggle = (set, key) => (set.has(key) ? set.delete(key) : set.add(key));

export function bindSong(paintAll) {
  const sheet = $("#sheet");

  sheet.addEventListener("change", (e) => {
    if (e.target.id === "ver") { ui.cur = Number(e.target.value); resetTargets(); ui.diff = false; paintSong(); }
    if (e.target.id === "notes") { ui.notes = e.target.checked; paintSong(); }
  });
  const lockLine = (el) => {
    const ver = current(), sid = el.dataset.lock, i = Number(el.dataset.i), key = `${sid}:${i}`;
    const text = ver.song.sections.find((s) => s.id === sid)?.lines[i];
    if (ui.locks.has(key)) ui.locks.delete(key);
    else if (text) { ui.locks.set(key, { sid, i, text }); learnLock(ver.song, sid, text); }
    paintSong();
    sheet.querySelector(`[data-lock="${sid}"][data-i="${i}"]`)?.focus({ preventScroll: true });
  };
  sheet.addEventListener("click", (e) => {
    const ver = current();
    const sc = e.target.closest("[data-scope]");
    if (sc) { toggle(ui.scope, sc.dataset.scope); paintSong(); return; }
    const ln = e.target.closest("[data-lock]");
    if (ln) { lockLine(ln); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) { copyText(cp, COPY[cp.dataset.copy](ver.song), $("#sheetBody")); learnCopy(cp.dataset.copy, ver); return; }
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "diff") { ui.diff = !ui.diff; paintSong(); }
    if (a === "edit") { ui.edit = true; paintSong(); }
    if (a === "cancel") { ui.edit = false; paintSong(); }
    if (a === "restore") {
      learnRestore(history.latest()?.label ?? "");
      const v = history.add(ver.song, { label: `restore v${ver.n}`, parent: ver.n, ctx: ver.ctx, source: "restore", story: ver.story });
      ui.cur = v.n; resetTargets(); paintSong();
    }
  });
  sheet.addEventListener("keydown", (e) => {
    const ln = e.target.closest("[data-lock]");
    if (ln && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); lockLine(ln); }
  });
  sheet.addEventListener("submit", (e) => {
    e.preventDefault();
    const ver = current();
    const song = readEditor(sheet, ver.song);
    learnEdit(ver.song, song);
    const v = history.add(song, { label: "manual edit", parent: ver.n, ctx: ver.ctx, source: "manual" });
    ui.cur = v.n; resetTargets(); paintSong();
  });
  bindDirect(paintSong, paintAll);
  bindAuto($("#direct"), paintSong, paintAll);
}
