// Deterministic guarantees on a revision, independent of model compliance:
// layout order, out-of-scope sections frozen, locked lines verbatim, global fields only when directed.
// d = { aspects:[], scope:[sid], locks:[{sid,i,text}], layout:[{id|null, tag}] | null }
const copy = (s) => ({ ...s, lines: [...s.lines] });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function enforce(prev, next, d = {}) {
  const repairs = [];
  const P = new Map(prev.sections.map((s) => [s.id, s]));
  const N = new Map(next.sections.map((s) => [s.id, s]));
  let k = Math.max(0, ...[...P.keys(), ...N.keys()].map((id) => Number(id.slice(1)) || 0));
  let sections = next.sections.map(copy);

  if (d.layout?.length) {
    // Existing ids map directly; new entries take an exact-tag fresh section first, then any leftover.
    const fresh = next.sections.filter((s) => !P.has(s.id)).map(copy);
    const slots = d.layout.map((item) => (item.id && P.has(item.id) ? null : item));
    const taken = slots.map((item) => {
      if (!item) return null;
      const j = fresh.findIndex((s) => s.tag.toLowerCase() === item.tag.toLowerCase());
      return j >= 0 ? fresh.splice(j, 1)[0] : null;
    });
    sections = d.layout.map((item, i) => {
      if (!slots[i]) {
        if (!N.has(item.id)) repairs.push(`restored [${P.get(item.id).tag}] the revision dropped`);
        return { ...copy(N.get(item.id) ?? P.get(item.id)), tag: item.tag || P.get(item.id).tag };
      }
      const s = taken[i] ?? fresh.shift();
      if (!s) {
        repairs.push(`[${item.tag}] was not written; left empty`);
        return { id: `s${++k}`, tag: item.tag, beat: "", desc: "", note: "", lines: [] };
      }
      return { ...s, tag: item.tag };
    });
    for (const s of fresh) repairs.push(`dropped unrequested [${s.tag}]`);
  }

  const lyricAspects = !d.aspects?.length || d.aspects.some((a) => a !== "style" && a !== "layout");
  const frozen = (s) => P.has(s.id) && (!lyricAspects || (d.scope?.length && !d.scope.includes(s.id)));
  sections = sections.map((s) => {
    if (!frozen(s)) return s;
    const p = { ...copy(P.get(s.id)), tag: d.layout?.length ? s.tag : P.get(s.id).tag };
    if (!same(s, p)) repairs.push(`kept [${p.tag}] as it was (outside scope)`);
    return p;
  });

  for (const L of d.locks ?? []) {
    const s = sections.find((x) => x.id === L.sid);
    if (!s) { repairs.push(`locked line lost with its section: "${L.text}"`); continue; }
    if (s.lines.includes(L.text)) continue;
    if (L.i < s.lines.length) s.lines[L.i] = L.text;
    else s.lines.push(L.text);
    repairs.push(`restored locked line "${L.text}"`);
  }

  const allow = (a) => (d.aspects?.length ? d.aspects.includes(a) : !d.scope?.length);
  const pick = (key, a) => {
    if (allow(a) || JSON.stringify(next[key]) === JSON.stringify(prev[key])) return next[key];
    if (prev[key]) repairs.push(`kept ${key} (not directed)`);
    return prev[key] || next[key];
  };
  const song = {
    title: pick("title", "story"), backstory: pick("backstory", "story"), arc: pick("arc", "story"), sections,
    style: pick("style", "style"), exclude: pick("exclude", "style"),
  };
  return { song, repairs };
}
