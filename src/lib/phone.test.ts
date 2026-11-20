import { describe, it, expect } from 'vitest';
import { isValidPhone, normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('normalises Indian numbers in common formats to +91XXXXXXXXXX', () => {
    for (const v of ['8008575757', '08008575757', '918008575757', '+918008575757', '+91 80085 75757', '+91-80085-75757', '(+91) 80085 75757', '80085 75757'])
      expect(normalizePhone(v), v).toBe('+918008575757');
  });
  it('accepts international E.164 numbers', () => {
    expect(normalizePhone('+1 415 555 2671')).toBe('+14155552671');
    expect(normalizePhone('+44 20 7946 0958')).toBe('+442079460958');
    expect(normalizePhone('+971 50 123 4567')).toBe('+971501234567');
  });
  it('rejects letters, too short, too long and misplaced plus', () => {
    for (const v of ['', '12345', 'abcdefghij', '+1', '+1234567890123456', '80085+75757', '+91abcdefghij']) expect(normalizePhone(v), v).toBeNull();
  });
  it('rejects Indian-looking numbers that cannot exist (must start 6-9)', () => {
    for (const v of ['5008575757', '+91 12345 67890', '1234567890']) expect(normalizePhone(v), v).toBeNull();
  });
  it('rejects a country code starting with 0', () => expect(normalizePhone('+0123456789')).toBeNull());
  it('handles non-string input safely', () => expect(normalizePhone(undefined as unknown as string)).toBeNull());
});

describe('isValidPhone', () => {
  it('mirrors normalizePhone', () => {
    expect(isValidPhone('+91 80085 75757')).toBe(true);
    expect(isValidPhone('hello')).toBe(false);
  });
});
