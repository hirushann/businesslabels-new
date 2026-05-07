import { NextRequest, NextResponse } from 'next/server';

type RegisterPayload = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  password_confirmation?: unknown;
  company?: unknown;
  phone?: unknown;
};

type RegisterResponseBody = {
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
    return JSON.parse(text) as RegisterResponseBody;
  } catch {
    return { message: text };
  }
}

function getAuthToken(data: RegisterResponseBody) {
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
    const body = (await request.json()) as RegisterPayload;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const passwordConfirmation = typeof body.password_confirmation === 'string' ? body.password_confirmation : '';
    const company = typeof body.company === 'string' ? body.company.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (!name || !email || !password || !passwordConfirmation) {
      return NextResponse.json(
        {
          message: 'Please complete the required fields.',
          errors: {
            name: name ? undefined : ['The name field is required.'],
            email: email ? undefined : ['The email field is required.'],
            password: password ? undefined : ['The password field is required.'],
            password_confirmation: passwordConfirmation ? undefined : ['The password confirmation field is required.'],
          },
        },
        { status: 422 }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, '/api/register'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        ...(company ? { company } : {}),
        ...(phone ? { phone } : {}),
      }),
      cache: 'no-store',
    });

    const data = await readResponseBody(response);
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
        maxAge: 60 * 60 * 24 * 30,
      });

    }

    if (response.ok) {
      nextResponse.cookies.set('auth_session', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Error registering:', error);

    return NextResponse.json(
      { message: 'Unable to register right now.' },
      { status: 500 }
    );
  }
}
