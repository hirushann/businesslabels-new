import { NextRequest, NextResponse } from 'next/server';
import type { SearchApiResponse, SearchProduct, SearchSort } from '@/components/search/types';

type LaravelProductsResponse = {
  data?: SearchProduct[];
  meta?: {
    current_page?: number;
    per_page?: number;
    last_page?: number;
    total?: number;
  };
  in_stock_count?: number;
};

const DEFAULT_PER_PAGE = 24;
const ALLOWED_SORTS: SearchSort[] = [
  'latest',
  'oldest',
  'title_asc',
  'title_desc',
  'price_asc',
  'price_desc',
];

function toPositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizeSort(value: string | null): SearchSort {
  if (!value) return 'latest';

  return ALLOWED_SORTS.includes(value as SearchSort) ? (value as SearchSort) : 'latest';
}

function defaultPayload(perPage: number): SearchApiResponse {
  return {
    items: [],
    pagination: {
      page: 1,
      perPage,
      totalPages: 1,
      totalItems: 0,
    },
    inStockCount: 0,
  };
}

function normalizePayload(
  payload: LaravelProductsResponse | null | undefined,
  fallbackPage: number,
  fallbackPerPage: number,
  error?: string
): SearchApiResponse {
  return {
    items: Array.isArray(payload?.data) ? payload.data : [],
    pagination: {
      page:
        typeof payload?.meta?.current_page === 'number' && payload.meta.current_page > 0
          ? payload.meta.current_page
          : fallbackPage,
      perPage:
        typeof payload?.meta?.per_page === 'number' && payload.meta.per_page > 0
          ? payload.meta.per_page
          : fallbackPerPage,
      totalPages:
        typeof payload?.meta?.last_page === 'number' && payload.meta.last_page > 0
          ? payload.meta.last_page
          : 1,
      totalItems:
        typeof payload?.meta?.total === 'number' && payload.meta.total >= 0
          ? payload.meta.total
          : 0,
    },
    inStockCount: typeof payload?.in_stock_count === 'number' ? payload.in_stock_count : 0,
    error,
  };
}

export async function GET(request: NextRequest) {
  const apiBaseUrl = process.env.BBNL_API_BASE_URL;
  const page = toPositiveInt(request.nextUrl.searchParams.get('page'), 1);
  const perPage = toPositiveInt(request.nextUrl.searchParams.get('per_page'), DEFAULT_PER_PAGE);
  const sort = normalizeSort(request.nextUrl.searchParams.get('sort'));
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!apiBaseUrl) {
    return NextResponse.json(
      {
        ...defaultPayload(perPage),
        error: 'Search backend base URL is not configured.',
      },
      { status: 500 }
    );
  }

  const upstreamUrl = new URL('/api/products', apiBaseUrl);
  upstreamUrl.searchParams.set('page', String(page));
  upstreamUrl.searchParams.set('per_page', String(perPage));
  upstreamUrl.searchParams.set('sort', sort);
  if (q !== '') {
    upstreamUrl.searchParams.set('search', q);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    const fallback = defaultPayload(perPage);

    if (!upstreamResponse.ok) {
      const status = upstreamResponse.status >= 500 ? 502 : upstreamResponse.status;

      return NextResponse.json(
        {
          ...fallback,
          error: 'Catalog search is temporarily unavailable.',
        },
        { status }
      );
    }

    let payload: LaravelProductsResponse | null = null;
    try {
      payload = (await upstreamResponse.json()) as LaravelProductsResponse;
    } catch {
      return NextResponse.json(
        {
          ...fallback,
          error: 'Catalog search is temporarily unavailable.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(normalizePayload(payload, page, perPage));
  } catch {
    return NextResponse.json(
      {
        ...defaultPayload(perPage),
        error: 'Catalog search is temporarily unavailable.',
      },
      { status: 503 }
    );
  }
}
