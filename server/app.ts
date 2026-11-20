import { handleChat, type Env as ChatEnv, type Limiter } from '../infra/chat/handler';
import { handleForm } from './forms';
import type { Mail } from './email';
import type { Store } from './store';

export type AppDeps = {
  store: Store; mailer: ((mail: Mail) => Promise<void>) | null; notifyTo: string;
  formsLimiter: Limiter; chatLimiter: Limiter; chatEnv: ChatEnv; fetch: typeof fetch;
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** The whole API as one function: Request in, Response out. nginx forwards /api/ here. */
export function createApp(d: AppDeps) {
  return async (req: Request): Promise<Response> => {
    const path = new URL(req.url).pathname.replace(/\/+$/, '') || '/';
    let res: Response;
    try {
      if (path === '/api/health') res = req.method === 'GET' ? json(200, { ok: true }) : json(405, { error: 'method_not_allowed' });
      else if (path === '/api/forms') res = await handleForm(req, { store: d.store, mailer: d.mailer, limiter: d.formsLimiter, notifyTo: d.notifyTo });
      else if (path === '/api/chat') res = await handleChat(req, d.chatEnv, { fetch: d.fetch, limiter: d.chatLimiter });
      else res = json(404, { error: 'not_found' });
    } catch (e) {
      console.error('unhandled error:', e instanceof Error ? e.message : 'unknown');
      res = json(500, { error: 'internal_error' });
    }
    const headers = new Headers(res.headers);
    headers.set('x-content-type-options', 'nosniff');
    headers.set('cache-control', 'no-store');
    return new Response(res.body, { status: res.status, headers });
  };
}
