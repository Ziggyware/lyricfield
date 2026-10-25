import { songCss } from "./style-song.ts";

// Low-vision system. Every text color clears WCAG AAA (7:1) on --bg; control borders clear 3:1.
// One meaning per color everywhere: yellow = action/title, cyan = song structure, violet = notes,
// green/amber/red = status (always paired with a ✓ ! ✕ glyph, never color alone).
// One size per level, all in rem so the text-size control scales everything: title, heading, lyric,
// body, meta. Nothing renders below 14px at the default size.
export const css = `
:root{--bg:#08090a;--fg:#ecefe4;--dim:#b4baa9;--line:#3a4034;--edge:#7d8673;--acc:#d4ff00;--bad:#ff8466;--ok:#86eaa9;--wait:#ffc95c;
--prm:#8fe3ff;--ask:#ffb8e8;--grp:#d2bfff;--hi:#171b0e;--z:1;
--t-title:1.5rem;--t-head:1.1875rem;--t-lyric:1.125rem;--t-body:1rem;--t-meta:.875rem;--tap:2.75rem;color-scheme:dark}
:root[data-z="2"]{--z:1.2}:root[data-z="3"]{--z:1.4}
html{font-size:calc(16px * var(--z));-webkit-text-size-adjust:100%}
@media (max-width:760px){html{font-size:calc(17px * var(--z))}}
*{box-sizing:border-box}html,body{min-height:100%}[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--fg);font:400 var(--t-body)/1.6 "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
padding:0 max(16px,env(safe-area-inset-right)) env(safe-area-inset-bottom) max(16px,env(safe-area-inset-left));display:flex;flex-direction:column}
button,select,textarea,input{font:inherit;color:inherit}
input,textarea,select{background:transparent;border:1px solid var(--edge);padding:.4rem .55rem;min-height:var(--tap)}select{background:var(--bg)}
:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;padding-top:12px}
.brand{color:var(--acc);font-weight:600;letter-spacing:.12em;text-decoration:none;font-size:var(--t-body);min-height:var(--tap);display:inline-flex;align-items:center}
.zs{display:flex;gap:4px}.zs button{min-width:var(--tap);min-height:var(--tap);background:none;border:1px solid var(--edge);cursor:pointer;font-weight:600;line-height:1}
.zs button[aria-pressed=true]{border-color:var(--acc);color:var(--acc);border-width:2px}
.zs [data-z="1"]{font-size:.875rem}.zs [data-z="2"]{font-size:1.0625rem}.zs [data-z="3"]{font-size:1.3125rem}
#form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding-block:10px 12px;border-bottom:1px solid var(--line)}
@media (max-width:560px){#form{grid-template-columns:1fr}#go{width:100%}}
#brief{min-height:6.5rem;resize:vertical;padding:.6rem;line-height:1.5}
#go{background:var(--acc);color:#000;border:0;padding:.6rem 1.2rem;font-weight:600;cursor:pointer;align-self:start;min-height:var(--tap)}#go:disabled{background:var(--dim);cursor:wait}
#dir{grid-column:1/-1}summary{cursor:pointer;color:var(--fg);font-weight:500;min-height:var(--tap);display:flex;align-items:center}
summary::marker,summary::-webkit-details-marker{color:var(--acc)}
.dgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px 20px;padding-block:8px}
#prog{padding-block:8px;color:var(--dim);font-size:var(--t-meta);font-variant-numeric:tabular-nums;border-bottom:1px solid var(--line)}
#prog b{color:var(--acc);font-weight:600}#prog .live{display:block;color:var(--fg);margin-top:2px}
#err{color:var(--bad);padding-block:8px;font-weight:500}#err::before{content:"✕ "}
${songCss}.empty{color:var(--dim);padding:16px 4px}
h4{margin:16px 0 6px;font-size:var(--t-meta);letter-spacing:.06em;color:var(--dim);font-weight:600;text-transform:uppercase}
.lnk{background:none;border:0;padding:0 2px;cursor:pointer;text-align:left;color:var(--fg);text-decoration:underline;text-underline-offset:3px;min-height:var(--tap)}
.btn{background:none;border:1px solid var(--edge);color:var(--fg);padding:.35rem .75rem;cursor:pointer;min-height:var(--tap)}
.btn:hover{border-color:var(--fg)}.btn[aria-pressed=true]{border:2px solid var(--acc);color:var(--acc)}.btn:disabled{color:var(--dim);border-style:dashed;cursor:default}
.btn.pri{border:2px solid var(--acc);color:var(--acc);font-weight:600}
.mt{font-size:var(--t-meta);color:var(--dim);font-variant-numeric:tabular-nums}
.chk{display:inline-flex;gap:8px;align-items:center;color:var(--fg);min-height:var(--tap)}
input[type=checkbox]{width:1.25rem;height:1.25rem;min-height:0;accent-color:var(--acc)}
.ef{display:grid;gap:4px;min-width:0}.ef>span{font-size:var(--t-meta);letter-spacing:.05em;color:var(--dim);text-transform:uppercase;font-weight:600}
.ef textarea{resize:vertical;line-height:1.5}
.auto p{margin:0}.alog{list-style:none;margin:0;padding:0;font-size:var(--t-meta);display:grid;gap:4px}
.alog .ok{color:var(--ok)}.alog .ok::before{content:"✓ "}.alog .mt::before{content:"· "}
`;
