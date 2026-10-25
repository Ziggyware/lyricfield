// Stable failure categories for insights, derived from check messages.
const CODES = [[/syllable sd/, "cadence-variance"], [/rhyme density/, "rhyme-density"], [/outside .* syllables/, "syllable-range"],
  [/lines; .* wants|tends to rush/, "section-length"], [/artist names/, "artist-name"], [/^banned/, "banned-word"],
  [/parentheses/, "paren-instruction"], [/repeats \[/, "verse-repeat"], [/static/, "static"], [/previous event/, "repeat-event"],
  [/same thing every time/, "flat-chorus"], [/human agency/, "object-agency"], [/pressures/, "pressure"], [/not relatable/, "not-relatable"], [/outsider voice/, "outsider-voice"], [/glamorizes/, "judged"],
  [/chosen tempo/, "design-tempo"], [/chosen sound/, "design-sound"], [/ending/, "unchanged-ending"], [/no clear meaning/, "no-meaning"], [/chars over/, "field-limit"]];
export const codeOf = (msg) => (CODES.find(([r]) => r.test(msg)) ?? [null, "other"])[1];
