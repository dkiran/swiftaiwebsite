import { describe, it, expect } from 'vitest';
import { loadConfig } from './config';

const base = { DB_USER: 'u', DB_PASSWORD: 'p', DB_NAME: 'swiftai' };
describe('loadConfig', () => {
  it('applies safe defaults: localhost only, port 3100, MySQL on localhost', () => {
    const c = loadConfig(base);
    expect(c.host).toBe('127.0.0.1');
    expect(c.port).toBe(3100);
    expect(c.trustProxy).toBe(false);
    expect(c.db).toEqual({ host: '127.0.0.1', port: 3306, user: 'u', password: 'p', database: 'swiftai' });
    expect(c.mail).toBeNull();
  });
  it('lists every missing database variable instead of starting half-configured', () => {
    expect(() => loadConfig({})).toThrow(/DB_USER.*DB_PASSWORD.*DB_NAME/s);
  });
  it('reads ZeptoMail settings when a token is set and requires the sender and notify address', () => {
    const c = loadConfig({ ...base, ZEPTOMAIL_TOKEN: 'k', MAIL_FROM_ADDRESS: 'hello@swift-ai.in', NOTIFY_EMAIL: 'hello@swift-ai.in', ZEPTOMAIL_API_HOST: 'api.zeptomail.in' });
    expect(c.mail).toEqual({ token: 'k', host: 'api.zeptomail.in', fromAddress: 'hello@swift-ai.in', fromName: 'Swift AI' });
    expect(c.notifyEmail).toBe('hello@swift-ai.in');
    expect(() => loadConfig({ ...base, ZEPTOMAIL_TOKEN: 'k' })).toThrow(/MAIL_FROM_ADDRESS/);
  });
  it('honours port, host and TRUST_PROXY overrides and passes chat settings through', () => {
    const c = loadConfig({ ...base, PORT: '4000', HOST: '0.0.0.0', TRUST_PROXY: '1', ANTHROPIC_API_KEY: 'sk', ALLOWED_ORIGIN: 'https://swift-ai.in' });
    expect([c.port, c.host, c.trustProxy]).toEqual([4000, '0.0.0.0', true]);
    expect(c.chatEnv.ANTHROPIC_API_KEY).toBe('sk');
    expect(c.chatEnv.ALLOWED_ORIGIN).toBe('https://swift-ai.in');
  });
  it('rejects an invalid port', () => expect(() => loadConfig({ ...base, PORT: 'abc' })).toThrow(/PORT/));
});
