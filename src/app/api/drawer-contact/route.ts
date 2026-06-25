import { NextRequest, NextResponse } from 'next/server';

type DrawerContactPayload = {
  email?: unknown;
  locale?: unknown;
  message?: unknown;
  recaptcha_token?: unknown;
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
    const locale = body.locale === 'nl' ? 'nl' : 'en';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const recaptchaToken = typeof body.recaptcha_token === 'string' ? body.recaptcha_token : '';
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!recaptchaToken) {
      if (isDevelopment) {
        console.warn('Bypassing missing reCAPTCHA token in development mode.');
      } else {
        return NextResponse.json(
          { message: 'reCAPTCHA verification failed.' },
          { status: 400 }
        );
      }
    }

    if (recaptchaToken) {
      // Call google siteverify
      const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
      const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '';

      const verifyResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: recaptchaSecret,
          response: recaptchaToken,
        }).toString(),
      });

      const verifyData = await verifyResponse.json() as { success: boolean; score?: number; 'error-codes'?: string[] };

      if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
        console.error('reCAPTCHA verification failed:', verifyData['error-codes'] || `Score too low: ${verifyData.score}`);
        
        if (!isDevelopment) {
          return NextResponse.json(
            { message: 'reCAPTCHA verification failed.' },
            { status: 400 }
          );
        } else {
          console.warn('Bypassing reCAPTCHA failure in development mode.');
        }
      }
    }

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
        locale,
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
