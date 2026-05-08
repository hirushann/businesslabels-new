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

async function proxyRegisterData(body?: { country_id?: unknown }) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  const url = new URL(backendUrl(apiBaseUrl, '/api/register/data'));
  if (body?.country_id) {
    url.searchParams.set('country_id', String(body.country_id));
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const data = await readResponseBody(response);

  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest) {
  try {
    const countryId = request.nextUrl.searchParams.get('country_id') ?? undefined;

    return await proxyRegisterData({ country_id: countryId });
  } catch (error) {
    console.error('Error loading register data:', error);

    return NextResponse.json(
      { message: 'Unable to load registration data.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { country_id?: unknown };

    return await proxyRegisterData({ country_id: body.country_id });
  } catch (error) {
    console.error('Error loading register data for country:', error);

    return NextResponse.json(
      { message: 'Unable to load registration data.' },
      { status: 500 }
    );
  }
}
