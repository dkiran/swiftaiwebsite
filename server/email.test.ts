import { describe, it, expect, vi } from 'vitest';
import { sendMail, buildSubmissionEmail, escapeHtml, type MailConfig } from './email';

const cfg: MailConfig = { token: 'SECRETKEY', host: 'api.zeptomail.com', fromAddress: 'hello@swift-ai.in', fromName: 'Swift AI' };
const mail = { to: 'owner@swift-ai.in', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' };
const okFetch = () => vi.fn().mockResolvedValue({ ok: true, status: 201, text: async () => '' });

describe('sendMail', () => {
  it('posts to the ZeptoMail API with the key header and the right body', async () => {
    const f = okFetch();
    await sendMail({ ...mail, replyTo: { address: 'lead@firm.in', name: 'Asha' } }, cfg, f as unknown as typeof fetch);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.zeptomail.com/v1.1/email');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Zoho-enczapikey SECRETKEY');
    const body = JSON.parse(init.body as string);
    expect(body.from).toEqual({ address: 'hello@swift-ai.in', name: 'Swift AI' });
    expect(body.to[0].email_address.address).toBe('owner@swift-ai.in');
    expect(body.subject).toBe('Hi');
    expect(body.htmlbody).toBe('<p>Hi</p>');
    expect(body.textbody).toBe('Hi');
    expect(body.reply_to[0]).toEqual({ address: 'lead@firm.in', name: 'Asha' });
  });
  it('does not double-prefix a token that already includes Zoho-enczapikey, and honours the data-centre host', async () => {
    const f = okFetch();
    await sendMail(mail, { ...cfg, token: 'Zoho-enczapikey ABC', host: 'api.zeptomail.in' }, f as unknown as typeof fetch);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.zeptomail.in/v1.1/email');
    expect((init.headers as Record<string, string>).Authorization).toBe('Zoho-enczapikey ABC');
  });
  it('throws on a non-2xx response without leaking the token', async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'bad token' });
    await expect(sendMail(mail, cfg, f as unknown as typeof fetch)).rejects.toThrow(/401/);
    await expect(sendMail(mail, cfg, f as unknown as typeof fetch)).rejects.not.toThrow(/SECRETKEY/);
  });
  it('propagates network errors', async () => {
    const f = vi.fn().mockRejectedValue(new Error('net down'));
    await expect(sendMail(mail, cfg, f as unknown as typeof fetch)).rejects.toThrow('net down');
  });
});

describe('buildSubmissionEmail', () => {
  const meta = { ip: '1.2.3.4', at: new Date('2026-11-20T10:00:00Z') };
  it('lists every field and the form name', () => {
    const m = buildSubmissionEmail('AI Audit', { name: 'Asha', email: 'a@b.in' }, meta);
    expect(m.subject).toBe('New submission: AI Audit');
    expect(m.html).toContain('Asha');
    expect(m.text).toContain('email: a@b.in');
    expect(m.html).toContain('1.2.3.4');
  });
  it('escapes HTML in values and field names', () => {
    const m = buildSubmissionEmail('X', { '<b>k</b>': '<script>alert(1)</script> "q" & \'s\'' }, meta);
    expect(m.html).not.toContain('<script>');
    expect(m.html).not.toContain('<b>k</b>');
    expect(m.html).toContain('&lt;script&gt;');
    expect(m.html).toContain('&amp;');
  });
  it('strips line breaks from the subject (header injection)', () => {
    const m = buildSubmissionEmail('Evil\r\nBcc: x@y.z', {}, meta);
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});

describe('escapeHtml', () => {
  it('escapes the five dangerous characters', () => expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;'));
});
