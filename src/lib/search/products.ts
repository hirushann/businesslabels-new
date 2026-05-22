import type { estypes } from "@elastic/elasticsearch";
import type { LinkProps } from "next/link";
import type { ProductCardData, ProductRouteType, ProductWarrantyData } from "@/components/ProductCard";
import { catalogIndexForType, elasticClient } from "@/lib/search/client";
import type { LaravelProduct } from "@/lib/mappings/product";
import { isDeliverableInStock } from "@/lib/utils/delivery";
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
  scopeCategories: ["scope_category"],
  categoryIds: ["category_id"],
  brands: ["brand"],
  materialIds: ["material_id"],
  materialCategories: ["material_category"],
  materialCategoryIds: ["material_category_id"],
  materialCodes: ["material_code", "materiaal_code", "materiaal-code"],
  materials: ["material", "materiaal"],
  finishings: ["finishing", "afwerking"],
  glues: ["glue", "lijm", "adhesive"],
  printMethods: ["print_method", "printmethode", "druktype"],
  printerTypes: ["printer_type"],
  detections: ["detectie"],
  marks: ["merken"],
  kernStrings: ["kern_string", "kern_type", "kern"],
  outerDiameterStrings: ["outer_diameter_string", "buiten_diameter_type", "buiten-diameter", "buiten_diameter"],
} as const;

const EXACT_VALUE_KEYS = {
  ids: ["id"],
  printerIds: ["printer_id", "printer_ids"],
  slugs: ["slug"],
  skus: ["sku"],
  articleNumbers: ["article_number"],
} as const;

const OPTION_FILTERS: Array<{
  key: CatalogOptionFilterKey;
  title: string;
  field: string;
  nestedPath?: string;
  paramValues: keyof Pick<
    CatalogSearchParams,
    | "categories"
    | "materialCodes"
    | "materials"
    | "finishings"
    | "glues"
    | "printMethods"
    | "printerTypes"
    | "detections"
    | "brands"
    | "marks"
    | "kernStrings"
    | "outerDiameterStrings"
  >;
}> = [
  { key: "category", title: "Product Type", field: "category_slugs.keyword", paramValues: "categories" },
  { key: "brand", title: "Brand", field: "catalog_brand.keyword", paramValues: "brands" },
  { key: "print_method", title: "Print Method", field: "properties.printmethode.keyword", nestedPath: "properties", paramValues: "printMethods" },
  { key: "printer_type", title: "Printer Type", field: "properties.printer_type.keyword", nestedPath: "properties", paramValues: "printerTypes" },
  { key: "detectie", title: "Detection", field: "properties.detectie.keyword", nestedPath: "properties", paramValues: "detections" },
  { key: "merken", title: "Compatible Brand", field: "compatible_brands.keyword", paramValues: "marks" },
  { key: "material_code", title: "Material Code", field: "catalog_material_code.keyword", paramValues: "materialCodes" },
  { key: "material", title: "Material Type", field: "catalog_material.keyword", paramValues: "materials" },
  { key: "finishing", title: "Finishing", field: "properties.afwerking.keyword", nestedPath: "properties", paramValues: "finishings" },
  { key: "glue", title: "Glue", field: "properties.lijm.keyword", nestedPath: "properties", paramValues: "glues" },
  { key: "kern_string", title: "Core Type", field: "properties.kern.keyword", nestedPath: "properties", paramValues: "kernStrings" },
  { key: "outer_diameter_string", title: "Outer Diameter Type", field: "properties.buiten-diameter.keyword", nestedPath: "properties", paramValues: "outerDiameterStrings" },
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
  { key: "width", title: "Label Width", field: "property_numbers.breedte", minParam: "widthMin", maxParam: "widthMax", unitSuffix: "mm" },
  { key: "height", title: "Label Height", field: "property_numbers.hoogte", minParam: "heightMin", maxParam: "heightMax", unitSuffix: "mm" },
  { key: "core", title: "Core Size", field: "property_numbers.kern", minParam: "coreMin", maxParam: "coreMax", unitSuffix: "mm" },
  {
    key: "outer_diameter",
    title: "Outer Diameter",
    field: "property_numbers.buiten-diameter",
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
  "discount",
  "stock",
  "in_stock",
  "delivery_dates_in_stock",
  "delivery_dates_no_stock",
  "packing_group",
  "allow_singulars",
  "main_image",
  "image",
  "thumbnail",
  "images",
  "categories",
  "category_slugs",
  "frontend_path",
  "catalog_brand",
  "catalog_material_code",
  "catalog_material",
  "compatible_brands",
  "terms",
  "meta",
  "material",
  "warranty_available",
  "warranty_option_ids",
  "warranty_option_names",
  "warranty_option_months",
  "warranty_option_prices",
  "properties",
  "is_group_product",
  "translations",
  "packing_group",
  "allow_singulars",
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

export function parseCatalogSearchParams(params: URLSearchParams, locale?: "en" | "nl"): CatalogSearchParams {
  const page = Math.max(1, Number.parseInt(params.get("page") ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number.parseInt(params.get("per_page") ?? String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE),
  );

  const categoryValues = valuesParam(params, MULTI_VALUE_KEYS.categories);
  const scopeCategoryValues = valuesParam(params, MULTI_VALUE_KEYS.scopeCategories);
  const categoryIdValues = valuesParam(params, MULTI_VALUE_KEYS.categoryIds);
  const materialIdValues = valuesParam(params, MULTI_VALUE_KEYS.materialIds);
  const materialCategoryIdValues = valuesParam(params, MULTI_VALUE_KEYS.materialCategoryIds);
  const printerIdValues = valuesParam(params, EXACT_VALUE_KEYS.printerIds);

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
    printerIds: integerValues(printerIdValues),
    categories: categoryValues,
    scopeCategories: scopeCategoryValues,
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
    locale,
  };
}

export function textQuery(search: string): estypes.QueryDslQueryContainer {
  const query = search.trim();
  if (!query) return { match_all: {} };

  // Tiered boosts
  const BOOST_SKU_EXACT = 100000;
  const BOOST_SKU_PREFIX = 10000;
  const BOOST_TITLE_PHRASE = 5000;
  const BOOST_TITLE_AND = 2000;
  const BOOST_FEATURE_SECTION = 1000;
  const BOOST_TITLE_PARTIAL = 100;
  const BOOST_BRAND_GENUINE = 50; // Higher than compatible
  const BOOST_SECONDARY = 10;
  const BOOST_DESCRIPTION = 0.05; // Extremely low to require other matches

  const skuFields = ["sku", "article_number", "variant_skus"];
  const titleFields = ["name", "title", "post_title"];
  const featureFields = ["subtitle", "catalog_material", "catalog_material_code", "excerpt"];
  const brandFields = ["catalog_brand"];
  const secondaryFields = [
    "compatible_brands",
    "properties.printmethode",
    "properties.afwerking",
    "properties.lijm",
    "properties.detectie",
    "slug",
  ];
  const descriptionFields = ["description", "content", "product_information"];

  const tokens = query.split(/\s+/).filter(Boolean);
  const isMultiTerm = tokens.length > 1;
  
  // Pattern for product codes like C8000, CW-C8000, TM-C3500, D6000
  const productCodeRegex = /^[A-Z]{1,4}-?[0-9]{2,}[A-Z0-9]*$|^[A-Z]{2,}-[A-Z][0-9]{2,}[A-Z0-9]*$/i;
  const isProductCodeIntent = tokens.every(t => productCodeRegex.test(t));
  const hasNumericToken = tokens.some((t) => /[0-9]{2,}/.test(t));
  const isPureNumeric = tokens.every(t => /^[0-9]+$/.test(t));

  const should: estypes.QueryDslQueryContainer[] = [];

  // --- TIER 1: SKU Exact Matches (Global Short-Circuit Priority) ---
  skuFields.forEach((field) => {
    should.push({
      term: {
        [`${field}.keyword`]: {
          value: query,
          boost: BOOST_SKU_EXACT,
          case_insensitive: true,
        },
      },
    });
  });

  // --- TIER 2: SKU Partial/Prefix Matches ---
  should.push({
    multi_match: {
      query,
      fields: skuFields.map((f) => `${f}^20`),
      type: "phrase_prefix",
      boost: BOOST_SKU_PREFIX,
    },
  });

  // --- TIER 3: Title/Name Matches ---
  should.push({
    multi_match: {
      query,
      fields: titleFields.map((f) => `${f}^10`),
      type: "phrase",
      boost: BOOST_TITLE_PHRASE,
    },
  });

  // 3b. Phrase Prefix for Titles (e.g. "Eps" -> "Epson")
  should.push({
    multi_match: {
      query,
      fields: titleFields,
      type: "phrase_prefix",
      boost: BOOST_TITLE_PHRASE * 0.4,
    },
  });

  if (isMultiTerm) {
    should.push({
      multi_match: {
        query,
        fields: titleFields,
        type: "cross_fields",
        operator: "and",
        boost: BOOST_TITLE_AND,
      },
    });

    // 3c. Partial Word Match for Numeric Tokens (e.g. "8000" matching "C8000")
    if (hasNumericToken && !isProductCodeIntent) {
      const wildcardQuery = tokens
        .map((t) => (/[0-9]{2,}/.test(t) ? `*${t}*` : t))
        .join(" AND ");
      should.push({
        query_string: {
          query: wildcardQuery,
          fields: titleFields,
          boost: BOOST_TITLE_AND * 0.5,
          default_operator: "AND",
          analyze_wildcard: true,
        },
      });
    }
  } else {
    // For single words, allow edge n-gram style wildcard matching for brands and titles
    if (query.length >= 1) {
      const wildcardFields = [...titleFields, ...brandFields];
      wildcardFields.forEach((field) => {
        should.push({
          wildcard: {
            [`${field}.keyword`]: {
              value: `${query.toLowerCase()}*`,
              boost: BOOST_TITLE_PARTIAL * 2,
              case_insensitive: true,
            },
          },
        });
      });
    }
  }

  // --- TIER 4: Feature Section (Subtitle, Material, Excerpt) ---
  should.push({
    multi_match: {
      query,
      fields: featureFields,
      type: "best_fields",
      operator: isMultiTerm ? "and" : "or",
      boost: BOOST_FEATURE_SECTION,
    },
  });

  // --- TIER 5: Brand & Secondary ---
  // Genuine brand match gets higher priority
  should.push({
    multi_match: {
      query,
      fields: brandFields,
      type: "best_fields",
      boost: BOOST_BRAND_GENUINE,
    },
  });

  // --- TIER 6: Secondary & Description (STRICT) ---
  const useFuzzy = !isProductCodeIntent; // Allow fuzzy for text parts of the query

  if (!isProductCodeIntent) {
    // Dynamic minimum_should_match for text searches
    // "2<67%" means if 2 terms, 100% must match. If 3+, 67% (2 out of 3) must match.
    const minShouldMatch = "2<67%";

    should.push({
      multi_match: {
        query,
        fields: titleFields,
        type: "best_fields",
        operator: "or",
        minimum_should_match: minShouldMatch,
        boost: BOOST_TITLE_PARTIAL,
      },
    });

    should.push({
      multi_match: {
        query,
        fields: secondaryFields,
        type: "best_fields",
        operator: "and",
        boost: BOOST_SECONDARY,
      },
    });

    if (useFuzzy) {
      // Filter out numeric tokens from the fuzzy query to prevent "7500" matching "7501"
      const fuzzyQuery = tokens.filter(t => !/[0-9]/.test(t)).join(" ");
      if (fuzzyQuery) {
        should.push({
          multi_match: {
            query: fuzzyQuery,
            fields: [...titleFields, "catalog_brand"],
            type: "best_fields",
            fuzziness: "AUTO",
            prefix_length: 2,
            boost: BOOST_SECONDARY * 0.5,
          },
        });
      }
    }

    // Description fallback only for non-product-code queries
    should.push({
      multi_match: {
        query,
        fields: descriptionFields,
        type: "cross_fields",
        operator: "and",
        boost: BOOST_DESCRIPTION,
      },
    });
  } else {
    // For product codes, we only allow very strict Title matching as a fallback to SKU
    should.push({
      multi_match: {
        query,
        fields: titleFields,
        type: "phrase_prefix",
        boost: BOOST_TITLE_PARTIAL,
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




function termsFilter(field: string, values: Array<string | number>): estypes.QueryDslQueryContainer | null {
  return values.length ? { terms: { [field]: values } } : null;
}

function nestedTermsFilter(
  path: string,
  field: string,
  values: Array<string | number>,
): estypes.QueryDslQueryContainer | null {
  const filter = termsFilter(field, values);
  if (!filter) return null;

  return {
    nested: {
      path,
      query: filter,
    },
  };
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
  stringNestedPath?: string,
): estypes.QueryDslQueryContainer | null {
  const rangeClause = rangeFilter(rangeField, rangeMin, rangeMax);
  const hasStringValues = stringValues.length > 0;
  const stringClause = hasStringValues
    ? {
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
      } satisfies estypes.QueryDslQueryContainer
    : null;
  const nestedStringClause = stringClause && stringNestedPath
    ? ({
        nested: {
          path: stringNestedPath,
          query: stringClause,
        },
      } satisfies estypes.QueryDslQueryContainer)
    : stringClause;

  if (!rangeClause && !hasStringValues) {
    return null;
  }

  if (rangeClause && !hasStringValues) {
    return rangeClause;
  }

  if (!rangeClause && hasStringValues) {
    return nestedStringClause;
  }

  // Both range and string values present - use OR logic
  return {
    bool: {
      should: [
        rangeClause as estypes.QueryDslQueryContainer,
        nestedStringClause as estypes.QueryDslQueryContainer,
      ],
      minimum_should_match: 1,
    },
  };
}

<<<<<<< HEAD
function getCompatibleInkCategorySlugs(printerSlug: string): string[] {
  const slug = printerSlug.toLowerCase();
  if (slug.includes("cw-c8000")) {
    return ["inkt-cartridges-epson-cw-c8000", "inkt-cartridges-cw-c8000-bk", "inkt-cartridges-cw-c8000-mk"];
  }
  if (slug.includes("cw-c4000")) {
    return ["inkt-epson-cw-c4000"];
  }
  if (slug.includes("tm-c3500")) {
    return ["inkt-cartridges-tm-c3500-nl"];
  }
  if (slug.includes("tm-c7500g")) {
    return ["inkt-cartridges-tm-c7500g-nl"];
  }
  if (slug.includes("tm-c7500")) {
    return ["inkt-cartridges-tm-c7500-nl"];
  }
  if (slug.includes("cw-c6000") || slug.includes("cw-c6500")) {
    return ["inkt-cartridges-cw-c6000-series"];
  }
  if (slug.includes("gpc831") || slug.includes("gp-c831")) {
    return ["inkt-cartridges-gp-c831"];
  }
  if (slug.includes("tm-c3400")) {
    return ["inkt-cartridges-tm-c3400"];
  }
  if (slug.includes("cw-d6000") || slug.includes("cw-d6500")) {
    return ["inkt-cartridges-cw-d6000-series"];
  }
  return [];
}

function getPrinterBrandFromSlug(printerSlug: string): string | null {
  const slug = printerSlug.toLowerCase();
  if (slug.startsWith("godex-")) return "Godex";
  if (slug.startsWith("zebra-")) return "Zebra";
  if (slug.startsWith("epson-")) return "Epson";
  if (slug.startsWith("citizen-")) return "Citizen";
  if (slug.startsWith("tsc-")) return "TSC";
  if (slug.startsWith("honeywell-")) return "Honeywell";
  if (slug.startsWith("metapace-")) return "Metapace";
  if (slug.startsWith("seiko-")) return "Seiko";
  if (slug.startsWith("primera-") || slug.startsWith("dtm-")) return "Primera";
  return null;
}

export type PrinterInfo = {
  productIds: number[];
  slugs: string[];
  titles: string[];
};

export async function getPrinterInfo(printerIds: number[]): Promise<PrinterInfo> {
  const result: PrinterInfo = { productIds: [], slugs: [], titles: [] };
  if (!printerIds || printerIds.length === 0) return result;

  const client = elasticClient();
  const prefix = process.env.SCOUT_PREFIX?.trim() ?? "";
  const index = prefix ? `${prefix}catalog_printers` : "catalog_printers";

  try {
    const response = await client.search<Record<string, unknown>>({
      index,
      ignore_unavailable: true,
      size: printerIds.length,
      _source: ["product_ids", "slug", "title"],
      query: {
        terms: { id: printerIds },
      },
    });

    const productIdsSet = new Set<number>();
    for (const hit of response.hits.hits) {
      if (hit._source?.product_ids && Array.isArray(hit._source.product_ids)) {
        for (const pid of hit._source.product_ids) {
          if (typeof pid === "number" && Number.isFinite(pid)) {
            productIdsSet.add(pid);
          }
        }
      }
      
      const slugVal = hit._source?.slug;
      if (Array.isArray(slugVal)) {
        result.slugs.push(...slugVal.filter((s): s is string => typeof s === "string"));
      } else if (typeof slugVal === "string") {
        result.slugs.push(slugVal);
      }

      const titleVal = hit._source?.title;
      if (Array.isArray(titleVal)) {
        result.titles.push(...titleVal.filter((t): t is string => typeof t === "string"));
      } else if (typeof titleVal === "string") {
        result.titles.push(titleVal);
      }
    }
    result.productIds = Array.from(productIdsSet);
    return result;
  } catch (error) {
    console.error(`[Search] Failed to fetch printer info for printers ${printerIds}:`, error);
    return result;
  }
}

function buildFilters(params: CatalogSearchParams, printerInfo?: PrinterInfo): estypes.QueryDslQueryContainer[] {
=======
/**
 * Filters that are always applied to both the main hits query and every facet
 * aggregation. Includes the active-state guard, type and ID-based scoping
 * (used by category/printer pages), ranges, and the kern_string /
 * outer_diameter_string filters — those are combined with their range
 * counterparts inside a single OR clause, so we keep them in the base rather
 * than try to split them out per facet.
 */
function buildBaseFilters(params: CatalogSearchParams): estypes.QueryDslQueryContainer[] {
>>>>>>> hasan
  // Slow-delivery products are NOT hidden from listings — they stay visible
  // and simply render without the "In Stock" label (see `mapProductHit`).
  const filters: Array<estypes.QueryDslQueryContainer | null> = [
    { term: { "state.keyword": "active" } },
    params.printerIds && params.printerIds.length > 0
      ? {
          bool: {
            must_not: [
              { term: { is_group_product: true } },
              { term: { "product_type.keyword": "group" } }
            ]
          }
        }
      : null,
    params.type ? { term: { product_type: params.type } } : null,
    termsFilter("id", params.ids),
    params.printerIds && params.printerIds.length > 0
      ? (() => {
          const printerShould: estypes.QueryDslQueryContainer[] = [
            {
              bool: {
                should: [
                  { terms: { printer_ids: params.printerIds } },
                  ...(printerInfo && printerInfo.productIds.length > 0
                    ? [{ terms: { id: printerInfo.productIds } }]
                    : []),
                ],
                minimum_should_match: 1,
              },
            },
          ];

          if (printerInfo) {
            const isEpson = printerInfo.slugs.some(slug => slug.toLowerCase().includes("epson"));
            if (isEpson) {
              const inkSlugs = printerInfo.slugs.flatMap(getCompatibleInkCategorySlugs);
              if (inkSlugs.length > 0) {
                printerShould.push({
                  bool: {
                    must: [
                      { term: { "category_slugs.keyword": "inkt-cartridges-nl" } },
                      { terms: { "category_slugs.keyword": inkSlugs } },
                    ],
                  },
                });
              }
            } else {
              const brands = printerInfo.slugs
                .map(getPrinterBrandFromSlug)
                .filter((b): b is string => b !== null);
              
              if (brands.length > 0) {
                printerShould.push({
                  bool: {
                    must: [
                      { term: { "category_slugs.keyword": "tt-printlinten-nl" } },
                      { terms: { "catalog_brand.keyword": [...brands, "Diamondlabels"] } },
                    ],
                  },
                });
              }
            }
          }

          return {
            bool: {
              should: printerShould,
              minimum_should_match: 1,
            },
          };
        })()
      : null,
    exactKeywordFilter("slug.keyword", params.slugs),
    exactKeywordFilter("sku.keyword", params.skus),
    exactKeywordFilter("article_number.keyword", params.articleNumbers),
<<<<<<< HEAD
    categorySlugFilter(params.categories),
    categorySlugFilter(params.scopeCategories),
=======
>>>>>>> hasan
    termsFilter("category_ids", params.categoryIds),
    termsFilter("material_id", params.materialIds),
    termsFilter("material_taxon_slugs", params.materialCategories),
    termsFilter("material_taxon_ids", params.materialCategoryIds),
    rangeFilter("price", params.priceMin, params.priceMax),
    rangeFilter("property_numbers.breedte", params.widthMin, params.widthMax),
    rangeFilter("property_numbers.hoogte", params.heightMin, params.heightMax),
    rangeOrStringFilter("property_numbers.kern", params.coreMin, params.coreMax, "properties.kern.keyword", params.kernStrings, "properties"),
    rangeOrStringFilter(
      "property_numbers.buiten-diameter",
      params.outerDiameterMin,
      params.outerDiameterMax,
      "properties.buiten-diameter.keyword",
      params.outerDiameterStrings,
      "properties",
    ),
  ];

  return filters.filter((filter): filter is estypes.QueryDslQueryContainer => filter !== null);
}

/**
 * One filter clause per UI facet key. Used both for the main query (where all
 * non-null entries are AND-ed in) and per-facet aggregations (where every
 * entry EXCEPT the facet being aggregated is applied). The latter is the
 * faceted-search pattern that lets a user switch values within a facet
 * without first deselecting — each option shows the count it WOULD have if
 * the user picked it.
 */
function buildFacetFilters(
  params: CatalogSearchParams,
): Partial<Record<CatalogOptionFilterKey, estypes.QueryDslQueryContainer>> {
  const entries: Array<[CatalogOptionFilterKey, estypes.QueryDslQueryContainer | null]> = [
    ["category", categorySlugFilter(params.categories)],
    ["brand", termsFilter("catalog_brand.keyword", params.brands)],
    ["material_code", termsFilter("catalog_material_code.keyword", params.materialCodes)],
    ["material", termsFilter("catalog_material.keyword", params.materials)],
    ["finishing", nestedTermsFilter("properties", "properties.afwerking.keyword", params.finishings)],
    ["glue", nestedTermsFilter("properties", "properties.lijm.keyword", params.glues)],
    ["print_method", nestedTermsFilter("properties", "properties.printmethode.keyword", params.printMethods)],
    ["printer_type", nestedTermsFilter("properties", "properties.printer_type.keyword", params.printerTypes)],
    ["detectie", nestedTermsFilter("properties", "properties.detectie.keyword", params.detections)],
    ["merken", termsFilter("compatible_brands.keyword", params.marks)],
  ];

  const result: Partial<Record<CatalogOptionFilterKey, estypes.QueryDslQueryContainer>> = {};
  for (const [key, value] of entries) {
    if (value !== null) result[key] = value;
  }
  return result;
}

function buildFilters(params: CatalogSearchParams): estypes.QueryDslQueryContainer[] {
  return [...buildBaseFilters(params), ...Object.values(buildFacetFilters(params))];
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

<<<<<<< HEAD
function aggregations(excludeCategories: string[] = []): Record<string, estypes.AggregationsAggregationContainer> {
=======
function aggregations(
  params: CatalogSearchParams,
): Record<string, estypes.AggregationsAggregationContainer> {
  const baseFilters = buildBaseFilters(params);
  const facetFilters = buildFacetFilters(params);

>>>>>>> hasan
  const optionAggs = Object.fromEntries(
    OPTION_FILTERS.map((filter) => {
      // For this facet's aggregation, apply base + every OTHER facet's
      // filter, but not its own. That way the facet's options reflect what
      // would be available if the user changed/added a value within it,
      // instead of collapsing to whatever they just picked.
      const otherFacetFilters = Object.entries(facetFilters)
        .filter(([key]) => key !== filter.key)
        .map(([, clause]) => clause);

      const termsAgg: estypes.AggregationsAggregationContainer = {
        terms: {
          field: filter.field,
          size: 100,
          order: { _key: "asc" },
        },
      };

      const innerAgg: estypes.AggregationsAggregationContainer = filter.nestedPath
        ? {
            nested: { path: filter.nestedPath },
            aggs: { values: termsAgg },
          }
        : termsAgg;

      // `global` escapes the parent query scope so we can re-apply *just*
      // base + other facet filters — the standard ES recipe for showing
      // counts that ignore the facet's own selection.
      const textClause = textQuery(params.search);
      const innerFilter = textClause
        ? {
            bool: {
              must: [textClause],
              filter: [...baseFilters, ...otherFacetFilters],
            },
          }
        : { bool: { filter: [...baseFilters, ...otherFacetFilters] } };

      return [
        `options_${filter.key}`,
        {
          global: {},
          aggs: {
            scoped: {
              filter: innerFilter,
              aggs: { facet: innerAgg },
            },
<<<<<<< HEAD
          } satisfies estypes.AggregationsAggregationContainer)
        : ({
            terms: {
              field: filter.field,
              size: 100,
              order: { _key: "asc" },
              ...(filter.key === "category" && excludeCategories.length > 0
                ? { exclude: excludeCategories }
                : {}),
            },
          } satisfies estypes.AggregationsAggregationContainer),
    ]),
=======
          },
        } satisfies estypes.AggregationsAggregationContainer,
      ];
    }),
>>>>>>> hasan
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
  // Walk a fixed list of paths down through the wrapper aggregations.
  // After the faceted-search refactor: agg = global > scoped(filter) >
  // facet (terms) > [optional nested `values` for nested fields) > buckets.
  type B = { buckets?: unknown };
  const root = agg as Record<string, unknown> & B;
  const scoped = (root as { scoped?: B & Record<string, unknown> }).scoped;
  const facet = scoped
    ? (scoped as { facet?: B & Record<string, unknown> }).facet
    : (root as { facet?: B & Record<string, unknown> }).facet;
  const values = facet
    ? (facet as { values?: B }).values
    : (root as { values?: B }).values;

  for (const candidate of [values, facet, scoped, root]) {
    if (candidate && Array.isArray(candidate.buckets)) {
      return candidate.buckets as Array<{ key?: string | number; doc_count?: number }>;
    }
  }
  return [];
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
  const options = OPTION_FILTERS.map((filter) => {
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

    return {
      key: filter.key,
      title: filter.title,
      options: aggregatedOptions,
    };
  // Hide facets that can't usefully narrow the result — i.e. zero options
  // (nothing matches the field at all) or a single option (every remaining
  // product shares that value, so picking it doesn't change anything).
  }).filter((filter) => filter.options.length > 1);

  return {
    ranges: RANGE_FILTERS.map((filter) => ({
      key: filter.key,
      title: filter.title,
      min: 0,
      max: Math.ceil(maxAggregation(aggregationsResult, filter.key) ?? 0),
      unitPrefix: filter.unitPrefix,
      unitSuffix: filter.unitSuffix,
    })).filter((filter) => filter.max > 0),
    options,
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

function getLocalizedValue(value: unknown, locale?: "en" | "nl"): string | null {
  if (!value) return null;
  
  if (Array.isArray(value)) {
    const strings = value.filter(v => typeof v === 'string' && v.trim() !== '') as string[];
    if (strings.length === 0) return null;
    if (strings.length === 1) return strings[0];
    
    // Assuming backend flattens ['en' => '...', 'nl' => '...']
    // English is index 0, Dutch is index 1
    if (locale === 'nl') return strings[1] || strings[0];
    return strings[0];
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' ? trimmed : null;
  }
  
  return stringValue(value);
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
  return type === "simple" || type === "variable" || type === "group_product" ? type : null;
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

function mapProductHit(hit: estypes.SearchHit<ProductSource>, index: number, locale?: "en" | "nl"): CatalogProductResult {
  const source = hit._source ?? {};
  const id = stringValue(source.id) ?? stringValue(source.ID) ?? hit._id ?? `result-${index}`;
  // `id` is only unique per product type/index; combine ES index + doc id for a
  // globally-unique result key so React keys don't collide across indices.
  const resultKey = `${hit._index ?? "idx"}::${hit._id ?? `${id}-${index}`}`;
  let type = productType(source.product_type) ?? productType(source.type);
  if (!type && booleanValue(source.is_group_product)) {
    type = "group_product";
  }
  const slug = stringValue(source.slug) ?? stringValue(source.post_name);
  const frontendPath = stringValue(source.frontend_path);
  
  const title = getLocalizedValue(source.title, locale) ?? getLocalizedValue(source.name, locale) ?? getLocalizedValue(source.post_title, locale) ?? "Unnamed product";
  const subtitle = getLocalizedValue(source.subtitle, locale);
  const excerpt = getLocalizedValue(source.excerpt, locale);

  const warranty = warrantyFromSource(source);

  const rawPrice = numberValue(source.price);
  const originalPrice = numberValue(source.original_price);
  const discount = numberValue(source.discount);

  let price = rawPrice;
  // Fallback for group products if price is 0 but original_price and discount are present
  if (type === "group_product" && (!price || price === 0) && originalPrice && discount) {
    price = originalPrice - (originalPrice * (discount / 100));
  }

  const stockCount = numberValue(source.stock);
  // Stock status follows the 10-day delivery window. When the index carries
  // no delivery data the helper returns null and we fall back to the raw
  // stock signal.
  const deliveryStockStatus = isDeliverableInStock({
    stock: stockCount,
    delivery_dates_in_stock: numberValue(source.delivery_dates_in_stock),
    delivery_dates_no_stock: numberValue(source.delivery_dates_no_stock),
  });

  const product: ProductCardData = {
    id,
    sku: stringValue(source.sku) ?? "-",
    name: title,
    subtitle,
    excerpt,
    materialTitle: stringValue(source.catalog_material) ?? stringValue(source.catalog_material_code),
    price,
    originalPrice,
    discount: discount ?? 0,
    inStock: deliveryStockStatus ?? (booleanValue(source.in_stock) || Boolean((stockCount ?? 0) > 0)),
    packing_group: numberValue(source.packing_group),
    allow_singulars: firstScalar(source.allow_singulars),
    mainImage: imageUrl(stringValue(source.main_image) ?? stringValue(source.image)),
    categories: categoriesFromSource(source),
    slug,
    type,
    ...(warranty !== undefined ? { warranty } : {})
  };

  const href: LinkProps["href"] | undefined = frontendPath
    ? frontendPath
    : slug && type
      ? { pathname: `/products/${slug}`, query: { type } }
      : slug
        ? `/products/${slug}`
        : undefined;

  return { id: resultKey, product, href };
}

function totalHitsValue(total: estypes.SearchTotalHits | number | undefined): number {
  if (typeof total === "number") return total;
  return total?.value ?? 0;
}

export async function searchCatalogProducts(params: CatalogSearchParams): Promise<CatalogSearchResponse> {
  const client = elasticClient();
  let printerInfo: PrinterInfo | undefined;
  if (params.printerIds && params.printerIds.length > 0) {
    printerInfo = await getPrinterInfo(params.printerIds);
  }
  const filters = buildFilters(params, printerInfo);
  const from = (params.page - 1) * params.perPage;

  const query: estypes.QueryDslQueryContainer = {
    bool: {
      must: [textQuery(params.search)],
      filter: filters,
    },
  };

  const response = await client.search<ProductSource>({
    index: catalogIndexForType(params.type),
    ignore_unavailable: true,
    from,
    size: params.perPage,
    track_total_hits: true,
    _source: RESULT_SOURCE_FIELDS as unknown as string[],
    query,
    ...(params.search && params.search.trim().split(/\s+/).filter(Boolean).length >= 2 
      ? { min_score: params.search.trim().split(/\s+/).filter(Boolean).length === 2 ? 3.0 : 2.0 } 
      : {}),
    ...(sortClauses(params.sort) ? { sort: sortClauses(params.sort) } : {}),
<<<<<<< HEAD
    aggs: aggregations(params.scopeCategories),
=======
    aggs: aggregations(params),
>>>>>>> hasan
  });

  console.log(`[Search] Query locale: ${params.locale}, Total hits: ${totalHitsValue(response.hits.total)}`);

  const total = totalHitsValue(response.hits.total);
  const lastPage = Math.max(1, Math.ceil(total / params.perPage));

  // Extract "Did you mean" suggestion
  let suggestion: string | undefined;
  if (params.search && total === 0) {
    // Try fuzzy search to find similar terms when exact search returns nothing
    try {
      const fuzzyResponse = await client.search<ProductSource>({
        index: catalogIndexForType(params.type),
        ignore_unavailable: true,
        size: 1,
        _source: ["name", "catalog_brand", "sku"] as unknown as string[],
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: params.search,
                  fields: ["name^3", "catalog_brand^2", "sku"],
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
        suggestion = stringValue(source.name) || stringValue(source.catalog_brand) || params.search;
        
        // Only suggest if it's different from the original search
        if (suggestion.toLowerCase() === params.search.toLowerCase()) {
          suggestion = undefined;
        }
      }
    } catch (fuzzyError) {
      console.error("Failed to generate search suggestion:", fuzzyError);
    }
  }



  const products = response.hits.hits.map((hit, index) => mapProductHit(hit, index, params.locale));

  // Secondary fetch to Laravel database to resolve correct packing_group values
  if (products.length > 0) {
    try {
      const backendUrl = process.env.BBNL_API_BASE_URL;
      if (backendUrl) {
        const slugs = products
          .map((p) => p.product.slug)
          .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
          
        if (slugs.length > 0) {
          const queryParams = new URLSearchParams();
          slugs.forEach((slug) => queryParams.append("slug[]", slug));
          queryParams.append("per_page", slugs.length.toString());
          if (params.locale) {
            queryParams.append("lang", params.locale);
          }
          
          const url = `${backendUrl}/api/products?${queryParams.toString()}`;
          const res = await fetch(url, {
            headers: { "Accept": "application/json" },
            next: { revalidate: 300 }
          });
          
          if (res.ok) {
            const json = await res.json();
            if (json && Array.isArray(json.data)) {
              const productConfigMap = new Map<string, { packingGroup: number | null; allowSingulars: LaravelProduct["allow_singulars"] }>();
              (json.data as LaravelProduct[]).forEach((p) => {
                if (p && p.slug) {
                  const resolvedSlug = typeof p.slug === "string" ? p.slug : (p.slug.en || p.slug.nl || "");
                  if (resolvedSlug) {
                    productConfigMap.set(resolvedSlug, {
                      packingGroup: p.packing_group != null ? Number(p.packing_group) : null,
                      allowSingulars: p.allow_singulars ?? null,
                    });
                  }
                }
              });
              
              products.forEach((p) => {
                if (p.product.slug && productConfigMap.has(p.product.slug)) {
                  const productConfig = productConfigMap.get(p.product.slug);
                  p.product.packing_group = productConfig?.packingGroup ?? null;
                  p.product.allow_singulars = productConfig?.allowSingulars ?? null;
                }
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("[Search] Failed to fetch packing_group overrides:", err);
    }
  }

  return {
    products,
    total,
    currentPage: Math.min(params.page, lastPage),
    lastPage,
    perPage: params.perPage,
    filters: buildCatalogFilters(response.aggregations as Record<string, unknown> | undefined),
    ...(suggestion ? { suggestion } : {}),
  };
}
