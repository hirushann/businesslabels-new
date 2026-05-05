import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set(['businesslabels.test', 'localhost', '127.0.0.1']);

function isAllowedUrl(url: URL): boolean {
  if (!['http:', 'https:'].includes(url.protocol)) return false;

  if (ALLOWED_HOSTS.has(url.hostname)) return true;

  const backendBase = process.env.BBNL_API_BASE_URL;
  if (!backendBase) return false;

  try {
    const backendUrl = new URL(backendBase);
    return backendUrl.hostname === url.hostname;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url');

  if (!target) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter.' }, { status: 400 });
  }

  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json({ error: 'URL host is not allowed.' }, { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      cache: 'force-cache',
      next: { revalidate: 300 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream responded with ${upstream.status}.` }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const cacheControl = upstream.headers.get('cache-control') || 'public, max-age=300';

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load remote media.' }, { status: 502 });
  }
}
