import { NextRequest, NextResponse } from 'next/server';

type ResetPasswordConfirmPayload = {
  token?: unknown;
  email?: unknown;
  password?: unknown;
  password_confirmation?: unknown;
};

type ResetPasswordConfirmResponseBody = {
  message?: string;
  errors?: Record<string, string[]>;
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
    return JSON.parse(text) as ResetPasswordConfirmResponseBody;
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
    const body = (await request.json()) as ResetPasswordConfirmPayload;
    const payload = {
      token: typeof body.token === 'string' ? body.token : '',
      email: typeof body.email === 'string' ? body.email.trim() : '',
      password: typeof body.password === 'string' ? body.password : '',
      password_confirmation: typeof body.password_confirmation === 'string' ? body.password_confirmation : '',
    };

    const response = await fetch(backendUrl(apiBaseUrl, '/api/reset/password/confirm'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to reset your password right now.' },
      { status: 500 }
    );
  }
}
