"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { SearchProvider, useSearch } from "@elastic/react-search-ui";
import type { SearchDriverOptions } from "@elastic/search-ui";
import { CategoryScopedProxyConnector } from "@/lib/categoryScopedConnector";
import EmptyState from "@/components/EmptyState";
import ProductCard from "@/components/ProductCard";
import type { ProductCardData } from "@/components/ProductCard";

import ProductListingFilters from "@/components/products-listing/ProductListingFilters";
import { mapProductListingResult } from "@/components/products-listing/productResult";

export type CategoryCardData = ProductCardData;

type CategoryListingProps = {
  products: CategoryCardData[];
  categorySlug: string;
};

const PAGE_SIZE = 24;

type CategoryListingSortValue = "latest" | "oldest" | "title_asc" | "title_desc" | "price_asc" | "price_desc";

const LISTING_SORT_OPTIONS: Array<{ value: CategoryListingSortValue; label: string }> = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Name: A - Z" },
  { value: "title_desc", label: "Name: Z - A" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const LISTING_SORT_TO_SEARCH_UI: Record<CategoryListingSortValue, { field: string; direction: "asc" | "desc" }> = {
  latest: { field: "created_at_timestamp", direction: "desc" },
  oldest: { field: "created_at_timestamp", direction: "asc" },
  title_asc: { field: "title_sort.keyword", direction: "asc" },
  title_desc: { field: "title_sort.keyword", direction: "desc" },
  price_asc: { field: "price", direction: "asc" },
  price_desc: { field: "price", direction: "desc" },
};

const CATEGORY_SEARCH_QUERY = {
  search_fields: {
    article_number: { weight: 10 },
    sku: { weight: 10 },
    title: { weight: 8 },
    name: { weight: 7 },
    slug: { weight: 2 },
    excerpt: { weight: 1.5 },
    description: { weight: 0.4 },
    brand: { weight: 1 },
    merken: { weight: 1 },
  },
  result_fields: {
    id: { raw: {} },
    product_type: { raw: {} },
    type: { raw: {} },
    title: { raw: {} },
    name: { raw: {} },
    slug: { raw: {} },
    article_number: { raw: {} },
    sku: { raw: {} },
    subtitle: { raw: {} },
    excerpt: { raw: {} },
    price: { raw: {} },
    original_price: { raw: {} },
    in_stock: { raw: {} },
    main_image: { raw: {} },
    categories: { raw: {} },
    material: { raw: {} },
    material_title: { raw: {} },
    category_slugs: { raw: {} },
  },
};

function sortValueFromState(sortField?: string, sortDirection?: string): CategoryListingSortValue {
  const match = LISTING_SORT_OPTIONS.find((option) => {
    const mapped = LISTING_SORT_TO_SEARCH_UI[option.value];
    return mapped.field === sortField && mapped.direction === sortDirection;
  });
  return match?.value ?? "latest";
}

function CategorySkeletonGrid({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-[520px] rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function CategoryListingContent({ products }: { products: CategoryCardData[] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    results,
    totalResults,
    current,
    totalPages,
    setCurrent,
    isLoading,
    error,
    sortField,
    sortDirection,
    setSort,
    filters,
    removeFilter,
  } = useSearch((state) => ({
    results: state.results,
    totalResults: state.totalResults,
    current: state.current,
    totalPages: state.totalPages,
    setCurrent: state.setCurrent,
    isLoading: state.isLoading,
    error: state.error,
    sortField: state.sortField,
    sortDirection: state.sortDirection,
    setSort: state.setSort,
    filters: state.filters,
    removeFilter: state.removeFilter,
  }));

  const activeFilters = filters ?? [];
  const activeFilterCount = activeFilters.reduce((count, filter) => count + filter.values.length, 0);
  const page = current || 1;
  const pageCount = totalPages || 1;
  const selectedSort = sortValueFromState(sortField, sortDirection);
  const searchHasResolved = Array.isArray(results) && (typeof totalResults === "number" || !isLoading);
  const fallbackProducts = !searchHasResolved && !error ? products : [];
  const searchProducts = useMemo(() => {
    return searchHasResolved
      ? (results ?? []).map((result, resultIndex) => mapProductListingResult(result, resultIndex))
      : [];
  }, [searchHasResolved, results]);
  
  const [accumulatedProducts, setAccumulatedProducts] = useState<any[]>([]);

  const hasFallbackProducts = fallbackProducts.length > 0;
  const hasSearchProducts = accumulatedProducts.length > 0 || searchProducts.length > 0;

  const handleSortChange = (value: CategoryListingSortValue) => {
    const mapped = LISTING_SORT_TO_SEARCH_UI[value];
    (setSort as (field: string, direction: "asc" | "desc") => void)(mapped.field, mapped.direction);
    setCurrent(1);
  };

  const clearFilters = () => {
    activeFilters.forEach((filter) => removeFilter(filter.field));
    setCurrent(1);
  };

  useEffect(() => {
    if (isLoading) {
      if (current === 1) {
        setAccumulatedProducts([]);
      }
      return;
    }

    if (current === 1) {
      setAccumulatedProducts(searchProducts);
    } else if (searchProducts.length > 0) {
      setAccumulatedProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = searchProducts.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
    }
  }, [searchProducts, current, isLoading]);

  const observerTarget = useRef<HTMLDivElement>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const loadMore = useCallback(() => {
    if (isLoading || isFetchingMore || page >= pageCount) return;
    setIsFetchingMore(true);
    setCurrent(page + 1);
  }, [isLoading, isFetchingMore, page, pageCount, setCurrent]);

  useEffect(() => {
    if (!isLoading) {
      setIsFetchingMore(false);
    }
  }, [isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((v) => !v)}
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
              onChange={(e) => handleSortChange(e.target.value as CategoryListingSortValue)}
              className="bg-transparent text-base font-normal font-['Segoe_UI'] leading-5 outline-none"
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
              <ProductListingFilters />
            </div>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-4 text-sm text-neutral-600">
            {isLoading && !hasFallbackProducts ? "Loading products..." : `${totalResults ?? products.length} results`}
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{String(error)}</div>
          ) : isLoading && current === 1 && !hasFallbackProducts ? (
            <CategorySkeletonGrid isSidebarOpen={isSidebarOpen} />
          ) : !hasFallbackProducts && !hasSearchProducts && !isLoading ? (
            <EmptyState title="No products found" description="Try adjusting the filters to see more products." />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                  isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"
                }`}
              >
                {hasSearchProducts
                  ? accumulatedProducts.map(({ id, product, href }, index) => (
                      <ProductCard key={`search-${id}-${index}`} product={product} href={href} />
                    ))
                  : fallbackProducts.map((product, index) => (
                      <ProductCard
                        key={`fallback-${product.id}-${index}`}
                        product={product}
                        href={(() => {
                          if (!product.slug) return undefined;
                          const isPrinter = product.categories.some(c => c.slug === "labelprinters" || c.name?.toLowerCase().includes("printer"));
                          const prefix = isPrinter ? "printers" : "products";
                          
                          return product.type
                            ? { pathname: `/${prefix}/${product.slug}`, query: { type: product.type } }
                            : `/${prefix}/${product.slug}`;
                        })()}
                      />
                    ))}

                {isLoading && (current ?? 1) > 1 && Array.from({ length: isSidebarOpen ? 3 : 4 }).map((_, i) => (
                  <div key={`loading-skeleton-${i}`} className="flex flex-col gap-4 w-full bg-white border border-gray-100/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-pulse">
                    <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl mb-2"></div>
                    <div className="w-2/3 h-5 bg-slate-100 rounded-full mt-2"></div>
                    <div className="w-1/2 h-5 bg-slate-100 rounded-full"></div>
                    <div className="w-1/3 h-5 bg-slate-100 rounded-full mt-1"></div>
                  </div>
                ))}
              </div>

              {page < pageCount && hasSearchProducts ? (
                <div ref={observerTarget} className="h-20 w-full flex justify-center items-center mt-4">
                  {(isLoading || isFetchingMore) ? (
                    <div className="text-gray-400">Loading more...</div>
                  ) : (
                    <div className="text-gray-400">Scroll for more...</div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoryListing({ products, categorySlug }: CategoryListingProps) {
  const connector = useMemo(
    () => new CategoryScopedProxyConnector({ basePath: "/api", categorySlug }),
    [categorySlug],
  );

  const config = useMemo<SearchDriverOptions>(
    () => ({
      apiConnector: connector,
      trackUrlState: false,
      alwaysSearchOnInitialLoad: true,
      initialState: {
        resultsPerPage: PAGE_SIZE,
        sortField: "created_at_timestamp",
        sortDirection: "desc",
      },
      searchQuery: CATEGORY_SEARCH_QUERY,
    }),
    [connector],
  );

  return (
    <SearchProvider config={config}>
      <CategoryListingContent products={products} />
    </SearchProvider>
  );
}
