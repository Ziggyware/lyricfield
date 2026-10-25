// Narrative contract shared by every prompt: the story law and the spine STORY plans before drafting.
export const STORY = `Story law (the song must mean something and move):
- Someone wants something, something stands in the way, something is at stake.
- Every verse is a scene where something HAPPENS: an action, a decision, a loss, a discovery. Time moves between verses. A verse that only lists images (a tableau) fails.
- Images carry the event; they never replace it. Show it through what people do and say.
- The chorus states the meaning; each return lands differently because the verses changed it.
- The bridge turns: a reveal, reversal or admission that recolors what came before.
- The ending is a changed state; the last section cannot mean what the opening meant.`;

export const RELATE = `Relatability law (people must recognize themselves without being pushed):
- Feelings belong to people. Objects, places, weather and machines never feel, want, know, hold, keep, remember, sing, breathe, watch or wait; they only do what they physically do (an engine stalls, rain falls). A person notices them and reacts.
- Anchor every emotion in a moment most listeners have lived (being embarrassed, trusted, left, proud, caught) and show it through what someone does or says.
- No pressure: never tell the listener what to feel or do. No sermons, slogans, "we all need to", or self-help lines. The scene earns the feeling.
- Specific beats general: a detail only these people would have (a name, a habit, a joke) is what makes it universal.`;

export const ARC = ["want", "obstacle", "stakes", "turn", "change", "meaning"];
export function spineText(sp) {
  const arc = ARC.filter((k) => sp.arc?.[k]).map((k) => `${k}: ${sp.arc[k]}`).join("\n");
  const beats = (sp.beats ?? []).map((b, i) => `${i + 1}. [${b.tag}] ${b.event}${b.shift ? ` → ${b.shift}` : ""}`).join("\n");
  return `Story spine (follow it):\n${arc}${beats ? `\nBeats:\n${beats}` : ""}`;
}
