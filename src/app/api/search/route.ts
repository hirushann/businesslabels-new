import { NextRequest, NextResponse } from 'next/server';
import ElasticsearchAPIConnector from '@elastic/search-ui-elasticsearch-connector';
import type { QueryConfig, RequestState, ResponseState } from '@elastic/search-ui';

const DEFAULT_INDEX_SUFFIXES = ['catalog_products_simple', 'catalog_products_variable'] as const;

function elasticHost(): string {
  const url = process.env.ELASTICSEARCH_URL;
  if (url && url.trim()) return url.trim();

  const host = process.env.ELASTIC_HOST?.trim();
  if (!host) return '';

  if (host.startsWith('http://') || host.startsWith('https://')) {
    return appendPortIfMissing(host);
  }

  const scheme = process.env.ELASTIC_SCHEME?.trim() || 'http';
  return appendPortIfMissing(`${scheme}://${host}`);
}

function appendPortIfMissing(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.port || !process.env.ELASTIC_PORT?.trim()) {
      return url.toString().replace(/\/$/, '');
    }

    url.port = process.env.ELASTIC_PORT.trim();
    return url.toString().replace(/\/$/, '');
  } catch {
    return rawUrl.replace(/\/$/, '');
  }
}

function elasticIndex(): string {
  const configured = process.env.SEARCH_INDEX || process.env.ELASTICSEARCH_INDEX;
  if (configured?.trim()) return configured.trim();

  const prefix = process.env.SCOUT_PREFIX?.trim() ?? '';
  return DEFAULT_INDEX_SUFFIXES.map((suffix) => `${prefix}${suffix}`).join(',');
}

function elasticConnectionHeaders(): Record<string, string> | undefined {
  const apiKey = process.env.ELASTIC_API_KEY?.trim();
  if (apiKey) return undefined;

  const username = process.env.ELASTIC_USERNAME?.trim();
  if (!username) return undefined;

  const password = process.env.ELASTIC_PASSWORD ?? '';
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');

  return {
    Authorization: `Basic ${encoded}`,
  };
}

function elasticFetchHeaders(connectionHeaders: Record<string, string> | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(connectionHeaders ?? {}),
  };

  const apiKey = process.env.ELASTIC_API_KEY?.trim();
  if (apiKey) {
    headers.Authorization = `ApiKey ${apiKey}`;
  }

  return headers;
}

function elasticIndexPath(index: string): string {
  return index.split(',').map((part) => encodeURIComponent(part)).join(',');
}

function normalizeError(message: string, status = 500) {
  return NextResponse.json(
    {
      error: message,
      results: [],
      totalResults: 0,
      totalPages: 0,
      requestId: '',
      facets: {},
      rawResponse: null,
    },
    { status }
  );
}

type ElasticsearchRequestBody = {
  sort?: unknown;
  [key: string]: unknown;
};

function normalizeSortClause(sortClause: unknown): unknown {
  if (!sortClause || typeof sortClause !== 'object' || Array.isArray(sortClause)) {
    return sortClause;
  }

  const entry = Object.entries(sortClause as Record<string, unknown>)[0];
  if (!entry) return sortClause;

  const [field, value] = entry;
  if (field === '_score') return sortClause;

  const unmappedTypeByField: Record<string, 'long' | 'double' | 'keyword'> = {
    created_at_timestamp: 'long',
    price: 'double',
    'title_sort.keyword': 'keyword',
  };

  const unmappedType = unmappedTypeByField[field] ?? 'keyword';

  if (typeof value === 'string') {
    return { [field]: { order: value, unmapped_type: unmappedType } };
  }

  if (value && typeof value === 'object') {
    return {
      [field]: {
        ...(value as Record<string, unknown>),
        unmapped_type: unmappedType,
      },
    };
  }

  return sortClause;
}

function withSafeSort(body: ElasticsearchRequestBody): ElasticsearchRequestBody {
  if (!body.sort) return body;

  if (Array.isArray(body.sort)) {
    return {
      ...body,
      sort: body.sort.map((clause) => normalizeSortClause(clause)),
    };
  }

  return {
    ...body,
    sort: normalizeSortClause(body.sort),
  };
}

async function loadMaxProductPrice(
  host: string,
  index: string,
  connectionHeaders: Record<string, string> | undefined,
): Promise<number | null> {
  try {
    const response = await fetch(`${host}/${elasticIndexPath(index)}/_search`, {
      method: 'POST',
      headers: elasticFetchHeaders(connectionHeaders),
      body: JSON.stringify({
        size: 0,
        aggs: {
          max_price: {
            max: {
              field: 'price',
            },
          },
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      aggregations?: {
        max_price?: {
          value?: number | null;
        };
      };
    };
    const maxPrice = json.aggregations?.max_price?.value;
    return typeof maxPrice === 'number' && Number.isFinite(maxPrice) ? maxPrice : null;
  } catch {
    return null;
  }
}

function buildRelevanceQuery(state: RequestState, queryConfig: QueryConfig) {
  const searchTerm = state.searchTerm?.trim();
  if (!searchTerm) return { match_all: {} };

  const primaryFields = ['title^8', 'name^7', 'sku^10', 'article_number^10'];
  const fallbackFields = ['slug^2', 'variant_skus^2', 'excerpt^1.5', 'description^0.4', 'content^0.3', 'product_information^0.3'];

  // Respect queryConfig.search_fields when present, but keep primary/fallback strategy explicit.
  const configuredPrimary = Object.entries(queryConfig.search_fields || {})
    .filter(([field]) => ['title', 'name', 'sku', 'article_number'].includes(field))
    .map(([field, config]) => `${field}^${config.weight ?? 1}`);
  const primary = configuredPrimary.length > 0 ? configuredPrimary : primaryFields;

  return {
    bool: {
      minimum_should_match: 1,
      should: [
        {
          multi_match: {
            query: searchTerm,
            fields: primary,
            type: 'best_fields',
            operator: 'and',
            boost: 6,
          },
        },
        {
          multi_match: {
            query: searchTerm,
            fields: primary,
            type: 'phrase_prefix',
            boost: 5,
          },
        },
        {
          multi_match: {
            query: searchTerm,
            fields: primary,
            type: 'best_fields',
            fuzziness: 'AUTO',
            prefix_length: 1,
            boost: 3,
          },
        },
        {
          multi_match: {
            query: searchTerm,
            fields: fallbackFields,
            type: 'best_fields',
            operator: 'or',
            boost: 0.8,
          },
        },
      ],
    },
  };
}

export async function POST(request: NextRequest) {
  const host = elasticHost();
  const index = elasticIndex();
  const connectionHeaders = elasticConnectionHeaders();

  if (!host) {
    return normalizeError('Elasticsearch host is not configured.', 500);
  }

  let body: { state?: RequestState; queryConfig?: QueryConfig };
  try {
    body = (await request.json()) as { state?: RequestState; queryConfig?: QueryConfig };
  } catch {
    return normalizeError('Invalid search request payload.', 400);
  }

  if (!body?.state || !body?.queryConfig) {
    return normalizeError('Missing search state or query config.', 400);
  }

  try {
    const connector = new ElasticsearchAPIConnector({
      host,
      index,
      ...(process.env.ELASTIC_API_KEY ? { apiKey: process.env.ELASTIC_API_KEY } : {}),
      ...(connectionHeaders ? { connectionOptions: { headers: connectionHeaders } } : {}),
      getQueryFn: (state, queryConfig) => buildRelevanceQuery(state, queryConfig) as never,
      interceptSearchRequest: async ({ requestBody }, next) => {
        const safeRequestBody = withSafeSort(requestBody as ElasticsearchRequestBody);
        return next(safeRequestBody as never);
      },
    });

    const [response, maxProductPrice] = await Promise.all([
      connector.onSearch(body.state, body.queryConfig),
      loadMaxProductPrice(host, index, connectionHeaders),
    ]);

    const responseWithPriceMetadata: ResponseState = {
      ...response,
      rawResponse: {
        ...(response.rawResponse && typeof response.rawResponse === 'object' ? response.rawResponse : {}),
        priceStats: {
          max: maxProductPrice,
        },
      },
    };

    return NextResponse.json(responseWithPriceMetadata);
  } catch (error) {
    console.error('Search proxy request failed.', {
      host,
      index,
      hasApiKey: Boolean(process.env.ELASTIC_API_KEY?.trim()),
      hasBasicAuth: Boolean(process.env.ELASTIC_USERNAME?.trim()),
      error,
    });
    return normalizeError('Search backend is temporarily unavailable.', 503);
  }
}

export async function GET() {
  return normalizeError('Method not allowed.', 405);
}
