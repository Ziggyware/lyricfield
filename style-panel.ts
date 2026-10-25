// Pass panel, layout editor, question dialog, design chips. Touch targets are at least --tap high.
export const panelCss = `
.dgrid1{display:grid;gap:12px;align-content:start}
.direct{display:grid;gap:14px}.direct .row{font-size:var(--t-body);color:var(--dim)}.direct .row b{color:var(--fg);font-weight:600;margin-right:6px}
.picks,.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{background:none;border:1px solid var(--edge);padding:.3rem .7rem;cursor:pointer;color:var(--fg);min-height:2.5rem}
.chip[aria-pressed=true]{border:2px solid var(--acc);color:var(--acc);font-weight:600}.chip[aria-pressed=true]::before{content:"✓ "}
.chip.fav{border-style:dashed}
.opts2{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
.lay{list-style:none;margin:8px 0;padding:0;display:grid;gap:4px}
.lay li{display:grid;grid-template-columns:1.8em minmax(0,1fr) auto auto auto auto;gap:4px;align-items:center}
.lay li:not(:has(.lay-new)){grid-template-columns:1.8em minmax(0,1fr) auto auto auto}
.lay li button{background:none;border:1px solid var(--edge);cursor:pointer;min-width:var(--tap);min-height:var(--tap)}.lay li button:disabled{color:var(--dim);border-style:dashed}
.lay-n{color:var(--dim);text-align:right;font-variant-numeric:tabular-nums;font-size:var(--t-meta)}.lay-new{font-size:var(--t-meta);color:var(--ok)}
.lay-add{display:flex;flex-wrap:wrap;gap:6px}
.ask{border:2px solid var(--ask);padding:14px;margin-block:10px;display:grid;gap:14px}
.q{border:0;padding:0;margin:0;display:grid;gap:8px}.q legend{color:var(--ask);padding:0;margin-bottom:6px;font-size:var(--t-head);font-weight:600;line-height:1.4}
.opts{display:flex;flex-wrap:wrap;gap:6px}
.opt{background:none;border:1px solid var(--edge);padding:.35rem .8rem;cursor:pointer;min-height:var(--tap)}.opt[aria-pressed=true]{border:2px solid var(--ask);color:var(--ask);font-weight:600}
.opt[aria-pressed=true]::before{content:"✓ "}.ask-act{display:flex;flex-wrap:wrap;gap:8px}
.arc{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 14px;margin:6px 0 10px}
.arc dt{color:var(--dim);font-size:var(--t-meta);text-transform:uppercase;letter-spacing:.05em;font-weight:600;padding-top:.1rem}.arc dd{margin:0;max-width:68ch}
@media (max-width:560px){.arc{grid-template-columns:1fr;gap:0}.arc dd{margin-bottom:8px}}
.dwide{grid-column:1/-1}.design{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px 20px}
.design .chips{align-items:center}.pdesign .design{grid-template-columns:1fr;margin-top:8px}.dz{white-space:pre-line}
`;
