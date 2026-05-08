import { NextRequest, NextResponse } from 'next/server';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n/config';
import { withLocaleParam } from '@/lib/i18n/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

/**
 * GET /api/products
 * Proxy endpoint that fetches products from the Laravel backend
 */
export async function GET(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { data: [], error: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value);
    
    // Pass through all search params to the backend
    const queryString = searchParams.toString();
    const url = withLocaleParam(`${API_BASE_URL}/api/products${queryString ? `?${queryString}` : ''}`, locale);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }, // Cache for 5 minutes
    } as RequestInit & { next?: { revalidate?: number | false } });

    if (!response.ok) {
      console.error(`Backend API error: ${response.status}`);
      return NextResponse.json(
        { data: [], error: 'Failed to fetch products' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { data: [], error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
