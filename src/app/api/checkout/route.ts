import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_RETURN_LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n/config';

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

function getRequestLocale(request: NextRequest) {
  return normalizeLocale(request.cookies.get('NEXT_LOCALE')?.value || request.headers.get('x-businesslabels-locale'));
}

function getRequestMessages(request: NextRequest) {
  return API_MESSAGES[getRequestLocale(request)];
}

export async function POST(request: NextRequest) {
  const locale = getRequestLocale(request);
  const messages = API_MESSAGES[locale];

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

      // If Laravel created the order but failed to initialize Mollie payment
      // (e.g. because it has an invalid/missing Mollie key), handle payment
      // creation from Next.js using the MOLLIE_KEY in the Next.js .env.
      const MOLLIE_KEY = process.env.MOLLIE_KEY;
      if (
        MOLLIE_KEY &&
        data?.error &&
        typeof data.error === 'string' &&
        data.error.includes('failed to authenticate')
      ) {
        // Extract the Mollie request body that Laravel tried to send
        const requestBodyMatch = data.error.match(/Request body:\s*(\{.*\})/);
        if (requestBodyMatch) {
          try {
            const mollieRequestBody = JSON.parse(requestBodyMatch[1]);
            console.log('[Checkout] Retrying Mollie payment creation from Next.js...');

            // Add webhook URL so Laravel gets notified of payment status
            // If in local dev (e.g. .test or localhost), Mollie will reject unreachable URLs.
            let webhookUrl = `${API_BASE_URL}/api/mollie/webhook`;
            if (webhookUrl.includes('.test') || webhookUrl.includes('localhost')) {
              webhookUrl = 'https://httpbin.org/status/200'; // Real reachable URL for local dev to bypass Mollie validation
            }

            const mollieResponse = await fetch('https://api.mollie.com/v2/payments', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${MOLLIE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...mollieRequestBody,
                webhookUrl,
              }),
            });

            const mollieData = await mollieResponse.json();

            if (mollieResponse.ok && mollieData._links?.checkout?.href) {
              const paymentUrl = mollieData._links.checkout.href;
              const orderNumber = mollieRequestBody.description?.replace('Order ', '') || '';
              console.log(`[Checkout] Mollie payment created from Next.js. Redirect: ${paymentUrl}`);

              const nextResponse = NextResponse.json({
                payment_url: paymentUrl,
                data: { number: orderNumber },
              });

              if (locale === 'en') {
                nextResponse.cookies.set(CHECKOUT_RETURN_LOCALE_COOKIE, 'en', {
                  httpOnly: true,
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                  path: '/',
                  maxAge: 60 * 60,
                });
              }

              return nextResponse;
            } else {
              console.error('[Checkout] Mollie payment creation from Next.js also failed:', mollieData);
            }
          } catch (parseError) {
            console.error('[Checkout] Failed to parse Mollie request body from error:', parseError);
          }
        }
      }

      return NextResponse.json(data, { status: response.status });
    }

    const nextResponse = NextResponse.json(data);
    if (locale === 'en' && data?.payment_url) {
      nextResponse.cookies.set(CHECKOUT_RETURN_LOCALE_COOKIE, 'en', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60,
      });
    }

    return nextResponse;
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
