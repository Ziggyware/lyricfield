import { lint, gateOf, typeOf } from "./suno.js";

// Which quick pick answers a story/design finding.
export const FAMILY = (f) =>
  f.where === "Style" ? "style" : /relatable|agency|pressures/.test(f.msg) ? "relate" : /outsider voice|glamorizes/.test(f.msg) ? "voice" : f.story ? "move" : "fix";

// Quick picks fill the panel; the human still reviews and runs the pass.
export const PICKS = {
  move: { label: "Make it move", aspects: ["story", "imagery"], text: "Every targeted section must make something happen: an action, decision, loss or discovery that moves the story forward and changes what the chorus means. Replace description with event." },
  relate: { label: "Make it relatable", aspects: ["relate", "imagery"], text: "Put a moment most people have lived at the center of each targeted section. People feel and act; objects only do what objects do. Never tell the listener what to feel." },
  voice: { label: "Deepen persona voice", aspects: ["voice", "imagery"], text: "Speak from inside the narrator's life: the vernacular their scene uses now, their private logic, the lie they believe and the contradiction they live with. Cut every line that judges, glamorizes or explains them to an outsider." },
  fix: { label: "Fix measured failures", aspects: ["cadence", "rhyme"], text: "Fix every measured failure without losing what works." },
  hook: { label: "Sharpen the hook", aspects: ["hook", "wordplay"], text: "Make the hook more memorable and more double-edged." },
  story: { label: "Deepen the story", aspects: ["story", "imagery"], text: "Make every section carry a concrete beat of the backstory." },
  style: { label: "Rework Style field", aspects: ["style"], text: "Make the Style field specific and current; describe the sound, never name artists." },
};

// Sections a pick targets on this version (empty = whole song).
export function pickScope(key, ver) {
  const song = ver.song, story = ver.story?.findings ?? [];
  const sids = (fs) => [...new Set(fs.map((f) => f.sid).filter(Boolean))];
  if (key === "move") return sids(story.filter((f) => FAMILY(f) === "move"));
  if (key === "relate") return sids(story.filter((f) => FAMILY(f) === "relate"));
  if (key === "voice") return sids(story.filter((f) => FAMILY(f) === "voice"));
  if (key === "fix") {
    const bad = new Set([...gateOf(lint(song)), ...story].map((x) => x.where));
    return song.sections.filter((s) => bad.has(`[${s.tag}]`)).map((s) => s.id);
  }
  if (key === "hook") return song.sections.filter((s) => ["chorus", "hook", "post"].includes(typeOf(s.tag))).map((s) => s.id);
  return [];
}
