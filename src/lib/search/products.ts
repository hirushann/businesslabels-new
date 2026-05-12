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
  materialCodes: ["material_code", "materiaal_code"],
  materials: ["material", "materiaal"],
  finishings: ["finishing", "afwerking"],
  glues: ["glue", "lijm", "adhesive"],
  printMethods: ["print_method", "printmethode", "druktype"],
  printerTypes: ["printer_type"],
  detections: ["detectie"],
  marks: ["merken"],
  kernStrings: ["kern_string", "kern_type"],
  outerDiameterStrings: ["outer_diameter_string", "buiten_diameter_type"],
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
    | "materialCodes"
    | "materials"
    | "finishings"
    | "glues"
    | "printMethods"
    | "kernStrings"
    | "outerDiameterStrings"
  >;
}> = [
  { key: "print_method", title: "Print Method", field: "catalog_print_method", paramValues: "printMethods" },
  { key: "material_code", title: "Material Code", field: "catalog_material_code", paramValues: "materialCodes" },
  { key: "material", title: "Material Type", field: "catalog_material", paramValues: "materials" },
  { key: "finishing", title: "Finishing", field: "catalog_finishing", paramValues: "finishings" },
  { key: "glue", title: "Glue", field: "catalog_glue", paramValues: "glues" },
  { key: "kern_string", title: "Core Type", field: "catalog_core_string", paramValues: "kernStrings" },
  { key: "outer_diameter_string", title: "Outer Diameter Type", field: "catalog_outer_diameter_string", paramValues: "outerDiameterStrings" },
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
  { key: "width", title: "Label Width", field: "catalog_width_mm", minParam: "widthMin", maxParam: "widthMax", unitSuffix: "mm" },
  { key: "height", title: "Label Height", field: "catalog_height_mm", minParam: "heightMin", maxParam: "heightMax", unitSuffix: "mm" },
  { key: "core", title: "Core Size", field: "catalog_core_mm", minParam: "coreMin", maxParam: "coreMax", unitSuffix: "mm" },
  {
    key: "outer_diameter",
    title: "Outer Diameter",
    field: "catalog_outer_diameter_mm",
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
  "properties",
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
    kernStrings: valuesParam(params, MULTI_VALUE_KEYS.kernStrings),
    outerDiameterStrings: valuesParam(params, MULTI_VALUE_KEYS.outerDiameterStrings),
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

  // Check if query looks like a SKU/article number (alphanumeric with optional hyphens/underscores)
  const looksLikeSKU = /^[A-Z0-9][-_A-Z0-9]*$/i.test(query);
  
  // Count terms in query
  const terms = query.split(/\s+/);
  const termCount = terms.length;
  const isMultiTerm = termCount > 1;

  // Primary fields: SKU for exact lookups, name for product titles
  const primary = [
    "sku^100",              // Highest priority - exact product codes
    "article_number^100",   // Alternative product codes
    "variant_skus^80",      // Variant product codes
    "name^80",              // Main product name (removed title - duplicate)
  ];
  
  // Secondary fields: material, brand, and product attributes
  const secondary = [
    "brand^15",             // Brand searches (Epson, etc.)
    "material_title^12",    // Material searches (polyester, paper)
    "druktype^8",           // Print method (TD/TT)
    "finishing^5",          // Surface finish (glossy, matte)
    "merken^5",             // Dutch brand field
    "excerpt^3",            // Short descriptions
    "slug^2",               // URL slugs (low priority)
  ];
  
  // Fallback: only keep description, remove redundant fields
  const fallback = [
    "description^0.5",      // Full description only
  ];

  // If it looks like a SKU, prioritize exact matches heavily
  if (looksLikeSKU) {
    return {
      bool: {
        should: [
          // Exact SKU match - if this matches, it will dominate
          {
            term: {
              "sku.keyword": {
                value: query,
                boost: 10000,
                case_insensitive: true,
              },
            },
          },
          // Exact article number match
          {
            term: {
              "article_number.keyword": {
                value: query,
                boost: 10000,
                case_insensitive: true,
              },
            },
          },
          // Exact variant SKU match
          {
            term: {
              "variant_skus.keyword": {
                value: query,
                boost: 9000,
                case_insensitive: true,
              },
            },
          },
          // Partial SKU/article matches (much lower priority)
          { multi_match: { query, fields: ["sku^10", "article_number^10", "variant_skus^8"], type: "phrase_prefix", boost: 1 } },
          // Name matches (minimal priority for SKU searches)
          { multi_match: { query, fields: ["name^2"], type: "phrase_prefix", boost: 0.1 } },
        ],
        minimum_should_match: 1,
      },
    };
  }

  // Multi-term search (e.g., "d6000 geel" or "ColorWorks 8000")
  if (isMultiTerm) {
    // For 2 terms: require both (100%)
    // For 3+ terms: require at least 75%
    const minMatch = termCount === 2 ? "100%" : "75%";
    
    // Build wildcard queries for each individual term (e.g., "8000" → "*8000*")
    // This allows "ColorWorks 8000" to match "ColorWorks C8000e BK"
    const termWildcards: estypes.QueryDslQueryContainer[] = [];
    for (const term of terms) {
      const wildcardValue = `*${term.toLowerCase()}*`;
      termWildcards.push(
        { bool: {
          should: [
            { wildcard: { name: { value: wildcardValue, boost: 1, case_insensitive: true } } },
            { wildcard: { brand: { value: wildcardValue, boost: 1, case_insensitive: true } } },
            { wildcard: { sku: { value: wildcardValue, boost: 1, case_insensitive: true } } },
            { wildcard: { article_number: { value: wildcardValue, boost: 1, case_insensitive: true } } },
          ],
          minimum_should_match: 1,
        }}
      );
    }
    
    // Build "both terms in name" clause (highest relevance for focused matches)
    // e.g., "D6000 geel" → both must be in the name field
    const nameWildcards: estypes.QueryDslQueryContainer[] = terms.map(term => ({
      wildcard: { name: { value: `*${term.toLowerCase()}*`, boost: 1, case_insensitive: true } }
    }));
    
    return {
      bool: {
        should: [
          // HIGHEST: Both terms in the name field (e.g., "CW-D6000 series Inktcartridges Geel")
          { bool: { must: nameWildcards, boost: 200 } },
          // Exact phrase in primary fields
          { multi_match: { query, fields: primary, type: "phrase", boost: 100 } },
          // All individual terms match via wildcards in any primary field
          { bool: { must: termWildcards, boost: 50 } },
          // All terms must match in primary fields
          { multi_match: { query, fields: primary, type: "best_fields", operator: "and", boost: 40 } },
          // Cross-field matching (terms can be in different fields)
          { multi_match: { query, fields: primary, type: "cross_fields", operator: "and", boost: 30 } },
          // Phrase prefix for partial matches
          { multi_match: { query, fields: primary, type: "phrase_prefix", boost: 20 } },
          // Most terms match in primary fields
          { multi_match: { query, fields: primary, type: "best_fields", minimum_should_match: minMatch, boost: 10 } },
          // Secondary fields (brand, material, attributes) - flexible OR matching
          { multi_match: { query, fields: secondary, operator: "or", boost: 8 } },
          // Individual wildcard matches in secondary fields
          ...terms.map(term => ({
            wildcard: { material_title: { value: `*${term.toLowerCase()}*`, boost: 3, case_insensitive: true } }
          })),
          // Fallback to description with flexible matching
          { multi_match: { query, fields: fallback, operator: "or", boost: 1 } },
        ],
        minimum_should_match: 1,
      },
    };
  }

  // Single-term text search (for product names, descriptions, etc.)
  return {
    bool: {
      minimum_should_match: 1,
      should: [
        // Exact SKU match still gets high priority
        {
          term: {
            "sku.keyword": {
              value: query,
              boost: 1000,
              case_insensitive: true,
            },
          },
        },
        // Exact article number match
        {
          term: {
            "article_number.keyword": {
              value: query,
              boost: 1000,
              case_insensitive: true,
            },
          },
        },
        // Exact variant SKU match
        {
          term: {
            "variant_skus.keyword": {
              value: query,
              boost: 900,
              case_insensitive: true,
            },
          },
        },
        // Wildcard matching - HIGH PRIORITY for partial matches (e.g., "colorwork" → "ColorWorks")
        { wildcard: { name: { value: `*${query.toLowerCase()}*`, boost: 50, case_insensitive: true } } },
        { wildcard: { brand: { value: `*${query.toLowerCase()}*`, boost: 40, case_insensitive: true } } },
        { wildcard: { sku: { value: `*${query.toLowerCase()}*`, boost: 30, case_insensitive: true } } },
        { wildcard: { article_number: { value: `*${query.toLowerCase()}*`, boost: 30, case_insensitive: true } } },
        // Exact term match in primary fields (e.g., "polyester" exact match)
        { multi_match: { query, fields: primary, type: "best_fields", operator: "or", boost: 20 } },
        // Phrase prefix for partial matches at word boundaries
        { multi_match: { query, fields: primary, type: "phrase_prefix", boost: 15 } },
        // Secondary fields with OR operator (flexible matching)
        { multi_match: { query, fields: secondary, operator: "or", boost: 10 } },
        // Fuzzy matching with no prefix requirement (handles typos)
        { multi_match: { query, fields: [...primary, ...secondary], fuzziness: "AUTO", prefix_length: 0, boost: 5 } },
        // Fallback to description with low priority
        { multi_match: { query, fields: fallback, operator: "or", boost: 1 } },
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

function categorySlugFilter(values: string[]): estypes.QueryDslQueryContainer | null {
  if (values.length === 0) return null;

  return {
    bool: {
      minimum_should_match: 1,
      should: [
        { terms: { "category_slugs.keyword": values } },
        {
          nested: {
            path: "categories",
            ignore_unmapped: true,
            query: {
              bool: {
                minimum_should_match: 1,
                should: [
                  { terms: { "categories.slug.keyword": values } },
                  { terms: { "categories.breadcrumb_slugs": values } },
                ],
              },
            },
          },
        },
      ],
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

function rangeOrStringFilter(
  rangeField: string,
  rangeMin: unknown,
  rangeMax: unknown,
  stringField: string,
  stringValues: string[],
): estypes.QueryDslQueryContainer | null {
  const rangeClause = rangeFilter(rangeField, rangeMin, rangeMax);
  const hasStringValues = stringValues.length > 0;

  if (!rangeClause && !hasStringValues) {
    return null;
  }

  if (rangeClause && !hasStringValues) {
    return rangeClause;
  }

  if (!rangeClause && hasStringValues) {
    return {
      bool: {
        minimum_should_match: 1,
        should: stringValues.map((value) => ({
          term: {
            [stringField]: {
              value,
              case_insensitive: true,
            },
          },
        })),
      },
    };
  }

  // Both range and string values present - use OR logic
  return {
    bool: {
      should: [
        rangeClause as estypes.QueryDslQueryContainer,
        {
          bool: {
            minimum_should_match: 1,
            should: stringValues.map((value) => ({
              term: {
                [stringField]: {
                  value,
                  case_insensitive: true,
                },
              },
            })),
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

function painlessList(values: readonly string[]): string {
  return `[${values.map((value) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`).join(", ")}]`;
}

function sourceValueRuntimeScript(keys: readonly string[], emitExpression: string): string {
  return `
def keys = ${painlessList(keys)};
def value = null;

for (def key : keys) {
  if (params._source.containsKey(key)) {
    value = params._source[key];
    break;
  }
}

if (value == null) {
  if (params._source.containsKey('properties')) {
    def properties = params._source['properties'];
    if (properties instanceof Map) {
      for (def key : keys) {
        if (properties.containsKey(key)) {
          value = properties[key];
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

function keywordRuntimeScript(keys: readonly string[]): string {
  return sourceValueRuntimeScript(keys, `
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

function numberRuntimeScript(keys: readonly string[]): string {
  return sourceValueRuntimeScript(keys, `
if (value instanceof List) {
  for (def item : value) {
    if (item == null) {
      continue;
    }
    def matcher = /[-+]?[0-9]*\\.?[0-9]+/.matcher(item.toString());
    if (matcher.find()) {
      emit(Double.parseDouble(matcher.group()));
    }
  }
} else {
  def matcher = /[-+]?[0-9]*\\.?[0-9]+/.matcher(value.toString());
  if (matcher.find()) {
    emit(Double.parseDouble(matcher.group()));
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
if (value == null && params._source.containsKey('properties')) {
  def properties = params._source['properties'];
  if (properties instanceof Map && properties.containsKey('materiaal')) {
    value = properties['materiaal'];
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

function catalogRuntimeMappings(): Record<string, unknown> {
  return {
    catalog_print_method: {
      type: "keyword",
      script: { source: keywordRuntimeScript(["printmethode", "print_method", "druktype"]) },
    },
    catalog_material_code: {
      type: "keyword",
      script: { source: keywordRuntimeScript(["materiaal-code", "materiaal_code", "material_code"]) },
    },
    catalog_material: {
      type: "keyword",
      script: { source: materialRuntimeScript() },
    },
    catalog_finishing: {
      type: "keyword",
      script: { source: keywordRuntimeScript(["afwerking", "finishing"]) },
    },
    catalog_glue: {
      type: "keyword",
      script: { source: keywordRuntimeScript(["lijm", "glue", "adhesive"]) },
    },
    catalog_core_string: {
      type: "keyword",
      script: { source: keywordRuntimeScript(["kern", "kern_numeric", "meta_kern"]) },
    },
    catalog_outer_diameter_string: {
      type: "keyword",
      script: { source: keywordRuntimeScript(["buiten-diameter", "buiten_diameter", "outer_diameter"]) },
    },
    catalog_width_mm: {
      type: "double",
      script: { source: numberRuntimeScript(["breedte", "meta_width", "width"]) },
    },
    catalog_height_mm: {
      type: "double",
      script: { source: numberRuntimeScript(["hoogte", "meta_height", "height"]) },
    },
    catalog_core_mm: {
      type: "double",
      script: { source: numberRuntimeScript(["kern", "kern_numeric", "meta_kern"]) },
    },
    catalog_outer_diameter_mm: {
      type: "double",
      script: { source: numberRuntimeScript(["buiten-diameter", "buiten_diameter", "outer_diameter"]) },
    },
  };
}

function buildFilters(params: CatalogSearchParams): estypes.QueryDslQueryContainer[] {
  const filters: Array<estypes.QueryDslQueryContainer | null> = [
    { term: { state: "active" } },
    params.type ? { term: { product_type: params.type } } : null,
    termsFilter("id", params.ids),
    exactKeywordFilter("slug.keyword", params.slugs),
    exactKeywordFilter("sku.keyword", params.skus),
    exactKeywordFilter("article_number.keyword", params.articleNumbers),
    categorySlugFilter(params.categories),
    termsFilter("category_ids", params.categoryIds),
    termsFilter("brand.keyword", params.brands),
    termsFilter("material_id", params.materialIds),
    termsFilter("material_taxon_slugs", params.materialCategories),
    termsFilter("material_taxon_ids", params.materialCategoryIds),
    termsFilter("catalog_material_code", params.materialCodes),
    termsFilter("catalog_material", params.materials),
    termsFilter("catalog_finishing", params.finishings),
    termsFilter("catalog_glue", params.glues),
    termsFilter("catalog_print_method", params.printMethods),
    termsFilter("printer_type.keyword", params.printerTypes),
    termsFilter("detectie.keyword", params.detections),
    termsFilter("merken.keyword", params.marks),
    params.inStock === true ? { range: { stock: { gt: 0 } } } : null,
    params.inStock === false ? { range: { stock: { lte: 0 } } } : null,
    rangeFilter("price", params.priceMin, params.priceMax),
    rangeFilter("catalog_width_mm", params.widthMin, params.widthMax),
    rangeFilter("catalog_height_mm", params.heightMin, params.heightMax),
    rangeOrStringFilter("catalog_core_mm", params.coreMin, params.coreMax, "catalog_core_string", params.kernStrings),
    rangeOrStringFilter("catalog_outer_diameter_mm", params.outerDiameterMin, params.outerDiameterMax, "catalog_outer_diameter_string", params.outerDiameterStrings),
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
    options: OPTION_FILTERS.map((filter) => {
      const aggregatedOptions = aggregationBuckets(aggregationsResult, filter.key)
        .map((bucket) => {
          const value = typeof bucket.key === "string" ? bucket.key : String(bucket.key ?? "");
          return {
            value,
            label: labelFromCode(value),
            count: typeof bucket.doc_count === "number" ? bucket.doc_count : 0,
          };
        })
        .filter((option) => option.value.trim() !== "");

      // Add static "Fan-fold" option for kern and outer diameter string filters
      if (filter.key === "kern_string" || filter.key === "outer_diameter_string") {
        const fanFoldExists = aggregatedOptions.some((opt) => opt.value.toLowerCase() === "fan-fold");
        if (!fanFoldExists) {
          aggregatedOptions.unshift({
            value: "Fan-fold",
            label: "Fan-fold",
            count: 0,
          });
        }
      }

      return {
        key: filter.key,
        title: filter.title,
        options: aggregatedOptions,
      };
    }).filter((filter) => filter.options.length > 0),
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

function propertyStringValue(source: ProductSource, keys: readonly string[]): string | null {
  const properties = source.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return null;

  for (const key of keys) {
    const value = (properties as Record<string, unknown>)[key];
    const text = stringValue(value);
    if (text?.trim()) return text;
  }

  return null;
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
    materialTitle: stringValue(source.material_title) ?? propertyStringValue(source, ["materiaal"]),
    price: numberValue(source.price),
    originalPrice: numberValue(source.original_price),
    inStock: booleanValue(source.in_stock) || Boolean((numberValue(source.stock) ?? 0) > 0),
    mainImage: imageUrl(stringValue(source.main_image) ?? stringValue(source.image)),
    categories: categoriesFromSource(source),
    slug,
    type,
    ...(warranty !== undefined ? { warranty } : {}),
  };

  const href: LinkProps["href"] | undefined =
    slug && type
      ? { pathname: `/products/${slug}`, query: { type } }
      : slug
        ? `/products/${slug}`
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
    runtime_mappings: catalogRuntimeMappings() as estypes.MappingRuntimeFields,
    _source: RESULT_SOURCE_FIELDS as unknown as string[],
    query: {
      bool: {
        must: [textQuery(params.search)],
        filter: filters,
      },
    },
    // Apply min_score for multi-term searches to filter weak matches
    // 2 terms: stricter threshold (5.0) to prevent broad matches (e.g., "D6000 geel")
    // 3+ terms: more lenient (1.5) to allow partial matches
    ...(params.search && params.search.trim().split(/\s+/).length >= 2 
      ? { min_score: params.search.trim().split(/\s+/).length === 2 ? 5.0 : 1.5 } 
      : {}),
    ...(sortClauses(params.sort) ? { sort: sortClauses(params.sort) } : {}),
    aggs: aggregations(),
  });

  const total = totalHitsValue(response.hits.total);
  const lastPage = Math.max(1, Math.ceil(total / params.perPage));

  // Extract "Did you mean" suggestion
  let suggestion: string | undefined;
  if (params.search && total === 0) {
    // Try fuzzy search to find similar terms when exact search returns nothing
    try {
      const fuzzyResponse = await client.search<ProductSource>({
        index: catalogIndexForType(params.type),
        size: 1,
        runtime_mappings: catalogRuntimeMappings() as estypes.MappingRuntimeFields,
        _source: ["name", "brand", "sku"] as unknown as string[],
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: params.search,
                  fields: ["name^3", "brand^2", "sku"],
                  fuzziness: "AUTO",
                  prefix_length: 0,
                },
              },
            ],
            filter: filters,
          },
        },
      });

      if (fuzzyResponse.hits.hits.length > 0) {
        const hit = fuzzyResponse.hits.hits[0];
        const source = hit._source as ProductSource;
        // Return the name or brand from the closest match as suggestion
        suggestion = stringValue(source.name) || stringValue(source.brand) || params.search;
        
        // Only suggest if it's different from the original search
        if (suggestion.toLowerCase() === params.search.toLowerCase()) {
          suggestion = undefined;
        }
      }
    } catch (fuzzyError) {
      console.error("Failed to generate search suggestion:", fuzzyError);
    }
  }

  return {
    products: response.hits.hits.map(mapProductHit),
    total,
    currentPage: Math.min(params.page, lastPage),
    lastPage,
    perPage: params.perPage,
    filters: buildCatalogFilters(response.aggregations as Record<string, unknown> | undefined),
    ...(suggestion ? { suggestion } : {}),
  };
}
