import { sys, ctxText, cap } from "./craft.js";
import { songJSON } from "./song.js";
import { hasPersona } from "./persona.js";

// STORY plans the spine before any line exists: one event per section, not one image per section.
export const spine = (ctx, digest) => ({
  system: sys("STORY"),
  user: `${ctxText(ctx)}\nTeam output:\n${cap(digest, 7000)}\n` +
    `Build the story spine. ${ctx.layout?.length ? "One beat per required layout entry, in order." : "Choose 7-10 sections in a real song form."} ` +
    `Each beat is an EVENT: who does what and what changes. Never a description of a scene. Verses move time forward; ` +
    `the bridge turns; the last section shows the changed state; for each repeated chorus say what it now means.\n` +
    `Return {"arc":{"want":str,"obstacle":str,"stakes":str,"turn":str,"change":str,"meaning":str (one sentence the listener keeps)},` +
    `"beats":[{"tag":str,"event":str,"shift":str (what the listener now understands or feels)}]}`,
});

// Audit reads only the sung lines: what actually happens, independent of the planned beats.
const VOICE = `voice: 0 an outsider describing the narrator, 1 mixed, 2 unmistakably the narrator speaking from inside their life. judged: true when the lines moralize about the narrator or glamorize the life. `;
export const audit = (ctx, song, p = hasPersona(ctx.design)) => ({
  system: sys("STORY"),
  user: `${ctxText(ctx)}\nSong:\n${songJSON(song)}\n` +
    `Audit the narrative as a hostile editor. Judge the LINES only, ignoring beat, note and backstory. ` +
    `For every section state the concrete event its lines show, at most 12 words, or "none" when the lines only describe. ` +
    `progress: 0 nothing happens, 1 small move, 2 real change. relatable: 0 no lived human moment a listener would recognize, ` +
    `1 some, 2 a moment most people have lived, shown through what someone does or says. pressure: true when the lines preach, ` +
    `sloganeer or tell the listener what to feel or do. objects: quote any line where an object, place or machine feels, wants, ` +
    `knows or acts like a person. ${p ? VOICE : ""}\n` +
    `Return {"sections":[{"sid":str,"event":str,"progress":0|1|2,"relatable":0|1|2,"pressure":bool,"objects":[str]${p ? ',"voice":0|1|2,"judged":bool' : ""}}],"chorus_shift":bool (each repeated chorus means something new),` +
    `"ending_changed":bool (the ending state differs from the opening state),"meaning":str (the song's meaning in one sentence, or "none")}`,
});
