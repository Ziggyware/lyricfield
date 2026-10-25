import { sys, ctxText, cap, SUNO, SCHEMA } from "./craft.js";
import { songJSON } from "./song.js";
import { ASPECTS } from "./roster.js";

const OPTS = `"questions":[{"q":str,"options":[2-4 short str]}] (0-3; ask only when the answer changes the song; never ask what is already settled)`;

export const clarifyBrief = (ctx) => ({
  system: sys("CLARIFIER"),
  user: `${ctxText(ctx)}\nReturn {"interpretation":str (one sentence: how you read the brief),${OPTS}}`,
});

export function directiveText(d, song) {
  const tags = new Map(song.sections.map((s) => [s.id, s.tag]));
  return [
    d.text ? `Direction: ${d.text}` : "",
    d.aspects?.length ? `Aspects to change: ${d.aspects.map((a) => ASPECTS[a]?.label ?? a).join(", ")}` : "Aspects: any",
    d.scope?.length ? `Scope: only sections ${d.scope.map((id) => `${id} [${tags.get(id) ?? "?"}]`).join(", ")}; every other section stays word for word` : "Scope: whole song",
    d.locks?.length ? `Locked lines (keep verbatim, same section): ${d.locks.map((l) => `${l.sid}: "${l.text}"`).join(" ; ")}` : "",
    d.layout?.length ? `New layout, in this order (id "new" means write it fresh): ${d.layout.map((x) => `${x.id ?? "new"} [${x.tag}]`).join(" | ")}` : "",
    d.answers?.length ? `Human answers:\n${d.answers.join("\n")}` : "",
    d.design ? "The writer changed the song design (see Song design above): carry it into tone, cadence, lines, cues and the Style field." : "",
  ].filter(Boolean).join("\n");
}

export const clarifyPass = (ctx, song, d) => ({
  system: sys("CLARIFIER"),
  user: `${ctxText(ctx)}\nCurrent song:\n${songJSON(song)}\n${directiveText(d, song)}\n` +
    `Return {"interpretation":str (one sentence: what you think the human wants changed and why),${OPTS}}`,
});

export const aspectWork = (agent, ctx, song, d, metrics) => ({
  system: sys(agent, SUNO),
  user: `${ctxText(ctx)}\nCurrent song:\n${songJSON(song)}\nMeasured prosody:\n${metrics}\n${directiveText(d, song)}\n` +
    `Diagnose what is weak in your domain inside the scope and prescribe exact fixes (rewritten lines, cues, descriptors).\n` +
    `Return {"deliver":str (diagnosis then prescriptions, newline separated),"reasons":[1-3 str]}`,
});

export const hooks = (ctx, digest) => ({
  system: sys("HOOKSMITH"),
  user: `${ctxText(ctx)}\nTeam output:\n${cap(digest, 9000)}\n` +
    `Write 10 hook candidates, each from a different mechanism (entendre, inversion, list, call-and-response, internal rhyme, ` +
    `deadpan fact, question, imperative, title drop, number). At most 10 words each.\n` +
    `Return {"hooks":[{"text":str,"mechanism":str}]}`,
});

export const judge = (ctx, cands) => ({
  system: sys("CRITIC"),
  user: `${ctxText(ctx)}\nScore every hook 1-10 on each axis. Be harsh; a 7 is rare.\n` +
    cands.map((h, i) => `${i}: ${h.text} (${h.mech})`).join("\n") +
    `\nReturn {"scores":[{"i":int,"memorable":n,"singable":n,"entendre":n,"specific":n,"fresh":n}]}`,
});

export const compose = (ctx, digest) => ({
  system: sys("COMPOSER", SUNO),
  user: `${ctxText(ctx)}\n\nTeam output:\n${cap(digest, 10000)}\n` +
    `Write the whole song. Follow the story spine: one section per beat, put the beat's event in "beat" and make the ` +
    `lines show it happening through what people do and say. Use the ARRANGER cues and the STYLIST fields.` +
    (ctx.layout?.length ? ` Sections must follow the required layout exactly, one section per entry.` : "") +
    `\nReturn ${SCHEMA}`,
});

export const critique = (ctx, song, metrics, lint, d) => ({
  system: sys("CRITIC", SUNO),
  user: `${ctxText(ctx)}\nSong:\n${songJSON(song)}\nMeasured prosody:\n${metrics}\n` +
    (lint ? `Measured failures (must be fixed):\n${lint}\n` : "") +
    (d ? `${directiveText(d, song)}\nJudge the song against the direction; flag only inside the scope; never flag locked lines.\n` : "") +
    `Return {"dismissal":str (hostile one sentence),"flags":[{"sid":str,"line":exact line,"why":str,"fix":str}] (3-8),` +
    `"keep":[lines that must survive],"reasons":[1-3 str]}`,
});

export const revise = (ctx, song, notes, lint, d) => ({
  system: sys("COMPOSER", SUNO),
  user: `${ctxText(ctx)}\nCurrent song:\n${songJSON(song)}\n` +
    (d ? `${directiveText(d, song)}\n` : "") +
    (notes ? `Notes to apply:\n${cap(notes, 9000)}\n` : "") +
    (lint ? `Measured failures to fix:\n${lint}\n` : "") +
    `Rewrite every flagged line, keep keep-lines and locked lines verbatim, echo each section's id ("new" for added sections), ` +
    `leave out-of-scope sections exactly as they are. Output the whole song.\nReturn ${SCHEMA}`,
});
