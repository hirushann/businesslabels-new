import { NextRequest, NextResponse } from 'next/server';

type DrawerBookingPayload = {
  country?: unknown;
  country_code?: unknown;
  dial_code?: unknown;
  phone_number?: unknown;
  full_phone_number?: unknown;
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
        country: body.country,
        country_code: body.country_code,
        dial_code: body.dial_code,
        phone_number: phoneNumber,
        full_phone_number: body.full_phone_number,
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
