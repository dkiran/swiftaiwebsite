import { normalizePhone } from '../src/lib/phone';
import type { Limiter } from '../infra/chat/handler';
import { buildSubmissionEmail, type Mail } from './email';
import type { Store } from './store';

export type FormDeps = { store: Store; mailer: ((mail: Mail) => Promise<void>) | null; limiter: Limiter; notifyTo?: string };

const MAX_BODY = 64 * 1024, MAX_FIELDS = 40, MAX_VALUE = 5000, MAX_FORM_NAME = 100;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const KEY = /^[A-Za-z0-9_\- ]{1,60}$/;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** POST /api/forms: validates, stores in MySQL, notifies by email. A lead is never lost to an email failure. */
export async function handleForm(req: Request, deps: FormDeps): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (!deps.limiter.hit(ip)) return json(429, { error: 'rate_limited' });

  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > MAX_BODY) return json(413, { error: 'too_large' });
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { error: 'too_large' });

  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'invalid_json' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(400, { error: 'invalid_body' });
  const input = body as Record<string, unknown>;

  if (typeof input._gotcha === 'string' && input._gotcha.trim()) return json(200, { ok: true }); // bot: pretend success, keep nothing

  const formName = typeof input._form === 'string' ? input._form.trim() : '';
  if (!formName || formName.length > MAX_FORM_NAME) return json(400, { error: 'invalid_form' });

  const payload: Record<string, string> = {};
  const entries = Object.entries(input).filter(([k]) => !k.startsWith('_'));
  if (entries.length > MAX_FIELDS) return json(400, { error: 'too_many_fields' });
  for (const [k, v] of entries) {
    if (!KEY.test(k)) return json(400, { error: 'invalid_field_name' });
    if (typeof v !== 'string') return json(400, { error: 'invalid_value' });
    if (v.length > MAX_VALUE) return json(400, { error: 'value_too_long' });
    const t = v.trim();
    if (t) payload[k] = t;
  }
  if (!Object.keys(payload).length) return json(400, { error: 'empty_form' });
  if (payload.email && !EMAIL.test(payload.email)) return json(400, { error: 'invalid_email' });
  if (payload.phone) {
    const e164 = normalizePhone(payload.phone);
    if (!e164) return json(400, { error: 'invalid_phone' });
    payload.phone_e164 = e164;
  }

  const userAgent = (req.headers.get('user-agent') || '').slice(0, 255);
  let id: number;
  try { id = await deps.store.insertSubmission({ formName, payload, ip, userAgent }); }
  catch { return json(500, { error: 'storage_failed' }); }

  if (deps.mailer) {
    try {
      const m = buildSubmissionEmail(formName, payload, { ip, at: new Date() });
      await deps.mailer({ to: deps.notifyTo ?? '', subject: m.subject, html: m.html, text: m.text, ...(payload.email ? { replyTo: { address: payload.email, name: payload.name } } : {}) });
      await deps.store.markEmailSent(id, true).catch(() => {});
    } catch (e) {
      await deps.store.markEmailSent(id, false, e instanceof Error ? e.message : 'mail failed').catch(() => {});
    }
  } else {
    await deps.store.markEmailSent(id, false, 'mail not configured').catch(() => {});
  }
  return json(200, { ok: true });
}
