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

    const response = await fetch(backendUrl(apiBaseUrl, '/api/reset/password'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
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
  } catch {
    return NextResponse.json(
      { message: 'Unable to request a password reset right now.' },
      { status: 500 }
    );
  }
}
