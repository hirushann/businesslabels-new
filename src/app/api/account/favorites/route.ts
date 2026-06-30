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
      { message: 'Please login to view your favorite products.' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(backendUrl(apiBaseUrl, '/api/user/favorite-products'), {
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
    console.error('Error fetching favorite products:', error);

    return NextResponse.json(
      { message: 'Unable to load favorite products right now.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      { message: 'Please login to perform this action.' },
      { status: 401 }
    );
  }

  try {
    const { type, id } = await request.json();
    if (!type || !id) {
      return NextResponse.json(
        { message: 'Missing type or id.' },
        { status: 400 }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, `/api/user/favorite-products/${type}/${id}`), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await readResponseBody(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error adding favorite product:', error);
    return NextResponse.json(
      { message: 'Unable to add favorite product.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
      { message: 'Please login to perform this action.' },
      { status: 401 }
    );
  }

  try {
    const { type, id } = await request.json();
    if (!type || !id) {
      return NextResponse.json(
        { message: 'Missing type or id.' },
        { status: 400 }
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, `/api/user/favorite-products/${type}/${id}`), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await readResponseBody(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error removing favorite product:', error);
    return NextResponse.json(
      { message: 'Unable to remove favorite product.' },
      { status: 500 }
    );
  }
}

