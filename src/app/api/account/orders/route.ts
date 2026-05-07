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
      { message: 'Please login to view your orders.' },
      { status: 401 }
    );
  }

  try {
    console.log('Auth token found, fetching orders from backend API...');
    console.log(authToken);
    const response = await fetch(backendUrl(apiBaseUrl, '/api/account/orders'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });

    console.log('Fetched orders with status:', response.status);

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching account orders:', error);

    return NextResponse.json(
      { message: 'Unable to load orders right now.' },
      { status: 500 }
    );
  }
}
