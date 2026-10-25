// Suno sings digits unreliably; spell integers out. 1100–2099 read as years, gear/slang numbers as idiom.
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven",
  "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const IDIOM = { 808: "eight-oh-eight", 909: "nine-oh-nine", 303: "three-oh-three", 911: "nine-one-one",
  101: "one-oh-one", 404: "four-oh-four", 365: "three sixty-five" };

function under100(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
}

function under1000(n) {
  if (n < 100) return under100(n);
  const h = `${ONES[Math.floor(n / 100)]} hundred`;
  return n % 100 ? `${h} ${under100(n % 100)}` : h;
}

export function numberWords(n) {
  if (IDIOM[n]) return IDIOM[n];
  if (n >= 2000 && n <= 2009) return `two thousand${n % 10 ? " " + ONES[n % 10] : ""}`;
  if (n >= 1100 && n <= 2099) {
    const hi = Math.floor(n / 100), lo = n % 100;
    return `${under100(hi)} ${lo === 0 ? "hundred" : lo < 10 ? "oh " + ONES[lo] : under100(lo)}`;
  }
  if (n < 1000) return under1000(n);
  if (n < 1e6) {
    const t = `${under1000(Math.floor(n / 1000))} thousand`;
    return n % 1000 ? `${t} ${under1000(n % 1000)}` : t;
  }
  return String(n);
}

// Sung lines only; bracket cues are read, not sung, so "808" may stay there.
export const spellNumbers = (line) => String(line).replace(/\b\d{1,6}\b/g, (d) => numberWords(Number(d)));
