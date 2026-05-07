import { NextRequest, NextResponse } from 'next/server';

type RegisterPayload = {
  username?: unknown;
  name?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  password?: unknown;
  password_confirmation?: unknown;
  company?: unknown;
  phone?: unknown;
  country_id?: unknown;
  state_id?: unknown;
  province_id?: unknown;
  billing_email?: unknown;
  country?: unknown;
  street_address?: unknown;
  postcode?: unknown;
  city?: unknown;
  state?: unknown;
  vat_number?: unknown;
  kvk_number?: unknown;
};

type RegisterResponseBody = {
  token?: unknown;
  access_token?: unknown;
  plainTextToken?: unknown;
  user?: unknown;
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
    return JSON.parse(text) as RegisterResponseBody;
  } catch {
    return { message: text };
  }
}

function getAuthToken(data: RegisterResponseBody) {
  const token = data.token ?? data.access_token ?? data.plainTextToken;

  return typeof token === 'string' && token.trim() ? token.trim() : null;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return readString(value);
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
    const body = (await request.json()) as RegisterPayload;
    const username = readString(body.username);
    const firstName = readString(body.first_name);
    const lastName = readString(body.last_name);
    const name = readString(body.name) || [firstName, lastName].filter(Boolean).join(' ').trim() || username;
    const email = readString(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const passwordConfirmation = typeof body.password_confirmation === 'string' ? body.password_confirmation : password;
    const company = readString(body.company);
    const phone = readString(body.phone);
    const countryId = readId(body.country_id);
    const stateId = readId(body.state_id);
    const provinceId = readId(body.province_id) || stateId;
    const billingEmail = readString(body.billing_email);
    const country = readString(body.country);
    const streetAddress = readString(body.street_address);
    const postcode = readString(body.postcode);
    const city = readString(body.city);
    const state = readString(body.state);
    const vatNumber = readString(body.vat_number);
    const kvkNumber = readString(body.kvk_number);

    if (!name || !email || !password || !passwordConfirmation) {
      return NextResponse.json(
        {
          message: 'Please complete the required fields.',
          errors: {
            name: name ? undefined : ['The name field is required.'],
            first_name: firstName || name ? undefined : ['The first name field is required.'],
            email: email ? undefined : ['The email field is required.'],
            password: password ? undefined : ['The password field is required.'],
            password_confirmation: passwordConfirmation ? undefined : ['The password confirmation field is required.'],
          },
        },
        { status: 422 }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, '/api/register'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(username ? { username } : {}),
        name,
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
        email,
        password,
        password_confirmation: passwordConfirmation,
        ...(company ? { company } : {}),
        ...(phone ? { phone } : {}),
        ...(countryId ? { country_id: countryId } : {}),
        ...(provinceId ? { province_id: provinceId, state_id: provinceId } : {}),
        ...(billingEmail ? { billing_email: billingEmail } : {}),
        ...(country ? { country } : {}),
        ...(streetAddress ? { street_address: streetAddress, address: streetAddress } : {}),
        ...(postcode ? { postcode, postal_code: postcode } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
        ...(vatNumber ? { vat_number: vatNumber, btw_number: vatNumber } : {}),
        ...(kvkNumber ? { kvk_number: kvkNumber } : {}),
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          company,
          phone,
          email: billingEmail || email,
          country_id: countryId,
          country,
          province_id: provinceId,
          state_id: provinceId,
          street_address: streetAddress,
          address: streetAddress,
          postcode,
          postal_code: postcode,
          city,
          state,
          vat_number: vatNumber,
          btw_number: vatNumber,
          kvk_number: kvkNumber,
        },
      }),
      cache: 'no-store',
    });

    const data = await readResponseBody(response);
    const nextResponse = NextResponse.json(data, { status: response.status });

    const upstreamCookie = response.headers.get('set-cookie');
    if (upstreamCookie) {
      nextResponse.headers.append('set-cookie', upstreamCookie);
    }

    const authToken = response.ok ? getAuthToken(data) : null;
    if (authToken) {
      nextResponse.cookies.set('auth_token', authToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

    }

    if (response.ok) {
      nextResponse.cookies.set('auth_session', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Error registering:', error);

    return NextResponse.json(
      { message: 'Unable to register right now.' },
      { status: 500 }
    );
  }
}
