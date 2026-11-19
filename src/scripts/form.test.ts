import { describe, it, expect, vi } from 'vitest';
import { validate, postLead, type Field } from './form';

const fields: Field[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'note', label: 'Note', type: 'textarea' },
];
const good = { name: 'Asha', email: 'asha@firm.in', phone: '+91 98765 43210', note: '' };

describe('validate', () => {
  it('returns no errors for a valid set', () => expect(validate(good, fields)).toEqual({}));
  it('rejects an empty required field', () => expect(validate({ ...good, name: '  ' }, fields).name).toBeTruthy());
  it('rejects a malformed email', () => expect(validate({ ...good, email: 'a@b' }, fields).email).toBeTruthy());
  it('rejects a phone with fewer than 10 digits', () => expect(validate({ ...good, phone: '12345' }, fields).phone).toBeTruthy());
  it('does not require optional fields', () => expect(validate({ ...good, note: '' }, fields).note).toBeUndefined());
});

describe('postLead', () => {
  it('returns unconfigured and never calls fetch when endpoint is empty', async () => {
    const f = vi.fn();
    expect(await postLead(good, '', f as unknown as typeof fetch)).toBe('unconfigured');
    expect(f).not.toHaveBeenCalled();
  });
  it('returns ok when the endpoint responds 200', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true });
    expect(await postLead(good, 'https://x.test/f', f as unknown as typeof fetch)).toBe('ok');
    expect(f).toHaveBeenCalledOnce();
  });
  it('returns error when the endpoint fails or the network throws', async () => {
    const bad = vi.fn().mockResolvedValue({ ok: false });
    expect(await postLead(good, 'https://x.test/f', bad as unknown as typeof fetch)).toBe('error');
    const boom = vi.fn().mockRejectedValue(new Error('net'));
    expect(await postLead(good, 'https://x.test/f', boom as unknown as typeof fetch)).toBe('error');
  });
  it('silently drops submissions where the honeypot is filled', async () => {
    const f = vi.fn();
    expect(await postLead({ ...good, _gotcha: 'bot' }, 'https://x.test/f', f as unknown as typeof fetch)).toBe('ok');
    expect(f).not.toHaveBeenCalled();
  });
});
