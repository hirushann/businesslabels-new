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
  runtime_mappings?: Record<string, unknown>;
  [key: string]: unknown;
};

const DIMENSION_FIELDS = {
  width: {
    key: 'meta_width',
    runtimeField: 'meta_width_mm',
  },
  height: {
    key: 'meta_height',
    runtimeField: 'meta_height_mm',
  },
  kern: {
    key: 'kern',
    runtimeField: 'meta_kern_mm',
  },
} as const;

const MATERIAL_CODE_FIELD = {
  key: 'material_code',
  runtimeField: 'meta_material_code',
} as const;

const FINISHING_FIELD = {
  key: 'finishing',
  runtimeField: 'meta_finishing',
} as const;

const GLUE_FIELD = {
  key: 'glue',
  runtimeField: 'meta_glue',
} as const;

const MATERIAL_FIELD = {
  runtimeField: 'meta_material',
} as const;

function metaValueRuntimeScript(metaKey: string, emitExpression: string): string {
  return `
def value = null;
if (params._source.containsKey('${metaKey}')) {
  value = params._source['${metaKey}'];
}
if (value == null && params._source.containsKey('meta')) {
  def meta = params._source['meta'];
  if (meta instanceof Map) {
    value = meta['${metaKey}'];
  } else if (meta instanceof List) {
    for (def item : meta) {
      if (item instanceof Map) {
        if (item.containsKey('${metaKey}')) {
          value = item['${metaKey}'];
          break;
        }
        if (item.containsKey('key') && item['key'] == '${metaKey}') {
          value = item['value'];
          break;
        }
      }
    }
  }
}
if (value == null) {
  return;
}
${emitExpression}
`;
}

function dimensionRuntimeScript(metaKey: string): string {
  return metaValueRuntimeScript(metaKey, `
def matcher = /[-+]?[0-9]*\\.?[0-9]+/.matcher(value.toString());
if (matcher.find()) {
  emit(Double.parseDouble(matcher.group()));
}
`);
}

function keywordRuntimeScript(metaKey: string): string {
  return metaValueRuntimeScript(metaKey, `
def text = value.toString();
if (text.length() > 0) {
  emit(text);
}
`);
}

function materialRuntimeScript(): string {
  return `
def value = null;
if (params._source.containsKey('material_title')) {
  value = params._source['material_title'];
}
if (value == null && params._source.containsKey('material')) {
  def material = params._source['material'];
  if (material instanceof Map) {
    if (material.containsKey('title')) {
      value = material['title'];
    } else if (material.containsKey('name')) {
      value = material['name'];
    } else if (material.containsKey('slug')) {
      value = material['slug'];
    }
  } else if (material != null) {
    value = material;
  }
}
if (value == null) {
  return;
}
def text = value.toString();
if (text.length() > 0) {
  emit(text);
}
`;
}

function metaRuntimeMappings(): Record<string, unknown> {
  const dimensionMappings = Object.fromEntries(
    Object.values(DIMENSION_FIELDS).map(({ key, runtimeField }) => [
      runtimeField,
      {
        type: 'double',
        script: {
          source: dimensionRuntimeScript(key),
        },
      },
    ]),
  );

  return {
    ...dimensionMappings,
    [MATERIAL_CODE_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: keywordRuntimeScript(MATERIAL_CODE_FIELD.key),
      },
    },
    [FINISHING_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: keywordRuntimeScript(FINISHING_FIELD.key),
      },
    },
    [GLUE_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: keywordRuntimeScript(GLUE_FIELD.key),
      },
    },
    [MATERIAL_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: materialRuntimeScript(),
      },
    },
  };
}

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
  const bodyWithRuntimeMappings = {
    ...body,
    runtime_mappings: {
      ...metaRuntimeMappings(),
      ...(body.runtime_mappings ?? {}),
    },
  };

  if (!bodyWithRuntimeMappings.sort) return bodyWithRuntimeMappings;

  if (Array.isArray(bodyWithRuntimeMappings.sort)) {
    return {
      ...bodyWithRuntimeMappings,
      sort: bodyWithRuntimeMappings.sort.map((clause) => normalizeSortClause(clause)),
    };
  }

  return {
    ...bodyWithRuntimeMappings,
    sort: normalizeSortClause(bodyWithRuntimeMappings.sort),
  };
}

type SearchStats = {
  price: {
    max: number | null;
  };
  dimensions: {
    width: {
      max: number | null;
    };
    height: {
      max: number | null;
    };
    kern: {
      max: number | null;
    };
  };
  pillFilters: {
    materialCode: {
      options: Array<{
        value: string;
        label: string;
        count: number;
      }>;
    };
    material: {
      options: Array<{
        value: string;
        label: string;
        count: number;
      }>;
    };
    finishing: {
      options: Array<{
        value: string;
        label: string;
        count: number;
      }>;
    };
    glue: {
      options: Array<{
        value: string;
        label: string;
        count: number;
      }>;
    };
  };
};

function labelFromCode(value: string): string {
  const normalized = value.trim().replace(/^\[\s*/, '').replace(/\s*\]$/, '').replace(/^["']|["']$/g, '');

  return normalized
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase();
      return upper.length <= 3 ? upper : `${upper.charAt(0)}${upper.slice(1).toLowerCase()}`;
    })
    .join(' ');
}

async function loadSearchStats(
  host: string,
  index: string,
  connectionHeaders: Record<string, string> | undefined,
): Promise<SearchStats> {
  const fallbackStats: SearchStats = {
    price: { max: null },
    dimensions: {
      width: { max: null },
      height: { max: null },
      kern: { max: null },
    },
    pillFilters: {
      materialCode: {
        options: [],
      },
      material: {
        options: [],
      },
      finishing: {
        options: [],
      },
      glue: {
        options: [],
      },
    },
  };

  try {
    const response = await fetch(`${host}/${elasticIndexPath(index)}/_search`, {
      method: 'POST',
      headers: elasticFetchHeaders(connectionHeaders),
      body: JSON.stringify({
        size: 0,
        runtime_mappings: metaRuntimeMappings(),
        aggs: {
          max_price: {
            max: {
              field: 'price',
            },
          },
          max_width: {
            max: {
              field: DIMENSION_FIELDS.width.runtimeField,
            },
          },
          max_height: {
            max: {
              field: DIMENSION_FIELDS.height.runtimeField,
            },
          },
          max_kern: {
            max: {
              field: DIMENSION_FIELDS.kern.runtimeField,
            },
          },
          material_codes: {
            terms: {
              field: MATERIAL_CODE_FIELD.runtimeField,
              size: 100,
              order: {
                _key: 'asc',
              },
            },
          },
          materials: {
            terms: {
              field: MATERIAL_FIELD.runtimeField,
              size: 100,
              order: {
                _key: 'asc',
              },
            },
          },
          finishings: {
            terms: {
              field: FINISHING_FIELD.runtimeField,
              size: 100,
              order: {
                _key: 'asc',
              },
            },
          },
          glues: {
            terms: {
              field: GLUE_FIELD.runtimeField,
              size: 100,
              order: {
                _key: 'asc',
              },
            },
          },
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallbackStats;
    }

    const json = (await response.json()) as {
      aggregations?: {
        max_price?: {
          value?: number | null;
        };
        max_width?: {
          value?: number | null;
        };
        max_height?: {
          value?: number | null;
        };
        max_kern?: {
          value?: number | null;
        };
        material_codes?: {
          buckets?: Array<{
            key?: string | number;
            doc_count?: number;
          }>;
        };
        materials?: {
          buckets?: Array<{
            key?: string | number;
            doc_count?: number;
          }>;
        };
        finishings?: {
          buckets?: Array<{
            key?: string | number;
            doc_count?: number;
          }>;
        };
        glues?: {
          buckets?: Array<{
            key?: string | number;
            doc_count?: number;
          }>;
        };
      };
    };

    const numberOrNull = (value: unknown) =>
      typeof value === 'number' && Number.isFinite(value) ? value : null;

    return {
      price: {
        max: numberOrNull(json.aggregations?.max_price?.value),
      },
      dimensions: {
        width: {
          max: numberOrNull(json.aggregations?.max_width?.value),
        },
        height: {
          max: numberOrNull(json.aggregations?.max_height?.value),
        },
        kern: {
          max: numberOrNull(json.aggregations?.max_kern?.value),
        },
      },
      pillFilters: {
        materialCode: {
          options: (json.aggregations?.material_codes?.buckets ?? [])
            .map((bucket) => {
              const value = typeof bucket.key === 'string' ? bucket.key : String(bucket.key ?? '');
              return {
                value,
                label: labelFromCode(value),
                count: typeof bucket.doc_count === 'number' ? bucket.doc_count : 0,
              };
            })
            .filter((option) => option.value.trim() !== ''),
        },
        material: {
          options: (json.aggregations?.materials?.buckets ?? [])
            .map((bucket) => {
              const value = typeof bucket.key === 'string' ? bucket.key : String(bucket.key ?? '');
              return {
                value,
                label: labelFromCode(value),
                count: typeof bucket.doc_count === 'number' ? bucket.doc_count : 0,
              };
            })
            .filter((option) => option.value.trim() !== ''),
        },
        finishing: {
          options: (json.aggregations?.finishings?.buckets ?? [])
            .map((bucket) => {
              const value = typeof bucket.key === 'string' ? bucket.key : String(bucket.key ?? '');
              return {
                value,
                label: labelFromCode(value),
                count: typeof bucket.doc_count === 'number' ? bucket.doc_count : 0,
              };
            })
            .filter((option) => option.value.trim() !== ''),
        },
        glue: {
          options: (json.aggregations?.glues?.buckets ?? [])
            .map((bucket) => {
              const value = typeof bucket.key === 'string' ? bucket.key : String(bucket.key ?? '');
              return {
                value,
                label: labelFromCode(value),
                count: typeof bucket.doc_count === 'number' ? bucket.doc_count : 0,
              };
            })
            .filter((option) => option.value.trim() !== ''),
        },
      },
    };
  } catch {
    return fallbackStats;
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

    const [response, searchStats] = await Promise.all([
      connector.onSearch(body.state, body.queryConfig),
      loadSearchStats(host, index, connectionHeaders),
    ]);

    const responseWithPriceMetadata: ResponseState = {
      ...response,
      rawResponse: {
        ...(response.rawResponse && typeof response.rawResponse === 'object' ? response.rawResponse : {}),
        priceStats: {
          max: searchStats.price.max,
        },
        dimensionStats: searchStats.dimensions,
        pillFilters: searchStats.pillFilters,
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

export async function GET(request: NextRequest) {
  // Proxy GET requests to Laravel backend for finder page
  const API_BASE_URL = process.env.BBNL_API_BASE_URL;
  
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: 'Backend API URL is not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query');
  const printerIds = searchParams.get('printer_ids');
  const productType = searchParams.get('product_type');
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '24';

  try {
    const backendParams = new URLSearchParams();
    if (query) backendParams.set('query', query);
    if (printerIds) backendParams.set('printer_ids', printerIds);
    if (productType) backendParams.set('product_type', productType);
    backendParams.set('page', page);
    backendParams.set('per_page', perPage);

    const response = await fetch(
      `${API_BASE_URL}/api/search?${backendParams.toString()}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(`Backend API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch products', data: [], current_page: 1, last_page: 1, total: 0, per_page: parseInt(perPage) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', data: [], current_page: 1, last_page: 1, total: 0, per_page: parseInt(perPage) },
      { status: 500 }
    );
  }
}
