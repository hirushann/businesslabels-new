import { NextRequest, NextResponse } from 'next/server';

type PrintSamplePayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  street?: string;
  postcode?: string;
  place?: string;
  state?: string;
  printer?: string;
  substrate?: string;
  finish?: string;
  special_material?: string;
  application?: string;
  comments?: string;
  locale?: string;
};

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
 * POST /api/print-sample
 * Proxy endpoint that forwards print sample requests to Laravel.
 */
export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    let body;
    let isFormData = false;
    let reqFormData;

    // Check if the request is multipart/form-data
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      isFormData = true;
      reqFormData = await request.formData();
      body = Object.fromEntries(reqFormData.entries()) as unknown as PrintSamplePayload;
    } else {
      body = (await request.json()) as PrintSamplePayload;
    }

    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        {
          message: 'First name, last name, and email are required.',
          errors: {
            first_name: body.first_name ? undefined : ['The first name field is required.'],
            last_name: body.last_name ? undefined : ['The last name field is required.'],
            email: body.email ? undefined : ['The email field is required.'],
          },
        },
        { status: 422 }
      );
    }

    // Forward logic
    let fetchOptions: RequestInit;

    if (isFormData && reqFormData) {
      reqFormData.set('locale', body.locale === 'nl' ? 'nl' : 'en');
      fetchOptions = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Omit Content-Type so fetch can set the correct boundary for multipart/form-data
        },
        body: reqFormData,
      };
    } else {
      fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...body,
          locale: body.locale === 'nl' ? 'nl' : 'en',
        }),
      };
    }

    const response = await fetch(backendUrl(apiBaseUrl, '/api/print-sample'), fetchOptions);

    const data = await readResponseBody(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error sending print sample request:', error);
    return NextResponse.json(
      { message: 'Failed to send print sample request.' },
      { status: 500 }
    );
  }
}
