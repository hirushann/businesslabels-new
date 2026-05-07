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

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  const authToken = request.cookies.get('auth_token')?.value;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(backendUrl(apiBaseUrl, '/api/account/logout'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await readResponseBody(response);
    const nextResponse = NextResponse.json(data, { status: response.status });

    nextResponse.cookies.delete('auth_token');
    nextResponse.cookies.delete('auth_session');

    return nextResponse;
  } catch (error) {
    console.error('Error logging out:', error);

    const nextResponse = NextResponse.json(
      { message: 'Logged out locally.' },
      { status: 200 }
    );
    nextResponse.cookies.delete('auth_token');
    nextResponse.cookies.delete('auth_session');

    return nextResponse;
  }
}
