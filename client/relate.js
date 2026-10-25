// Relatability checks that need no model: objects given human agency, and lines that pressure the listener.
// Feelings belong to people; an engine may stall, it may not hope.
const NOUNS = new Set(("car truck engine motor clutch gear gears wheel road street lot parking city town house room wall walls door window " +
  "phone radio screen tv sun moon sky stars star night day morning evening rain wind storm thunder snow sea ocean river " +
  "tree trees field fields church steeple bell bells pew pews dash dashboard seat metal steel chrome asphalt concrete " +
  "light lights shadow silence clock time money bottle glass table chair bed floor ceiling stage mic speaker song music " +
  "guitar piano drum drums bass beat track tape record vinyl highway bridge train plane bus fire smoke dust air world earth " +
  "kitchen stove fridge coffee cup letter paper page book pen camera mirror photo picture key keys lock gate fence porch").split(" "));
const VERBS = ["sing", "whisper", "cry", "weep", "laugh", "smile", "grin", "sigh", "scream", "beg", "pray", "dream", "hope", "know",
  "remember", "forget", "feel", "want", "wait", "watch", "listen", "hold", "keep", "call", "tell", "say", "speak", "breathe",
  "dance", "judge", "forgive", "love", "hate", "miss", "mourn", "wink", "nod", "beckon", "welcome", "embrace", "kiss", "cradle",
  "promise", "fear", "trust", "believe", "learn", "sleep", "wake", "ache", "long", "yearn", "witness", "approve", "bless", "teach", "understand"];
// Exact inflections, so "grind" never reads as "grin" + d.
const forms = (v) => {
  const stem = v.endsWith("e") ? v.slice(0, -1) : v;
  return [v, /(s|sh|ch|x)$/.test(v) ? `${v}es` : `${v}s`, v.endsWith("e") ? `${v}d` : `${v}ed`, `${stem}ing`];
};
const IRREGULAR = ["knew", "known", "held", "kept", "told", "said", "spoke", "spoken", "slept", "woke", "woken", "taught", "understood", "felt", "forgave", "forgot", "forgotten", "sang", "sung", "wept", "dreamt", "learnt", "smiled"];
const VERB_FORMS = new Set([...VERBS.flatMap(forms), ...IRREGULAR]);
const VERB = { test: (w) => VERB_FORMS.has(w) };
const SKIP = new Set(["the", "a", "an", "my", "your", "his", "her", "our", "their", "this", "that", "its", "old", "still", "just", "softly", "slowly"]);

// Clause punctuation is kept as a token: a subject never reaches across a comma or dash to a verb.
const words = (t) => String(t).toLowerCase().replace(/\([^)]*\)/g, " ").match(/[a-z']+|[,;:.!?—–-]/g) ?? [];
const sing = (w) => (NOUNS.has(w) ? w : w.endsWith("s") && NOUNS.has(w.slice(0, -1)) ? w.slice(0, -1) : null);

// "the lot holds its breath", "metal sings", "the city's heart": noun subject + human verb within two words.
export function objectAgency(line) {
  const w = words(line);
  for (let i = 0; i < w.length; i++) {
    const base = w[i].endsWith("'s") ? w[i].slice(0, -2) : w[i];
    const n = sing(base);
    if (!n) continue;
    if (w[i].endsWith("'s") && /^(heart|soul|voice|eyes|arms|hands)$/.test(w[i + 1] ?? "")) return `${n}'s ${w[i + 1]}`;
    for (let j = i + 1, seen = 0; j < w.length && seen < 2; j++) {
      if (/^[,;:.!?—–-]$/.test(w[j])) break;
      if (SKIP.has(w[j])) continue;
      if (sing(w[j])) break; // the next noun is the subject; it gets its own turn
      seen++;
      if (VERB.test(w[j]) && !(n === "phone" && /^calls?$/.test(w[j]))) return `${n} ${w[j]}`; // "phone call" is a noun
    }
  }
  return null;
}

const PRESSURE = [
  /\b(?:you|we|y'all|everybody|everyone)(?: all)? (?:should|must|need to|have to|gotta|ought to)\b/i,
  /\b(?:never forget|always remember|remember that|don't you ever|rise up|stand up and|we are one|be the change|live your truth|believe in yourself|follow your dreams|you deserve)\b/i,
];
export const pressure = (line) => PRESSURE.some((r) => r.test(line));

export function relateFindings(song) {
  const out = [];
  for (const s of song.sections) {
    for (const l of s.lines) {
      const o = objectAgency(l);
      if (o) out.push({ sev: "warn", where: `[${s.tag}]`, msg: `object given human agency (${o}): "${l}"`, gate: true, story: true, sid: s.id });
      if (pressure(l)) out.push({ sev: "warn", where: `[${s.tag}]`, msg: `pressures the listener: "${l}"`, gate: true, story: true, sid: s.id });
    }
  }
  return out;
}
