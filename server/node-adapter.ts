import http from 'node:http';

/**
 * Connects Node's http server to a Web-standard handler. Two safety rules live here:
 * the request body is size-capped, and the client IP comes from the socket unless the proxy header is explicitly trusted.
 */
export function createNodeServer(app: (req: Request) => Promise<Response>, opts: { trustProxy: boolean; maxBody: number }) {
  return http.createServer(async (req, res) => {
    try {
      const method = req.method || 'GET';
      let body: Buffer | undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        const chunks: Buffer[] = []; let size = 0;
        for await (const chunk of req) {
          size += (chunk as Buffer).length;
          if (size > opts.maxBody) {
            res.writeHead(413, { 'content-type': 'application/json', connection: 'close' });
            res.end('{"error":"too_large"}');
            res.on('finish', () => req.destroy());
            return;
          }
          chunks.push(chunk as Buffer);
        }
        body = Buffer.concat(chunks);
      }
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (v !== undefined && k !== 'x-forwarded-for') headers.set(k, Array.isArray(v) ? v.join(', ') : v);
      const forwarded = typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'].split(',')[0].trim() : '';
      headers.set('x-forwarded-for', opts.trustProxy && forwarded ? forwarded : req.socket.remoteAddress || 'unknown');

      const webReq = new Request(`http://localhost${req.url || '/'}`, { method, headers, body: body && body.length ? body : undefined });
      const out = await app(webReq);
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
    } catch {
      if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
      res.end('{"error":"internal_error"}');
    }
  });
}
