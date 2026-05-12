import type { estypes } from "@elastic/elasticsearch";
import { elasticClient } from "@/lib/search/client";
import type { ProductCardData } from "@/components/ProductCard";

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

function parseSortValue(value: string | null): PrinterSortValue {
  return PRINTER_SORT_VALUES.includes(value as PrinterSortValue) ? (value as PrinterSortValue) : "latest";
}

export function parsePrinterSearchParams(params: URLSearchParams): PrinterSearchParams {
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
  };
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

  // STRICT matching on title only - prioritize exact phrase matches
  // This ensures "Godex ZX1200i" shows ZX1200i, not all Godex printers
  return {
    bool: {
      should: [
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
        // Match any word (for single-word searches only)
        {
          match: {
            title: {
              query,
              boost: 1000,
            },
          },
        },
      ],
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

  if (params.druktype.length > 0) {
    filterClauses.push({ terms: { "properties.druktype": params.druktype } });
  }
  if (params.kern.length > 0) {
    filterClauses.push({ terms: { "properties.kern": params.kern } });
  }
  if (params.detectie.length > 0) {
    filterClauses.push({ terms: { "properties.detectie": params.detectie } });
  }
  if (params.width.length > 0) {
    filterClauses.push({ terms: { "properties.width": params.width } });
  }
  if (params.buitenDiameter.length > 0) {
    filterClauses.push({ terms: { "properties.buiten_diameter": params.buitenDiameter } });
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
    const searchBody: any = {
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
        "properties",
        "price",
        "original_price",
        "status",
        "created_at",
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

      return {
        id: String(source.id),
        sku: "",
        name: String(titles[0] || ""),
        subtitle: subtitles[0] ? String(subtitles[0]) : null,
        excerpt: excerpts[0] ? String(excerpts[0]) : null,
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
