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
  created_at?: string | null;
  updated_at?: string | null;
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
  let title = stringValue(source.title) || "";
  let subtitle = stringValue(source.subtitle);
  let excerpt = stringValue(source.excerpt);
  let content = stringValue(source.content);

  // Apply translations if locale is provided
  if (locale && Array.isArray(source.translations)) {
    const entry = source.translations.find((e: any) => {
      if (!e || typeof e !== "object") return false;
      return e[locale] || e.language === locale;
    });

    if (entry) {
      const translation = entry[locale] || entry;
      
      const apply = (val: unknown) => {
        if (val !== null && val !== undefined) {
          if (typeof val === "string") {
            const trimmed = val.trim();
            return trimmed !== "" ? trimmed : null;
          }
          return val;
        }
        return null;
      };

      const translatedTitle = apply(translation.title) || apply(translation.name);
      if (translatedTitle) title = translatedTitle as string;

      const translatedSubtitle = apply(translation.subtitle);
      if (translatedSubtitle) subtitle = translatedSubtitle as string;

      const translatedExcerpt = apply(translation.excerpt);
      if (translatedExcerpt) excerpt = translatedExcerpt as string;

      const translatedContent = apply(translation.content);
      if (translatedContent) content = translatedContent as string;
    }
  }

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
    created_at: stringValue(source.created_at),
    updated_at: stringValue(source.updated_at),
  };
}

function parseSortValue(value: string | null): PrinterSortValue {
  return PRINTER_SORT_VALUES.includes(value as PrinterSortValue) ? (value as PrinterSortValue) : "latest";
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
    sort: parseSortValue(params.get("sort")),
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

function buildSortClause(sort: PrinterSortValue): estypes.Sort {
  switch (sort) {
    case "oldest":
      return [{ created_at_timestamp: { order: "asc" } }];
    case "title_asc":
      return [{ "title_sort": { order: "asc" } }];
    case "title_desc":
      return [{ "title_sort": { order: "desc" } }];
    case "latest":
    default:
      return [{ created_at_timestamp: { order: "desc" } }];
  }
}

function buildTextQuery(search: string): estypes.QueryDslQueryContainer {
  const query = search.trim();
  if (!query) return { match_all: {} };

  const lowerQuery = query.toLowerCase();
  const isMultiTerm = query.split(/\s+/).filter(Boolean).length > 1;

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
    mustClauses.push(buildTextQuery(params.search));
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
      ],
    };

    // Add rescore to prioritize exact phrase matches (only when sorting by relevance)
    if (params.search && params.sort === "latest") {
      searchBody.rescore = {
        window_size: 100,
        query: {
          rescore_query: {
            match_phrase: {
              title: {
                query: params.search,
                slop: 0,
              },
            },
          },
          query_weight: 0.1,
          rescore_query_weight: 10000,
        },
      };
    } else {
      // Use explicit sort only when not rescoring
      searchBody.sort = buildSortClause(params.sort);
    }

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
    const printers: PrinterCardData[] = hits.map((hit) => {
      const source = hit._source as Record<string, unknown>;
      const titles = Array.isArray(source.title) ? source.title : [source.title];
      const subtitles = Array.isArray(source.subtitle) ? source.subtitle : [source.subtitle];
      const slugs = Array.isArray(source.slug) ? source.slug : [source.slug];
      const excerpts = Array.isArray(source.excerpt) ? source.excerpt : [source.excerpt];

      let name = String(titles[0] || "");
      let subtitle = subtitles[0] ? String(subtitles[0]) : null;
      let excerpt = excerpts[0] ? String(excerpts[0]) : null;

      // Apply translations if locale is provided
      if (params.locale && Array.isArray(source.translations)) {
        const entry = source.translations.find((e: any) => {
          if (!e || typeof e !== "object") return false;
          return e[params.locale!] || e.language === params.locale;
        });

        if (entry) {
          const translation = entry[params.locale!] || entry;
          
          const apply = (val: unknown) => {
            if (val !== null && val !== undefined) {
              if (typeof val === "string") {
                const trimmed = val.trim();
                return trimmed !== "" ? trimmed : null;
              }
              return val;
            }
            return null;
          };

          const translatedTitle = apply(translation.title) || apply(translation.name);
          if (translatedTitle) name = translatedTitle as string;

          const translatedSubtitle = apply(translation.subtitle);
          if (translatedSubtitle) subtitle = translatedSubtitle as string;

          const translatedExcerpt = apply(translation.excerpt);
          if (translatedExcerpt) excerpt = translatedExcerpt as string;
        }
      }

      return {
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
      };
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
