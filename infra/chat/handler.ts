import { buildSystemPrompt } from '../../src/data/knowledge';

export type Env = { ANTHROPIC_API_KEY?: string; CHAT_MODEL?: string; CHAT_DISABLED?: string; ALLOWED_ORIGIN?: string };
export type Limiter = { hit(key: string): boolean };
export type Deps = { fetch: typeof fetch; limiter: Limiter };
type Msg = { role: 'user' | 'assistant'; content: string };

const MAX_MESSAGES = 20, MAX_CHARS = 1000, FORWARD_LAST = 10;

/** Sliding-window limiter, kept in memory per Lambda container. */
export function createLimiter(max = 10, windowMs = 60_000, now: () => number = Date.now): Limiter {
  const hits = new Map<string, number[]>();
  return {
    hit(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      if (recent.length >= max) { hits.set(key, recent); return false; }
      recent.push(t); hits.set(key, recent); return true;
    },
  };
}

export async function handleChat(req: Request, env: Env, deps: Deps): Promise<Response> {
  const cors = {
    'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (env.CHAT_DISABLED === '1') return json(503, { error: 'disabled' });
  if (!env.ANTHROPIC_API_KEY) return json(503, { error: 'not_configured' });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  let body: { messages?: unknown };
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }); }
  const raw = body?.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return json(400, { error: 'invalid_messages' });
  for (const m of raw) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim() || m.content.length > MAX_CHARS)
      return json(400, { error: 'invalid_messages' });
  }

  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (!deps.limiter.hit(ip)) return json(429, { error: 'rate_limited' });

  let msgs = (raw as Msg[]).slice(-FORWARD_LAST);
  while (msgs.length && msgs[0].role !== 'user') msgs = msgs.slice(1); // API needs a leading user turn
  while (msgs.length && msgs[msgs.length - 1].role !== 'user') msgs = msgs.slice(0, -1); // no assistant prefill: a forged trailing turn would 400
  if (!msgs.length) return json(400, { error: 'invalid_messages' });

  try {
    const res = await deps.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.CHAT_MODEL || 'claude-haiku-5-5', max_tokens: 1024, thinking: { type: 'disabled' }, system: buildSystemPrompt(), messages: msgs }),
    });
    if (!res.ok) return json(502, { error: 'upstream' });
    const data = (await res.json()) as { stop_reason?: string; content?: { type: string; text?: string }[] };
    if (data.stop_reason === 'refusal') return json(502, { error: 'refused' });
    const reply = (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
    if (!reply) return json(502, { error: 'empty' });
    return json(200, { reply });
  } catch { return json(502, { error: 'upstream' }); }
}
