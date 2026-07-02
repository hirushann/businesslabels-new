import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl) {
    return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
  }

  try {
    const url = `${apiBaseUrl.replace(/\/$/, '')}/api/faq/slug/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch FAQ page' }, { status: res.status });
    }
    const json = await res.json();
    return NextResponse.json(json);
  } catch (error) {
    console.error('Failed to proxy FAQ page request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
