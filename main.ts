import { readFile } from "https://esm.town/v/std/utils/index.ts";
import { shell } from "./html.ts";
import { landing } from "./landing.ts";
import { recordEvent } from "./events.ts";
import { insights } from "./insights.ts";

// Shared free-tier inference router (OpenAI-compatible, multi-provider fallback).
const ROUTER = "https://router.val.run/v1/chat/completions";
const CLIENT = new Set(["agents", "app", "app-auto", "app-design", "app-direct", "app-pass", "app-song", "arc", "ask", "auto", "clarify", "codes", "craft", "design", "design-data", "direct", "editor", "enforce", "engine", "esc", "finale", "graph", "groups", "layout", "learn", "llm", "narrative", "numwords", "pass", "persona", "picks", "plan", "prompts", "prompts-story", "prosody", "refine", "relate", "roster", "sheet", "song", "state", "store", "suno", "taste", "taste-profile", "tournament", "versions"]);

async function llm(req: Request): Promise<Response> {
  let body: { messages?: unknown; temperature?: number; max_tokens?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "body is not JSON" }, { status: 400 });
  }
  const { messages, temperature = 0.9, max_tokens = 4000 } = body ?? {};
  if (!Array.isArray(messages) || !messages.length) return Response.json({ error: "messages required" }, { status: 400 });

  const t0 = performance.now();
  try {
    const r = await fetch(ROUTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, temperature, max_tokens: Math.min(16000, max_tokens) }),
      signal: AbortSignal.timeout(55_000),
    });
    const j = await r.json().catch(() => null);
    const ms = Math.round(performance.now() - t0);
    const content = j?.choices?.[0]?.message?.content;
    if (!r.ok || !content) {
      const why = j?.error?.message || (j?.choices ? `empty reply (finish ${j.choices[0]?.finish_reason ?? "?"}, ${j.usage?.completion_tokens ?? "?"} tokens)` : "");
      const msg = (String(why).split("\n").find(Boolean) || `router HTTP ${r.status}`).slice(0, 400);
      // Never answer 5xx: Cloudflare replaces 5xx bodies from the val with its own HTML page and the reason
      // is lost. Pool exhaustion / rate limits → 429 + retryAfter (client cools down); anything else → 424.
      const limited = r.status === 429 || r.status === 503 || /EXHAUSTED|rate.?limit|too many/i.test(msg);
      const retryAfter = Number(r.headers.get("retry-after")) || (limited ? 6 : 0);
      return Response.json({ error: msg, ms, retryAfter }, { status: limited ? 429 : 424 });
    }
    return Response.json({
      content,
      model: j.model,
      provider: j._omni_meta?.provider?.name ?? null,
      tokens: j.usage?.total_tokens ?? 0,
      ms,
    });
  } catch (e) {
    const ms = Math.round(performance.now() - t0);
    const timeout = e instanceof DOMException && e.name === "TimeoutError";
    return Response.json({ error: timeout ? "router timed out at 55s" : String(e), ms }, { status: 408 });
  }
}

export default async function (req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (req.method === "POST" && pathname === "/api/llm") return llm(req);
  if (req.method === "POST" && pathname === "/api/event") return recordEvent(req);
  if (req.method === "GET" && pathname === "/api/insights") return insights(req);
  const m = pathname.match(/^\/c\/([a-z-]+)\.js$/);
  if (req.method === "GET" && m && CLIENT.has(m[1])) {
    return new Response(await readFile(`/client/${m[1]}.js`, import.meta.url), {
      headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }
  const page = req.method === "GET" && (pathname === "/" ? landing : pathname === "/app" ? shell : null);
  if (page) return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  return new Response("Not Found", { status: 404 });
}
