import { NextResponse } from 'next/server';

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

/**
 * GET /api/team-members
 * Forwards HelpDrawer team member retrieval to Laravel using BBNL_API_BASE_URL.
 */
export async function GET() {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'BBNL_API_BASE_URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(backendUrl(apiBaseUrl, '/api/team-members'), {
      headers: {
        'Accept': 'application/json',
      },
    });
    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching HelpDrawer team members:', error);

    return NextResponse.json(
      { message: 'Failed to fetch team members.' },
      { status: 500 }
    );
  }
}
