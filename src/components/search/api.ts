import type { SearchApiResponse, SearchSort } from './types';

type SearchParams = {
  q: string;
  page: number;
  perPage: number;
  sort: SearchSort;
};

function fallbackResponse(perPage: number, error: string): SearchApiResponse {
  return {
    items: [],
    pagination: {
      page: 1,
      perPage,
      totalPages: 1,
      totalItems: 0,
    },
    inStockCount: 0,
    error,
  };
}

function normalizeResponse(
  payload: unknown,
  fallbackPerPage: number,
  fallbackError?: string
): SearchApiResponse {
  const data = payload as Partial<SearchApiResponse> | null | undefined;

  const pagination = data?.pagination;
  const page = typeof pagination?.page === 'number' && pagination.page > 0 ? pagination.page : 1;
  const perPage =
    typeof pagination?.perPage === 'number' && pagination.perPage > 0
      ? pagination.perPage
      : fallbackPerPage;
  const totalPages =
    typeof pagination?.totalPages === 'number' && pagination.totalPages > 0 ? pagination.totalPages : 1;
  const totalItems = typeof pagination?.totalItems === 'number' && pagination.totalItems >= 0 ? pagination.totalItems : 0;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: {
      page,
      perPage,
      totalPages,
      totalItems,
    },
    inStockCount: typeof data?.inStockCount === 'number' ? data.inStockCount : 0,
    error: typeof data?.error === 'string' && data.error ? data.error : fallbackError,
  };
}

export async function fetchSearchResults(params: SearchParams): Promise<SearchApiResponse> {
  const qs = new URLSearchParams();
  qs.set('q', params.q);
  qs.set('page', String(params.page));
  qs.set('per_page', String(params.perPage));
  qs.set('sort', params.sort);

  try {
    const response = await fetch(`/api/search?${qs.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      return fallbackResponse(params.perPage, 'Search service returned an invalid response.');
    }

    if (!response.ok) {
      return normalizeResponse(payload, params.perPage, 'Search is temporarily unavailable.');
    }

    return normalizeResponse(payload, params.perPage);
  } catch {
    return fallbackResponse(params.perPage, 'Search is temporarily unavailable.');
  }
}
