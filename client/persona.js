import { SPECIALISTS } from "./roster.js";

// Fringe narrators: each lens names what that life tracks, fears and lies to itself about, so the song
// speaks from inside it. Lenses describe the person, never the procedure.
export const LENSES = {
  "addict": "measures the day in hours until the next one; lies with precision; the love is real and always comes second; keeps count of who still picks up",
  "recovering addict": "counts days; every errand passes an old spot; old friends are the hardest people to see; sober is boring and that is the point",
  "dealer": "runs a small business with no safety net; knows customers' kids by name; trusts nobody and is lonely for it; the money is quick and already spent",
  "sex worker": "a working person: rent, regulars, rules, the safety text, a family that does not know; humor as armor; contempt for pity",
  "victim": "the ordinary detail of that day; the before and after; anger at people who want them healed on schedule; a self older than the harm",
  "survivor": "the routines that keep them safe; the trigger in a normal place; the first good day that felt like betrayal",
  "killer": "remembers it in ordinary details; the story they tell themselves about why; the one person whose opinion still matters; no pride and no gore",
  "lifer": "time measured by visits that thinned out; the economy inside; a world outside that keeps moving in photos",
  "ex-con": "home after years: prices, phones, a grown kid, the box on every application, the old crew's offer",
  "informant": "two loyalties, both lying to them; a friend's mother's cooking; safety bought with someone else's",
  "unhoused": "logistics: where to sleep, charge, wash; being looked through; pride kept in small private rules",
  "runaway": "the thing at home worse than the road; help that comes with conditions; bus fare math",
  "gambler": "the system that almost works; the next win that will cover the last loss; family turned creditors",
  "enforcer": "the code of the job; violence as a skill they are good at; tenderness at home that does not fit their hands",
  "addict's mother": "the phone at three a.m.; the hidden purse; loving and locking the door; the black dress kept ready",
};
export const PERSONAS = Object.keys(LENSES);

export const PERSONA = `Persona law (the narrator lives at the edge; write from inside the life, never about it):
- First person from inside: their private logic, the rationalizations they believe, their humor, loyalty and tenderness, and what they would never say out loud. The listener sees more than the narrator admits; the narrator never explains themselves to an outsider.
- Neither glamor nor sermon: no romance of the life, no cautionary-tale narrator, no redemption the story did not earn. Consequences arrive as events, not lessons.
- Lived texture: the daily economics and rituals (hours, cash, cold, waiting, who you trust, who owes whom) in the vernacular that scene uses now. Tourist cliches fail: the streets, hustle, demons, chasing the high, broken wings, fallen angel, sin, the life.
- Contradiction drives the song: the narrator wants two things that cannot both happen; the bridge is the moment they see themselves, or refuse to.
- Victims and survivors keep agency and an identity beyond the harm. Harm is shown through its aftermath in a person, never as spectacle, and violence is never eroticized.
- The way in for the listener is the shared human moment inside the extreme life: broke, ashamed, loyal, scared, loving someone bad for you, wanting to go home.
- Hard limits: no usable instructions (making, dosing or hiding drugs; committing or evading crimes); no real identifiable people; every character is an adult; nothing sexual involving minors; no praise of violence against real groups.`;

export const hasPersona = (d) => !!(d?.persona?.length || d?.narrator);

// Prompt block, present only when the writer chose a fringe narrator.
export function personaText(d) {
  if (!hasPersona(d)) return "";
  const lens = (d.persona ?? []).filter((p) => LENSES[p]).map((p) => `- ${p}: ${LENSES[p]}`);
  return `${PERSONA}${lens.length ? `\nPersona lenses (several = one person who is all of these, or the people whose lives collide in the song):\n${lens.join("\n")}` : ""}`;
}

// VOICE joins the specialist team whenever a persona is set.
export const specialistsFor = (d) => (hasPersona(d) ? [...SPECIALISTS, "VOICE"] : SPECIALISTS);
