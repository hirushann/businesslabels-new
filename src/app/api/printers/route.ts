import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.BBNL_API_BASE_URL;

type Printer = {
  id: number;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  template: string;
  meta: Record<string, any>;
  image: string | null;
  created_at: string;
  updated_at: string;
};

type PrintersResponse = {
  data: Printer[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
};

/**
 * GET /api/printers
 * Proxy endpoint that fetches full printer list from Laravel backend
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
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '15';

    const response = await fetch(
      `${API_BASE_URL}/api/printers?page=${page}&per_page=${perPage}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 600 }, // Cache for 10 minutes
      }
    );

    if (!response.ok) {
      console.error(`Backend API error: ${response.status}`);
      return NextResponse.json(
        { data: [], error: 'Failed to fetch printers' },
        { status: response.status }
      );
    }

    const data: PrintersResponse = await response.json();

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
