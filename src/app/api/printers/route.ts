import { NextRequest, NextResponse } from "next/server";
import type { Filter, FilterValueRange } from "@elastic/search-ui";

const API_BASE_URL = process.env.BBNL_API_BASE_URL;
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGES = 100;

type ProductRecord = {
  id: string | number;
  sku?: string | null;
  article_number?: string | null;
  title?: string | null;
  name?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  material?: { title?: string | null; name?: string | null; slug?: string | null } | null;
  material_title?: string | null;
  price?: number | string | null;
  original_price?: number | string | null;
  in_stock?: boolean | number | string | null;
  main_image?: string | null;
  image?: string | null;
  categories?: Array<{ id?: number; name?: string | null; slug?: string | null }>;
  category_slugs?: string[] | string | null;
  brand?: string | string[] | null;
  search_brand_slug?: string[] | string | null;
  search_category_slug?: string[] | string | null;
  meta_width_mm?: number | string | null;
  meta_height_mm?: number | string | null;
  meta_kern_mm?: number | string | null;
  meta_material_code?: string[] | string | null;
  meta_material?: string[] | string | null;
  meta_finishing?: string[] | string | null;
  meta_glue?: string[] | string | null;
  slug?: string | null;
  type?: "simple" | "variable" | string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

type ProductsResponse = {
  data?: ProductRecord[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
};

type FilterOptionKey = "category" | "brand" | "materialCode" | "material" | "finishing" | "glue";

const OPTION_FIELDS: Record<FilterOptionKey, string> = {
  category: "search_category_slug",
  brand: "search_brand_slug",
  materialCode: "meta_material_code",
  material: "meta_material",
  finishing: "meta_finishing",
  glue: "meta_glue",
};

function isRangeFilter(value: unknown): value is FilterValueRange {
  return typeof value === "object" && value !== null && "name" in value;
}

function scalarToString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return null;
}

function collectStrings(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item));
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return collectStrings(record.slug ?? record.value ?? record.name ?? record.title);
  }

  const text = scalarToString(value);
  return text ? [text] : [];
}

function numericValues(value: unknown): number[] {
  return collectStrings(value)
    .map((item) => {
      const parsed = Number(item);
      if (Number.isFinite(parsed)) return parsed;

      const match = item.match(/[-+]?[0-9]*\.?[0-9]+/);
      if (!match) return null;

      const matchedValue = Number(match[0]);
      return Number.isFinite(matchedValue) ? matchedValue : null;
    })
    .filter((value): value is number => value !== null);
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function labelFromCode(value: string): string {
  const normalized = value.trim().replace(/^\[\s*/, "").replace(/\s*\]$/, "").replace(/^["']|["']$/g, "");

  return normalized
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase();
      return upper.length <= 3 ? upper : `${upper.charAt(0)}${upper.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function productCategoryValues(product: ProductRecord): string[] {
  const explicitValues = collectStrings(product.search_category_slug ?? product.category_slugs);
  if (explicitValues.length > 0) return explicitValues;

  return collectStrings(product.categories);
}

function productMaterialValues(product: ProductRecord): string[] {
  const explicitValues = collectStrings(product.meta_material ?? product.material_title);
  if (explicitValues.length > 0) return explicitValues;

  return collectStrings(product.material);
}

function valuesForField(product: ProductRecord, field: string): string[] {
  switch (field) {
    case "search_category_slug":
      return productCategoryValues(product);
    case "search_brand_slug":
      return collectStrings(product.search_brand_slug ?? product.brand);
    case "meta_material":
      return productMaterialValues(product);
    default:
      return collectStrings(product[field]);
  }
}

function rangeValuesForField(product: ProductRecord, field: string): number[] {
  if (field === "price") {
    const price = numberValue(product.price);
    return price === null ? [] : [price];
  }

  return numericValues(product[field]);
}

function matchesRange(product: ProductRecord, field: string, range: FilterValueRange): boolean {
  const from = typeof range.from === "number" ? range.from : null;
  const to = typeof range.to === "number" ? range.to : null;
  const values = rangeValuesForField(product, field);

  if (values.length === 0) return false;

  return values.some((value) => (from === null || value >= from) && (to === null || value <= to));
}

function matchesFilter(product: ProductRecord, filter: Filter): boolean {
  if (filter.values.length === 0) return true;

  const ranges = filter.values.filter(isRangeFilter);
  if (ranges.length > 0) {
    const rangeMatches = ranges.some((range) => matchesRange(product, filter.field, range));
    return filter.type === "none" ? !rangeMatches : rangeMatches;
  }

  const values = new Set(valuesForField(product, filter.field).map((value) => value.toLowerCase()));
  const selected = filter.values.flatMap((value) => collectStrings(value).map((item) => item.toLowerCase()));
  const hasMatch = selected.some((value) => values.has(value));

  return filter.type === "none" ? !hasMatch : hasMatch;
}

function applyFilters(products: ProductRecord[], filters: Filter[]): ProductRecord[] {
  if (filters.length === 0) return products;
  return products.filter((product) => filters.every((filter) => matchesFilter(product, filter)));
}

function titleForProduct(product: ProductRecord): string {
  return product.title?.trim() || product.name?.trim() || `Product ${product.id}`;
}

function timestampForProduct(product: ProductRecord): number {
  if (!product.created_at) return 0;
  const timestamp = Date.parse(product.created_at);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortProducts(products: ProductRecord[], sort: string): ProductRecord[] {
  return [...products].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return timestampForProduct(a) - timestampForProduct(b);
      case "title_desc":
        return titleForProduct(b).localeCompare(titleForProduct(a));
      case "price_asc":
        return (numberValue(a.price) ?? Number.POSITIVE_INFINITY) - (numberValue(b.price) ?? Number.POSITIVE_INFINITY);
      case "price_desc":
        return (numberValue(b.price) ?? Number.NEGATIVE_INFINITY) - (numberValue(a.price) ?? Number.NEGATIVE_INFINITY);
      case "latest":
        return timestampForProduct(b) - timestampForProduct(a);
      case "title_asc":
      default:
        return titleForProduct(a).localeCompare(titleForProduct(b));
    }
  });
}

function optionMetadata(products: ProductRecord[], field: string) {
  const counts = new Map<string, number>();

  products.forEach((product) => {
    new Set(valuesForField(product, field)).forEach((value) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({
      value,
      label: labelFromCode(value),
      count,
    }));
}

function maxForField(products: ProductRecord[], field: string): number | null {
  const values = products.flatMap((product) => rangeValuesForField(product, field));
  if (values.length === 0) return null;
  return Math.max(...values);
}

function metadataFor(products: ProductRecord[]) {
  return {
    priceStats: {
      max: maxForField(products, "price"),
    },
    dimensionStats: {
      width: { max: maxForField(products, "meta_width_mm") },
      height: { max: maxForField(products, "meta_height_mm") },
      kern: { max: maxForField(products, "meta_kern_mm") },
    },
    pillFilters: {
      category: { options: optionMetadata(products, OPTION_FIELDS.category) },
      brand: { options: optionMetadata(products, OPTION_FIELDS.brand) },
      materialCode: { options: optionMetadata(products, OPTION_FIELDS.materialCode) },
      material: { options: optionMetadata(products, OPTION_FIELDS.material) },
      finishing: { options: optionMetadata(products, OPTION_FIELDS.finishing) },
      glue: { options: optionMetadata(products, OPTION_FIELDS.glue) },
    } satisfies Record<FilterOptionKey, { options: Array<{ value: string; label: string; count: number }> }>,
  };
}

function parseFilters(value: string | null): Filter[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((filter): filter is Filter => {
      if (!filter || typeof filter !== "object") return false;
      const item = filter as { field?: unknown; values?: unknown };
      return typeof item.field === "string" && Array.isArray(item.values);
    });
  } catch {
    return [];
  }
}

async function fetchProductPage(page: number): Promise<ProductsResponse | null> {
  if (!API_BASE_URL) return null;

  const response = await fetch(`${API_BASE_URL}/api/printers?page=${page}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as ProductsResponse;
}

async function fetchAllPrinterProducts(): Promise<ProductRecord[]> {
  const firstPage = await fetchProductPage(1);
  if (!firstPage?.data) return [];

  const lastPage = Math.min(firstPage.meta?.last_page ?? 1, MAX_PAGES);
  if (lastPage <= 1) return firstPage.data;

  const remainingPages = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) => fetchProductPage(index + 2)),
  );

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((response) => response?.data ?? []),
  ];
}

export async function GET(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json({ data: [], error: "Backend API URL is not configured." }, { status: 500 });
  }

  const pageParam = Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPageParam = Number.parseInt(request.nextUrl.searchParams.get("per_page") ?? String(DEFAULT_PAGE_SIZE), 10);
  const perPage = Number.isFinite(perPageParam) && perPageParam > 0 ? perPageParam : DEFAULT_PAGE_SIZE;
  const sort = request.nextUrl.searchParams.get("sort") ?? "title_asc";
  const filters = parseFilters(request.nextUrl.searchParams.get("filters"));

  try {
    const products = await fetchAllPrinterProducts();
    const allMetadata = metadataFor(products);
    const filteredProducts = applyFilters(products, filters);
    const sortedProducts = sortProducts(filteredProducts, sort);
    const total = sortedProducts.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, lastPage);
    const start = (safePage - 1) * perPage;

    return NextResponse.json({
      data: sortedProducts.slice(start, start + perPage),
      meta: {
        current_page: safePage,
        last_page: lastPage,
        total,
        per_page: perPage,
      },
      rawResponse: allMetadata,
    });
  } catch (error) {
    console.error("Error fetching printer products:", error);
    return NextResponse.json({ data: [], error: "Failed to fetch printer products" }, { status: 500 });
  }
}
