import { NextRequest, NextResponse } from 'next/server';

type ResetPasswordPayload = {
  email?: unknown;
};

type ResetPasswordResponseBody = {
  message?: string;
  status?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
};

function backendUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function splitSetCookieHeader(header: string) {
  return header
    .split(/,(?=\s*[^;,=\s]+=[^;,]+)/)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(headers: Headers) {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = withGetSetCookie.getSetCookie?.();

  if (setCookies?.length) {
    return setCookies;
  }

  const setCookie = headers.get('set-cookie');

  return setCookie ? splitSetCookieHeader(setCookie) : [];
}

function getCookieHeader(setCookies: string[]) {
  return setCookies
    .map((cookie) => cookie.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

function getXsrfToken(setCookies: string[]) {
  const xsrfCookie = setCookies
    .map((cookie) => cookie.split(';')[0]?.trim() ?? '')
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='));

  if (!xsrfCookie) {
    return null;
  }

  const token = xsrfCookie.slice('XSRF-TOKEN='.length);

  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as ResetPasswordResponseBody;
  } catch {
    return { message: text };
  }
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
    const body = (await request.json()) as ResetPasswordPayload;
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return NextResponse.json(
        {
          message: 'The email field is required.',
          errors: {
            email: ['The email field is required.'],
          },
        },
        { status: 422 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          message: 'Please enter a valid email address.',
          errors: {
            email: ['Please enter a valid email address.'],
          },
        },
        { status: 422 }
      );
    }

    const csrfResponse = await fetch(backendUrl(apiBaseUrl, '/sanctum/csrf-cookie'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
    });

    const csrfSetCookies = getSetCookieHeaders(csrfResponse.headers);
    const cookieHeader = getCookieHeader(csrfSetCookies);
    const xsrfToken = getXsrfToken(csrfSetCookies);

    if (!csrfResponse.ok || !cookieHeader || !xsrfToken) {
      const data = await readResponseBody(csrfResponse);

      return NextResponse.json(
        {
          message: data.message || 'Unable to initialize password reset security token.',
        },
        { status: csrfResponse.ok ? 500 : csrfResponse.status }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, '/forgot-password'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken,
      },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });

    const data = await readResponseBody(response);

    return NextResponse.json(
      {
        ...data,
        message: data.message || data.status,
      },
      { status: response.status }
    );
  } catch (error) {
    console.error('Error requesting password reset:', error);

    return NextResponse.json(
      { message: 'Unable to request a password reset right now.' },
      { status: 500 }
    );
  }
}
