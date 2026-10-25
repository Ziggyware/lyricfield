export const ROSTER = [
  { id: "DIRECTOR", role: "decomposes the brief into an intention tree, promises, conversation groups and open questions" },
  { id: "CLARIFIER", role: "asks the human only the questions whose answers would change the song; never asks what the brief already settles" },
  { id: "STORY", role: "backstory author: who, where, when, what is at stake, point of view, the turn; one narrative beat per section" },
  { id: "LEXICON", role: "cunning linguist of modern American English: idiom, slang half-life, double and triple entendres, fresh concrete word banks" },
  { id: "PROSODY", role: "stress grid, syllable budgets per line, cadence, breath points, time signatures" },
  { id: "RHYME", role: "rhyme lattice: interleaved, internal, multisyllabic and slant rhyme; sonic chaining across lines" },
  { id: "SONIC", role: "key, tempo, modulation point, melodic contour, harmonic movement, hook placement, vocal delivery" },
  { id: "ARRANGER", role: "song layout and energy curve: section order, bar counts, per-section arrangement cue and delivery; writes the ** section notes" },
  { id: "STYLIST", role: "Suno v6 Style and Exclude fields: era, genre, groove, BPM, signature instruments, vocal character, production; turns references into descriptors, never artist names" },
  { id: "LINEAGE", role: "hears the song as children, parents, grandparents and grandchildren across cultures and heritages; finds images every generation decodes, flags references that exclude" },
  { id: "VOICE", role: "inhabits the narrator from inside their life: current vernacular of their scene, private logic, the lie they tell themselves, what they never say aloud; cuts tourist lines, judgement and glamor" },
  { id: "HOOKSMITH", role: "generates many hook candidates through different mechanisms; never settles for the first" },
  { id: "CRITIC", role: "anti-median editor: writes the hostile one-sentence dismissal and flags every line that fits it" },
  { id: "COMPOSER", role: "assembles the song from every deliverable and conversation; final say on each line" },
];
export const IDS = ROSTER.map((a) => a.id);
export const SPECIALISTS = ["STORY", "LEXICON", "PROSODY", "RHYME", "SONIC", "ARRANGER", "STYLIST", "LINEAGE"];

export const DEFAULT_DELIVER = {
  STORY: "Backstory paragraph plus one narrative beat per section",
  LEXICON: "Word bank of 24 fresh concrete terms plus 6 entendre candidates",
  PROSODY: "Per-section syllable budgets, stress pattern and breath points",
  RHYME: "Rhyme lattice per section with end, internal and slant chains",
  SONIC: "Key, tempo, modulation point, melodic contour and hook placement",
  ARRANGER: "Section layout with bar counts, energy 1-10 per section and a bracket cue for each",
  STYLIST: "Suno Style field of 5-8 ordered descriptors and an Exclude list",
  LINEAGE: "Cross-generation image set and exclusion audit",
  VOICE: "Narrator voice sheet: scene vernacular bank, private logic, the lie they believe, the contradiction, eight lines in their voice",
};

// What a directed pass can change; each aspect is studied by one specialist before COMPOSER revises.
export const ASPECTS = {
  layout: { label: "Layout", agent: "ARRANGER" },
  story: { label: "Story", agent: "STORY" },
  imagery: { label: "Imagery", agent: "LEXICON" },
  wordplay: { label: "Wordplay", agent: "LEXICON" },
  rhyme: { label: "Rhyme", agent: "RHYME" },
  cadence: { label: "Cadence", agent: "PROSODY" },
  hook: { label: "Hook", agent: "HOOKSMITH" },
  delivery: { label: "Delivery", agent: "SONIC" },
  arrangement: { label: "Arrangement", agent: "ARRANGER" },
  tone: { label: "Tone", agent: "LEXICON" },
  relate: { label: "Relatable", agent: "LINEAGE" },
  voice: { label: "Persona voice", agent: "VOICE" },
  style: { label: "Style field", agent: "STYLIST" },
  reach: { label: "Reach", agent: "LINEAGE" },
};

export const SECTION_TYPES = ["Intro", "Verse", "Pre-Chorus", "Chorus", "Post-Chorus", "Hook", "Rap Verse", "Bridge",
  "Breakdown", "Instrumental Break", "Build", "Drop", "Final Chorus", "Outro", "End"];

export const LAYOUTS = {
  auto: { label: "Auto", tags: [] },
  pop: { label: "Pop", tags: ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Pre-Chorus", "Chorus", "Bridge", "Final Chorus", "Outro"] },
  rock: { label: "Alt-rock", tags: ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Verse 2", "Bridge", "Breakdown", "Chorus", "Outro"] },
  raprock: { label: "Rap-rock", tags: ["Intro", "Verse 1", "Chorus", "Rap Verse", "Chorus", "Bridge", "Final Chorus", "Outro"] },
  ballad: { label: "Ballad", tags: ["Intro", "Verse 1", "Verse 2", "Chorus", "Verse 3", "Chorus", "Bridge", "Final Chorus", "Outro"] },
  edm: { label: "EDM", tags: ["Intro", "Verse 1", "Build", "Drop", "Verse 2", "Build", "Drop", "Outro"] },
};
