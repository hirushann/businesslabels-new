import { NextRequest, NextResponse } from 'next/server';

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

function isValidId(id: string) {
  return /^\d+$/.test(id);
}

/**
 * GET /api/blog-feedback/{id}
 * Returns the helpful vote counts for a blog post: { yes, no, total, yes_percent, no_percent }.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl || !isValidId(id)) {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }

  try {
    const response = await fetch(backendUrl(apiBaseUrl, `/api/posts/${id}/feedback`), {
      headers: { Accept: 'application/json', 'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '' },
      cache: 'no-store',
    });
    const data = await readResponseBody(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching blog feedback:', error);
    return NextResponse.json({ message: 'Failed to load feedback.' }, { status: 500 });
  }
}

/**
 * POST /api/blog-feedback/{id}
 * Body: { helpful: boolean }. Records a vote and returns the updated counts.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl || !isValidId(id)) {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (typeof body.helpful !== 'boolean') {
      return NextResponse.json({ message: 'The helpful field is required.' }, { status: 422 });
    }

    const response = await fetch(backendUrl(apiBaseUrl, `/api/posts/${id}/feedback`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
        // Lets the backend de-duplicate votes per visitor
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify({ helpful: body.helpful }),
    });
    const data = await readResponseBody(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error submitting blog feedback vote:', error);
    return NextResponse.json({ message: 'Failed to submit feedback.' }, { status: 500 });
  }
}
