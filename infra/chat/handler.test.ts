import { describe, it, expect, vi } from 'vitest';
import { handleChat, createLimiter } from './handler';

const env = { ANTHROPIC_API_KEY: 'sk-test-secret' };
const upstreamOk = () => vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'Hello from Swift AI' }] }) });
const mk = (body: unknown, ip = '1.1.1.1') =>
  new Request('https://x.test/chat', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body) });
const deps = (f = upstreamOk()) => ({ fetch: f as unknown as typeof fetch, limiter: createLimiter(10, 60_000, () => 0) });
const ok = { messages: [{ role: 'user', content: 'What do you do?' }] };

describe('handleChat', () => {
  it('returns 503 not_configured when the API key is missing', async () => {
    const r = await handleChat(mk(ok), {}, deps());
    expect(r.status).toBe(503);
    expect((await r.json()).error).toBe('not_configured');
  });
  it('returns 503 disabled when the kill switch is on', async () => {
    const r = await handleChat(mk(ok), { ...env, CHAT_DISABLED: '1' }, deps());
    expect(r.status).toBe(503);
    expect((await r.json()).error).toBe('disabled');
  });
  it('rejects empty messages, oversize messages and too many messages with 400', async () => {
    for (const body of [{ messages: [] }, { messages: [{ role: 'user', content: 'x'.repeat(1001) }] },
      { messages: Array.from({ length: 21 }, () => ({ role: 'user', content: 'hi' })) }, { nope: 1 }, { messages: [{ role: 'system', content: 'hi' }] }]) {
      expect((await handleChat(mk(body), env, deps())).status).toBe(400);
    }
  });
  it('rate limits the 11th request in a minute from one IP with 429', async () => {
    const d = deps();
    for (let i = 0; i < 10; i++) expect((await handleChat(mk(ok), env, d)).status).toBe(200);
    expect((await handleChat(mk(ok), env, d)).status).toBe(429);
    expect((await handleChat(mk(ok, '2.2.2.2'), env, d)).status).toBe(200);
  });
  it('forwards only the last 10 messages, starting with a user turn', async () => {
    const f = upstreamOk();
    const msgs = Array.from({ length: 16 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `m${i}` }));
    await handleChat(mk({ messages: msgs.slice(0, 15) }), env, deps(f));
    const sent = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.messages.length).toBeLessThanOrEqual(10);
    expect(sent.messages[0].role).toBe('user');
    expect(sent.messages.at(-1).content).toBe('m14');
  });
  it('sends the Swift AI system prompt, key header and no tools', async () => {
    const f = upstreamOk();
    await handleChat(mk(ok), env, deps(f));
    const init = f.mock.calls[0][1] as RequestInit;
    const sent = JSON.parse(init.body as string);
    expect(sent.system).toContain('Swift AI Tech Solutions Private Limited');
    expect(sent.tools).toBeUndefined();
    expect(sent.max_tokens).toBeLessThanOrEqual(500);
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('sk-test-secret');
  });
  it('returns the reply and never leaks the API key', async () => {
    const r = await handleChat(mk(ok), env, deps());
    const text = await r.text();
    expect(JSON.parse(text).reply).toBe('Hello from Swift AI');
    expect(text).not.toContain('sk-test-secret');
  });
  it('returns 502 when the upstream fails or throws', async () => {
    const bad = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    expect((await handleChat(mk(ok), env, deps(bad))).status).toBe(502);
    const boom = vi.fn().mockRejectedValue(new Error('net'));
    expect((await handleChat(mk(ok), env, deps(boom))).status).toBe(502);
  });
  it('answers CORS preflight with 204', async () => {
    const r = await handleChat(new Request('https://x.test/chat', { method: 'OPTIONS' }), env, deps());
    expect(r.status).toBe(204);
    expect(r.headers.get('access-control-allow-methods')).toContain('POST');
  });
});

describe('createLimiter', () => {
  it('allows again after the window passes', () => {
    let t = 0; const l = createLimiter(2, 1000, () => t);
    expect([l.hit('a'), l.hit('a'), l.hit('a')]).toEqual([true, true, false]);
    t = 1001; expect(l.hit('a')).toBe(true);
  });
});
