import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

export async function POST(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const authToken = request.cookies.get('auth_token')?.value;

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
      { error: 'Failed to process checkout request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number');

  if (!number) {
    return NextResponse.json({ message: 'Order number is required' }, { status: 400 });
  }

  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: 'Backend API URL is not configured.' },
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
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
