import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function GET(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { data: [], message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const query = request.nextUrl.searchParams.get('query') ?? '';
    const url = new URL(`${API_BASE_URL.replace(/\/$/, '')}/api/printers/search`);
    url.searchParams.set('query', query);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error searching printers:', error);

    return NextResponse.json(
      { data: [], message: 'Failed to search printers.' },
      { status: 500 }
    );
  }
}
