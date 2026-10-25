// Inference call wrapped in the clock primitives: one timer per call, a reminder when the soft
// deadline passes, a reminder per retry or cooldown.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// First balanced, parseable {...} in the reply; tolerant of fences and prose around it. An object that
// never closes means the reply was truncated: return null (→ retry with a larger budget) rather than
// falling back to a nested fragment such as the "arc" object inside a cut-off song.
export function extractJSON(s) {
  const src = String(s ?? "").replace(/```(?:json)?/gi, "");
  let start = src.indexOf("{");
  while (start !== -1) {
    let depth = 0, str = false, esc = false, end = -1;
    for (let i = start; i < src.length && end < 0; i++) {
      const c = src[i];
      if (str) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') str = false;
      } else if (c === '"') str = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) end = i;
    }
    if (end < 0) return null;
    try { return JSON.parse(src.slice(start, end + 1)); } catch { start = src.indexOf("{", end + 1); }
  }
  return null;
}

// Shared cooldown gate. The router's free key slots are a pooled token bucket: when one call is told
// to wait (HTTP 429), every call waits, so retries refill the bucket instead of draining it.
const gate = { until: 0, streak: 0 };
const MAX_COOLDOWNS = 8;
async function cooled() {
  for (let w = gate.until - Date.now(); w > 0; w = gate.until - Date.now()) await sleep(w);
}
function coolDown(hintS) {
  gate.streak++;
  const ms = Math.min(45000, Math.max(hintS * 1000, 3000 * 2 ** (gate.streak - 1))) * (0.85 + Math.random() * 0.3);
  gate.until = Math.max(gate.until, Date.now() + ms);
  return Math.round(ms / 1000);
}

export async function ask(store, o) {
  const { agent, parent, system, user, temperature = 0.9, maxTokens = 6000, softMs = 20000, tries = 3 } = o;
  const timer = store.add("timer", `${agent} inference`, {
    agent, parent, status: "running",
    data: { softMs, attempts: 0 }, refs: parent ? [{ rel: "guards", to: parent }] : [],
  });
  let soft = null;
  const softT = setTimeout(() => {
    soft = store.add("reminder", `${agent} past ${softMs / 1000}s soft deadline`, {
      agent, parent, status: "pending", refs: parent ? [{ rel: "nudges", to: parent }] : [],
    });
  }, softMs);
  const messages = [{ role: "system", content: system }, { role: "user", content: user }];
  const nudge = (label, data) => store.add("reminder", label, {
    agent, parent, status: "fired", data, refs: parent ? [{ rel: "nudges", to: parent }] : [],
  });

  try {
    let i = 1, cools = 0;
    while (true) {
      await cooled();
      store.set(timer.id, { data: { attempts: i, cooldowns: cools } });
      let r, j;
      try {
        r = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            temperature: Math.max(0.3, temperature - 0.25 * (i - 1)),
            max_tokens: Math.round(maxTokens * (1 + 0.5 * (i - 1))), // truncation is the common failure: widen on retry
          }),
        });
        j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
      } catch (e) {
        r = { ok: false, status: 0 };
        j = { error: `network: ${e?.message ?? e}` };
      }
      store.stats.calls++;
      if (r.status === 429 && cools < MAX_COOLDOWNS) {
        cools++;
        const s = coolDown(Number(j.retryAfter) || 0);
        nudge(`${agent} cooldown ${s}s: ${String(j.error ?? "rate limited").slice(0, 80)}`, { cause: j.error });
        continue;
      }
      let msg = "";
      if (!r.ok) msg = String(j.error || `HTTP ${r.status}`);
      else {
        gate.streak = 0;
        store.stats.ms += j.ms || 0;
        store.stats.tokens += j.tokens || 0;
        const out = extractJSON(j.content);
        if (out) {
          store.set(timer.id, { status: "done", data: { ms: j.ms, model: j.model, provider: j.provider, tokens: j.tokens } });
          return out;
        }
        msg = "reply was not JSON";
      }
      msg = msg.slice(0, 240);
      store.stats.fails++;
      store.set(timer.id, { data: { lastError: msg } });
      if (i >= tries) {
        store.set(timer.id, { status: "failed" });
        throw new Error(`${agent}: ${msg}`);
      }
      i++;
      nudge(`${agent} retry ${i}/${tries}`, { cause: msg });
      if (msg === "reply was not JSON") {
        messages.push({ role: "user", content: "Your last reply did not parse. Return exactly one JSON object." });
      }
      await sleep(500 + Math.random() * 1000 * 2 ** i);
    }
  } finally {
    clearTimeout(softT);
    if (soft) store.set(soft.id, { status: "cleared" });
  }
}
