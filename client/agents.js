import { specialistsFor } from "./persona.js";
import { sys, ctxText, SUNO } from "./craft.js";
export { ROSTER, IDS, SPECIALISTS, DEFAULT_DELIVER } from "./roster.js";

export const director = (ctx) => ({
  system: sys("DIRECTOR"),
  user: `${ctxText(ctx)}\n\nReturn {"title":str,"thesis":str (one sentence: what the song is really about),` +
    `"dismissal_risk":str (the lazy version a hostile listener expects),` +
    `"intents":[{"id":"i1","label":str,"parent":null|"iN","reason":str}] (6-12, root first, depth up to 3),` +
    `"promises":[{"id":"p1","agent":${JSON.stringify(specialistsFor(ctx.design))},"deliver":str (concrete artifact),"intent":"iN","needs":["pN"]}] ` +
    `(8-12, each specialist at least once; STORY before ARRANGER; STYLIST needs SONIC;${specialistsFor(ctx.design).includes("VOICE") ? " LEXICON needs VOICE;" : ""} needs form a DAG),` +
    `"groups":[{"id":"g1","label":str,"members":[2-4 agent ids],"topic":str}] (2-3),` +
    `"questions":[{"from":id,"to":id,"q":str}] (3-6, agent to agent)}`,
});

export const work = (agent, deliver, intent, upstream, ctx) => ({
  system: sys(agent, agent === "STYLIST" || agent === "ARRANGER" ? SUNO : ""),
  user: `${ctxText(ctx)}\nYour promise: ${deliver}\nServes intent: ${intent}\n` +
    (upstream ? `Upstream deliverables:\n${upstream}\n` : "") +
    `Return {"deliver":str (the artifact itself, dense, newline separated),"reasons":[2-4 str: why each key choice],` +
    `"questions":[{"to":agent id,"q":str}] (0-2 genuine blockers only),"subintents":[0-2 str finer intentions you found]}`,
});

export const convene = (g, deliveries, questions, ctx) => ({
  system: sys("MODERATOR") + "\nVoice each member strictly through their role.",
  user: `${ctxText(ctx)}\nGroup: ${g.label}\nTopic: ${g.data.topic ?? ""}\nMembers: ${g.data.members.join(", ")}\n` +
    `Their deliverables:\n${deliveries}\nQuestions to settle:\n${questions || "(none)"}\n` +
    `Return {"messages":[{"from":id,"to":id|"ALL","text":str}] (4-10 turns, each changes something),` +
    `"answers":[{"qid":str,"by":id,"text":str}] (one per question),"decision":str,"reasons":[1-3 str]}`,
});
