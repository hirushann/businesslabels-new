import { NextRequest, NextResponse } from 'next/server';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n/config';
import { withLocaleParam } from '@/lib/i18n/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

/**
 * POST /api/products/printer-products
 * Proxy endpoint that fetches products matching a printer's specifications
 * from the Laravel backend
 * 
 * Request body:
 * - printer_id: number (required) - Single printer ID
 * - product_type?: 'labels' | 'ink' (optional) - Filter by product category
 * - per_page?: number (optional) - Items per page (default 15, max 100)
 */
export async function POST(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { message: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Validate required printer_id
    if (!body.printer_id) {
      return NextResponse.json(
        { 
          message: 'The printer id field is required.',
          errors: {
            printer_id: ['The printer id field is required.']
          }
        },
        { status: 422 }
      );
    }

    // Forward request to backend API with the active locale
    const locale = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value);
    const response = await fetch(withLocaleParam(`${API_BASE_URL}/api/products/printer-products`, locale), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json' 
      },
      body: JSON.stringify({
        printer_id: body.printer_id,
        ...(body.product_type && { product_type: body.product_type }),
        ...(body.per_page && { per_page: body.per_page }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Pass through backend error responses
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: { 
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' 
      },
    });
  } catch (error) {
    console.error('Error fetching printer products:', error);
    return NextResponse.json(
      { message: 'Failed to fetch printer products' },
      { status: 500 }
    );
  }
}
