import type { estypes } from "@elastic/elasticsearch";
import type { LinkProps } from "next/link";
import type { ProductCardData, ProductRouteType, ProductWarrantyData } from "@/components/ProductCard";
import { catalogIndexForType, elasticClient } from "@/lib/search/client";
import {
  CATALOG_SORT_VALUES,
  type CatalogFilters,
  type CatalogOptionFilterKey,
  type CatalogProductResult,
  type CatalogProductType,
  type CatalogRangeKey,
  type CatalogSearchParams,
  type CatalogSearchResponse,
  type CatalogSortValue,
} from "@/lib/search/types";

export type WarrantyRawData = {
  is_available: boolean;
  has_options: boolean;
  options: Array<{
    id: number;
    name: string | null;
    duration_months: number | null;
    price: number | null;
    description: string | null;
    sort_order: number;
  }>;
  default_option: {
    id: number;
    name: string | null;
    duration_months: number | null;
    price: number | null;
    description: string | null;
    sort_order: number;
  } | null;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 24;
const MAX_PER_PAGE = 60;

const MULTI_VALUE_KEYS = {
  categories: ["category", "category_slug"],
  categoryIds: ["category_id"],
  brands: ["brand"],
  materialIds: ["material_id"],
  materialCategories: ["material_category"],
  materialCategoryIds: ["material_category_id"],
  materialCodes: ["material_code"],
  materials: ["material"],
  finishings: ["finishing"],
  glues: ["glue", "adhesive"],
  printMethods: ["print_method", "druktype"],
  printerTypes: ["printer_type"],
  detections: ["detectie"],
  marks: ["merken"],
} as const;

const EXACT_VALUE_KEYS = {
  ids: ["id"],
  slugs: ["slug"],
  skus: ["sku"],
  articleNumbers: ["article_number"],
} as const;

const OPTION_FILTERS: Array<{
  key: CatalogOptionFilterKey;
  title: string;
  field: string;
  paramValues: keyof Pick<
    CatalogSearchParams,
    | "categories"
    | "brands"
    | "materialCodes"
    | "materials"
    | "finishings"
    | "glues"
    | "printMethods"
    | "printerTypes"
    | "detections"
    | "marks"
  >;
}> = [
  { key: "category", title: "Product Type", field: "category_slugs.keyword", paramValues: "categories" },
  { key: "brand", title: "Brand", field: "brand.keyword", paramValues: "brands" },
  { key: "material_code", title: "Material Code", field: "material_code.keyword", paramValues: "materialCodes" },
  { key: "material", title: "Material Type", field: "material_title.keyword", paramValues: "materials" },
  { key: "finishing", title: "Finishing", field: "finishing.keyword", paramValues: "finishings" },
  { key: "glue", title: "Glue", field: "glue.keyword", paramValues: "glues" },
  { key: "print_method", title: "Print Method", field: "druktype.keyword", paramValues: "printMethods" },
  { key: "printer_type", title: "Printer Type", field: "printer_type.keyword", paramValues: "printerTypes" },
  { key: "detectie", title: "Detection", field: "detectie.keyword", paramValues: "detections" },
  { key: "merken", title: "Marks", field: "merken.keyword", paramValues: "marks" },
];

const RANGE_FILTERS: Array<{
  key: CatalogRangeKey;
  title: string;
  field: string;
  minParam: keyof CatalogSearchParams;
  maxParam: keyof CatalogSearchParams;
  unitPrefix?: string;
  unitSuffix?: string;
}> = [
  { key: "price", title: "Price Range", field: "price", minParam: "priceMin", maxParam: "priceMax", unitPrefix: "€" },
  { key: "width", title: "Label Width", field: "meta_width_numeric", minParam: "widthMin", maxParam: "widthMax", unitSuffix: "mm" },
  { key: "height", title: "Label Height", field: "meta_height_numeric", minParam: "heightMin", maxParam: "heightMax", unitSuffix: "mm" },
  { key: "core", title: "Core Size", field: "kern_numeric", minParam: "coreMin", maxParam: "coreMax", unitSuffix: "mm" },
  {
    key: "outer_diameter",
    title: "Outer Diameter",
    field: "buitendia_numeric",
    minParam: "outerDiameterMin",
    maxParam: "outerDiameterMax",
    unitSuffix: "mm",
  },
];

const RESULT_SOURCE_FIELDS = [
  "id",
  "ID",
  "product_type",
  "type",
  "title",
  "name",
  "post_title",
  "slug",
  "post_name",
  "article_number",
  "sku",
  "subtitle",
  "excerpt",
  "price",
  "original_price",
  "stock",
  "in_stock",
  "main_image",
  "image",
  "thumbnail",
  "images",
  "categories",
  "category_slugs",
  "terms",
  "meta",
  "material",
  "material_title",
  "warranty_available",
  "warranty_option_ids",
  "warranty_option_names",
  "warranty_option_months",
  "warranty_option_prices",
] as const;

type ProductSource = Record<string, unknown>;

function firstParam(params: URLSearchParams, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = params.get(key);
    if (value?.trim()) return value.trim();
  }

  return null;
}

function valuesParam(params: URLSearchParams, keys: readonly string[]): string[] {
  const values: string[] = [];

  keys.forEach((key) => {
    params.getAll(key).forEach((rawValue) => {
      rawValue
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => values.push(part));
    });
  });

  return Array.from(new Set(values));
}

function numberParam(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (!raw?.trim()) return undefined;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function integerValues(values: string[]): number[] {
  return values
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
}

function booleanParam(params: URLSearchParams, key: string): boolean | undefined {
  const raw = params.get(key);
  if (!raw?.trim()) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "in_stock"].includes(normalized)) return true;
  if (["0", "false", "no", "out_of_stock"].includes(normalized)) return false;
  return undefined;
}

function productTypeParam(value: string | null): CatalogProductType | undefined {
  return value === "simple" || value === "variable" ? value : undefined;
}

function sortParam(value: string | null): CatalogSortValue {
  return CATALOG_SORT_VALUES.includes(value as CatalogSortValue) ? (value as CatalogSortValue) : "latest";
}

export function parseCatalogSearchParams(params: URLSearchParams): CatalogSearchParams {
  const page = Math.max(1, Number.parseInt(params.get("page") ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number.parseInt(params.get("per_page") ?? String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE),
  );

  const categoryValues = valuesParam(params, MULTI_VALUE_KEYS.categories);
  const categoryIdValues = valuesParam(params, MULTI_VALUE_KEYS.categoryIds);
  const materialIdValues = valuesParam(params, MULTI_VALUE_KEYS.materialIds);
  const materialCategoryIdValues = valuesParam(params, MULTI_VALUE_KEYS.materialCategoryIds);

  const search = firstParam(params, ["search", "q"]) ?? "";
  const explicitSort = params.get("sort");

  return {
    search,
    type: productTypeParam(firstParam(params, ["type", "product_type"])),
    page,
    perPage,
    sort: explicitSort ? sortParam(explicitSort) : search ? "relevance" : "latest",
    priceMin: numberParam(params, "price_min"),
    priceMax: numberParam(params, "price_max"),
    widthMin: numberParam(params, "width_min"),
    widthMax: numberParam(params, "width_max"),
    heightMin: numberParam(params, "height_min"),
    heightMax: numberParam(params, "height_max"),
    coreMin: numberParam(params, "core_min"),
    coreMax: numberParam(params, "core_max"),
    outerDiameterMin: numberParam(params, "outer_diameter_min"),
    outerDiameterMax: numberParam(params, "outer_diameter_max"),
    inStock: booleanParam(params, "in_stock"),
    ids: integerValues(valuesParam(params, EXACT_VALUE_KEYS.ids)),
    slugs: valuesParam(params, EXACT_VALUE_KEYS.slugs),
    skus: valuesParam(params, EXACT_VALUE_KEYS.skus),
    articleNumbers: valuesParam(params, EXACT_VALUE_KEYS.articleNumbers),
    categories: categoryValues,
    categoryIds: integerValues(categoryIdValues),
    brands: valuesParam(params, MULTI_VALUE_KEYS.brands),
    materialIds: integerValues(materialIdValues),
    materialCategories: valuesParam(params, MULTI_VALUE_KEYS.materialCategories),
    materialCategoryIds: integerValues(materialCategoryIdValues),
    materialCodes: valuesParam(params, MULTI_VALUE_KEYS.materialCodes),
    materials: valuesParam(params, MULTI_VALUE_KEYS.materials),
    finishings: valuesParam(params, MULTI_VALUE_KEYS.finishings),
    glues: valuesParam(params, MULTI_VALUE_KEYS.glues),
    printMethods: valuesParam(params, MULTI_VALUE_KEYS.printMethods),
    printerTypes: valuesParam(params, MULTI_VALUE_KEYS.printerTypes),
    detections: valuesParam(params, MULTI_VALUE_KEYS.detections),
    marks: valuesParam(params, MULTI_VALUE_KEYS.marks),
  };
}

function textQuery(search: string): estypes.QueryDslQueryContainer {
  const query = search.trim();
  if (!query) return { match_all: {} };

  const primary = ["article_number^10", "sku^10", "variant_skus^8", "title^8", "name^7", "slug^2"];
  const fallback = [
    "material_title^1.2",
    "material_slug",
    "brand",
    "merken",
    "druktype",
    "finishing",
    "excerpt^1.5",
    "description^0.4",
    "content^0.3",
    "product_information^0.3",
  ];

  return {
    bool: {
      minimum_should_match: 1,
      should: [
        {
          term: {
            "sku.keyword": {
              value: query,
              boost: 100,
              case_insensitive: true,
            },
          },
        },
        {
          term: {
            "article_number.keyword": {
              value: query,
              boost: 100,
              case_insensitive: true,
            },
          },
        },
        {
          term: {
            "variant_skus.keyword": {
              value: query,
              boost: 80,
              case_insensitive: true,
            },
          },
        },
        { multi_match: { query, fields: primary, type: "best_fields", operator: "and", boost: 6 } },
        { multi_match: { query, fields: primary, type: "phrase_prefix", boost: 5 } },
        { multi_match: { query, fields: primary, fuzziness: "AUTO", prefix_length: 1, boost: 3 } },
        { multi_match: { query, fields: fallback, operator: "or", boost: 0.8 } },
      ],
    },
  };
}

function termsFilter(field: string, values: Array<string | number>): estypes.QueryDslQueryContainer | null {
  return values.length ? { terms: { [field]: values } } : null;
}

function exactKeywordFilter(field: string, values: string[]): estypes.QueryDslQueryContainer | null {
  if (values.length === 0) return null;

  return {
    bool: {
      minimum_should_match: 1,
      should: values.map((value) => ({
        term: {
          [field]: {
            value,
            case_insensitive: true,
          },
        },
      })),
    },
  };
}

function rangeFilter(
  field: string,
  min: unknown,
  max: unknown,
): estypes.QueryDslQueryContainer | null {
  const range: Record<string, number> = {};
  if (typeof min === "number" && Number.isFinite(min)) range.gte = min;
  if (typeof max === "number" && Number.isFinite(max)) range.lte = max;
  return Object.keys(range).length ? { range: { [field]: range } } : null;
}

function buildFilters(params: CatalogSearchParams): estypes.QueryDslQueryContainer[] {
  const filters: Array<estypes.QueryDslQueryContainer | null> = [
    { term: { state: "active" } },
    params.type ? { term: { product_type: params.type } } : null,
    termsFilter("id", params.ids),
    exactKeywordFilter("slug.keyword", params.slugs),
    exactKeywordFilter("sku.keyword", params.skus),
    exactKeywordFilter("article_number.keyword", params.articleNumbers),
    termsFilter("category_slugs.keyword", params.categories),
    termsFilter("category_ids", params.categoryIds),
    termsFilter("brand.keyword", params.brands),
    termsFilter("material_id", params.materialIds),
    termsFilter("material_taxon_slugs", params.materialCategories),
    termsFilter("material_taxon_ids", params.materialCategoryIds),
    termsFilter("material_code.keyword", params.materialCodes),
    termsFilter("material_title.keyword", params.materials),
    termsFilter("finishing.keyword", params.finishings),
    termsFilter("glue.keyword", params.glues),
    termsFilter("druktype.keyword", params.printMethods),
    termsFilter("printer_type.keyword", params.printerTypes),
    termsFilter("detectie.keyword", params.detections),
    termsFilter("merken.keyword", params.marks),
    params.inStock === true ? { range: { stock: { gt: 0 } } } : null,
    params.inStock === false ? { range: { stock: { lte: 0 } } } : null,
    rangeFilter("price", params.priceMin, params.priceMax),
    rangeFilter("meta_width_numeric", params.widthMin, params.widthMax),
    rangeFilter("meta_height_numeric", params.heightMin, params.heightMax),
    rangeFilter("kern_numeric", params.coreMin, params.coreMax),
    rangeFilter("buitendia_numeric", params.outerDiameterMin, params.outerDiameterMax),
  ];

  return filters.filter((filter): filter is estypes.QueryDslQueryContainer => filter !== null);
}

function sortClauses(sort: CatalogSortValue): estypes.Sort | undefined {
  const sortOptions: Record<CatalogSortValue, estypes.Sort> = {
    relevance: [{ _score: { order: "desc" } }, { created_at_timestamp: { order: "desc", unmapped_type: "long" } }],
    latest: [{ created_at_timestamp: { order: "desc", unmapped_type: "long" } }],
    oldest: [{ created_at_timestamp: { order: "asc", unmapped_type: "long" } }],
    title_asc: [{ "title_sort.keyword": { order: "asc", unmapped_type: "keyword" } }],
    title_desc: [{ "title_sort.keyword": { order: "desc", unmapped_type: "keyword" } }],
    price_asc: [{ price: { order: "asc", unmapped_type: "double" } }],
    price_desc: [{ price: { order: "desc", unmapped_type: "double" } }],
  };

  return sortOptions[sort];
}

function aggregations(): Record<string, estypes.AggregationsAggregationContainer> {
  const optionAggs = Object.fromEntries(
    OPTION_FILTERS.map((filter) => [
      `options_${filter.key}`,
      {
        terms: {
          field: filter.field,
          size: 100,
          order: { _key: "asc" },
        },
      } satisfies estypes.AggregationsAggregationContainer,
    ]),
  );

  const rangeAggs = Object.fromEntries(
    RANGE_FILTERS.map((filter) => [
      `max_${filter.key}`,
      {
        max: {
          field: filter.field,
        },
      } satisfies estypes.AggregationsAggregationContainer,
    ]),
  );

  return { ...optionAggs, ...rangeAggs };
}

function labelFromCode(value: string): string {
  return value
    .trim()
    .replace(/^\[\s*/, "")
    .replace(/\s*\]$/, "")
    .replace(/^["']|["']$/g, "")
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase();
      return upper.length <= 3 ? upper : `${upper.charAt(0)}${upper.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function aggregationBuckets(
  aggregationsResult: Record<string, unknown> | undefined,
  key: string,
): Array<{ key?: string | number; doc_count?: number }> {
  const agg = aggregationsResult?.[`options_${key}`];
  if (!agg || typeof agg !== "object") return [];
  const buckets = (agg as { buckets?: unknown }).buckets;
  return Array.isArray(buckets) ? (buckets as Array<{ key?: string | number; doc_count?: number }>) : [];
}

function maxAggregation(
  aggregationsResult: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const agg = aggregationsResult?.[`max_${key}`];
  const value = agg && typeof agg === "object" ? (agg as { value?: unknown }).value : null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildCatalogFilters(aggregationsResult: Record<string, unknown> | undefined): CatalogFilters {
  return {
    ranges: RANGE_FILTERS.map((filter) => ({
      key: filter.key,
      title: filter.title,
      min: 0,
      max: Math.ceil(maxAggregation(aggregationsResult, filter.key) ?? 0),
      unitPrefix: filter.unitPrefix,
      unitSuffix: filter.unitSuffix,
    })).filter((filter) => filter.max > 0),
    options: OPTION_FILTERS.map((filter) => ({
      key: filter.key,
      title: filter.title,
      options: aggregationBuckets(aggregationsResult, filter.key)
        .map((bucket) => {
          const value = typeof bucket.key === "string" ? bucket.key : String(bucket.key ?? "");
          return {
            value,
            label: labelFromCode(value),
            count: typeof bucket.doc_count === "number" ? bucket.doc_count : 0,
          };
        })
        .filter((option) => option.value.trim() !== ""),
    })).filter((filter) => filter.options.length > 0),
  };
}

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

function numberValue(value: unknown): number | null {
  const scalar = firstScalar(value);
  if (typeof scalar === "number") return scalar;
  if (typeof scalar === "string" && scalar.trim()) {
    const parsed = Number(scalar);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function booleanValue(value: unknown): boolean {
  const scalar = firstScalar(value);
  if (typeof scalar === "boolean") return scalar;
  if (typeof scalar === "number") return scalar > 0;
  if (typeof scalar === "string") return ["1", "true", "yes", "in_stock"].includes(scalar.toLowerCase());
  return false;
}

function productType(value: unknown): ProductRouteType | null {
  const type = stringValue(value);
  return type === "simple" || type === "variable" ? type : null;
}

function imageUrl(url: string | null): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}

function warrantyFromSource(source: ProductSource): ProductWarrantyData | null | undefined {
  if (!("warranty_available" in source)) return undefined;
  if (!booleanValue(source.warranty_available)) return null;

  const ids = Array.isArray(source.warranty_option_ids) ? source.warranty_option_ids : [];
  const names = Array.isArray(source.warranty_option_names) ? source.warranty_option_names : [];
  const months = Array.isArray(source.warranty_option_months) ? source.warranty_option_months : [];
  const prices = Array.isArray(source.warranty_option_prices) ? source.warranty_option_prices : [];

  const options = ids
    .map((id, index) => {
      const optionId = Number(id);
      if (!Number.isFinite(optionId)) return null;

      return {
        id: optionId,
        name: names[index] != null ? String(names[index]) : null,
        duration_months: months[index] != null ? Number(months[index]) : null,
        price: prices[index] != null ? Number(prices[index]) : null,
        description: null,
        sort_order: index,
      };
    })
    .filter((option): option is NonNullable<typeof option> => Boolean(option));

  return {
    is_available: true,
    has_options: options.length > 0,
    options,
    default_option: options[0] ?? null,
  };
}

function categoriesFromSource(source: ProductSource): Array<{ id?: number; name?: string | null; slug?: string | null }> {
  const categories = source.categories;
  if (Array.isArray(categories)) {
    const normalized: Array<{ id?: number; name?: string | null; slug?: string | null }> = [];

    categories.forEach((category) => {
      if (typeof category === "string") {
        normalized.push({ name: category, slug: category });
        return;
      }

      if (category && typeof category === "object") {
        const record = category as Record<string, unknown>;
        normalized.push({
          id: numberValue(record.id) ?? numberValue(record.term_id) ?? undefined,
          name: stringValue(record.name),
          slug: stringValue(record.slug) ?? stringValue(record.post_name) ?? undefined,
        });
      }
    });

    return normalized;
  }

  if (Array.isArray(source.category_slugs)) {
    return source.category_slugs
      .map((category) => stringValue(category))
      .filter((category): category is string => Boolean(category?.trim()))
      .map((category) => ({ name: labelFromCode(category), slug: category }));
  }

  return [];
}

function mapProductHit(hit: estypes.SearchHit<ProductSource>, index: number): CatalogProductResult {
  const source = hit._source ?? {};
  const id = stringValue(source.id) ?? stringValue(source.ID) ?? hit._id ?? `result-${index}`;
  const type = productType(source.product_type) ?? productType(source.type);
  const slug = stringValue(source.slug) ?? stringValue(source.post_name);
  const title = stringValue(source.title) ?? stringValue(source.name) ?? stringValue(source.post_title) ?? "Unnamed product";
  const warranty = warrantyFromSource(source);

  const product: ProductCardData = {
    id,
    sku: stringValue(source.sku) ?? "-",
    name: title,
    subtitle: stringValue(source.subtitle),
    excerpt: stringValue(source.excerpt),
    materialTitle: stringValue(source.material_title),
    price: numberValue(source.price),
    originalPrice: numberValue(source.original_price),
    inStock: booleanValue(source.in_stock) || Boolean((numberValue(source.stock) ?? 0) > 0),
    mainImage: imageUrl(stringValue(source.main_image) ?? stringValue(source.image)),
    categories: categoriesFromSource(source),
    slug,
    type,
    ...(warranty !== undefined ? { warranty } : {}),
  };

  const categorySlugs = Array.isArray(source.category_slugs)
    ? source.category_slugs.map((s) => stringValue(s)?.toLowerCase()).filter(Boolean)
    : [];
  
  const isPrinter = categorySlugs.includes("labelprinters") || 
                    product.categories?.some(c => c.name?.toLowerCase().includes("printer") || c.slug?.toLowerCase() === "labelprinters");

  const prefix = isPrinter ? "printers" : "products";

  const href: LinkProps["href"] | undefined =
    slug && type
      ? { pathname: `/${prefix}/${slug}`, query: { type } }
      : slug
        ? `/${prefix}/${slug}`
        : undefined;

  return { id, product, href };
}

function totalHitsValue(total: estypes.SearchTotalHits | number | undefined): number {
  if (typeof total === "number") return total;
  return total?.value ?? 0;
}

export async function searchCatalogProducts(params: CatalogSearchParams): Promise<CatalogSearchResponse> {
  const client = elasticClient();
  const filters = buildFilters(params);
  const from = (params.page - 1) * params.perPage;

  const response = await client.search<ProductSource>({
    index: catalogIndexForType(params.type),
    from,
    size: params.perPage,
    track_total_hits: true,
    _source: RESULT_SOURCE_FIELDS as unknown as string[],
    query: {
      bool: {
        must: [textQuery(params.search)],
        filter: filters,
      },
    },
    ...(sortClauses(params.sort) ? { sort: sortClauses(params.sort) } : {}),
    aggs: aggregations(),
  });

  const total = totalHitsValue(response.hits.total);
  const lastPage = Math.max(1, Math.ceil(total / params.perPage));

  return {
    products: response.hits.hits.map(mapProductHit),
    total,
    currentPage: Math.min(params.page, lastPage),
    lastPage,
    perPage: params.perPage,
    filters: buildCatalogFilters(response.aggregations as Record<string, unknown> | undefined),
  };
}
