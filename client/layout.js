import { SECTION_TYPES } from "./roster.js";
import { esc } from "./esc.js";

// Ordered section list editor shared by the brief form ("form") and the pass panel ("pass").
// Items are { id|null, tag }: id ties an entry to an existing section, null means write it fresh.
export const layoutHTML = (list, items) =>
  `<ol class="lay" data-list="${list}">` + items.map((it, i) =>
    `<li><span class="lay-n">${i + 1}</span>` +
    `<input class="lay-tag" id="lay-${list}-${i}" data-list="${list}" data-i="${i}" value="${esc(it.tag)}" aria-label="Section ${i + 1}">` +
    (it.id ? "" : `<span class="lay-new">new</span>`) +
    `<button type="button" data-lay="up" data-list="${list}" data-i="${i}" aria-label="Move up"${i ? "" : " disabled"}>↑</button>` +
    `<button type="button" data-lay="down" data-list="${list}" data-i="${i}" aria-label="Move down"${i < items.length - 1 ? "" : " disabled"}>↓</button>` +
    `<button type="button" data-lay="del" data-list="${list}" data-i="${i}" aria-label="Remove">×</button></li>`).join("") +
  `</ol><div class="lay-add"><select id="lay-type-${list}" aria-label="Section type">` +
  SECTION_TYPES.map((t) => `<option>${t}</option>`).join("") +
  `</select><button type="button" class="btn" data-lay="add" data-list="${list}">Add</button></div>`;

const numbered = /^(Verse|Rap Verse)$/;
export function nextTag(items, type) {
  if (!numbered.test(type)) return type;
  const n = items.filter((x) => new RegExp(`^${type} \\d+$`).test(x.tag)).length + 1;
  return `${type} ${n}`;
}

export function applyLayout(items, act, i, type) {
  const a = items.map((x) => ({ ...x }));
  if (act === "up" && i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]];
  if (act === "down" && i < a.length - 1) [a[i + 1], a[i]] = [a[i], a[i + 1]];
  if (act === "del") a.splice(i, 1);
  if (act === "add") a.push({ id: null, tag: nextTag(a, type) });
  return a;
}

export const sameLayout = (items, song) =>
  items.length === song.sections.length && items.every((x, i) => x.id === song.sections[i].id && x.tag === song.sections[i].tag);
