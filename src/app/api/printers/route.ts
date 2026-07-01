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
    
    // Log request and response to a local file for debugging
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'api-log.txt');
    const logEntry = `[${new Date().toISOString()}] URL: ${request.url}\n` +
      `Printers returned: ${result.printers.map(p => `${p.id}:${p.name}(featured:${p.featured})`).join(', ')}\n\n`;
    fs.appendFileSync(logPath, logEntry);

    console.log(`[API /api/printers] Returning ${result.printers.length} printers (total: ${result.total})`, result.printers);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Error fetching printers:', error);
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'api-log.txt');
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ERROR: ${(error as any).message}\n\n`);
    } catch {}
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
