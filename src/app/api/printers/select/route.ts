import { NextRequest, NextResponse } from 'next/server';
import type { PrinterSelectResponse } from '@/lib/types/printer';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n/config';
import { withLocaleParam } from '@/lib/i18n/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

/**
 * GET /api/printers/select
 * Proxy endpoint that fetches printer options from Laravel backend
 * Returns only id, name, and slug - optimized for select/combobox fields
 */
export async function GET(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      { data: [], error: 'Backend API URL is not configured.' },
      { status: 500 }
    );
  }

  try {
    const locale = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value);
    const response = await fetch(withLocaleParam(`${API_BASE_URL}/api/printers/select`, locale), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      console.error(`Backend API error: ${response.status}`);
      return NextResponse.json(
        { data: [], error: 'Failed to fetch printers' },
        { status: response.status }
      );
    }

    const data: PrinterSelectResponse = await response.json();

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
    });
  } catch (error) {
    console.error('Error fetching printers:', error);
    return NextResponse.json(
      { data: [], error: 'Failed to fetch printers' },
      { status: 500 }
    );
  }
}
