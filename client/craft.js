import { BANNED } from "./prosody.js";
import { ROSTER } from "./roster.js";
import { STORY, RELATE, spineText } from "./narrative.js";
import { designText } from "./design.js";
import { personaText } from "./persona.js";
export { STORY, spineText };

const team = ROSTER.map((a) => `${a.id}: ${a.role}`).join("\n");

export const CRAFT = `Craft law:
- Modern American English, current idiom. Slang only if it will still read in five years, unless the brief wants a period.
- Short singable lines. Parallel lines within one syllable of each other. Breathe where a singer breathes.
- Concrete lived specifics over abstraction; deadpan facts carry the joke. People act; objects never hold, keep or know anything.
- Anti-median: draft many options and discard the first and most obvious; name the hostile one-sentence dismissal and rewrite anything that fits it; ban the obvious word for the subject; transplant one real structural mechanism from another domain (not decoration); invert one genre default and follow it through; give the central device one moment where it fails or inverts; subtract ornament.
- Metaphor never blunt or on-the-nose; no jargon dumps of the central image.
- Wordplay: double and triple entendres only when every reading lands. Interleaved, internal, multisyllabic and slant rhyme over easy monosyllables.
- Verse interlock where it fits: line one "idea A, idea B", line two "idea B, idea A" in fresh words. Never echo the end of one line at the start of the next.
- Numbers as words. ALL CAPS only for one punch moment.
- Never use: ${BANNED.join(", ")}. No stock AI phrasing (neon dreams, in the silence, we rise, set the night on fire, heart of gold, chasing the light).`;

export const SUNO = `Suno v6 format (paste-ready, user-reported conventions):
- "tag": section name only, e.g. Intro, Verse 1, Pre-Chorus, Chorus, Rap Verse, Bridge, Breakdown, Final Chorus, Outro. Number verses.
- "desc": bracket cue of at most 6 words for arrangement or delivery, items split by semicolons, never commas, never bar counts, e.g. "close mic; brushed snare". Read, not sung. Long cues risk being sung.
- "note": the ** block shown above the section: one sentence on what the section does in the story and how it is performed. Empty for an unchanged repeat.
- "lines": sung words only. (Parentheses) are sung as backing vocals or echoes, so never put instructions in them.
- Section sizes: verse 4-8 lines, pre-chorus 2-4, chorus 4-6, bridge 2-4, rap verse 8-16. Core hook at most 10 words.
- Syllables per line: 6-10 rock/pop, 8-12 ballad, 10-16 rap. Keep counts consistent inside a section.
- "style": 5-8 comma-separated descriptors ordered era, genre, groove with BPM, two or three signature instruments, vocal character, emotional direction, production texture. Under 300 characters. No artist or band names: v6 refuses imitation, so describe the sound.
- "exclude": comma-separated sounds and traits to keep out (goes in Advanced Options > Exclude).
- "backstory": 3-6 sentences: who, where, when, what is at stake, the turn. Not sung; it is for the writer and Suno simple-mode prompts.`;

export const SCHEMA = `{"title":str,"backstory":str,"arc":{"want":str,"obstacle":str,"stakes":str,"turn":str,"change":str,"meaning":str},` +
  `"sections":[{"id":str,"tag":str,"beat":str (the event that happens here),"desc":str,"note":str,"lines":[str]}],"style":str,"exclude":str,"reasons":[2-5 str]}`;

export const sys = (id, extra = "") =>
  `You are ${id} on a lyric-writing team.\n${team}\n${CRAFT}\n${STORY}\n${RELATE}${extra ? "\n" + extra : ""}\nReply with ONE JSON object and nothing else.`;

export const cap = (s, n) => (String(s ?? "").length > n ? String(s).slice(0, n) + " …" : String(s ?? ""));

// Everything the human has directed so far, for every prompt.
export function ctxText(ctx) {
  return [
    `Brief:\n${ctx.brief}`,
    designText(ctx.design),
    personaText(ctx.design),
    ctx.answers?.length ? `Human answers:\n${ctx.answers.join("\n")}` : "",
    ctx.directions?.length ? `Earlier human directions, still in force unless overridden:\n${ctx.directions.join("\n")}` : "",
    ctx.layout?.length ? `Required layout (in order): ${ctx.layout.join(" | ")}` : "",
    ctx.styleDir ? `Style direction: ${ctx.styleDir}` : "",
    ctx.exclude ? `Keep out: ${ctx.exclude}` : "",
    ctx.thesis ? `Thesis: ${ctx.thesis}` : "",
    ctx.risk ? `Avoid (the lazy version): ${ctx.risk}` : "",
    ctx.hook ? `Chosen hook (must anchor the chorus): ${ctx.hook}` : "",
    ctx.spine ? spineText(ctx.spine) : "",
    ctx.taste || "",
  ].filter(Boolean).join("\n");
}
