import type { estypes } from "@elastic/elasticsearch";
import { elasticClient } from "@/lib/search/client";

// Re-export types from printerTypes for convenience
export type {
  PrinterCardData,
  PrinterSortValue,
  PrinterOptionFilterKey,
  PrinterFilterOption,
  PrinterOptionFilter,
  PrinterFilters,
  PrinterSearchParams,
  PrinterSearchResponse,
} from "./printerTypes";
export { PRINTER_SORT_VALUES } from "./printerTypes";

// Import types and values for internal use
import type {
  PrinterCardData,
  PrinterSortValue,
  PrinterOptionFilterKey,
  PrinterFilterOption,
  PrinterFilters,
  PrinterSearchParams,
  PrinterSearchResponse,
} from "./printerTypes";
import { PRINTER_SORT_VALUES } from "./printerTypes";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 24;
const MAX_PER_PAGE = 60;

const OPTION_FILTERS: Array<{
  key: PrinterOptionFilterKey;
  title: string;
  field: string;
  paramKey: keyof PrinterSearchParams;
}> = [
  { key: "druktype", title: "Print Type", field: "properties.druktype", paramKey: "druktype" },
  { key: "kern", title: "Core Size", field: "properties.kern", paramKey: "kern" },
  { key: "detectie", title: "Detection", field: "properties.detectie", paramKey: "detectie" },
  { key: "width", title: "Width", field: "properties.width", paramKey: "width" },
  { key: "buiten_diameter", title: "Outer Diameter", field: "properties.buiten_diameter", paramKey: "buitenDiameter" },
];

function printerIndexName(): string {
  const prefix = process.env.SCOUT_PREFIX?.trim() ?? "";
  return prefix ? `${prefix}catalog_printers` : "catalog_printers";
}

type PrinterSource = Record<string, unknown>;

export type FinderPrinterDetails = {
  id: number;
  title: string;
  subtitle?: string | null;
  slug: string;
  image?: string | null;
  properties?: Record<string, string[]>;
  excerpt?: string | null;
  content?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  product_url?: string | null;
};

function firstScalar(value: unknown): string | number | boolean | null {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const scalar = firstScalar(item);
      if (scalar !== null) return scalar;
    }
  }
  return null;
}

function stringValue(value: unknown): string | null {
  const scalar = firstScalar(value);
  return scalar === null ? null : String(scalar);
}

function cleanString(value: unknown): string | null {
  return stringValue(value)?.trim() || null;
}

export function localizedPrinterText(source: PrinterSource, locale?: "en" | "nl") {
  const fallback = {
    title: cleanString(source.title) ?? "",
    subtitle: cleanString(source.subtitle),
    excerpt: cleanString(source.excerpt),
    content: cleanString(source.content),
  };

  if (!locale) return fallback;

  const entry = (Array.isArray(source.translations) ? source.translations : []).find((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    return record[locale] || record.language === locale;
  }) as Record<string, unknown> | undefined;
  const nested = entry?.[locale];
  const translation = nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : entry;

  const translated = {
    title: cleanString(translation?.title) ?? cleanString(translation?.name) ?? "",
    subtitle: cleanString(translation?.subtitle),
    excerpt: cleanString(translation?.excerpt),
    content: cleanString(translation?.content),
    meta_title: cleanString(translation?.meta_title),
    meta_description: cleanString(translation?.meta_description),
  };

  return locale === "en"
    ? translated
    : {
        title: translated.title || fallback.title,
        subtitle: translated.subtitle ?? fallback.subtitle,
        excerpt: translated.excerpt ?? fallback.excerpt,
        content: translated.content ?? fallback.content,
        meta_title: translated.meta_title ?? undefined,
        meta_description: translated.meta_description ?? undefined,
      };
}

function stringValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => stringValues(item));
  }

  const string = stringValue(value)?.trim();
  return string ? [string] : [];
}

function numberValue(value: unknown): number | null {
  const scalar = firstScalar(value);
  if (typeof scalar === "number") return scalar;
  if (typeof scalar === "string" && scalar.trim()) {
    const parsed = Number(scalar);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringArrayMap(value: unknown): Record<string, string[]> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, rawValue]) => {
      const strings = stringValues(rawValue);

      return [key, strings] as const;
    })
    .filter(([, values]) => values.length > 0);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function mapFinderPrinter(source: PrinterSource, locale?: "en" | "nl"): FinderPrinterDetails | null {
  const id = numberValue(source.id);
  const { title, subtitle, excerpt, content, meta_title, meta_description } = localizedPrinterText(source, locale);

  if (id === null || !title) return null;

  return {
    id,
    title,
    subtitle,
    slug: stringValue(source.slug) ?? "",
    image: stringValue(source.image) ?? stringValue(source.main_image),
    properties: stringArrayMap(source.properties),
    excerpt,
    content,
    meta_title,
    meta_description,
    created_at: stringValue(source.created_at),
    updated_at: stringValue(source.updated_at),
    product_url: stringValue(source.product_url),
  };
}

function parseSortValue(value: string | null, hasSearch: boolean): PrinterSortValue {
  return PRINTER_SORT_VALUES.includes(value as PrinterSortValue)
    ? (value as PrinterSortValue)
    : hasSearch ? "relevance" : "title_asc";
}

export function parsePrinterSearchParams(params: URLSearchParams, locale?: "en" | "nl"): PrinterSearchParams {
  const page = Math.max(1, Number.parseInt(params.get("page") ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number.parseInt(params.get("per_page") ?? String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE)
  );

  const search = params.get("search") || params.get("q") || "";
  
  return {
    search,
    page,
    perPage,
    sort: parseSortValue(params.get("sort"), Boolean(search.trim())),
    druktype: params.getAll("druktype").flatMap(v => v.split(",")).filter(Boolean),
    kern: params.getAll("kern").flatMap(v => v.split(",")).filter(Boolean),
    detectie: params.getAll("detectie").flatMap(v => v.split(",")).filter(Boolean),
    width: params.getAll("width").flatMap(v => v.split(",")).filter(Boolean),
    buitenDiameter: params.getAll("buiten_diameter").flatMap(v => v.split(",")).filter(Boolean),
    locale,
  };
}

export async function getPrinterById(id: number, locale?: "en" | "nl"): Promise<FinderPrinterDetails | null> {
  if (!Number.isFinite(id)) return null;

  const client = elasticClient();
  const response = await client.search<PrinterSource>({
    index: printerIndexName(),
    ignore_unavailable: true,
    size: 1,
    _source: [
      "id",
      "title",
      "subtitle",
      "slug",
      "image",
      "main_image",
      "properties",
      "content",
      "excerpt",
      "translations",
      "created_at",
      "updated_at",
    ],
    query: {
      bool: {
        filter: [
          { term: { id } },
          { term: { status: "published" } },
        ],
      },
    },
  });

  const source = response.hits.hits[0]?._source;
  return source ? mapFinderPrinter(source, locale) : null;
}

function buildSortClause(sort: PrinterSortValue): estypes.Sort | undefined {
  const featuredSort = { featured: { order: "desc" } } as const;
  switch (sort) {
    case "oldest":
      return [featuredSort, { created_at_timestamp: { order: "asc" } }];
    case "latest":
      return [featuredSort, { created_at_timestamp: { order: "desc" } }];
    case "title_desc":
      return [featuredSort, { "title_sort.keyword": { order: "desc" } }];
    case "relevance":
      return undefined;
    case "title_asc":
    default:
      return [featuredSort, { "title_sort.keyword": { order: "asc" } }];
  }
}

export function buildPrinterTextQuery(search: string): estypes.QueryDslQueryContainer {
  const query = search.trim();
  if (!query) return { match_all: {} };

  const lowerQuery = query.toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);
  const isMultiTerm = tokens.length > 1;
  const isModelSearch = tokens.some((token) => /\d/.test(token));

  // STRICT matching on title only - prioritize exact phrase matches
  // This ensures "Godex ZX1200i" shows ZX1200i, not all Godex printers
  const should: estypes.QueryDslQueryContainer[] = [
    // Exact phrase match - TOP PRIORITY
    {
      match_phrase: {
        title: {
          query,
          boost: 10000000,
        },
      },
    },
    // Exact keyword match
    {
      term: {
        "title_sort.keyword": {
          value: lowerQuery,
          boost: 5000000,
        },
      },
    },
    // Phrase prefix match (Essential for partials like "Eps", "Zeb", "God")
    {
      match_phrase_prefix: {
        title: {
          query,
          boost: 2000000,
          max_expansions: 50,
        },
      },
    },
    // Match with ALL words required (for multi-word searches)
    {
      match: {
        title: {
          query,
          boost: 1000000,
          operator: "and",
        },
      },
    },
  ];

  should.push({
    multi_match: {
      query,
      fields: ["subtitle^3", "excerpt^2", "content", "category_titles_nl^2", "category_titles_en^2"],
      type: "cross_fields",
      operator: "and",
      boost: 100,
    },
  });

  should.push({
    nested: {
      path: "properties",
      ignore_unmapped: true,
      score_mode: "max",
      query: {
        multi_match: {
          query,
          fields: [
            "properties.label_type",
            "properties.druktype",
            "properties.detectie",
            "properties.width",
            "properties.label_breedte",
            "properties.kern",
            "properties.buiten_diameter",
            "properties.max_buiten_diameter",
          ],
          type: "cross_fields",
          operator: "and",
          boost: 250,
        },
      },
    },
  });

  if (!isModelSearch && query.length >= 3) {
    should.push({
      match: {
        title: {
          query,
          fuzziness: "AUTO",
          prefix_length: 1,
          boost: 100,
        },
      },
    });
  }

  // For single words, allow even more permissive partial matching
  if (!isMultiTerm) {
    // Edge N-gram like behavior for short terms via wildcard
    // Start matching even with a single character for brands
    if (query.length >= 1) {
      should.push({
        wildcard: {
          "title_sort.keyword": {
            value: `${lowerQuery}*`,
            boost: 500000,
            case_insensitive: true,
          },
        },
      });
    }

    // Basic match fallback
    should.push({
      match: {
        title: {
          query,
          boost: 1000,
        },
      },
    });
  }

  return {
    bool: {
      should,
      minimum_should_match: 1,
    },
  };
}

/**
 * Search printers in Elasticsearch
 */
export async function searchPrinters(params: PrinterSearchParams): Promise<PrinterSearchResponse> {
  const client = elasticClient();
  const index = printerIndexName();
  const from = (params.page - 1) * params.perPage;

  // Build query
  const mustClauses: estypes.QueryDslQueryContainer[] = [
    { term: { status: "published" } },
  ];

  // Add text search
  if (params.search) {
    mustClauses.push(buildPrinterTextQuery(params.search));
  }

  // Add property filters
  const filterClauses: estypes.QueryDslQueryContainer[] = [];

  function nestedPropertyFilter(field: string, values: string[]) {
    return {
      bool: {
        minimum_should_match: 1,
        should: [
          { terms: { [field]: values } },
          {
            nested: {
              path: "properties",
              ignore_unmapped: true,
              query: {
                bool: {
                  filter: [{ terms: { [field]: values } }],
                },
              },
            },
          },
        ],
      },
    };
  }

  if (params.druktype.length > 0) {
    filterClauses.push(nestedPropertyFilter("properties.druktype", params.druktype));
  }
  if (params.kern.length > 0) {
    filterClauses.push(nestedPropertyFilter("properties.kern", params.kern));
  }
  if (params.detectie.length > 0) {
    filterClauses.push(nestedPropertyFilter("properties.detectie", params.detectie));
  }
  if (params.width.length > 0) {
    filterClauses.push(nestedPropertyFilter("properties.width", params.width));
  }
  if (params.buitenDiameter.length > 0) {
    filterClauses.push(nestedPropertyFilter("properties.buiten_diameter", params.buitenDiameter));
  }

  // Build aggregations for filters (properties is a nested field)
  const aggs: Record<string, estypes.AggregationsAggregationContainer> = {};
  OPTION_FILTERS.forEach(filter => {
    aggs[filter.key] = {
      nested: {
        path: "properties",
      },
      aggs: {
        values: {
          terms: {
            field: `${filter.field}.keyword`,
            size: 100,
          },
        },
      },
    };
  });

  try {
    const searchBody: Record<string, unknown> = {
      query: {
        bool: {
          must: mustClauses,
          filter: filterClauses,
        },
      },
      from,
      size: params.perPage,
      aggs,
      _source: [
        "id",
        "title",
        "subtitle",
        "slug",
        "excerpt",
        "image",
        "main_image",
        "sku",
        "properties",
        "price",
        "original_price",
        "status",
        "created_at",
        "translations",
        "featured",
      ],
    };

    const sort = buildSortClause(params.sort);
    if (sort) searchBody.sort = sort;

    const response = await client.search({
      index,
      ignore_unavailable: true,
      body: searchBody,
    });

    const hits = response.hits.hits;
    const total = typeof response.hits.total === "number"
      ? response.hits.total
      : response.hits.total?.value ?? 0;

    const lastPage = Math.max(1, Math.ceil(total / params.perPage));

    // Map printers
    const printers: PrinterCardData[] = hits.flatMap((hit) => {
      const source = hit._source as Record<string, unknown>;
      const slugs = Array.isArray(source.slug) ? source.slug : [source.slug];
      const { title: name, subtitle, excerpt } = localizedPrinterText(source, params.locale);
      if (!name) return [];

      return [{
        id: String(source.id),
        sku: source.sku ? String(source.sku) : "",
        name,
        subtitle,
        excerpt,
        materialTitle: null,
        price: source.price ? Number(source.price) : 0,
        originalPrice: source.original_price ? Number(source.original_price) : null,
        inStock: true,
        mainImage: source.image || source.main_image ? String(source.image || source.main_image) : null,
        categories: [],
        slug: slugs[0] ? String(slugs[0]) : null,
        type: "simple",
        properties: source.properties as Record<string, string[]> | undefined,
        featured: source.featured !== undefined ? source.featured as PrinterCardData["featured"] : null,
      }];
    });

    // Build filters from aggregations
    const filters: PrinterFilters = {
      options: [],
    };

    if (response.aggregations) {
      OPTION_FILTERS.forEach((filterDef) => {
        const nestedAgg = response.aggregations?.[filterDef.key] as estypes.AggregationsNestedAggregate | undefined;
        const termsAgg = nestedAgg?.values as estypes.AggregationsStringTermsAggregate | undefined;
        if (termsAgg?.buckets && Array.isArray(termsAgg.buckets)) {
          const options: PrinterFilterOption[] = termsAgg.buckets.map((bucket) => ({
            value: String(bucket.key),
            label: String(bucket.key),
            count: bucket.doc_count ?? 0,
          }));

          if (options.length > 0) {
            filters.options.push({
              key: filterDef.key,
              title: filterDef.title,
              options,
            });
          }
        }
      });
    }

    return {
      printers,
      total,
      currentPage: params.page,
      lastPage,
      perPage: params.perPage,
      filters,
    };
  } catch (error) {
    console.error("Error searching printers:", error);
    
    return {
      printers: [],
      total: 0,
      currentPage: params.page,
      lastPage: 1,
      perPage: params.perPage,
      filters: { options: [] },
    };
  }
}
