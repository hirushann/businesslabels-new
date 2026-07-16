"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchProvider, useSearch } from "@elastic/react-search-ui";
import { useTranslations, useLocale } from "next-intl";
import type { SearchDriverOptions } from "@elastic/search-ui";
import { CategoryScopedProxyConnector } from "@/lib/categoryScopedConnector";
import EmptyState from "@/components/EmptyState";
import ProductCard from "@/components/ProductCard";
import type { ProductCardData } from "@/components/ProductCard";
import ProductListingFilters from "@/components/products-listing/ProductListingFilters";
import { mapProductListingResult } from "@/components/products-listing/productResult";

export type PrinterCardData = ProductCardData;

type PrintersListingProps = {
  printers: PrinterCardData[];
  currentPage?: number;
  lastPage?: number;
};

const PAGE_SIZE = 24;

type PrinterListingSortValue = "latest" | "oldest" | "title_asc" | "title_desc" | "price_asc" | "price_desc";

const SORT_VALUES: PrinterListingSortValue[] = ["latest", "oldest", "title_asc", "title_desc", "price_asc", "price_desc"];

const LISTING_SORT_TO_SEARCH_UI: Record<PrinterListingSortValue, { field: string; direction: "asc" | "desc" }> = {
  latest: { field: "created_at_timestamp", direction: "desc" },
  oldest: { field: "created_at_timestamp", direction: "asc" },
  title_asc: { field: "title_sort.keyword", direction: "asc" },
  title_desc: { field: "title_sort.keyword", direction: "desc" },
  price_asc: { field: "price", direction: "asc" },
  price_desc: { field: "price", direction: "desc" },
};

const PRINTERS_SEARCH_QUERY = {
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
    subtitle_en: { raw: {} },
    subtitle_nl: { raw: {} },
    excerpt: { raw: {} },
    excerpt_en: { raw: {} },
    excerpt_nl: { raw: {} },
    price: { raw: {} },
    original_price: { raw: {} },
    in_stock: { raw: {} },
    main_image: { raw: {} },
    categories: { raw: {} },
    material: { raw: {} },
    material_title: { raw: {} },
    category_slugs: { raw: {} },
    is_group_product: { raw: {} },
    is_label_product: { raw: {} },
    translations: { raw: {} },
    material_translations: { raw: {} },
  },
};

function sortValueFromState(sortField?: string, sortDirection?: string): PrinterListingSortValue {
  const match = SORT_VALUES.find((value) => {
    const mapped = LISTING_SORT_TO_SEARCH_UI[value];
    return mapped.field === sortField && mapped.direction === sortDirection;
  });
  return match ?? "latest";
}

function PrinterSkeletonGrid({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isSidebarOpen ? "xl:grid-cols-3" : "lg:grid-cols-3"}`}>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-[520px] rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function PrintersListingContent({ printers }: { printers: PrinterCardData[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const sortOptions = useMemo(() => [
    { value: "latest" as const, label: t("sort.latest") },
    { value: "oldest" as const, label: t("sort.oldest") },
    { value: "title_asc" as const, label: t("sort.nameAsc") },
    { value: "title_desc" as const, label: t("sort.nameDesc") },
    { value: "price_asc" as const, label: t("sort.priceAsc") },
    { value: "price_desc" as const, label: t("sort.priceDesc") },
  ], [t]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [accumulatedPrinters, setAccumulatedPrinters] = useState<ReturnType<typeof mapProductListingResult>[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
  const fallbackPrinters = !searchHasResolved && !error ? printers : [];
  const searchPrinters = useMemo(() => {
    return searchHasResolved
      ? (results ?? []).map((result, resultIndex) => mapProductListingResult(result, resultIndex, t("product.unnamedProduct"), locale))
      : [];
  }, [results, searchHasResolved, t, locale]);
  const hasFallbackPrinters = fallbackPrinters.length > 0;
  const hasSearchPrinters = accumulatedPrinters.length > 0;
  const hasMorePrinters = page < pageCount;

  const handleSortChange = (value: PrinterListingSortValue) => {
    const mapped = LISTING_SORT_TO_SEARCH_UI[value];
    (setSort as (field: string, direction: "asc" | "desc") => void)(mapped.field, mapped.direction);
    setCurrent(1);
  };

  useEffect(() => {
    if (isLoading) return;

    const timeoutId = window.setTimeout(() => {
      if (page <= 1) {
        setAccumulatedPrinters(searchPrinters);
        return;
      }

      setAccumulatedPrinters((currentPrinters) => {
        const existingIds = new Set(currentPrinters.map((item) => item.id));
        const nextPrinters = searchPrinters.filter((item) => !existingIds.has(item.id));
        return [...currentPrinters, ...nextPrinters];
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, page, searchPrinters]);

  const loadMorePrinters = useCallback(() => {
    if (isLoading || isFetchingMore || !hasMorePrinters) return;
    setIsFetchingMore(true);
    setCurrent(page + 1);
  }, [hasMorePrinters, isFetchingMore, isLoading, page, setCurrent]);

  useEffect(() => {
    if (isLoading) return;

    const timeoutId = window.setTimeout(() => {
      setIsFetchingMore(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMorePrinters) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMorePrinters();
        }
      },
      { rootMargin: "480px 0px", threshold: 0.01 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMorePrinters, loadMorePrinters]);

  const clearFilters = () => {
    activeFilters.forEach((filter) => removeFilter(filter.field));
    setCurrent(1);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-4">
        <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">{t("finder.printerProducts")}</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              className={`inline-flex h-[42px] w-fit items-center gap-2 px-1 py-2 transition-colors ${
                isSidebarOpen ? "text-brand" : "text-neutral-800 hover:text-brand"
              }`}
              aria-expanded={isSidebarOpen}
            >
              <span className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
                  <path d="M17.4993 3.33398H11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.33333 3.33398H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17.5 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.66667 10H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17.5007 16.666H13.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 16.666H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.666 1.66602V4.99935" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.334 15V18.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-lg font-bold font-sans leading-6">{t("finder.filters")}</span>
                {activeFilterCount > 0 ? (
                  <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                    isSidebarOpen ? "bg-amber-100 text-brand" : "bg-brand text-white"
                  }`}>
                    {activeFilterCount}
                  </span>
                ) : null}
              </span>
            </button>
            
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-slate-400 hover:text-brand underline underline-offset-4"
              >
                {t("finder.clearAll")}
              </button>
            ) : null}
          </div>

          <div className="relative flex shrink-0 items-center h-10 self-end md:self-auto">
            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value as PrinterListingSortValue)}
              className="appearance-none bg-transparent text-right text-sm font-medium font-sans outline-none cursor-pointer hover:text-brand pr-6 text-neutral-800"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.66699 10L8.00033 13.3333L11.3337 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.66699 6.00001L8.00033 2.66667L11.3337 6.00001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex flex-col gap-6 ${isSidebarOpen ? "lg:flex-row lg:items-start" : ""}`}>
        {isSidebarOpen ? (
          <aside className="w-full shrink-0 rounded-xl border border-slate-100 bg-white p-4 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.08)] md:w-96 lg:w-96">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-800">{t("finder.filters")}</h2>
                  {activeFilterCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-brand">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </div>
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    {t("finder.clearAll")}
                  </button>
                ) : null}
              </div>
              <ProductListingFilters />
            </div>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-4 text-sm text-neutral-600">
            {isLoading && !hasFallbackPrinters ? t("finder.loadingPrinters") : t("search.results", { count: totalResults ?? printers.length })}
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{String(error)}</div>
          ) : isLoading && !hasFallbackPrinters && accumulatedPrinters.length === 0 ? (
            <PrinterSkeletonGrid isSidebarOpen={isSidebarOpen} />
          ) : !hasFallbackPrinters && !hasSearchPrinters ? (
            <EmptyState title={t("finder.noPrintersFound")} description={t("finder.noPrintersDescriptionFilters")} />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                  isSidebarOpen ? "xl:grid-cols-3" : "lg:grid-cols-3"
                }`}
              >
                {hasSearchPrinters
                  ? accumulatedPrinters.map(({ id, product, href }) => (
                      <ProductCard key={id} product={product} href={href} />
                    ))
                  : fallbackPrinters.map((product) => (
                      <ProductCard
                        key={String(product.id)}
                        product={product}
                        href={
                          product.slug && product.type
                            ? { pathname: `/product/${product.slug}`, query: { type: product.type } }
                            : product.slug
                              ? `/product/${product.slug}`
                              : undefined
                        }
                      />
                    ))}
              </div>

              {isLoading && accumulatedPrinters.length > 0 ? (
                <PrinterSkeletonGrid isSidebarOpen={isSidebarOpen} />
              ) : null}

              {hasMorePrinters && hasSearchPrinters ? (
                <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center pt-4 text-sm text-slate-500">
                  {isFetchingMore || isLoading ? t("finder.loadingMorePrinters") : t("finder.scrollForMorePrinters")}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrintersListing({ printers }: PrintersListingProps) {
  const connector = useMemo(
    () => new CategoryScopedProxyConnector({ basePath: "/api", categorySlug: "labelprinters" }),
    [],
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
      searchQuery: PRINTERS_SEARCH_QUERY,
    }),
    [connector],
  );

  return (
    <SearchProvider config={config}>
      <PrintersListingContent printers={printers} />
    </SearchProvider>
  );
}
