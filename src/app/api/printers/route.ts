import { NextRequest, NextResponse } from 'next/server';
import { normalizeLocale } from '@/lib/i18n/config';
import { parsePrinterSearchParams, searchPrinters } from '@/lib/search/printers';

/**
 * GET /api/printers
 * Search printers using Elasticsearch
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = parsePrinterSearchParams(searchParams, normalizeLocale(searchParams.get('lang')));

    const result = await searchPrinters(params);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Error fetching printers:', error);
    return NextResponse.json(
      { 
        printers: [], 
        total: 0,
        currentPage: 1,
        lastPage: 1,
        perPage: 24,
        filters: { options: [] },
        error: 'Failed to fetch printers' 
      },
      { status: 500 }
    );
  }
}
