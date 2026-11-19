import { handleChat, createLimiter } from './handler';

// AWS Lambda adapter for a Function URL (payload format 2.0).
// Env vars: ANTHROPIC_API_KEY (secret), CHAT_MODEL, CHAT_DISABLED, ALLOWED_ORIGIN (https://your-domain).
type Event = { requestContext: { http: { method: string; sourceIp: string } }; headers: Record<string, string>; body?: string; isBase64Encoded?: boolean; rawPath?: string };
const limiter = createLimiter(10, 60_000);

export const handler = async (event: Event) => {
  const body = event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body) : undefined;
  const method = event.requestContext.http.method;
  const headers = { ...event.headers, 'x-forwarded-for': event.requestContext.http.sourceIp }; // trust the platform IP, not the client header
  const req = new Request('https://lambda.local/chat', { method, headers, body: method === 'GET' || method === 'HEAD' ? undefined : body });
  const res = await handleChat(req, process.env as Record<string, string | undefined>, { fetch, limiter });
  return { statusCode: res.status, headers: Object.fromEntries(res.headers), body: await res.text() };
};
