"use client";

import { useMemo, useState } from "react";
import { SearchProvider, useSearch } from "@elastic/react-search-ui";
import type { SearchDriverOptions } from "@elastic/search-ui";
import { ApiProxyConnector } from "@elastic/search-ui-elasticsearch-connector";
import EmptyState from "@/components/EmptyState";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import ProductPaginationSwitcher from "@/components/ProductPaginationSwitcher";
import ProductListingFilters from "@/components/products-listing/ProductListingFilters";
import { mapProductListingResult } from "@/components/products-listing/productResult";

export type ListingProductCardData = ProductCardData;

type ProductsListingProps = {
  products: ListingProductCardData[];
  currentPage: number;
  lastPage: number;
  basePath?: string;
};

const PAGE_SIZE = 24;

type ProductListingSortValue = "latest" | "oldest" | "title_asc" | "title_desc" | "price_asc" | "price_desc";

const productListingConnector = new ApiProxyConnector({
  basePath: "/api",
});

const LISTING_SORT_OPTIONS: Array<{ value: ProductListingSortValue; label: string }> = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Name: A - Z" },
  { value: "title_desc", label: "Name: Z - A" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const LISTING_SORT_TO_SEARCH_UI: Record<ProductListingSortValue, { field: string; direction: "asc" | "desc" }> = {
  latest: { field: "created_at_timestamp", direction: "desc" },
  oldest: { field: "created_at_timestamp", direction: "asc" },
  title_asc: { field: "title_sort.keyword", direction: "asc" },
  title_desc: { field: "title_sort.keyword", direction: "desc" },
  price_asc: { field: "price", direction: "asc" },
  price_desc: { field: "price", direction: "desc" },
};

const PRODUCT_LISTING_SEARCH_QUERY = {
  search_fields: {
    article_number: { weight: 10 },
    sku: { weight: 10 },
    "meta._sku.value": { weight: 10 },
    title: { weight: 8 },
    name: { weight: 7 },
    post_title: { weight: 8 },
    slug: { weight: 2 },
    post_name: { weight: 2 },
    variant_skus: { weight: 2 },
    material_title: { weight: 1.2 },
    material_slug: { weight: 1 },
    material_code: { weight: 1.2 },
    brand: { weight: 1 },
    merken: { weight: 1 },
    druktype: { weight: 0.8 },
    finishing: { weight: 0.8 },
    excerpt: { weight: 1.5 },
    description: { weight: 0.4 },
    content: { weight: 0.3 },
    post_content: { weight: 0.4 },
    product_information: { weight: 0.3 },
  },
  result_fields: {
    id: { raw: {} },
    ID: { raw: {} },
    product_type: { raw: {} },
    type: { raw: {} },
    title: { raw: {} },
    name: { raw: {} },
    post_title: { raw: {} },
    slug: { raw: {} },
    post_name: { raw: {} },
    article_number: { raw: {} },
    sku: { raw: {} },
    subtitle: { raw: {} },
    excerpt: { raw: {} },
    price: { raw: {} },
    original_price: { raw: {} },
    stock: { raw: {} },
    in_stock: { raw: {} },
    main_image: { raw: {} },
    image: { raw: {} },
    thumbnail: { raw: {} },
    images: { raw: {} },
    categories: { raw: {} },
    terms: { raw: {} },
    meta: { raw: {} },
    material: { raw: {} },
    material_title: { raw: {} },
    warranty_available: { raw: {} },
    warranty_option_ids: { raw: {} },
    warranty_option_names: { raw: {} },
    warranty_option_months: { raw: {} },
    warranty_option_prices: { raw: {} },
  },
};

function productListingSortValueFromState(
  sortField?: string,
  sortDirection?: string,
): ProductListingSortValue {
  const match = LISTING_SORT_OPTIONS.find((option) => {
    const mapped = LISTING_SORT_TO_SEARCH_UI[option.value];
    return mapped.field === sortField && mapped.direction === sortDirection;
  });

  return match?.value ?? "latest";
}

function applyProductListingSort(
  setSort: (field: string, direction: "asc" | "desc") => void,
  sortValue: ProductListingSortValue,
) {
  const mapped = LISTING_SORT_TO_SEARCH_UI[sortValue];
  setSort(mapped.field, mapped.direction);
}

function cardHref(product: ListingProductCardData) {
  if (!product.slug) return undefined;

  return product.type
    ? { pathname: `/products/${product.slug}`, query: { type: product.type } }
    : { pathname: `/products/${product.slug}` };
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

function ProductsListingContent({ products }: { products: ListingProductCardData[] }) {
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
  const selectedSort = productListingSortValueFromState(sortField, sortDirection);
  const searchHasResolved = Array.isArray(results) && (typeof totalResults === "number" || !isLoading);
  const fallbackProducts = !searchHasResolved && !error ? products : [];
  const searchProducts = searchHasResolved
    ? (results ?? []).map((result, resultIndex) => mapProductListingResult(result, resultIndex))
    : [];
  const hasFallbackProducts = fallbackProducts.length > 0;
  const hasSearchProducts = searchProducts.length > 0;

  const handleSortChange = (value: ProductListingSortValue) => {
    applyProductListingSort(setSort as (field: string, direction: "asc" | "desc") => void, value);
    setCurrent(1);
  };

  const clearFilters = () => {
    activeFilters.forEach((filter) => removeFilter(filter.field));
    setCurrent(1);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            onChange={(event) => handleSortChange(event.target.value as ProductListingSortValue)}
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
          ) : isLoading && !hasFallbackProducts ? (
            <ProductSkeletonGrid isSidebarOpen={isSidebarOpen} />
          ) : !hasFallbackProducts && !hasSearchProducts ? (
            <EmptyState title="No products found" description="Try adjusting the filters to see more products." />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                  isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"
                }`}
              >
                {hasSearchProducts
                  ? searchProducts.map(({ id, product, href }) => {
                      return <ProductCard key={id} product={product} href={href} />;
                    })
                  : fallbackProducts.map((product) => {
                      return <ProductCard key={product.id} product={product} href={cardHref(product)} />;
                    })}
              </div>

              {pageCount > 1 && hasSearchProducts ? (
                <ProductPaginationSwitcher currentPage={page} pageCount={pageCount} onPageChange={setCurrent} />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsListing({ products }: ProductsListingProps) {
  const config = useMemo<SearchDriverOptions>(
    () => ({
      apiConnector: productListingConnector,
      trackUrlState: false,
      alwaysSearchOnInitialLoad: true,
      initialState: {
        resultsPerPage: PAGE_SIZE,
        sortField: "created_at_timestamp",
        sortDirection: "desc",
      },
      searchQuery: PRODUCT_LISTING_SEARCH_QUERY,
    }),
    [],
  );

  return (
    <SearchProvider config={config}>
      <ProductsListingContent products={products} />
    </SearchProvider>
  );
}
