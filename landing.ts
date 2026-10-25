// Public front page. Every claim on it describes behavior the app actually has.
const css = `:root{--bg:#08090a;--fg:#ecefe4;--dim:#b4baa9;--line:#3a4034;--acc:#d4ff00;--z:1;color-scheme:dark}
:root[data-z="2"]{--z:1.2}:root[data-z="3"]{--z:1.4}
html{font-size:calc(17px * var(--z));-webkit-text-size-adjust:100%}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:400 1rem/1.6 "IBM Plex Mono",ui-monospace,Menlo,monospace}
.w{max-width:1080px;margin:0 auto;padding:0 max(16px,env(safe-area-inset-left))}
nav{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-block:14px;border-bottom:1px solid var(--line)}
.b{color:var(--acc);font-weight:600;letter-spacing:.14em;font-size:1rem}
a.go{background:var(--acc);color:#000;text-decoration:none;font-weight:600;padding:.7rem 1.2rem;display:inline-flex;align-items:center;min-height:2.75rem}
a:focus-visible{outline:3px solid var(--acc);outline-offset:3px}
h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.1;margin:48px 0 18px;font-weight:600;text-wrap:balance;max-width:17ch}
h1 em{font-style:normal;color:var(--acc)}.lead{max-width:60ch;margin:0 0 28px;font-size:1.0625rem}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));border-top:1px solid var(--line);border-left:1px solid var(--line);margin-block:48px}
.g div{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:18px}
h2{font-size:.9375rem;letter-spacing:.08em;text-transform:uppercase;color:var(--acc);margin:0 0 10px;font-weight:600}
.g p{margin:0}.g p+p{margin-top:10px;color:var(--dim)}
pre{font:inherit;font-size:1.125rem;line-height:1.5;border-left:3px solid var(--acc);padding:4px 0 4px 16px;margin:0;white-space:pre-wrap}
.t{color:var(--dim)}footer{border-top:1px solid var(--line);margin-top:56px;padding-block:18px;font-size:.875rem;color:var(--dim)}
#n:empty{display:none}`;

export const landing = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>LYRICFIELD</title>
<meta name="description" content="Song lyrics that tell a story, written and revised by a team of AI agents, paste-ready for Suno v6.">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${css}</style><script>try{document.documentElement.dataset.z=localStorage.getItem("lf.z")||"1"}catch{}</script></head><body><div class="w">
<nav><span class="b">LYRICFIELD</span><a class="go" href="/app">Write a song</a></nav>
<h1>Lyrics where <em>something happens.</em></h1>
<p class="lead">Describe the song. Fourteen agents plan the story, write it, audit every section for events, relatability and voice, then revise until the checks pass. The result pastes straight into Suno v6: sections, cues, backstory, Style and Exclude.</p>
<a class="go" href="/app">Write a song</a>
<div class="g">
<div><h2>Design</h2><p>Choose the direction, meaning, story, tone, cadence, beat and BPM, instruments, effects, idiom and point of view.</p><p>The Style field is checked against your sound.</p></div>
<div><h2>Narrators</h2><p>Write from inside lives songs usually only point at: addict, dealer, sex worker, victim, survivor, killer, lifer, informant, runaway.</p><p>No glamor, no sermon, no tourist lines.</p></div>
<div><h2>Story</h2><p>Every verse must change something. Objects never feel; people do. Nothing tells the listener what to feel.</p><p>Static or preachy sections are caught and rewritten.</p></div>
<div><h2>Passes</h2><p>Direct any section by hand, or let auto passes fix whatever fails worst, keeping a version only when it scores no worse.</p><p>Lock lines you love; every version is kept.</p></div>
</div>
<h2>From a real run</h2>
<pre>Her knuckles pale, she hovers the rim
She laughs: "That's a stall!"
Three stalls, two laughs, one new driver</pre>
<p class="t">Brief: a grandmother teaching her grandson to drive stick in a church parking lot. Wry; half-time; 140 BPM; fuzz bass.</p>
<p id="n" class="t"></p>
<footer>Runs on free inference providers. Your lyrics and words stay in your browser; only anonymous choice categories are counted to improve the app.</footer>
</div><script>
fetch("/api/insights").then((r) => (r.ok ? r.json() : null)).then((j) => {
  const w = j?.totals?.write ?? 0, p = j?.totals?.pass ?? 0;
  if (w) document.getElementById("n").textContent = w + " songs and " + p + " revision runs in the last " + j.days + " days.";
}).catch(() => {});
</script></body></html>`;
