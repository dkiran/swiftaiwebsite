export type MailConfig = { token: string; host: string; fromAddress: string; fromName: string };
export type Mail = { to: string; subject: string; html: string; text?: string; replyTo?: { address: string; name?: string } };

export const escapeHtml = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Sends one email through the ZeptoMail REST API. Throws on any failure (callers decide what to do). */
export async function sendMail(mail: Mail, cfg: MailConfig, fetchImpl: typeof fetch = fetch): Promise<void> {
  const auth = cfg.token.startsWith('Zoho-enczapikey') ? cfg.token : `Zoho-enczapikey ${cfg.token}`;
  const res = await fetchImpl(`https://${cfg.host}/v1.1/email`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      from: { address: cfg.fromAddress, name: cfg.fromName },
      to: [{ email_address: { address: mail.to } }],
      subject: mail.subject,
      htmlbody: mail.html,
      ...(mail.text ? { textbody: mail.text } : {}),
      ...(mail.replyTo ? { reply_to: [mail.replyTo] } : {}),
    }),
  });
  if (!res.ok) throw new Error(`ZeptoMail request failed with status ${res.status}`);
}

/** Notification email for the Swift AI inbox. Every value is HTML-escaped. */
export function buildSubmissionEmail(formName: string, fields: Record<string, string>, meta: { ip: string; at: Date }) {
  const subject = `New submission: ${formName}`.replace(/[\r\n]+/g, ' ').slice(0, 150);
  const rows = Object.entries(fields);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1d1d1f"><h2 style="margin:0 0 12px">${escapeHtml(formName)}</h2>` +
    `<table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="vertical-align:top;color:#5f6368"><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>` +
    `<p style="color:#8a8f98;font-size:12px;margin-top:16px">Received ${escapeHtml(meta.at.toISOString())} from IP ${escapeHtml(meta.ip)}</p></div>`;
  const text = `${formName}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nReceived ${meta.at.toISOString()} from IP ${meta.ip}`;
  return { subject, html, text };
}
