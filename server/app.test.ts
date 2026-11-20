import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from './app';
import { createNodeServer } from './node-adapter';
import { createMemoryStore } from './store';
import { createLimiter } from '../infra/chat/handler';

const good = { _form: 'Contact', name: 'Asha', email: 'asha@firm.in', message: 'Hello' };
let server: Server, base: string, store: ReturnType<typeof createMemoryStore>;
const upstream = vi.fn();

async function start(opts: { trustProxy?: boolean; chatKey?: string } = {}) {
  store = createMemoryStore();
  const app = createApp({
    store, mailer: null, notifyTo: 'o@x.in', formsLimiter: createLimiter(50, 60_000), chatLimiter: createLimiter(50, 60_000),
    chatEnv: { ANTHROPIC_API_KEY: opts.chatKey }, fetch: upstream as unknown as typeof fetch,
  });
  server = createNodeServer(app, { trustProxy: !!opts.trustProxy, maxBody: 64 * 1024 });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

beforeEach(() => upstream.mockReset());
afterEach(async () => { await new Promise((r) => server.close(r)); });

describe('API over real HTTP', () => {
  it('answers /api/health and sets safe headers', async () => {
    await start();
    const r = await fetch(base + '/api/health');
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(r.headers.get('x-content-type-options')).toBe('nosniff');
    expect(r.headers.get('cache-control')).toBe('no-store');
  });
  it('saves a form submission', async () => {
    await start();
    const r = await post('/api/forms', good);
    expect(r.status).toBe(200);
    expect(store.submissions).toHaveLength(1);
    expect(store.submissions[0].formName).toBe('Contact');
  });
  it('ignores a spoofed X-Forwarded-For unless TRUST_PROXY is on', async () => {
    await start({ trustProxy: false });
    await post('/api/forms', good, { 'x-forwarded-for': '9.9.9.9' });
    expect(store.submissions[0].ip).not.toBe('9.9.9.9');
    expect(store.submissions[0].ip).toMatch(/127\.0\.0\.1/);
  });
  it('uses the proxy header when TRUST_PROXY is on', async () => {
    await start({ trustProxy: true });
    await post('/api/forms', good, { 'x-forwarded-for': '9.9.9.9' });
    expect(store.submissions[0].ip).toBe('9.9.9.9');
  });
  it('rejects a huge body with 413 and keeps serving', async () => {
    await start();
    const r = await post('/api/forms', { ...good, message: 'x'.repeat(300_000) }).catch(() => null);
    if (r) expect(r.status).toBe(413);
    expect((await fetch(base + '/api/health')).status).toBe(200);
  });
  it('returns 404 for unknown paths and 405 for wrong methods', async () => {
    await start();
    expect((await fetch(base + '/api/nope')).status).toBe(404);
    expect((await fetch(base + '/api/forms')).status).toBe(405);
    expect((await fetch(base + '/')).status).toBe(404);
  });
  it('routes /api/chat: 503 without a key, and a reply with one', async () => {
    await start();
    const r = await post('/api/chat', { messages: [{ role: 'user', content: 'Hi' }] });
    expect(r.status).toBe(503);
    await new Promise((res) => server.close(res));
    await start({ chatKey: 'sk-test' });
    upstream.mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'Hello from Swift AI' }] }) });
    const r2 = await post('/api/chat', { messages: [{ role: 'user', content: 'Hi' }] });
    expect(r2.status).toBe(200);
    expect((await r2.json()).reply).toBe('Hello from Swift AI');
  });
  it('returns a plain 500 (no stack trace) when something throws', async () => {
    await start();
    store.insertSubmission = () => { throw new Error('secret internal detail'); };
    const r = await post('/api/forms', good);
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain('secret internal detail');
  });
});
