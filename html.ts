import { css } from "./style.ts";

export const shell = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>LYRICFIELD · Write</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${css}</style><script>try{document.documentElement.dataset.z=localStorage.getItem("lf.z")||"1"}catch{}</script></head><body>
<header class="top"><a href="/" class="brand">LYRICFIELD</a>
<div class="zs" role="group" aria-label="Text size"><button type="button" data-z="1" aria-label="Normal text">A</button><button type="button" data-z="2" aria-label="Large text">A</button><button type="button" data-z="3" aria-label="Largest text">A</button></div></header>
<form id="form">
<textarea id="brief" aria-label="Song brief">A song about a grandmother teaching her grandson to drive stick on a Sunday in a church parking lot, told so a 9-year-old and a 90-year-old both laugh at the same line. Modern alt-rock with a rap burst.</textarea>
<button id="go" type="submit">Write song</button>
<details id="dir"><summary>Direction</summary><div class="dgrid">
<div class="ef"><span>Layout</span><select id="preset" aria-label="Layout preset"></select><div id="flayout"></div></div>
<div id="fdesign" class="dwide"></div>
<div class="dgrid1">
<label class="ef"><span>Style direction</span><input id="styleDir"></label>
<label class="ef"><span>Exclude</span><input id="excl"></label>
<div class="opts2">
<label class="chk"><input type="checkbox" id="clar" checked> Ask me first</label>
<label class="chk">Rounds <select id="rounds"><option>1</option><option selected>2</option><option>3</option></select></label>
<label class="chk">Auto passes after <select id="autoN"><option>0</option><option>2</option><option>3</option><option>4</option><option>6</option></select></label>
<label class="chk">Parallel <select id="conc"><option>2</option><option>3</option><option selected>4</option><option>6</option></select></label>
</div>
<div class="opts2"><label class="chk"><input type="checkbox" id="tasteOn"> Learn from my choices</label>
<button type="button" class="lnk" id="forget">Forget what it learned</button></div>
</div></div></details>
</form>
<div id="ask" class="ask" role="dialog" aria-label="Questions" hidden></div>
<div id="prog" aria-live="polite" hidden></div>
<div id="err" role="alert" hidden></div>
<main id="song"><div id="sheet"></div><div id="direct"></div></main>
<script type="module" src="/c/app.js"></script>
</body></html>`;
