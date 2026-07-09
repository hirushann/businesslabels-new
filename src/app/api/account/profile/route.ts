import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

function backendUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;

  if (!API_BASE_URL) {
    return NextResponse.json({ message: 'Backend API URL is not configured.' }, { status: 500 });
  }

  if (!authToken) {
    return NextResponse.json({ message: 'Please login.' }, { status: 401 });
  }

  try {
    const response = await fetch(backendUrl(API_BASE_URL, '/api/user/profile'), {
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
    console.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Unable to load profile.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;

  if (!API_BASE_URL) {
    return NextResponse.json({ message: 'Backend API URL is not configured.' }, { status: 500 });
  }

  if (!authToken) {
    return NextResponse.json({ message: 'Please login.' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let response;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      if (!formData.has('_method')) {
        formData.append('_method', 'PUT');
      }

      response = await fetch(backendUrl(API_BASE_URL, '/api/user/profile'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });
    } else {
      const body = await request.json();
      response = await fetch(backendUrl(API_BASE_URL, '/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });
    }

    const data = await readResponseBody(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Unable to update profile.' }, { status: 500 });
  }
}
