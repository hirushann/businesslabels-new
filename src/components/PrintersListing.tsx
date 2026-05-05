"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Filter, FilterValueRange } from "@elastic/search-ui";
import EmptyState from "@/components/EmptyState";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import ProductPaginationSwitcher from "@/components/ProductPaginationSwitcher";
import { ProductListingFiltersView } from "@/components/products-listing/ProductListingFilters";

type ApiProduct = {
  id: string | number;
  sku?: string | null;
  article_number?: string | null;
  title?: string | null;
  name?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  material?: { title?: string | null } | null;
  price?: number | null;
  original_price?: number | null;
  in_stock?: boolean | null;
  main_image?: string | null;
  categories?: Array<{ id?: number; name?: string | null }>;
  slug?: string | null;
  type?: "simple" | "variable" | string | null;
  packing_group?: number | null;
};

type PrinterProductsListingResponse = {
  data?: ApiProduct[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
  rawResponse?: unknown;
  error?: string;
};

type PrintersListingProps = {
  printers: ProductCardData[];
  currentPage: number;
  lastPage: number;
};

type PrinterListingSortValue = "latest" | "oldest" | "title_asc" | "title_desc" | "price_asc" | "price_desc";

const PAGE_SIZE = 24;

const LISTING_SORT_OPTIONS: Array<{ value: PrinterListingSortValue; label: string }> = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Name: A - Z" },
  { value: "title_desc", label: "Name: Z - A" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

function normalizeType(raw: string | null | undefined): "simple" | "variable" | null {
  return raw === "simple" || raw === "variable" ? raw : null;
}

function mapProductToCardData(apiProduct: ApiProduct): ProductCardData {
  return {
    id: apiProduct.id,
    sku: apiProduct.sku || apiProduct.article_number || "",
    name: apiProduct.title || apiProduct.name || "Unnamed printer",
    subtitle: apiProduct.subtitle,
    excerpt: apiProduct.excerpt,
    materialTitle: apiProduct.material?.title,
    price: apiProduct.price,
    originalPrice: apiProduct.original_price,
    inStock: apiProduct.in_stock ?? true,
    mainImage: apiProduct.main_image,
    categories: apiProduct.categories ?? [],
    slug: apiProduct.slug,
    type: normalizeType(apiProduct.type),
    packing_group: apiProduct.packing_group,
  };
}

function cardHref(product: ProductCardData) {
  if (!product.slug) return undefined;

  return product.type
    ? { pathname: `/products/${product.slug}`, query: { type: product.type } }
    : { pathname: `/products/${product.slug}` };
}

function PrinterSkeletonGrid({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-[520px] rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

export default function PrintersListing({ printers, currentPage, lastPage }: PrintersListingProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sort, setSort] = useState<PrinterListingSortValue>("title_asc");
  const [page, setPage] = useState(currentPage || 1);
  const [items, setItems] = useState<ProductCardData[]>(printers);
  const [pageCount, setPageCount] = useState(lastPage || 1);
  const [totalResults, setTotalResults] = useState(printers.length);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFilterCount = useMemo(
    () => filters.reduce((count, filter) => count + filter.values.length, 0),
    [filters],
  );

  const addFilter = useCallback((name: string, value: string, type: "any" = "any") => {
    setFilters((currentFilters) => {
      const existing = currentFilters.find((filter) => filter.field === name && filter.type === type);
      const otherFilters = currentFilters.filter((filter) => filter.field !== name || filter.type !== type);
      const values = existing?.values ?? [];
      const nextValues = values.includes(value) ? values : [...values, value];
      return [...otherFilters, { field: name, values: nextValues, type }];
    });
    setPage(1);
  }, []);

  const removeFilter = useCallback((name: string, value?: string, type?: "any") => {
    setFilters((currentFilters) => {
      if (value === undefined) {
        return currentFilters.filter((filter) => filter.field !== name || (type !== undefined && filter.type !== type));
      }

      return currentFilters.flatMap((filter) => {
        if (filter.field !== name || (type !== undefined && filter.type !== type)) return [filter];

        const nextValues = filter.values.filter((filterValue) => filterValue !== value);
        return nextValues.length > 0 ? [{ ...filter, values: nextValues }] : [];
      });
    });
    setPage(1);
  }, []);

  const setFilter = useCallback((name: string, value: FilterValueRange) => {
    setFilters((currentFilters) => [
      ...currentFilters.filter((filter) => filter.field !== name),
      { field: name, values: [value], type: "all" },
    ]);
    setPage(1);
  }, []);

  const clearFilters = () => {
    setFilters([]);
    setPage(1);
  };

  const handleSortChange = (value: PrinterListingSortValue) => {
    setSort(value);
    setPage(1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PAGE_SIZE),
      sort,
    });

    if (filters.length > 0) {
      params.set("filters", JSON.stringify(filters));
    }

    async function loadPrinters() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/printers?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = (await response.json()) as PrinterProductsListingResponse;

        if (!response.ok) {
          throw new Error(json.error || "Failed to fetch printers");
        }

        setItems((json.data ?? []).map(mapProductToCardData));
        setPageCount(json.meta?.last_page ?? 1);
        setTotalResults(json.meta?.total ?? 0);
        setRawResponse(json.rawResponse ?? null);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch printers");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadPrinters();

    return () => controller.abort();
  }, [filters, page, sort]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-4">
        <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">Printer Products</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

          <label className="flex h-10 w-fit items-center gap-3 rounded-[42px] border border-slate-200 px-5 text-neutral-800">
            <span className="sr-only">Sort printers</span>
            <select
              value={sort}
              onChange={(event) => handleSortChange(event.target.value as PrinterListingSortValue)}
              className="bg-transparent text-base leading-5 outline-none"
            >
              {LISTING_SORT_OPTIONS.map((option) => (
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
              <ProductListingFiltersView
                activeFilters={filters}
                rawResponse={rawResponse}
                addFilter={addFilter}
                removeFilter={removeFilter}
                setFilter={setFilter}
              />
            </div>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-4 text-sm text-neutral-600">
            {isLoading && items.length === 0 ? "Loading printers..." : `${totalResults} results`}
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
          ) : isLoading && items.length === 0 ? (
            <PrinterSkeletonGrid isSidebarOpen={isSidebarOpen} />
          ) : items.length === 0 ? (
            <EmptyState title="No printers found" description="Try adjusting the filters to see more printers." />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                  isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"
                }`}
              >
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} href={cardHref(product)} />
                ))}
              </div>

              {pageCount > 1 ? (
                <ProductPaginationSwitcher currentPage={page} pageCount={pageCount} onPageChange={setPage} />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
