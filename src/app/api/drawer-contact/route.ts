import { NextRequest, NextResponse } from 'next/server';

type DrawerContactPayload = {
  email?: unknown;
  message?: unknown;
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
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/**
 * POST /api/drawer-contact
 * Proxy endpoint that forwards HelpDrawer contact messages to Laravel.
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
    const body = (await request.json()) as DrawerContactPayload;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!email || !message) {
      return NextResponse.json(
        {
          message: 'The email and message fields are required.',
          errors: {
            email: email ? undefined : ['The email field is required.'],
            message: message ? undefined : ['The message field is required.'],
          },
        },
        { status: 422 }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, '/api/drawer-contact'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        message,
      }),
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error sending HelpDrawer contact message:', error);

    return NextResponse.json(
      { message: 'Failed to send message.' },
      { status: 500 }
    );
  }
}
