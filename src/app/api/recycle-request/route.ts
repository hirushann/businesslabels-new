import { NextRequest, NextResponse } from 'next/server';

function backendUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

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

/**
 * POST /api/recycle-request
 * Proxy endpoint that forwards recycle requests to Laravel.
 */
export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(backendUrl(apiBaseUrl, '/api/recycle-request'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error forwarding recycle request:', error);

    return NextResponse.json(
      { message: 'Failed to send request. Please try again later.' },
      { status: 500 }
    );
  }
}
