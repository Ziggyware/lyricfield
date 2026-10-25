import { PERSONAS } from "./persona.js";

// Song design: the choices a writer makes before a word is written. Chips are categorical (and feed
// app-wide insights); text fields stay private to this browser.
export const DESIGN = {
  tone: ["wry", "tender", "defiant", "playful", "bittersweet", "deadpan", "aching", "euphoric", "menacing", "triumphant"],
  cadence: ["conversational", "laid-back", "staccato", "syncopated", "triplet flow", "16th-note bursts", "drawled", "chant"],
  feel: ["straight 8ths", "half-time", "four-on-the-floor", "breakbeat", "shuffle", "trap hats", "6/8 sway", "7/4 lurch"],
  instruments: ["fuzz bass", "crunchy guitar", "clean guitar", "acoustic guitar", "piano", "analog synth", "synth pads", "808", "live kit", "drum machine", "brass"],
  effects: ["tape delay", "plate reverb", "sidechain pump", "filter sweep", "vocal chops", "bitcrush", "gated reverb", "reverse reverb", "distortion", "dry and close"],
  idiom: ["modern American", "Gulf South", "Midwest plain-spoken", "East Coast", "West Coast", "internet-native", "church vernacular", "shop talk"],
  pov: ["first person", "second person", "third person", "duet"],
  persona: PERSONAS,
};
export const TEXTS = { direction: "Direction", meaning: "Meaning", story: "Story", narrator: "Narrator" };
export const LABEL = { tone: "Tone", cadence: "Cadence", feel: "Beat", instruments: "Instruments", effects: "Effects", idiom: "Idiom", pov: "Voice", persona: "Persona" };

