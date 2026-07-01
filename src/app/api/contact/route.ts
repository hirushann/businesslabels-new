import { NextRequest, NextResponse } from 'next/server';

type ContactPayload = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  locale?: string;
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
 * POST /api/contact
 * Proxy endpoint that forwards contact messages to Laravel.
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
    const body = (await request.json()) as ContactPayload;

    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        {
          message: 'The name, email, and message fields are required.',
          errors: {
            name: body.name ? undefined : ['The name field is required.'],
            email: body.email ? undefined : ['The email field is required.'],
            message: body.message ? undefined : ['The message field is required.'],
          },
        },
        { status: 422 }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, '/api/contact'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        locale: body.locale === 'nl' ? 'nl' : 'en',
      }),
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error sending contact message:', error);

    return NextResponse.json(
      { message: 'Failed to send message.' },
      { status: 500 }
    );
  }
}
