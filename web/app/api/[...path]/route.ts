import type { NextRequest } from 'next/server';

// Proxy /api/* -> NestJS (đọc API_URL lúc chạy). Giữ cookie cùng origin nên không cần CORS.
export const dynamic = 'force-dynamic';

const API = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = `${API}/api/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const h of ['cookie', 'content-type', 'x-forwarded-for']) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  // để Nest biết request gốc là https (cookie Secure)
  headers.set('x-forwarded-proto', req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', ''));

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return Response.json({ error: 'API không phản hồi' }, { status: 502 });
  }

  const out = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) out.set('content-type', ct);
  for (const c of upstream.headers.getSetCookie()) out.append('set-cookie', c);
  const body = upstream.status === 204 ? null : await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers: out });
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
