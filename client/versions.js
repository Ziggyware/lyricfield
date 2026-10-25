import { clone } from "./song.js";

// Immutable version history, persisted per browser. A pass or manual edit of version n appends a new
// version whose parent is n; restoring appends a copy, so nothing is ever overwritten.
const KEY = "lyricfield.versions.v2";
const MAX = 60;

const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x?.song?.sections) : [];
  } catch {
    return [];
  }
};

export function createHistory() {
  let list = load();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX))); } catch { /* quota or blocked storage */ }
  };
  return {
    all: () => list,
    get: (n) => list.find((v) => v.n === n) ?? null,
    latest: () => list.at(-1) ?? null,
    // story = the STORY audit of exactly this text; manual edits pass null because the audit no longer applies.
    add(song, { label, parent = null, ctx, source, story = null }) {
      const v = { n: (list.at(-1)?.n ?? 0) + 1, parent, label, source, ctx, story, song: clone(song), t: Date.now() };
      list.push(v);
      if (list.length > MAX) list = list.slice(-MAX);
      save();
      return v;
    },
  };
}

// Line diff (LCS) between two rendered lyric texts: [{op:" "|"+"|"-", text}].
export function diff(a, b) {
  const x = a.split("\n"), y = b.split("\n");
  const n = x.length, m = y.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) { out.push({ op: " ", text: x[i] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push({ op: "-", text: x[i++] });
    else out.push({ op: "+", text: y[j++] });
  }
  while (i < n) out.push({ op: "-", text: x[i++] });
  while (j < m) out.push({ op: "+", text: y[j++] });
  return out;
}
