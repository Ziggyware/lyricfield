export const songCss = `
#song{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,360px);gap:0;min-height:0}
#sheet,#direct{overflow:auto;min-width:0;padding-block:0 8px}#direct{padding-top:8px}
#direct{border-left:1px solid var(--line);padding-inline:12px}
@media (max-width:760px){#song{grid-template-columns:1fr;overflow:auto}#sheet,#direct{overflow:visible}#direct{border-left:0;border-top:1px solid var(--line);padding-inline:0}}
.sh-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding-bottom:8px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:1}
.sh-bar .cp{display:inline-flex;flex-wrap:wrap;gap:4px;align-items:center;color:var(--dim)}
.cc{font-size:11px;color:var(--dim);font-variant-numeric:tabular-nums}.cc.over{color:var(--bad)}
.sheet h2{font-size:15px;font-weight:600;margin:10px 0 4px;color:var(--acc);text-wrap:balance}
.ast{color:var(--grp);font-size:12px;margin-top:10px}
.blk{border-top:1px solid var(--line);margin-top:12px;padding-top:4px}.blk p{margin:2px 0 8px;max-width:72ch}
.sec{margin:6px 0 10px;padding-left:6px;border-left:1px solid transparent}.sec.scoped{border-left-color:var(--acc);background:var(--hi)}
.hd{background:none;border:0;padding:2px 0;cursor:pointer;color:var(--prm);text-align:left}.hd[aria-pressed=true]{color:var(--acc)}
.ln{display:grid;grid-template-columns:2.4em 2.2em minmax(0,1fr) auto;font-variant-numeric:tabular-nums;cursor:pointer;border-left:1px solid transparent}
.ln:hover{background:#11130f}.ln.lk{border-left-color:var(--wait)}.ln.lk .tx{color:#fff}
.sy{color:var(--dim);text-align:right;padding-right:8px}.ln.off .sy{color:var(--wait)}.rh{color:var(--prm)}
.ln.bad .tx{color:var(--bad)}.lkm{font-size:10px;color:var(--wait);padding-left:6px}
.sd{font-size:10px;color:var(--dim);padding-left:4.6em}
.lint{list-style:none;margin:0;padding:0}.lint li{padding:2px 0;font-size:12px}.lint b{font-weight:500;color:var(--fg);margin-right:6px}
.sev-error{color:var(--bad)}.sev-warn{color:var(--wait)}.lint li:not(.gate){opacity:.7}
.dl{display:grid;grid-template-columns:1.4em minmax(0,1fr);white-space:pre-wrap}.dl span{color:var(--dim)}
.dadd{color:var(--ok);background:#0d1a12}.ddel{color:var(--bad);background:#1d0f0c;text-decoration:line-through}
.edit{display:grid;gap:10px;padding-top:10px}.esec{border:1px solid var(--line);padding:6px 8px;display:grid;gap:6px}
.esec legend{color:var(--prm)}.erow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:6px}
.dgrid1{display:grid;gap:8px;align-content:start}
.direct{display:grid;gap:10px}.direct .row{font-size:12px;color:var(--dim)}.direct .row b{color:var(--fg);font-weight:500;margin-right:6px}
.picks,.chips{display:flex;flex-wrap:wrap;gap:4px}
.chip{background:none;border:1px solid var(--line);padding:2px 8px;cursor:pointer;color:var(--dim)}
.chip[aria-pressed=true]{border-color:var(--acc);color:var(--acc)}
.opts2{display:flex;flex-wrap:wrap;gap:12px}
.lay-box summary{cursor:pointer;color:var(--dim)}
.lay{list-style:none;margin:6px 0;padding:0;display:grid;gap:2px}
.lay li{display:grid;grid-template-columns:1.6em minmax(0,1fr) auto auto auto auto;gap:4px;align-items:center}
.lay input{padding:1px 6px}.lay li button{background:none;border:1px solid var(--line);cursor:pointer;padding:0 6px}.lay li button:disabled{opacity:.3}
.lay-n{color:var(--dim);text-align:right;font-variant-numeric:tabular-nums}.lay-new{font-size:10px;color:var(--ok)}
.lay li:not(:has(.lay-new)){grid-template-columns:1.6em minmax(0,1fr) auto auto auto}
.lay-add{display:flex;gap:4px}
.ask{border:1px solid var(--ask);padding:10px;margin-block:8px;display:grid;gap:10px}
.q{border:0;padding:0;margin:0;display:grid;gap:6px}.q legend{color:var(--ask);padding:0;margin-bottom:4px}
.opts{display:flex;flex-wrap:wrap;gap:4px}
.opt{background:none;border:1px solid var(--line);padding:3px 8px;cursor:pointer}.opt[aria-pressed=true]{border-color:var(--ask);color:var(--ask)}
.ask-act{display:flex;gap:8px}
.arc{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:2px 12px;margin:4px 0 8px}.arc dt{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.06em}.arc dd{margin:0;max-width:72ch}
.sd .ev{color:var(--ok)}.sd .flat{color:var(--bad)}
.chip.fav{border-style:dashed}
.dwide{grid-column:1/-1}.design{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:8px 16px}
.design .chips{align-items:center}.pdesign .design{grid-template-columns:1fr;margin-top:6px}.dz{white-space:pre-line}
`;
