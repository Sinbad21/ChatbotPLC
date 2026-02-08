/**
 * Catch-all API proxy route handler.
 *
 * Every request to /api/* on the frontend worker is forwarded to the
 * dedicated API worker (plcassistant-api). This allows the browser to
 * talk only to one domain, eliminating CORS and cookie-domain issues.
 *
 * The API_BACKEND_URL env var is read at runtime (server component / edge).
 * Fallback: the hardcoded production URL.
 */

const BACKEND =
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://plcassistant-api.gabrypiritore.workers.dev';

/** Headers that must NOT be forwarded to/from the upstream. */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'te',
  'trailer',
  'upgrade',
  'proxy-authorization',
  'proxy-authenticate',
]);

async function proxy(request: Request, params: { path: string[] }): Promise<Response> {
  const path = params.path.join('/');

  // Build target URL preserving query string
  const incoming = new URL(request.url);
  const target = new URL(`/api/${path}`, BACKEND);
  target.search = incoming.search;

  // Forward headers, stripping hop-by-hop and host
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || HOP_BY_HOP.has(lower)) return;
    headers.set(key, value);
  });

  // Build fetch init
  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual', // don't follow redirects — let the client handle them
  };

  // Forward body for methods that have one
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    // @ts-expect-error — duplex required for streaming request bodies on edge
    init.duplex = 'half';
  }

  const upstream = await fetch(target.toString(), init);

  // Build response, forwarding all headers except hop-by-hop
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // Remove any content-encoding — the body is already decompressed by fetch()
    if (lower === 'content-encoding') return;
    // Append Set-Cookie (there can be multiples)
    if (lower === 'set-cookie') {
      // Rewrite SameSite=None to Lax — we're same-origin now
      const rewritten = value.replace(/SameSite=None/gi, 'SameSite=Lax');
      responseHeaders.append(key, rewritten);
      return;
    }
    responseHeaders.set(key, value);
  });

  // Remove CORS headers — same-origin doesn't need them, and they could confuse the browser
  responseHeaders.delete('access-control-allow-origin');
  responseHeaders.delete('access-control-allow-credentials');
  responseHeaders.delete('access-control-allow-methods');
  responseHeaders.delete('access-control-allow-headers');
  responseHeaders.delete('access-control-expose-headers');
  responseHeaders.delete('access-control-max-age');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await context.params);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await context.params);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await context.params);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await context.params);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await context.params);
}

export async function OPTIONS(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await context.params);
}
