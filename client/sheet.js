import { esc } from "./esc.js";
import { measure } from "./prosody.js";
import { lint, typeOf, syllableRange } from "./suno.js";
import { lyricsText, sheetText, tagLine, noteLine } from "./song.js";
import { ARC } from "./narrative.js";
import { diff } from "./versions.js";
import { designText } from "./design.js";

const bar = (ui, ver, versions) => {
  const lyr = lyricsText(ver.song, ui.notes).length, sty = ver.song.style.length;
  const latest = versions.at(-1)?.n === ver.n;
  return `<div class="sh-bar">` +
    `<select id="ver" aria-label="Version">${[...versions].reverse().map((v) =>
      `<option value="${v.n}"${v.n === ver.n ? " selected" : ""}>v${v.n} · ${esc(v.label)}</option>`).join("")}</select>` +
    `<button class="btn" data-a="diff" aria-pressed="${ui.diff}"${ver.parent ? "" : " disabled"}>Diff</button>` +
    `<button class="btn" data-a="edit">Edit</button>` +
    (latest ? "" : `<button class="btn" data-a="restore">Restore</button>`) +
    `<span class="cp">Copy <button class="btn" data-copy="lyrics">Lyrics</button><button class="btn" data-copy="style">Style</button>` +
    `<button class="btn" data-copy="exclude">Exclude</button><button class="btn" data-copy="backstory">Backstory</button>` +
    `<button class="btn" data-copy="sheet">Sheet</button></span>` +
    `<label class="chk"><input type="checkbox" id="notes"${ui.notes ? " checked" : ""}> ** in Lyrics</label>` +
    `<span class="cc${lyr > 5000 ? " over" : ""}">${lyr}/5000</span><span class="cc${sty > 1000 ? " over" : ""}">${sty}/1000</span></div>`;
};

// Planned beat (in the ** block) against what the STORY audit heard the lines actually do.
function section(s, ui, heard) {
  const m = measure(s.lines), t = typeOf(s.tag), [a, b] = syllableRange(t);
  const on = ui.scope.has(s.id);
  return `<div class="sec${on ? " scoped" : ""}">` +
    (noteLine(s) ? `<div class="ast">**${esc(noteLine(s))}**</div>` : "") +
    `<button class="hd" data-scope="${s.id}" aria-pressed="${on}">${esc(tagLine(s))}</button>` +
    m.lines.map((l, i) => {
      const lk = ui.locks.has(`${s.id}:${i}`);
      const cls = `ln${lk ? " lk" : ""}${l.banned.length ? " bad" : ""}${l.syl < a || l.syl > b ? " off" : ""}`;
      return `<div class="${cls}" role="button" tabindex="0" data-lock="${s.id}" data-i="${i}" aria-pressed="${lk}">` +
        `<span class="sy">${l.syl}</span><span class="rh">${l.scheme}</span><span class="tx">${esc(l.text)}</span>` +
        `<span class="lkm">${lk ? "locked" : ""}</span></div>`;
    }).join("") +
    (s.lines.length ? `<div class="sd">≈${m.mean.toFixed(1)} syl · σ ${m.sd.toFixed(2)} · rhyme ${m.density.toFixed(2)}` +
      (heard ? ` · heard: <span class="${/^none\b/i.test(heard) ? "flat" : "ev"}">${esc(heard)}</span>` : "") + `</div>` : "") +
    `</div>`;
}

const lintHTML = (L) => L.length
  ? `<ul class="lint">${L.map((x) => `<li class="sev-${x.sev}${x.gate ? " gate" : ""}"><b>${esc(x.where)}</b> ${esc(x.msg)}</li>`).join("")}</ul>`
  : `<p class="mt">Gate passed.</p>`;

const arcHTML = (a) => ARC.some((k) => a?.[k])
  ? `<div class="blk"><div class="ast">**Arc**</div><dl class="arc">${ARC.filter((k) => a[k]).map((k) => `<dt>${k}</dt><dd>${esc(a[k])}</dd>`).join("")}</dl></div>`
  : "";

export function sheetHTML(ui, ver, versions, parent) {
  const s = ver.song, story = ver.story;
  if (ui.diff && parent) {
    const d = diff(sheetText(parent.song), sheetText(s));
    return bar(ui, ver, versions) + `<div class="sheet diffv" id="sheetBody">` +
      d.map((x) => `<div class="dl d${x.op === "+" ? "add" : x.op === "-" ? "del" : "eq"}"><span>${x.op}</span>${esc(x.text) || "&nbsp;"}</div>`).join("") + `</div>`;
  }
  return bar(ui, ver, versions) +
    `<div class="sheet" id="sheetBody"><h2>${esc(s.title)}</h2>` +
    `<div class="blk"><div class="ast">**Backstory**</div><p>${esc(s.backstory)}</p></div>` + arcHTML(s.arc) +
    (designText(ver.ctx?.design) ? `<div class="blk"><div class="ast">**Design**</div><p class="dz">${esc(designText(ver.ctx.design).split("\n").slice(1).join("\n"))}</p></div>` : "") +
    s.sections.map((x) => section(x, ui, story?.events?.[x.id])).join("") +
    `<div class="blk"><div class="ast">**Style**</div><p>${esc(s.style)}</p>` +
    `<div class="ast">**Exclude**</div><p>${esc(s.exclude)}</p></div></div>` +
    `<div class="blk"><h4>Story, relatability and design check</h4>${story ? (story.meaning ? `<p class="mt">Meaning heard: ${esc(story.meaning)}</p>` : "") + lintHTML(story.findings ?? [])
      : `<p class="mt">Not audited for this version; a pass with at least one round audits it.</p>`}</div>` +
    `<div class="blk"><h4>Suno v6 check</h4>${lintHTML(lint(s))}</div>`;
}
