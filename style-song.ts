// Sheet and pass panel. Level → size: title --t-title, section header --t-head, sung line --t-lyric,
// prose and notes --t-body, measurements --t-meta. The pass panel and dialogs live in style-panel.ts.
import { panelCss } from "./style-panel.ts";

export const songCss = `
#song{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,400px);gap:0;min-height:0}
#sheet,#direct{overflow:auto;min-width:0;padding-block:0 12px}#direct{padding-top:10px;border-left:1px solid var(--line);padding-inline:16px}
@media (max-width:760px){#song{grid-template-columns:1fr;overflow:visible}#sheet,#direct{overflow:visible}#direct{border-left:0;border-top:2px solid var(--line);padding-inline:0;padding-top:12px}}
.sh-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding-block:8px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:1}
.sh-bar .cp{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;color:var(--dim)}
#ver{max-width:100%;flex:1 1 14rem}
.cc{font-size:var(--t-meta);color:var(--dim);font-variant-numeric:tabular-nums}.cc.over{color:var(--bad);font-weight:600}.cc.over::before{content:"✕ "}
.sheet h2{font-size:var(--t-title);line-height:1.25;font-weight:600;margin:14px 0 6px;color:var(--acc);text-wrap:balance}
.ast{color:var(--grp);font-size:var(--t-body);margin-top:14px;line-height:1.5}
.blk{border-top:1px solid var(--line);margin-top:16px;padding-top:6px}.blk p{margin:4px 0 10px;max-width:68ch}
.sec{margin:8px 0 16px;padding-left:10px;border-left:3px solid transparent}.sec.scoped{border-left-color:var(--acc);background:var(--hi)}
.hd{background:none;border:0;padding:4px 0;cursor:pointer;color:var(--prm);text-align:left;font-size:var(--t-head);font-weight:600;min-height:var(--tap)}
.hd[aria-pressed=true]{color:var(--acc)}.hd[aria-pressed=true]::before{content:"▸ "}
.ln{display:grid;grid-template-columns:2.2em 1.9em minmax(0,1fr) auto;align-items:baseline;font-variant-numeric:tabular-nums;cursor:pointer;border-left:3px solid transparent;padding:3px 0 3px 2px;min-height:var(--tap)}
.ln:hover{background:#13160e}.ln.lk{border-left-color:var(--wait);background:#1a160b}.ln.lk .tx{color:#fff;font-weight:500}
.tx{font-size:var(--t-lyric);line-height:1.45;overflow-wrap:anywhere}
.sy{color:var(--dim);text-align:right;padding-right:8px;font-size:var(--t-meta)}.ln.off .sy{color:var(--wait);font-weight:600}
.rh{color:var(--prm);font-size:var(--t-meta);font-weight:600}
.ln.bad .tx{color:var(--bad);text-decoration:underline wavy;text-underline-offset:4px}
.lkm{font-size:var(--t-meta);color:var(--wait);padding-left:6px;font-weight:600}
.sd{font-size:var(--t-meta);color:var(--dim);padding:4px 0 0 2.4em;line-height:1.5}
.sd .ev{color:var(--ok)}.sd .ev::before{content:"✓ "}.sd .flat{color:var(--bad)}.sd .flat::before{content:"✕ "}
.lint{list-style:none;margin:0;padding:0;display:grid;gap:6px}.lint li{font-size:var(--t-body);line-height:1.5}
.lint b{font-weight:600;color:var(--fg);margin-right:6px}
.sev-error{color:var(--bad)}.sev-error::before{content:"✕ "}.sev-warn{color:var(--wait)}.sev-warn::before{content:"! "}
.lint li:not(.gate){color:var(--dim)}.lint li:not(.gate)::before{content:"· "}
.dl{display:grid;grid-template-columns:1.6em minmax(0,1fr);white-space:pre-wrap;font-size:var(--t-lyric)}.dl span{color:var(--dim)}
.dadd{color:var(--ok);background:#0d1d13}.ddel{color:var(--bad);background:#221109;text-decoration:line-through}
.edit{display:grid;gap:12px;padding-top:12px}.esec{border:1px solid var(--edge);padding:8px 10px;display:grid;gap:8px}
.esec legend{color:var(--prm);font-size:var(--t-head);font-weight:600}.erow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:8px}
@media (max-width:560px){.erow{grid-template-columns:1fr}}
${panelCss}`;
