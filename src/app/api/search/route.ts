import { NextRequest, NextResponse } from 'next/server';
import ElasticsearchAPIConnector from '@elastic/search-ui-elasticsearch-connector';
import type { QueryConfig, RequestState, ResponseState } from '@elastic/search-ui';

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
  const patterns = new Set<string>();

  if (prefix) {
    patterns.add(`${prefix}catalog_products_*`);
  }

  patterns.add('catalog_products_*');

  return Array.from(patterns).join(',');
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
    keys: ['breedte', 'meta_width', 'width'],
    runtimeField: 'meta_width_mm',
  },
  height: {
    keys: ['hoogte', 'meta_height', 'height'],
    runtimeField: 'meta_height_mm',
  },
  kern: {
    keys: ['kern_numeric', 'kern', 'meta_kern'],
    runtimeField: 'meta_kern_mm',
  },
} as const;

const MATERIAL_CODE_FIELD = {
  keys: ['materiaal-code', 'material_code'],
  runtimeField: 'meta_material_code',
} as const;

const FINISHING_FIELD = {
  keys: ['afwerking', 'finishing'],
  runtimeField: 'meta_finishing',
} as const;

const GLUE_FIELD = {
  keys: ['lijm', 'glue'],
  runtimeField: 'meta_glue',
} as const;

const KERN_STRING_FIELD = {
  keys: ['kern_numeric', 'kern', 'meta_kern'],
  runtimeField: 'meta_kern_string',
} as const;

const MATERIAL_FIELD = {
  runtimeField: 'meta_material',
} as const;

const CATEGORY_FIELD = {
  runtimeField: 'search_category_slug',
} as const;

const BRAND_FIELD = {
  runtimeField: 'search_brand_slug',
} as const;

function painlessList(values: readonly string[]): string {
  return `[${values.map((value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`).join(', ')}]`;
}

function metaValueRuntimeScript(metaKeys: readonly string[], emitExpression: string): string {
  return `
def metaKeys = ${painlessList(metaKeys)};
def value = null;
for (def metaKey : metaKeys) {
  if (params._source.containsKey(metaKey)) {
    value = params._source[metaKey];
    break;
  }
}
if (value == null && params._source.containsKey('meta')) {
  def meta = params._source['meta'];
  if (meta instanceof Map) {
    for (def metaKey : metaKeys) {
      if (meta.containsKey(metaKey)) {
        value = meta[metaKey];
        break;
      }
    }
  } else if (meta instanceof List) {
    for (def item : meta) {
      if (item instanceof Map) {
        for (def metaKey : metaKeys) {
          if (item.containsKey(metaKey)) {
            value = item[metaKey];
            break;
          }
          if (item.containsKey('key') && item['key'] == metaKey) {
            value = item['value'];
            break;
          }
        }
      }
      if (value != null) {
        break;
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

function dimensionRuntimeScript(metaKeys: readonly string[]): string {
  return metaValueRuntimeScript(metaKeys, `
def matcher = /[-+]?[0-9]*\\.?[0-9]+/.matcher(value.toString());
if (matcher.find()) {
  emit(Double.parseDouble(matcher.group()));
}
`);
}

function keywordRuntimeScript(metaKeys: readonly string[]): string {
  return metaValueRuntimeScript(metaKeys, `
if (value instanceof List) {
  for (def item : value) {
    if (item == null) {
      continue;
    }
    def itemValue = item;
    if (item instanceof Map && item.containsKey('value')) {
      itemValue = item['value'];
    }
    def text = itemValue.toString();
    if (text.length() > 0) {
      emit(text);
    }
  }
} else {
  def text = value.toString();
  if (text.length() > 0) {
    emit(text);
  }
}
`);
}

function materialRuntimeScript(): string {
  return `
def value = null;
if (params._source.containsKey('material_title')) {
  value = params._source['material_title'];
}
if (value == null && params._source.containsKey('materiaal')) {
  value = params._source['materiaal'];
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
if (value instanceof List) {
  for (def item : value) {
    if (item == null) {
      continue;
    }
    def text = item.toString();
    if (text.length() > 0) {
      emit(text);
    }
  }
} else {
  def text = value.toString();
  if (text.length() > 0) {
    emit(text);
  }
}
`;
}

function categoryRuntimeScript(): string {
  return `
if (params._source.containsKey('category_slugs')) {
  def categories = params._source['category_slugs'];
  if (categories instanceof List) {
    for (def category : categories) {
      if (category != null && category.toString().length() > 0) {
        emit(category.toString());
      }
    }
  } else if (categories != null && categories.toString().length() > 0) {
    emit(categories.toString());
  }
}
if (params._source.containsKey('terms')) {
  def terms = params._source['terms'];
  if (terms instanceof Map && terms.containsKey('product_cat')) {
    def productCategories = terms['product_cat'];
    if (productCategories instanceof List) {
      for (def category : productCategories) {
        if (category instanceof Map && category.containsKey('slug') && category['slug'] != null) {
          emit(category['slug'].toString());
        }
      }
    }
  }
}
`;
}

function brandRuntimeScript(): string {
  return `
if (params._source.containsKey('brand')) {
  def brand = params._source['brand'];
  if (brand != null && brand.toString().length() > 0) {
    emit(brand.toString());
  }
}
if (params._source.containsKey('merken')) {
  def merken = params._source['merken'];
  if (merken instanceof List) {
    for (def item : merken) {
      if (item != null && item.toString().length() > 0) {
        emit(item.toString());
      }
    }
  } else if (merken != null && merken.toString().length() > 0) {
    emit(merken.toString());
  }
}
if (params._source.containsKey('terms')) {
  def terms = params._source['terms'];
  if (terms instanceof Map && terms.containsKey('product_brand')) {
    def productBrands = terms['product_brand'];
    if (productBrands instanceof List) {
      for (def brandTerm : productBrands) {
        if (brandTerm instanceof Map && brandTerm.containsKey('slug') && brandTerm['slug'] != null) {
          emit(brandTerm['slug'].toString());
        }
      }
    }
  }
}
`;
}

function metaRuntimeMappings(): Record<string, unknown> {
  const dimensionMappings = Object.fromEntries(
    Object.values(DIMENSION_FIELDS).map(({ keys, runtimeField }) => [
      runtimeField,
      {
        type: 'double',
        script: {
          source: dimensionRuntimeScript(keys),
        },
      },
    ]),
  );

  return {
    ...dimensionMappings,
    [MATERIAL_CODE_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: keywordRuntimeScript(MATERIAL_CODE_FIELD.keys),
      },
    },
    [FINISHING_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: keywordRuntimeScript(FINISHING_FIELD.keys),
      },
    },
    [GLUE_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: keywordRuntimeScript(GLUE_FIELD.keys),
      },
    },
    [KERN_STRING_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: keywordRuntimeScript(KERN_STRING_FIELD.keys),
      },
    },
    [MATERIAL_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: materialRuntimeScript(),
      },
    },
    [CATEGORY_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: categoryRuntimeScript(),
      },
    },
    [BRAND_FIELD.runtimeField]: {
      type: 'keyword',
      script: {
        source: brandRuntimeScript(),
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

function withCategoryConstraint(body: ElasticsearchRequestBody, categorySlug: string): ElasticsearchRequestBody {
  const constraintClause = { terms: { category_slugs: [categorySlug] } };
  const existingQuery = body.query;
  const newQuery = existingQuery
    ? { bool: { must: [existingQuery], filter: [constraintClause] } }
    : { bool: { filter: [constraintClause] } };
  return { ...body, query: newQuery };
}

function withBrandConstraint(body: ElasticsearchRequestBody, brandSlug: string): ElasticsearchRequestBody {
  const constraintClause = {
    term: {
      [BRAND_FIELD.runtimeField]: {
        value: brandSlug,
        case_insensitive: true,
      },
    },
  };
  const existingQuery = body.query;
  const newQuery = existingQuery
    ? { bool: { must: [existingQuery], filter: [constraintClause] } }
    : { bool: { filter: [constraintClause] } };
  return { ...body, query: newQuery };
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
    category: {
      options: Array<{
        value: string;
        label: string;
        count: number;
      }>;
    };
    brand: {
      options: Array<{
        value: string;
        label: string;
        count: number;
      }>;
    };
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
    kern: {
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
  categorySlug?: string,
  brandSlug?: string,
): Promise<SearchStats> {
  const fallbackStats: SearchStats = {
    price: { max: null },
    dimensions: {
      width: { max: null },
      height: { max: null },
      kern: { max: null },
    },
    pillFilters: {
      category: {
        options: [],
      },
      brand: {
        options: [],
      },
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
      kern: {
        options: [],
      },
    },
  };

  try {
    const statsBody: Record<string, unknown> = {
      size: 0,
      runtime_mappings: metaRuntimeMappings(),
    };

    const statsFilters: unknown[] = [];
    if (categorySlug) {
      statsFilters.push({ terms: { category_slugs: [categorySlug] } });
    }
    if (brandSlug) {
      statsFilters.push({
        term: {
          [BRAND_FIELD.runtimeField]: {
            value: brandSlug,
            case_insensitive: true,
          },
        },
      });
    }
    if (statsFilters.length > 0) {
      statsBody.query = { bool: { filter: statsFilters } };
    }

    const response = await fetch(`${host}/${elasticIndexPath(index)}/_search`, {
      method: 'POST',
      headers: elasticFetchHeaders(connectionHeaders),
      body: JSON.stringify({
        ...statsBody,
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
          kern_strings: {
            terms: {
              field: KERN_STRING_FIELD.runtimeField,
              size: 100,
              order: {
                _key: 'asc',
              },
            },
          },
          categories: {
            terms: {
              field: CATEGORY_FIELD.runtimeField,
              size: 100,
              order: {
                _key: 'asc',
              },
            },
          },
          brands: {
            terms: {
              field: BRAND_FIELD.runtimeField,
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
        kern_strings?: {
          buckets?: Array<{
            key?: string | number;
            doc_count?: number;
          }>;
        };
        categories?: {
          buckets?: Array<{
            key?: string | number;
            doc_count?: number;
            names?: {
              buckets?: Array<{
                key?: string | number;
              }>;
            };
          }>;
        };
        brands?: {
          buckets?: Array<{
            key?: string | number;
            doc_count?: number;
            names?: {
              buckets?: Array<{
                key?: string | number;
              }>;
            };
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
        category: {
          options: (json.aggregations?.categories?.buckets ?? [])
            .map((bucket) => {
              const value = typeof bucket.key === 'string' ? bucket.key : String(bucket.key ?? '');
              const label = bucket.names?.buckets?.[0]?.key;
              return {
                value,
                label: typeof label === 'string' && label.trim() !== '' ? label : labelFromCode(value),
                count: typeof bucket.doc_count === 'number' ? bucket.doc_count : 0,
              };
            })
            .filter((option) => option.value.trim() !== ''),
        },
        brand: {
          options: (json.aggregations?.brands?.buckets ?? [])
            .map((bucket) => {
              const value = typeof bucket.key === 'string' ? bucket.key : String(bucket.key ?? '');
              const label = bucket.names?.buckets?.[0]?.key;
              return {
                value,
                label: typeof label === 'string' && label.trim() !== '' ? label : labelFromCode(value),
                count: typeof bucket.doc_count === 'number' ? bucket.doc_count : 0,
              };
            })
            .filter((option) => option.value.trim() !== ''),
        },
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
        kern: {
          options: (json.aggregations?.kern_strings?.buckets ?? [])
            .map((bucket) => {
              const value = typeof bucket.key === 'string' ? bucket.key : String(bucket.key ?? '');
              return {
                value,
                label: labelFromCode(value),
                count: typeof bucket.doc_count === 'number' ? bucket.doc_count : 0,
              };
            })
            .filter((option) => option.value.trim() !== '' && !/[-+]?[0-9]*\.?[0-9]+/.test(option.value)),
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

  const primaryFields = ['title^8', 'name^7', 'post_title^8', 'sku^10', 'meta._sku.value^10', 'article_number^10'];
  const fallbackFields = [
    'slug^2',
    'post_name^2',
    'variant_skus^2',
    'excerpt^1.5',
    'description^0.4',
    'content^0.3',
    'post_content^0.4',
    'product_information^0.3',
    'meta.*.value^0.8',
    'terms.*.name^0.6',
  ];

  // Respect queryConfig.search_fields when present, but keep primary/fallback strategy explicit.
  const configuredPrimary = Object.entries(queryConfig.search_fields || {})
    .filter(([field]) => ['title', 'name', 'post_title', 'sku', 'meta._sku.value', 'article_number'].includes(field))
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

  let body: { state?: RequestState; queryConfig?: QueryConfig; categorySlug?: string; brandSlug?: string };
  try {
    body = (await request.json()) as {
      state?: RequestState;
      queryConfig?: QueryConfig;
      categorySlug?: string;
      brandSlug?: string;
    };
  } catch {
    return normalizeError('Invalid search request payload.', 400);
  }

  if (!body?.state || !body?.queryConfig) {
    return normalizeError('Missing search state or query config.', 400);
  }

  const categorySlug = typeof body.categorySlug === 'string' && body.categorySlug.trim()
    ? body.categorySlug.trim()
    : undefined;
  const brandSlug = typeof body.brandSlug === 'string' && body.brandSlug.trim()
    ? body.brandSlug.trim()
    : undefined;

  try {
    const connector = new ElasticsearchAPIConnector({
      host,
      index,
      ...(process.env.ELASTIC_API_KEY ? { apiKey: process.env.ELASTIC_API_KEY } : {}),
      ...(connectionHeaders ? { connectionOptions: { headers: connectionHeaders } } : {}),
      getQueryFn: (state, queryConfig) => buildRelevanceQuery(state, queryConfig) as never,
      interceptSearchRequest: async ({ requestBody }, next) => {
        let safeRequestBody = withSafeSort(requestBody as ElasticsearchRequestBody);
        if (categorySlug) {
          safeRequestBody = withCategoryConstraint(safeRequestBody, categorySlug);
        }
        if (brandSlug) {
          safeRequestBody = withBrandConstraint(safeRequestBody, brandSlug);
        }
        return next(safeRequestBody as never);
      },
    });

    const [response, searchStats] = await Promise.all([
      connector.onSearch(body.state, body.queryConfig),
      loadSearchStats(host, index, connectionHeaders, categorySlug, brandSlug),
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
