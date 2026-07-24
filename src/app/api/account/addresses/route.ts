import { NextRequest, NextResponse } from 'next/server';

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

async function getCustomerId(apiBaseUrl: string, authToken: string): Promise<number | null> {
  try {
    const response = await fetch(backendUrl(apiBaseUrl, '/api/user/profile'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = await response.json();
    const user = data.data || data;
    return user?.id || null;
  } catch (error) {
    console.error('Error fetching user profile for customer ID:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  const authToken = request.cookies.get('auth_token')?.value;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  if (!authToken) {
    return NextResponse.json(
      { message: 'Please login to view your addresses.' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(backendUrl(apiBaseUrl, '/api/user/addresses'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching account addresses:', error);

    return NextResponse.json(
      { message: 'Unable to load addresses right now.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  const authToken = request.cookies.get('auth_token')?.value;
  const body = await request.json();

  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'Backend API URL is not configured.' }, { status: 500 });
  }

  if (!authToken) {
    return NextResponse.json({ message: 'Please login.' }, { status: 401 });
  }

  try {
    const customerId = await getCustomerId(apiBaseUrl, authToken);
    if (!customerId) {
      return NextResponse.json({ message: 'Unable to verify customer account.' }, { status: 400 });
    }

    const response = await fetch(backendUrl(apiBaseUrl, `/api/customers/${customerId}/addresses`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await readResponseBody(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error saving account address:', error);
    return NextResponse.json({ message: 'Unable to save address right now.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  const authToken = request.cookies.get('auth_token')?.value;
  const body = await request.json();

  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'Backend API URL is not configured.' }, { status: 500 });
  }

  if (!authToken) {
    return NextResponse.json({ message: 'Please login.' }, { status: 401 });
  }

  const { id, ...addressData } = body;
  if (!id) {
    return NextResponse.json({ message: 'Missing address id.' }, { status: 400 });
  }

  try {
    const customerId = await getCustomerId(apiBaseUrl, authToken);
    if (!customerId) {
      return NextResponse.json({ message: 'Unable to verify customer account.' }, { status: 400 });
    }

    console.log('[addresses PUT] customerId:', customerId, 'addressId:', id);
    console.log('[addresses PUT] payload to backend:', JSON.stringify(addressData, null, 2));

    const response = await fetch(backendUrl(apiBaseUrl, `/api/customers/${customerId}/addresses/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(addressData),
    });

    const data = await readResponseBody(response);
    console.log('[addresses PUT] backend status:', response.status, 'response:', JSON.stringify(data, null, 2));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating account address:', error);
    return NextResponse.json({ message: 'Unable to update address right now.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  const authToken = request.cookies.get('auth_token')?.value;

  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'Backend API URL is not configured.' }, { status: 500 });
  }

  if (!authToken) {
    return NextResponse.json({ message: 'Please login.' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: 'Missing address id.' }, { status: 400 });
    }

    const customerId = await getCustomerId(apiBaseUrl, authToken);
    if (!customerId) {
      return NextResponse.json({ message: 'Unable to verify customer account.' }, { status: 400 });
    }

    const response = await fetch(backendUrl(apiBaseUrl, `/api/customers/${customerId}/addresses/${id}`), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log('[addresses DELETE] backend status:', response.status, 'addressId:', id);

    // Treat 204 No Content as success — normalize to 200 so the client
    // receives a valid JSON body (204 must not have a body per HTTP spec).
    if (response.status === 204) {
      return NextResponse.json({ message: 'Address deleted successfully.' }, { status: 200 });
    }

    const data = await readResponseBody(response);
    console.log('[addresses DELETE] backend response body:', JSON.stringify(data));

    // Any 2xx is a success — normalise to 200 to avoid empty-body edge-cases.
    if (response.ok) {
      return NextResponse.json({ message: 'Address deleted successfully.', ...data }, { status: 200 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting account address:', error);
    return NextResponse.json({ message: 'Unable to delete address right now.' }, { status: 500 });
  }
}
