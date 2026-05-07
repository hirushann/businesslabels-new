import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

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

export async function POST(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const productId = body.product_id;
    const printerId = body.printer_id;

    if (!productId || !printerId) {
      return NextResponse.json(
        {
          message: 'The product id and printer id fields are required.',
          errors: {
            product_id: productId ? undefined : ['The product id field is required.'],
            printer_id: printerId ? undefined : ['The printer id field is required.'],
          },
        },
        { status: 422 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/products/compatibility`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        printer_id: printerId,
      }),
      cache: 'no-store',
    });

    const data = await readResponseBody(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error checking product compatibility:', error);

    return NextResponse.json(
      { message: 'Failed to check product compatibility.' },
      { status: 500 }
    );
  }
}
