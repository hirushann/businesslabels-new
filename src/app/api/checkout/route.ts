import { NextRequest, NextResponse } from 'next/server';
import { normalizeLocale } from '@/lib/i18n/config';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

const API_MESSAGES = {
  en: {
    backendMissing: 'Backend API URL is not configured.',
    invoiceAccountOnly: 'Pay by invoice within 30 days is only available for customers with an account.',
    checkoutFailed: 'Failed to process checkout request',
    orderNumberRequired: 'Order number is required',
    internalServerError: 'Internal server error',
  },
  nl: {
    backendMissing: 'Backend API-URL is niet geconfigureerd.',
    invoiceAccountOnly: 'Op factuur betalen binnen 30 dagen is alleen beschikbaar voor klanten met een account.',
    checkoutFailed: 'Afrekenen kon niet worden verwerkt',
    orderNumberRequired: 'Bestelnummer is verplicht',
    internalServerError: 'Interne serverfout',
  },
};

function getRequestMessages(request: NextRequest) {
  const locale = normalizeLocale(request.cookies.get('NEXT_LOCALE')?.value || request.headers.get('x-businesslabels-locale'));
  return API_MESSAGES[locale];
}

export async function POST(request: NextRequest) {
  const messages = getRequestMessages(request);

  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: messages.backendMissing },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const authToken = request.cookies.get('auth_token')?.value;
    const isGuestCheckout = !authToken;

    if (isGuestCheckout && body?.payment_method === 'banktransfer') {
      return NextResponse.json(
        {
          message: messages.invoiceAccountOnly,
          errors: {
            payment_method: [messages.invoiceAccountOnly],
          },
        },
        { status: 422 }
      );
    }

    const endpoint = authToken ? `${API_BASE_URL}/api/orders` : `${API_BASE_URL}/api/guest/orders`;
    
    console.log(`Sending checkout request to Laravel (${authToken ? 'Authenticated' : 'Guest'}):`, endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Laravel response status:', response.status);

    if (!response.ok) {
      console.error('Laravel error data:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Checkout proxy error:', error);
    return NextResponse.json(
      { error: messages.checkoutFailed },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const messages = getRequestMessages(request);
  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number');

  if (!number) {
    return NextResponse.json({ message: messages.orderNumberRequired }, { status: 400 });
  }

  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: messages.backendMissing },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/guest/orders/${number}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Checkout status proxy error:', error);
    return NextResponse.json(
      { message: messages.internalServerError },
      { status: 500 }
    );
  }
}
