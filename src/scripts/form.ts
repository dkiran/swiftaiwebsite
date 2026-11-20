export type Field = {
  name: string; label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'url';
  required?: boolean; options?: string[]; placeholder?: string;
};
export type Result = 'ok' | 'unconfigured' | 'error';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validate(values: Record<string, string>, fields: Field[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = (values[f.name] ?? '').trim();
    if (!v) { if (f.required) errors[f.name] = `${f.label} is required`; continue; }
    if (f.type === 'email' && !EMAIL.test(v)) errors[f.name] = 'Enter a valid email address';
    if (f.type === 'tel' && v.replace(/\D/g, '').length < 10) errors[f.name] = 'Enter a valid phone number (10+ digits)';
    if (f.type === 'url' && !/^https?:\/\/.+\..+/.test(v)) errors[f.name] = 'Enter a full URL starting with https://';
  }
  return errors;
}

export async function postLead(values: Record<string, string>, endpoint: string, fetchImpl: typeof fetch = fetch, accessKey = ''): Promise<Result> {
  if (values._gotcha) return 'ok'; // honeypot: pretend success, send nothing
  if (!endpoint) return 'unconfigured';
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(accessKey ? { ...values, access_key: accessKey } : values),
    });
    return res.ok ? 'ok' : 'error';
  } catch { return 'error'; }
}

export async function submit(form: HTMLFormElement): Promise<Result> {
  const values: Record<string, string> = {};
  new FormData(form).forEach((v, k) => { values[k] = String(v); });
  return postLead(values, import.meta.env.PUBLIC_FORM_ENDPOINT ?? '', fetch, import.meta.env.PUBLIC_FORM_ACCESS_KEY ?? '');
}

/** Wire every <form data-lead> on the page. */
export function init() {
  document.querySelectorAll<HTMLFormElement>('form[data-lead]').forEach((form) => {
    const fields: Field[] = JSON.parse(form.dataset.fields || '[]');
    const msg = form.querySelector<HTMLElement>('.form-msg')!;
    const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values: Record<string, string> = {};
      new FormData(form).forEach((v, k) => { values[k] = String(v); });
      const errors = validate(values, fields);
      form.querySelectorAll('.field').forEach((el) => {
        const n = (el as HTMLElement).dataset.name!;
        el.classList.toggle('invalid', !!errors[n]);
        el.querySelector('.err')!.textContent = errors[n] || '';
      });
      msg.className = 'form-msg';
      if (Object.keys(errors).length) {
        form.querySelector<HTMLElement>('.field.invalid input, .field.invalid select, .field.invalid textarea')?.focus();
        return;
      }
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending…';
      const r = await submit(form);
      btn.disabled = false; btn.textContent = label;
      if (r === 'ok') { msg.textContent = form.dataset.success || 'Thank you! We will get back to you within one business day.'; msg.className = 'form-msg show ok'; form.reset(); }
      else if (r === 'unconfigured') { msg.textContent = 'This form is not connected yet. Please email us directly using the address on the Contact page.'; msg.className = 'form-msg show bad'; }
      else { msg.textContent = 'Something went wrong. Please try again, or email us directly.'; msg.className = 'form-msg show bad'; }
    });
  });
}
