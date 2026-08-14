import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json({ message: 'Backend API URL is not configured.' }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/vat-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(await request.json()),
      cache: 'no-store',
    });

    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Unable to validate VAT right now.' }, { status: 502 });
  }
}
