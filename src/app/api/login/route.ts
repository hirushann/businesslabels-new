import { NextRequest, NextResponse } from 'next/server';

type LoginPayload = {
  email?: unknown;
  password?: unknown;
  remember?: unknown;
};

type LoginResponseBody = {
  token?: unknown;
  access_token?: unknown;
  plainTextToken?: unknown;
  user?: unknown;
  [key: string]: unknown;
};

function backendUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as LoginResponseBody;
  } catch {
    return { message: text };
  }
}

function getAuthToken(data: LoginResponseBody) {
  const token = data.token ?? data.access_token ?? data.plainTextToken;

  return typeof token === 'string' && token.trim() ? token.trim() : null;
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as any;
    const email = (body.email || body.username || '').toString().trim();
    const password = (body.password || '').toString();
    const remember = Boolean(body.remember);

    if (!email || !password) {
      return NextResponse.json(
        {
          message: 'The email and password fields are required.',
          errors: {
            email: email ? undefined : ['The email field is required.'],
            password: password ? undefined : ['The password field is required.'],
          },
        },
        { status: 422 }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, '/api/login'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: email, email, password, remember }),
      cache: 'no-store',
    });

    const data = await readResponseBody(response);
    
    // Map 'username' errors back to 'email' for the frontend
    if (response.status === 422 && data.errors && (data.errors.username || data.errors.email)) {
      if (data.errors.username && !data.errors.email) {
        data.errors.email = data.errors.username;
      }
    }

    const nextResponse = NextResponse.json(data, { status: response.status });

    const upstreamCookie = response.headers.get('set-cookie');
    if (upstreamCookie) {
      nextResponse.headers.append('set-cookie', upstreamCookie);
    }

    const authToken = response.ok ? getAuthToken(data) : null;
    if (authToken) {
      nextResponse.cookies.set('auth_token', authToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
      });
    }

    if (response.ok) {
      nextResponse.cookies.set('auth_session', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Error logging in:', error);

    return NextResponse.json(
      { message: 'Unable to login right now.' },
      { status: 500 }
    );
  }
}
