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

function clearAuthCookies(response: NextResponse) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };

  response.cookies.set('auth_token', '', cookieOptions);
  response.cookies.set('auth_session', '', cookieOptions);
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  const authToken = request.cookies.get('auth_token')?.value;

  if (!apiBaseUrl) {
    const nextResponse = NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );

    clearAuthCookies(nextResponse);

    return nextResponse;
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

    clearAuthCookies(nextResponse);

    return nextResponse;
  } catch (error) {
    console.error('Error logging out:', error);

    const nextResponse = NextResponse.json(
      { message: 'Logged out locally.' },
      { status: 200 }
    );
    clearAuthCookies(nextResponse);

    return nextResponse;
  }
}
