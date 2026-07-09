import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

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

export async function GET(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(backendUrl(API_BASE_URL, '/api/shipping-rules/active'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching shipping rules:', error);

    return NextResponse.json(
      { message: 'Unable to load shipping rules right now.' },
      { status: 500 }
    );
  }
}
