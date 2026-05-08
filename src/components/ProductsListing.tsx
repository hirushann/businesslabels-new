"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Accordion from "@/components/Accordion";
import EmptyState from "@/components/EmptyState";
import ProductCard from "@/components/ProductCard";
import type { ProductCardData } from "@/components/ProductCard";
import ProductPaginationSwitcher from "@/components/ProductPaginationSwitcher";
import RangeSlider from "@/components/RangeSlider";
import type {
  CatalogOptionFilterKey,
  CatalogProductResult,
  CatalogSearchResponse,
  CatalogSortValue,
} from "@/lib/search/types";

type ProductsListingProps = {
  initialCatalog: CatalogSearchResponse;
  initialQueryString: string;
};

export type ListingProductCardData = ProductCardData;

type LegacyProductsListingProps = {
  products: ListingProductCardData[];
  currentPage?: number;
  lastPage?: number;
  basePath?: string;
};

type ProductsListingUnionProps = ProductsListingProps | LegacyProductsListingProps;

const SORT_OPTIONS: Array<{ value: CatalogSortValue; label: string }> = [
  { value: "relevance", label: "Most Relevant" },
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Name: A - Z" },
  { value: "title_desc", label: "Name: Z - A" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const OPTION_PARAM_KEY: Record<CatalogOptionFilterKey, string> = {
  category: "category",
  brand: "brand",
  material_code: "material_code",
  material: "material",
  finishing: "finishing",
  glue: "glue",
  print_method: "print_method",
  printer_type: "printer_type",
  detectie: "detectie",
  merken: "merken",
};

const RANGE_PARAM_KEYS = {
  price: { min: "price_min", max: "price_max" },
  width: { min: "width_min", max: "width_max" },
  height: { min: "height_min", max: "height_max" },
  core: { min: "core_min", max: "core_max" },
  outer_diameter: { min: "outer_diameter_min", max: "outer_diameter_max" },
} as const;

const KNOWN_FILTER_PARAMS = [
  "search",
  "q",
  "type",
  "product_type",
  "sort",
  "page",
  "per_page",
  "price_min",
  "price_max",
  "width_min",
  "width_max",
  "height_min",
  "height_max",
  "core_min",
  "core_max",
  "outer_diameter_min",
  "outer_diameter_max",
  "in_stock",
  "id",
  "slug",
  "sku",
  "article_number",
  "category",
  "category_slug",
  "category_id",
  "brand",
  "material_id",
  "material_category",
  "material_category_id",
  "material_code",
  "material",
  "finishing",
  "glue",
  "adhesive",
  "print_method",
  "druktype",
  "printer_type",
  "detectie",
  "merken",
];

function paramsToString(params: URLSearchParams): string {
  params.sort();
  return params.toString();
}

function valuesFor(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function numberFor(params: URLSearchParams, key: string): number | null {
  const value = params.get(key);
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRangeValue(value: number, unitPrefix?: string, unitSuffix?: string): string {
  return `${unitPrefix ?? ""}${value}${unitSuffix ? ` ${unitSuffix}` : ""}`;
}

function normalizeSortValue(value: string | null, hasSearch: boolean): CatalogSortValue {
  const allowed = new Set(SORT_OPTIONS.map((option) => option.value));
  return allowed.has(value as CatalogSortValue) ? (value as CatalogSortValue) : hasSearch ? "relevance" : "latest";
}

function ProductSkeletonGrid({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-[520px] rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function LegacyProductsListing({ products, currentPage = 1, lastPage = 1, basePath }: LegacyProductsListingProps) {
  const setPage = (page: number) => {
    if (!basePath) return;
    const [path, query = ""] = basePath.split("?");
    const params = new URLSearchParams(query);
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    const next = params.toString();
    window.location.href = next ? `${path}?${next}` : path;
  };

  return (
    <div className="flex flex-col gap-8">
      {products.length === 0 ? (
        <EmptyState title="No products found" description="Try adjusting the filters to see more products." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => {
              const href = product.slug
                ? product.type
                  ? { pathname: `/products/${product.slug}`, query: { type: product.type } }
                  : { pathname: `/products/${product.slug}` }
                : undefined;

              return <ProductCard key={String(product.id)} product={product} href={href} />;
            })}
          </div>

          {lastPage > 1 && basePath ? (
            <ProductPaginationSwitcher currentPage={currentPage} pageCount={lastPage} onPageChange={setPage} />
          ) : null}
        </>
      )}
    </div>
  );
}

function CatalogProductsListing({ initialCatalog, initialQueryString }: ProductsListingProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const currentQueryString = useMemo(() => paramsToString(new URLSearchParams(searchParams.toString())), [searchParams]);
  const initialSortedQueryString = useMemo(
    () => paramsToString(new URLSearchParams(initialQueryString)),
    [initialQueryString],
  );
  const searchValue = searchParams.get("search") ?? searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(searchValue);
  const selectedSort = normalizeSortValue(searchParams.get("sort"), Boolean(searchValue));
  const hasInitialCatalog = currentQueryString === initialSortedQueryString;

  const setParams = (updater: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    updater(next);
    const nextString = paramsToString(next);
    const href = nextString ? `${pathname}?${nextString}` : pathname;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchInput(searchValue);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [searchValue]);

  useEffect(() => {
    if (hasInitialCatalog) {
      const timeoutId = window.setTimeout(() => {
        setCatalog(initialCatalog);
        setError(null);
        setIsLoading(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const controller = new AbortController();
    window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
    }, 0);

    fetch(`/api/catalog/products?${currentQueryString}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Catalog search is temporarily unavailable.");
        }
        return response.json() as Promise<CatalogSearchResponse>;
      })
      .then((nextCatalog) => {
        setCatalog(nextCatalog);
      })
      .catch((fetchError) => {
        if ((fetchError as { name?: string }).name !== "AbortError") {
          setError(fetchError instanceof Error ? fetchError.message : "Catalog search failed.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [currentQueryString, hasInitialCatalog, initialCatalog]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      const activeSearch = searchValue.trim();
      if (nextSearch === activeSearch) return;

      setParams((params) => {
        params.delete("q");
        if (nextSearch) {
          params.set("search", nextSearch);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
      });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = useMemo(() => {
    let count = 0;
    catalog.filters.options.forEach((filter) => {
      count += valuesFor(currentParams, OPTION_PARAM_KEY[filter.key]).length;
    });

    catalog.filters.ranges.forEach((filter) => {
      const rangeKeys = RANGE_PARAM_KEYS[filter.key];
      if (currentParams.has(rangeKeys.min) || currentParams.has(rangeKeys.max)) {
        count += 1;
      }
    });

    if (currentParams.has("in_stock")) count += 1;
    if (currentParams.has("type") || currentParams.has("product_type")) count += 1;
    return count;
  }, [catalog.filters.options, catalog.filters.ranges, currentParams]);

  const clearFilters = () => {
    setParams((params) => {
      KNOWN_FILTER_PARAMS.forEach((key) => params.delete(key));
    });
    setSearchInput("");
  };

  const setSort = (value: CatalogSortValue) => {
    setParams((params) => {
      if ((searchValue && value === "relevance") || (!searchValue && value === "latest")) {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }
      params.set("page", "1");
    });
  };

  const setPage = (page: number) => {
    setParams((params) => {
      if (page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
    });
  };

  const toggleOption = (key: CatalogOptionFilterKey, value: string) => {
    setParams((params) => {
      const paramKey = OPTION_PARAM_KEY[key];
      const selected = new Set(valuesFor(params, paramKey));
      if (selected.has(value)) {
        selected.delete(value);
      } else {
        selected.add(value);
      }

      params.delete(paramKey);
      Array.from(selected).forEach((item) => params.append(paramKey, item));
      params.set("page", "1");
    });
  };

  const setRange = (key: keyof typeof RANGE_PARAM_KEYS, range: [number, number], max: number) => {
    setParams((params) => {
      const rangeKeys = RANGE_PARAM_KEYS[key];
      if (range[0] <= 0) {
        params.delete(rangeKeys.min);
      } else {
        params.set(rangeKeys.min, String(range[0]));
      }

      if (range[1] >= max) {
        params.delete(rangeKeys.max);
      } else {
        params.set(rangeKeys.max, String(range[1]));
      }
      params.set("page", "1");
    });
  };

  const products: CatalogProductResult[] = catalog.products;
  const loading = isLoading || isPending;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-slate-200 px-3 lg:max-w-xl">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
            <circle cx="6.75" cy="6.75" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11.5 11.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products..."
            className="h-11 w-full bg-transparent text-base text-neutral-800 outline-none"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((currentValue) => !currentValue)}
            className={`inline-flex h-10 w-fit items-center gap-4 rounded-[42px] border px-5 py-2 text-neutral-800 transition-colors ${
              isSidebarOpen ? "border-amber-500 bg-amber-50 text-amber-600" : "border-slate-200 hover:border-amber-200"
            }`}
            aria-expanded={isSidebarOpen}
          >
            <span className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M5.5 10H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-lg font-semibold font-['Segoe_UI'] leading-6">Filters</span>
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-600">
                  {activeFilterCount}
                </span>
              ) : null}
            </span>
          </button>

          <label className="flex h-10 items-center gap-3 rounded-[42px] border border-slate-200 px-5 py-2 text-neutral-800">
            <span className="sr-only">Sort products</span>
            <select
              value={selectedSort}
              onChange={(event) => setSort(event.target.value as CatalogSortValue)}
              className="bg-transparent text-base font-normal font-['Segoe_UI'] leading-5 outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={`flex flex-col gap-6 ${isSidebarOpen ? "lg:flex-row lg:items-start" : ""}`}>
        {isSidebarOpen ? (
          <aside className="w-full shrink-0 rounded-xl border border-slate-100 bg-white p-4 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.08)] md:w-96 lg:w-96">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-800">Filters</h2>
                  {activeFilterCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-600">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </div>
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-medium text-amber-500 hover:underline"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col gap-3">
                {catalog.filters.ranges.map((filter) => {
                  const keys = RANGE_PARAM_KEYS[filter.key];
                  const value: [number, number] = [
                    Math.min(numberFor(currentParams, keys.min) ?? 0, filter.max),
                    Math.min(numberFor(currentParams, keys.max) ?? filter.max, filter.max),
                  ];

                  return (
                    <Accordion key={filter.key} title={filter.title} defaultOpen={true} size="compact" className="bg-white">
                      <RangeSlider
                        min={0}
                        max={filter.max}
                        value={value}
                        onChange={() => {}}
                        onAfterChange={(range) => setRange(filter.key, range, filter.max)}
                        formatValue={(rangeValue) => formatRangeValue(rangeValue, filter.unitPrefix, filter.unitSuffix)}
                        inputPrefix={filter.unitPrefix}
                      />
                    </Accordion>
                  );
                })}

                {catalog.filters.options.map((filter) => {
                  const paramKey = OPTION_PARAM_KEY[filter.key];
                  const selectedValues = new Set(valuesFor(currentParams, paramKey));

                  return (
                    <Accordion key={filter.key} title={filter.title} defaultOpen={true} size="compact" className="bg-white">
                      <div className="flex flex-wrap gap-2">
                        {filter.options.map((option) => {
                          const selected = selectedValues.has(option.value);

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleOption(filter.key, option.value)}
                              className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                selected
                                  ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                  : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                              }`}
                              aria-pressed={selected}
                            >
                              <span>{option.label}</span>
                              <span className={selected ? "text-white/75" : "text-slate-400"}>{option.count}</span>
                              {selected ? <span className="text-base leading-none text-white/80">×</span> : null}
                            </button>
                          );
                        })}
                      </div>
                    </Accordion>
                  );
                })}
              </div>
            </div>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-4 text-sm text-neutral-600">
            {loading ? "Loading products..." : `${catalog.total} results`}
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
          ) : loading && products.length === 0 ? (
            <ProductSkeletonGrid isSidebarOpen={isSidebarOpen} />
          ) : products.length === 0 ? (
            <EmptyState title="No products found" description="Try adjusting the filters to see more products." />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                  isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"
                }`}
              >
                {products.map(({ id, product, href }) => (
                  <ProductCard key={id} product={product} href={href} />
                ))}
              </div>

              {catalog.lastPage > 1 ? (
                <ProductPaginationSwitcher
                  currentPage={catalog.currentPage}
                  pageCount={catalog.lastPage}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsListing(props: ProductsListingUnionProps) {
  if ("initialCatalog" in props) {
    return <CatalogProductsListing {...props} />;
  }

  return <LegacyProductsListing {...props} />;
}
