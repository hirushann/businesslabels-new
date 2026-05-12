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
    console.warn('BBNL_API_BASE_URL is not configured');
    return NextResponse.json(
      { data: [], error: 'Backend API URL is not configured.' },
      { status: 200 }
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
        { status: 200 }
      );
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Backend returned non-JSON response');
      return NextResponse.json(
        { data: [], error: 'Backend service unavailable' },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { data: [], error: 'Failed to fetch products' },
      { status: 200 }
    );
  }
}
