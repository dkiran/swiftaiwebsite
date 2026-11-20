type Msg = { role: 'user' | 'assistant'; content: string };
const FALLBACK = 'Our assistant is not available right now. Please book a free AI Audit at /book-ai-audit/ or reach us at /contact/.';
const LINK = /(\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/|https?:\/\/[^\s)]+)/gi;

/** Render text safely: textContent for text, anchors only for internal paths and http(s) URLs. */
function render(el: HTMLElement, text: string) {
  el.textContent = '';
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const i = m.index!;
    el.append(text.slice(last, i));
    const a = document.createElement('a'); a.href = m[0]; a.textContent = m[0];
    if (m[0].startsWith('http')) a.rel = 'noopener'; el.append(a); last = i + m[0].length;
  }
  el.append(text.slice(last));
}

export function initChat() {
  const root = document.getElementById('chat');
  if (!root) return;
  const fab = root.querySelector<HTMLButtonElement>('.chat-fab')!;
  const panel = root.querySelector<HTMLElement>('.chat-panel')!;
  const log = root.querySelector<HTMLElement>('.chat-log')!;
  const form = root.querySelector<HTMLFormElement>('.chat-form')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const send = form.querySelector<HTMLButtonElement>('button')!;
  const endpoint: string = import.meta.env.PUBLIC_CHAT_ENDPOINT ?? (import.meta.env.PROD ? '/api/chat' : '');
  const history: Msg[] = [];

  const add = (cls: 'bot' | 'me', text: string) => { const d = document.createElement('div'); d.className = `msg ${cls}`; render(d, text); log.append(d); log.scrollTop = log.scrollHeight; return d; };
  const open = (v: boolean) => { panel.classList.toggle('open', v); fab.setAttribute('aria-expanded', String(v)); if (v) input.focus(); else fab.focus(); };

  add('bot', 'Hi! I\'m the Swift AI assistant. Ask me about AI automation, fractional CTOs, our products or the free AI Audit.');
  const chips = document.createElement('div'); chips.className = 'chips';
  for (const q of ['What do you automate?', 'How does the free AI Audit work?', 'What does a fractional CTO cost?', 'I want to hire a CTO']) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = q; b.onclick = () => { chips.remove(); ask(q); }; chips.append(b);
  }
  log.append(chips);

  async function ask(text: string) {
    if (!text.trim()) return;
    add('me', text); history.push({ role: 'user', content: text });
    if (!endpoint) { add('bot', FALLBACK); return; }
    send.disabled = true; const typing = add('bot', '…');
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-10) }) });
      if (res.status === 429) throw new Error('rate');
      if (!res.ok) throw new Error('bad');
      const { reply } = await res.json();
      history.push({ role: 'assistant', content: reply }); render(typing, reply);
    } catch (e) {
      history.pop();
      render(typing, (e as Error).message === 'rate' ? 'You are sending messages very quickly. Please wait a minute and try again.' : FALLBACK);
    } finally { send.disabled = false; log.scrollTop = log.scrollHeight; }
  }

  fab.addEventListener('click', () => open(!panel.classList.contains('open')));
  root.querySelector('.chat-close')!.addEventListener('click', () => open(false));
  panel.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') open(false); });
  form.addEventListener('submit', (e) => { e.preventDefault(); const t = input.value.trim().slice(0, 1000); input.value = ''; chips.remove(); ask(t); });
}
