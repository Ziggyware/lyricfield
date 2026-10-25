import { songCss } from "./style-song.ts";

export const css = `
:root{--bg:#08090a;--fg:#d9dccf;--dim:#6f7468;--line:#1d2019;--acc:#d4ff00;--bad:#ff5a3c;--ok:#7ee0a1;--wait:#ffc24a;
--prm:#9be7ff;--ask:#ffb3e6;--grp:#c6a8ff;--hi:#13160d;color-scheme:dark}
*{box-sizing:border-box}html,body{height:100%}[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--fg);font:13px/1.45 "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
padding:0 max(12px,env(safe-area-inset-right)) env(safe-area-inset-bottom) max(12px,env(safe-area-inset-left));display:flex;flex-direction:column}
button,select,textarea,input{font:inherit;color:inherit}
input,textarea,select{background:transparent;border:1px solid var(--line);padding:4px 6px}select{background:var(--bg)}
:focus-visible{outline:1px solid var(--acc);outline-offset:1px}
.top{padding-top:10px}.brand{color:var(--acc);font-weight:600;letter-spacing:.12em;text-decoration:none;font-size:12px}
#form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding-block:8px 10px;border-bottom:1px solid var(--line)}
#brief{min-height:64px;resize:vertical;padding:8px;line-height:1.4}
#go{background:var(--acc);color:#000;border:0;padding:8px 14px;font-weight:600;cursor:pointer;align-self:start}#go:disabled{opacity:.45;cursor:wait}
#dir{grid-column:1/-1}#dir summary{cursor:pointer;color:var(--dim)}
.dgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:8px 16px;padding-block:8px}
#prog{padding-block:6px;color:var(--dim);font-size:11px;font-variant-numeric:tabular-nums;border-bottom:1px solid var(--line)}
#prog b{color:var(--acc);font-weight:500}#prog .live{display:block;color:var(--fg);opacity:.7;margin-top:2px}
#err{color:var(--bad);padding-block:6px}
${songCss}.empty{color:var(--dim);padding:12px 4px}
h4{margin:12px 0 4px;font-size:10px;letter-spacing:.08em;color:var(--dim);font-weight:500;text-transform:uppercase}
.lnk{background:none;border:0;padding:0;cursor:pointer;text-align:left;color:var(--fg);text-decoration:underline;text-decoration-color:var(--dim)}
.btn{background:none;border:1px solid var(--line);color:var(--fg);padding:3px 8px;cursor:pointer}
.btn:hover{border-color:var(--dim)}.btn[aria-pressed=true]{border-color:var(--acc);color:var(--acc)}.btn:disabled{opacity:.4;cursor:default}
.btn.pri{border-color:var(--acc);color:var(--acc)}
.mt{font-size:11px;color:var(--dim);font-variant-numeric:tabular-nums}
.chk{display:inline-flex;gap:6px;align-items:center;color:var(--dim)}
.ef{display:grid;gap:2px;min-width:0}.ef>span{font-size:10px;letter-spacing:.06em;color:var(--dim);text-transform:uppercase}
.ef textarea{resize:vertical;line-height:1.4}
.auto p{margin:0}.alog{list-style:none;margin:0;padding:0;font-size:12px;display:grid;gap:2px}.alog .ok{color:var(--ok)}
`;
