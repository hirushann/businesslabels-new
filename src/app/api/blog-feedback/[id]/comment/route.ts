import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/utils/verifyRecaptcha';

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

/**
 * POST /api/blog-feedback/{id}/comment
 * Body: { message, email?, locale?, post_title?, post_url?, recaptcha_token }.
 * Forwards written "not helpful" feedback to Laravel, which emails it to the team.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  if (!apiBaseUrl || !/^\d+$/.test(id)) {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }

  try {
    const body = await request.json();

    const recaptchaResult = await verifyRecaptcha(
      typeof body.recaptcha_token === 'string' ? body.recaptcha_token : '',
      'blog_feedback',
    );
    if (!recaptchaResult.success) {
      return NextResponse.json({ message: 'reCAPTCHA verification failed. Please try again.' }, { status: 403 });
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return NextResponse.json(
        { message: 'The message field is required.', errors: { message: ['The message field is required.'] } },
        { status: 422 },
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, `/api/posts/${id}/feedback/comment`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        message: message.slice(0, 2000),
        email: typeof body.email === 'string' ? body.email.trim() : '',
        post_title: typeof body.post_title === 'string' ? body.post_title : '',
        post_url: typeof body.post_url === 'string' ? body.post_url : '',
        locale: body.locale === 'nl' ? 'nl' : 'en',
      }),
    });
    const data = await readResponseBody(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error submitting blog feedback comment:', error);
    return NextResponse.json({ message: 'Failed to send feedback.' }, { status: 500 });
  }
}
