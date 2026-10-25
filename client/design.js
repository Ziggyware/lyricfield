import { esc } from "./esc.js";
import { DESIGN, TEXTS, LABEL } from "./design-data.js";
export { DESIGN, TEXTS };

export const emptyDesign = () => ({ ...Object.fromEntries(Object.keys(DESIGN).map((k) => [k, []])), bpm: "", ...Object.fromEntries(Object.keys(TEXTS).map((k) => [k, ""])) });
export const cloneDesign = (d) => JSON.parse(JSON.stringify({ ...emptyDesign(), ...(d ?? {}) }));
export const sameDesign = (a, b) => JSON.stringify(cloneDesign(a)) === JSON.stringify(cloneDesign(b));
export const hasDesign = (d) => !!d && (Object.keys(DESIGN).some((k) => d[k]?.length) || !!(d.bpm || Object.keys(TEXTS).some((k) => d[k])));

// Prompt block: every agent sees the same design.
export function designText(d) {
  if (!hasDesign(d)) return "";
  const L = [];
  for (const [k, t] of Object.entries(TEXTS)) if (d[k]) L.push(`${t}: ${d[k]}`);
  for (const k of Object.keys(DESIGN)) if (d[k]?.length) L.push(`${LABEL[k]}: ${d[k].join(", ")}`);
  if (d.bpm) L.push(`Tempo: ${d.bpm} BPM`);
  return `Song design chosen by the writer (honor every item; the Style field must carry the beat, tempo, instruments and effects):\n${L.join("\n")}`;
}

export function designHTML(prefix, d) {
  return `<div class="design">` +
    Object.entries(TEXTS).map(([k, t]) =>
      `<label class="ef"><span>${t}</span><input id="${prefix}-${k}" data-dtext="${k}" value="${esc(d[k] ?? "")}"></label>`).join("") +
    Object.entries(DESIGN).map(([k, opts]) => `<div class="ef"><span>${LABEL[k]}</span><div class="chips">` +
      opts.map((o) => `<button type="button" class="chip" data-dchip="${k}" data-v="${esc(o)}" aria-pressed="${d[k]?.includes(o) ?? false}">${esc(o)}</button>`).join("") +
      (k === "feel" ? `<label class="chk">BPM <input id="${prefix}-bpm" data-dtext="bpm" inputmode="numeric" size="4" value="${esc(d.bpm ?? "")}"></label>` : "") +
      `</div></div>`).join("") + `</div>`;
}

// Event delegation shared by the brief form and the pass panel. Returns true when it handled the event.
export function designEvent(e, d) {
  const c = e.target.closest?.("[data-dchip]");
  if (e.type === "click" && c) {
    const k = c.dataset.dchip, v = c.dataset.v, i = d[k].indexOf(v);
    i >= 0 ? d[k].splice(i, 1) : d[k].push(v);
    c.setAttribute("aria-pressed", String(i < 0));
    return true;
  }
  const t = e.target.dataset?.dtext;
  if (e.type === "input" && t) {
    d[t] = t === "bpm" ? e.target.value.replace(/\D/g, "").slice(0, 3) : e.target.value;
    return true;
  }
  return false;
}

// The Style field must reflect the sound the writer chose.
export function designFindings(song, d) {
  if (!hasDesign(d)) return [];
  const style = song.style.toLowerCase(), out = [];
  const add = (msg) => out.push({ sev: "warn", where: "Style", msg, gate: true, story: false, sid: null });
  if (d.bpm && !style.includes(String(d.bpm))) add(`missing the chosen tempo ${d.bpm} BPM`);
  const sound = [...d.instruments, ...d.effects, ...d.feel];
  const missing = sound.filter((x) => !style.includes(x.toLowerCase().split(" ")[0]));
  if (sound.length && missing.length * 2 > sound.length) add(`leaves out chosen sound: ${missing.join(", ")}`);
  return out;
}

// Categorical design summary for the event log (chips and tempo only; free text stays out of the server).
export const designChips = (d) =>
  hasDesign(d) ? { ...Object.fromEntries(Object.keys(DESIGN).map((k) => [k, [...d[k]]])), bpm: d.bpm ? Number(d.bpm) : null } : {};
