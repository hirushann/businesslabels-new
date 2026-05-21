import { NextRequest, NextResponse } from 'next/server';
import { parsePrinterSearchParams, searchPrinters } from '@/lib/search/printers';

/**
 * GET /api/printers
 * Search printers using Elasticsearch
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = parsePrinterSearchParams(searchParams);

    const result = await searchPrinters(params);
    console.log(`[API /api/printers] Returning ${result.printers.length} printers (total: ${result.total})`, result.printers);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
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
