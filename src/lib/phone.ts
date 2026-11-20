/**
 * Phone numbers: Indian (10 digits starting 6-9, with optional 0, 91 or +91) or international E.164 (+ then 8 to 15 digits).
 * This checks the FORMAT only. It does not prove the number belongs to the person (SMS verification comes in a later phase).
 */
const INDIAN_SUBSCRIBER = /^[6-9]\d{9}$/;

export function normalizePhone(input: string): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.trim().replace(/[\s\-.()]/g, '');
  const plus = cleaned.startsWith('+');
  const digits = plus ? cleaned.slice(1) : cleaned;
  if (!/^\d+$/.test(digits)) return null;

  if (plus) {
    if (digits.startsWith('0')) return null;
    if (digits.startsWith('91')) return INDIAN_SUBSCRIBER.test(digits.slice(2)) ? `+${digits}` : null;
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
  const national = digits.startsWith('0') ? digits.slice(1) : digits;
  if (INDIAN_SUBSCRIBER.test(national)) return `+91${national}`;
  if (national.length === 12 && national.startsWith('91') && INDIAN_SUBSCRIBER.test(national.slice(2))) return `+${national}`;
  return null;
}

export const isValidPhone = (input: string): boolean => normalizePhone(input) !== null;
