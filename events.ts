import { sqlite } from "https://esm.town/v/std/sqlite/main.ts";

// Selection events, categorical only: the client never sends lyric text or free-text answers, and the
// sanitizer below drops anything that could carry it (strings over 40 chars, nested objects).
const KINDS = new Set(["answer", "pass", "lock", "rewrite", "restore", "copy", "write", "result", "auto"]);
let ready: Promise<unknown> | null = null;
export const init = () =>
  ready ??= sqlite.batch([
    "CREATE TABLE IF NOT EXISTS lf_events (id INTEGER PRIMARY KEY, t INTEGER NOT NULL, profile TEXT NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS lf_events_kind_t ON lf_events(kind, t)",
  ]).catch((e) => { ready = null; throw e; });

type Prim = string | number | boolean | null;
const prim = (v: unknown): Prim | undefined => {
  if (v === null || typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") return v.length <= 40 ? v : undefined;
  return undefined;
};
function clean(data: unknown): Record<string, Prim | Prim[]> {
  const out: Record<string, Prim | Prim[]> = {};
  if (!data || typeof data !== "object" || Array.isArray(data)) return out;
  for (const [k, v] of Object.entries(data).slice(0, 16)) {
    if (!/^[a-z]{1,16}$/.test(k)) continue;
    if (Array.isArray(v)) out[k] = v.slice(0, 16).map(prim).filter((x): x is Prim => x !== undefined);
    else { const p = prim(v); if (p !== undefined) out[k] = p; }
  }
  return out;
}

export async function recordEvent(req: Request): Promise<Response> {
  const text = await req.text();
  if (text.length > 2048) return Response.json({ error: "too large" }, { status: 413 });
  let b: { profile?: unknown; kind?: unknown; data?: unknown };
  try { b = JSON.parse(text); } catch { return Response.json({ error: "body is not JSON" }, { status: 400 }); }
  if (typeof b.profile !== "string" || !/^[\w-]{6,64}$/.test(b.profile)) return Response.json({ error: "bad profile" }, { status: 400 });
  if (typeof b.kind !== "string" || !KINDS.has(b.kind)) return Response.json({ error: "bad kind" }, { status: 400 });
  await init();
  await sqlite.execute({ sql: "INSERT INTO lf_events (t, profile, kind, data) VALUES (?, ?, ?, ?)", args: [Date.now(), b.profile, b.kind, JSON.stringify(clean(b.data))] });
  return new Response(null, { status: 204 });
}
