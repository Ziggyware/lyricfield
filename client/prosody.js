// Heuristic English prosody: orthographic syllable estimate + rhyme keys from the final vowel nucleus.
export const BANNED = ["static", "ghost", "ghosts", "borrowed", "echo", "echoes", "whisper", "whispers",
  "shadow", "shadows", "tapestry", "symphony", "embrace", "journey", "ignite", "shattered", "neon-lit"];

const EXC = { the: 1, every: 2, everything: 3, everyone: 3, everybody: 4, fire: 1, hour: 1, our: 1, poem: 2,
  being: 2, quiet: 2, real: 1, idea: 3, area: 3, lion: 2, people: 2, business: 2, family: 3, different: 3,
  evening: 2, chocolate: 2, camera: 3, interest: 2, science: 2, violin: 3, create: 2, react: 2, cruel: 2,
  fuel: 2, diet: 2, yeah: 1, oh: 1, ooh: 1, gonna: 2, wanna: 2, gotta: 2 };

export function syl(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (EXC[w]) return EXC[w];
  if (w.length <= 3) return 1;
  let x = w;
  if (/[^laeiouy]es$/.test(x) && !/(?:[sxzcg]|ch|sh)es$/.test(x)) x = x.slice(0, -2);
  else if (/[^laeiouy]e$/.test(x)) x = x.slice(0, -1);
  else if (/[^aeioudt]ed$/.test(x)) x = x.slice(0, -2);
  x = x.replace(/^y/, "");
  return Math.max(1, (x.match(/[aeiouy]+/g) || []).length);
}

export function rhymeKey(word) {
  let x = String(word ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (x.length > 3 && /[^aeiou]e$/.test(x)) x = x.slice(0, -1);
  if (x.length > 3 && /[^s]s$/.test(x)) x = x.slice(0, -1);
  x = x.replace(/igh/g, "i").replace(/ph/g, "f").replace(/ck/g, "k").replace(/qu/g, "kw");
  const m = x.match(/[aeiouy]+[^aeiouy]*$/);
  const k = m ? m[0] : x;
  const v = (k.match(/^[aeiouy]+/) || [""])[0];
  return { k, v, c: k.slice(v.length) };
}

// 2 = perfect, 1 = slant (shared nucleus or shared coda), 0 = none
export function rhymes(a, b) {
  if (!a.k || !b.k) return 0;
  if (a.k === b.k) return 2;
  if (a.v === b.v || (a.c && a.c === b.c)) return 1;
  return 0;
}

const WORDS = /[A-Za-z][A-Za-z'-]*/g;
const words = (t) => String(t ?? "").match(WORDS) || [];
// Lead-vocal words: parenthesized backing vocals and stray brackets are not the lead line.
export const leadWords = (t) => words(String(t ?? "").replace(/\[[^\]]*\]|\([^)]*\)/g, " "));
const sylOf = (ws) => ws.reduce((a, w) => a + w.split("-").reduce((s, p) => s + syl(p), 0), 0);

// Per-line syllables, end-rhyme scheme letters (~ marks slant), mean/sd of syllables, rhyme density.
export function measure(texts) {
  const lines = texts.map((text) => {
    const lw = leadWords(text);
    return {
      text, syl: sylOf(lw),
      key: lw.length ? rhymeKey(lw.at(-1)) : { k: "", v: "", c: "" },
      banned: words(text).filter((w) => BANNED.includes(w.toLowerCase())),
    };
  });
  const reps = [];
  for (const l of lines) {
    let best = -1, grade = 0;
    reps.forEach((r, i) => {
      const g = rhymes(r, l.key);
      if (g > grade) { grade = g; best = i; }
    });
    if (best < 0) { reps.push(l.key); best = reps.length - 1; }
    l.scheme = String.fromCharCode(65 + (best % 26)) + (grade === 1 ? "~" : "");
  }
  const ys = lines.map((l) => l.syl), n = ys.length || 1;
  const mean = ys.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(ys.reduce((a, y) => a + (y - mean) ** 2, 0) / n);
  const count = {};
  for (const l of lines) count[l.scheme[0]] = (count[l.scheme[0]] ?? 0) + 1;
  const density = lines.length ? lines.filter((l) => count[l.scheme[0]] > 1).length / lines.length : 0;
  return { lines, mean, sd, density };
}
