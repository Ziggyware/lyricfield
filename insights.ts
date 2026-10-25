import { sqlite } from "https://esm.town/v/std/sqlite/main.ts";
import { init } from "./events.ts";

const DESIGN = ["tone", "cadence", "feel", "instruments", "effects", "idiom", "pov", "persona"];
const pairs = (rows: Record<string, unknown>[]) => rows.map((r) => [r.k, Number(r.n)] as [unknown, number]);
const each = (kind: string, path: string, since: number) => ({
  sql: `SELECT j.value AS k, COUNT(*) AS n FROM lf_events, json_each(json_extract(lf_events.data, '${path}')) AS j
        WHERE kind = ? AND t >= ? GROUP BY j.value ORDER BY n DESC LIMIT 12`, args: [kind, since],
});
const one = (kind: string, path: string, since: number) => ({
  sql: `SELECT json_extract(data, '${path}') AS k, COUNT(*) AS n FROM lf_events WHERE kind = ? AND t >= ? AND json_extract(data, '${path}') IS NOT NULL
        GROUP BY k ORDER BY n DESC LIMIT 12`, args: [kind, since],
});

// App-wide aggregates over the window: what writers direct, what they reject, what the checks keep failing on.
export async function insights(req: Request): Promise<Response> {
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const since = Date.now() - days * 864e5;
  await init();
  const [tot, prof, asp, picks, types, presets, gate, story, ans, copies, ...design] = await sqlite.batch([
    { sql: "SELECT kind AS k, COUNT(*) AS n FROM lf_events WHERE t >= ? GROUP BY kind", args: [since] },
    { sql: "SELECT COUNT(DISTINCT profile) AS n FROM lf_events WHERE t >= ?", args: [since] },
    each("pass", "$.aspects", since), one("pass", "$.pick", since), each("pass", "$.types", since),
    one("write", "$.preset", since), each("result", "$.gate", since), each("result", "$.story", since),
    { sql: "SELECT COUNT(*) AS n, SUM(json_extract(data, '$.skipped')) AS s, SUM(json_extract(data, '$.option')) AS o FROM lf_events WHERE kind = 'answer' AND t >= ?", args: [since] },
    { sql: "SELECT COUNT(*) AS n FROM lf_events WHERE kind = 'copy' AND json_extract(data, '$.what') = 'lyrics' AND t >= ?", args: [since] },
    ...DESIGN.map((k) => each("write", `$.${k}`, since)),
  ]);
  const totals = Object.fromEntries(pairs(tot.rows));
  const a = ans.rows[0] ?? {}, an = Number(a.n) || 0;
  const versions = (totals.write ?? 0) + (totals.pass ?? 0);
  return Response.json({
    days, profiles: Number(prof.rows[0]?.n ?? 0), totals,
    restoreRate: (totals.restore ?? 0) / Math.max(1, totals.pass ?? 0),
    skipRate: an ? Number(a.s) / an : 0, optionRate: an ? Number(a.o) / an : 0,
    shipRate: Math.min(1, Number(copies.rows[0]?.n ?? 0) / Math.max(1, versions)),
    aspects: pairs(asp.rows), picks: pairs(picks.rows), types: pairs(types.rows), presets: pairs(presets.rows),
    gate: pairs(gate.rows), story: pairs(story.rows),
    design: Object.fromEntries(DESIGN.map((k, i) => [k, pairs(design[i].rows)])),
  });
}
