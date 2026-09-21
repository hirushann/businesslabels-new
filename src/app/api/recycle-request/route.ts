import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/utils/verifyRecaptcha';

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
 * POST /api/recycle-request
 * Proxy endpoint that forwards recycle requests to Laravel.
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
    const body = await request.json();

    const recaptchaToken = typeof body.recaptcha_token === 'string' ? body.recaptcha_token : '';

    // No expected action enforced — this route serves both recycle_box_form and recycle_pickup_form
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { message: 'reCAPTCHA verification failed. Please try again.' },
        { status: 403 }
      );
    }

    // Strip the token before forwarding — already verified above
    const { recaptcha_token: _token, ...forwardBody } = body;

    const response = await fetch(backendUrl(apiBaseUrl, '/api/recycle-request'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(forwardBody),
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error forwarding recycle request:', error);

    return NextResponse.json(
      { message: 'Failed to send request. Please try again later.' },
      { status: 500 }
    );
  }
}
