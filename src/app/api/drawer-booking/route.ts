import { NextRequest, NextResponse } from 'next/server';

type DrawerBookingPayload = {
  country?: unknown;
  country_code?: unknown;
  dial_code?: unknown;
  locale?: unknown;
  phone_number?: unknown;
  full_phone_number?: unknown;
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
 * POST /api/drawer-booking
 * Proxy endpoint that forwards HelpDrawer callback bookings to Laravel.
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
    const body = (await request.json()) as DrawerBookingPayload;
    const phoneNumber = typeof body.phone_number === 'string' ? body.phone_number.trim() : '';
    const locale = body.locale === 'nl' ? 'nl' : 'en';
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
        
        // In development, bypass reCAPTCHA failure
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

    if (!phoneNumber) {
      return NextResponse.json(
        {
          message: 'The phone number field is required.',
          errors: {
            phone_number: ['The phone number field is required.'],
          },
        },
        { status: 422 }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, '/api/drawer-booking'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        country: body.country || 'Unknown',
        country_code: body.country_code || '',
        dial_code: body.dial_code || '',
        locale,
        phone_number: phoneNumber,
        full_phone_number: body.full_phone_number || phoneNumber,
      }),
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error booking HelpDrawer callback:', error);

    return NextResponse.json(
      { message: 'Failed to book callback.' },
      { status: 500 }
    );
  }
}
