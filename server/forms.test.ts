import { describe, it, expect, vi } from 'vitest';
import { handleForm } from './forms';
import { createMemoryStore } from './store';
import { createLimiter } from '../infra/chat/handler';

const mk = (body: unknown, opts: { ip?: string; raw?: string; method?: string } = {}) =>
  new Request('https://x.test/api/forms', {
    method: opts.method ?? 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': opts.ip ?? '1.1.1.1', 'user-agent': 'TestAgent/1.0' },
    body: (opts.method ?? 'POST') === 'POST' ? (opts.raw ?? JSON.stringify(body)) : undefined,
  });
const setup = (over: Partial<Parameters<typeof handleForm>[1]> = {}) => {
  const store = createMemoryStore();
  const mailer = vi.fn().mockResolvedValue(undefined);
  const deps = { store, mailer, limiter: createLimiter(10, 60_000, () => 0), ...over };
  return { store, mailer, deps };
};
const good = { _form: 'AI Audit', name: 'Asha Rao', email: 'asha@firm.in', phone: '+91 80085 75757', bottleneck: 'Invoices' };

describe('handleForm', () => {
  it('stores a valid submission, emails the owner and reports success', async () => {
    const { store, mailer, deps } = setup();
    const r = await handleForm(mk(good), deps);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(store.submissions).toHaveLength(1);
    const s = store.submissions[0];
    expect(s.formName).toBe('AI Audit');
    expect(s.payload.name).toBe('Asha Rao');
    expect(s.payload.phone_e164).toBe('+918008575757');
    expect(s.ip).toBe('1.1.1.1');
    expect(s.userAgent).toBe('TestAgent/1.0');
    expect(s.emailSent).toBe(true);
    expect(mailer).toHaveBeenCalledOnce();
    expect(mailer.mock.calls[0][0].replyTo.address).toBe('asha@firm.in');
  });
  it('does not store internal keys (those starting with an underscore)', async () => {
    const { store, deps } = setup();
    await handleForm(mk({ ...good, _subject: 'x', _gotcha: '' }), deps);
    expect(Object.keys(store.submissions[0].payload).some((k) => k.startsWith('_'))).toBe(false);
  });
  it('silently accepts honeypot submissions without storing or emailing', async () => {
    const { store, mailer, deps } = setup();
    const r = await handleForm(mk({ ...good, _gotcha: 'I am a bot' }), deps);
    expect(r.status).toBe(200);
    expect(store.submissions).toHaveLength(0);
    expect(mailer).not.toHaveBeenCalled();
  });
  it('rejects an invalid email or phone with 400 and stores nothing', async () => {
    const { store, deps } = setup();
    expect((await handleForm(mk({ ...good, email: 'a@b' }), deps)).status).toBe(400);
    const r = await handleForm(mk({ ...good, phone: '12345' }), deps);
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe('invalid_phone');
    expect(store.submissions).toHaveLength(0);
  });
  it('rejects bad JSON, non-object bodies, a missing form name and empty forms', async () => {
    const { deps } = setup();
    expect((await handleForm(mk(null, { raw: '{nope' }), deps)).status).toBe(400);
    expect((await handleForm(mk([1, 2]), deps)).status).toBe(400);
    expect((await handleForm(mk({ name: 'x' }), deps)).status).toBe(400);
    expect((await handleForm(mk({ _form: 'Empty' }), deps)).status).toBe(400);
  });
  it('rejects oversized bodies with 413', async () => {
    const { deps } = setup();
    const r = await handleForm(mk({ ...good, bottleneck: 'x'.repeat(70_000) }), deps);
    expect(r.status).toBe(413);
  });
  it('rejects too many fields, over-long values and odd field names', async () => {
    const { deps } = setup();
    const many = Object.fromEntries(Array.from({ length: 45 }, (_, i) => [`f${i}`, 'v']));
    expect((await handleForm(mk({ _form: 'X', ...many }), deps)).status).toBe(400);
    expect((await handleForm(mk({ ...good, bottleneck: 'x'.repeat(5001) }), deps)).status).toBe(400);
    expect((await handleForm(mk({ ...good, 'bad<key>': 'v' }), deps)).status).toBe(400);
  });
  it('still succeeds and records the failure when the notification email fails', async () => {
    const { store, deps } = setup({ mailer: vi.fn().mockRejectedValue(new Error('mail down')) });
    const r = await handleForm(mk(good), deps);
    expect(r.status).toBe(200);
    expect(store.submissions[0].emailSent).toBe(false);
    expect(store.submissions[0].emailError).toContain('mail down');
  });
  it('still stores the lead when email is not configured', async () => {
    const { store, deps } = setup({ mailer: null });
    expect((await handleForm(mk(good), deps)).status).toBe(200);
    expect(store.submissions).toHaveLength(1);
    expect(store.submissions[0].emailSent).toBe(false);
  });
  it('returns 500 and sends no email when storage fails', async () => {
    const { mailer, deps } = setup();
    deps.store.insertSubmission = vi.fn().mockRejectedValue(new Error('db down'));
    const r = await handleForm(mk(good), deps);
    expect(r.status).toBe(500);
    expect((await r.json()).error).toBe('storage_failed');
    expect(mailer).not.toHaveBeenCalled();
  });
  it('rate limits the 11th request in a minute from one IP, but not other IPs', async () => {
    const { deps } = setup();
    for (let i = 0; i < 10; i++) expect((await handleForm(mk(good), deps)).status).toBe(200);
    expect((await handleForm(mk(good), deps)).status).toBe(429);
    expect((await handleForm(mk(good, { ip: '2.2.2.2' }), deps)).status).toBe(200);
  });
  it('only accepts POST', async () => {
    const { deps } = setup();
    expect((await handleForm(mk(null, { method: 'GET' }), deps)).status).toBe(405);
  });
  it('stores HTML in values untouched (escaping happens when emails are built)', async () => {
    const { store, deps } = setup();
    await handleForm(mk({ ...good, bottleneck: '<script>alert(1)</script>' }), deps);
    expect(store.submissions[0].payload.bottleneck).toBe('<script>alert(1)</script>');
  });
});
