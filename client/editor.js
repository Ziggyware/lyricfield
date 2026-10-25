import { esc } from "./esc.js";
import { normalize } from "./song.js";
import { ARC } from "./narrative.js";

// Manual edit mode: every field of the shown version, committed as a new version.
const area = (id, label, value, rows = 3) =>
  `<label class="ef"><span>${label}</span><textarea id="${id}" rows="${rows}">${esc(value)}</textarea></label>`;
const field = (id, label, value) =>
  `<label class="ef"><span>${label}</span><input id="${id}" value="${esc(value)}"></label>`;

export function editorHTML(song) {
  return `<form class="sheet edit" id="editor">` +
    field("e-title", "Title", song.title) +
    area("e-backstory", "Backstory", song.backstory, 4) +
    `<fieldset class="esec"><legend>Arc</legend>${ARC.map((k) => field(`e-arc-${k}`, k, song.arc?.[k] ?? "")).join("")}</fieldset>` +
    song.sections.map((s) => `<fieldset class="esec"><legend>${esc(s.tag)}</legend>` +
      `<div class="erow">${field(`e-${s.id}-tag`, "Tag", s.tag)}${field(`e-${s.id}-desc`, "Cue", s.desc)}</div>` +
      field(`e-${s.id}-beat`, "Beat (what happens)", s.beat ?? "") +
      field(`e-${s.id}-note`, "** note", s.note) +
      area(`e-${s.id}-lines`, "Lines", s.lines.join("\n"), Math.max(2, s.lines.length + 1)) +
      `</fieldset>`).join("") +
    area("e-style", "Style", song.style, 3) +
    area("e-exclude", "Exclude", song.exclude, 2) +
    `<div class="ask-act"><button type="submit" class="btn pri">Commit as new version</button>` +
    `<button type="button" class="btn" data-a="cancel">Cancel</button></div></form>`;
}

// Reads the editor back through the same sanitizers the model output goes through.
export function readEditor(root, song) {
  const v = (id) => root.querySelector(`#${id}`)?.value ?? "";
  return normalize({
    title: v("e-title"), backstory: v("e-backstory"), style: v("e-style"), exclude: v("e-exclude"),
    arc: Object.fromEntries(ARC.map((k) => [k, v(`e-arc-${k}`)])),
    sections: song.sections.map((s) => ({
      id: s.id, tag: v(`e-${s.id}-tag`), beat: v(`e-${s.id}-beat`), desc: v(`e-${s.id}-desc`), note: v(`e-${s.id}-note`), lines: v(`e-${s.id}-lines`),
    })),
  }, song);
}
