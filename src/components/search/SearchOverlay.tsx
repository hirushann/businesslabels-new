'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchProvider, useSearch } from '@elastic/react-search-ui';
import type { SearchDriverOptions } from '@elastic/search-ui';
import { apiConnector, SORT_TO_SEARCH_UI, type OverlaySortValue } from './api';
import { useNextRoutingOptions } from './useNextRouting';
import EmptyState from '@/components/EmptyState';
import ProductCard, { type ProductCardData } from '@/components/ProductCard';
import SearchFilters from './SearchFilters';

type SearchOverlayProps = {
  onClose: () => void;
};

const SORT_OPTIONS: Array<{ value: OverlaySortValue; label: string }> = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title_asc', label: 'Name: A - Z' },
  { value: 'title_desc', label: 'Name: Z - A' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const PAGE_SIZE = 24;
const MIN_QUERY_LENGTH = 2;

function getRaw(result: unknown, field: string): unknown {
  const entry = (result as Record<string, { raw?: unknown }>)?.[field];
  return entry?.raw;
}

function getMetaValue(result: unknown, key: string): unknown {
  const direct = getRaw(result, key);
  if (direct !== undefined && direct !== null) return direct;

  const meta = getRaw(result, 'meta');
  if (!meta) return null;

  if (Array.isArray(meta)) {
    const entry = meta.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const record = item as { key?: unknown };
      return record.key === key;
    });

    return entry && typeof entry === 'object' ? (entry as { value?: unknown }).value : null;
  }

  if (typeof meta === 'object') {
    const value = (meta as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      const first = value[0];
      if (first && typeof first === 'object' && 'value' in first) {
        return (first as { value?: unknown }).value;
      }
      return first ?? null;
    }

    if (value && typeof value === 'object' && 'value' in value) {
      return (value as { value?: unknown }).value;
    }

    return value ?? null;
  }

  return null;
}

function firstScalar(value: unknown): string | number | boolean | null {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const scalar = firstScalar(item);
      if (scalar !== null) return scalar;
    }
  }

  return null;
}

function valueAsString(value: unknown): string | null {
  const scalar = firstScalar(value);
  if (scalar === null) return null;

  return String(scalar);
}

function valueAsNumber(value: unknown): number | null {
  const scalar = firstScalar(value);
  if (typeof scalar === 'number') return scalar;
  if (typeof scalar === 'string' && scalar.trim() !== '') {
    const parsed = Number(scalar);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function valueAsBoolean(value: unknown): boolean {
  const scalar = firstScalar(value);
  if (typeof scalar === 'boolean') return scalar;
  if (typeof scalar === 'number') return scalar > 0;
  if (typeof scalar === 'string') return ['1', 'true', 'yes', 'in_stock'].includes(scalar.toLowerCase());

  return false;
}

function normalizeResultType(value: unknown): 'simple' | 'variable' | null {
  const scalar = valueAsString(value);
  if (scalar === 'simple' || scalar === 'variable') {
    return scalar;
  }

  return null;
}

function titleForProduct(result: unknown): string {
  const title = valueAsString(getRaw(result, 'title'));
  const name = valueAsString(getRaw(result, 'name'));
  const postTitle = valueAsString(getRaw(result, 'post_title'));

  if (typeof title === 'string' && title.trim() !== '') return title;
  if (typeof name === 'string' && name.trim() !== '') return name;
  if (typeof postTitle === 'string' && postTitle.trim() !== '') return postTitle;
  return 'Unnamed product';
}

function imageForProduct(result: unknown): string | null {
  const mainImage = valueAsString(getRaw(result, 'main_image'));
  if (mainImage && mainImage.trim() !== '') return mainImage;

  const fallbackImage = valueAsString(getRaw(result, 'image'));
  if (fallbackImage && fallbackImage.trim() !== '') return fallbackImage;

  const thumbnail = getRaw(result, 'thumbnail');
  if (typeof thumbnail === 'string' && thumbnail.trim() !== '') return thumbnail;
  if (thumbnail && typeof thumbnail === 'object') {
    const src = valueAsString((thumbnail as { src?: unknown }).src);
    if (src && src.trim() !== '') return src;
    const url = valueAsString((thumbnail as { url?: unknown }).url);
    if (url && url.trim() !== '') return url;
  }

  const images = getRaw(result, 'images');
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];

    if (typeof first === 'string' && first.trim() !== '') {
      return first;
    }

    if (typeof first === 'object' && first !== null) {
      const src = valueAsString((first as { src?: unknown }).src);
      if (src && src.trim() !== '') return src;
      const url = valueAsString((first as { url?: unknown }).url);
      if (url && url.trim() !== '') return url;
    }
  }

  return null;
}

function categoriesForProduct(result: unknown): Array<{ id?: number; name?: string | null }> {
  const categories = getRaw(result, 'categories');
  if (Array.isArray(categories)) {
    return categories
      .map((category) => {
        if (typeof category === 'string') {
          return { name: category };
        }

        if (typeof category === 'object' && category !== null) {
          const record = category as { id?: unknown; term_id?: unknown; name?: unknown };
          const id = valueAsNumber(record.id) ?? valueAsNumber(record.term_id) ?? undefined;
          const name = valueAsString(record.name);
          return { id, name };
        }

        return null;
      })
      .filter((category) => category !== null) as Array<{ id?: number; name?: string | null }>;
  }

  const terms = getRaw(result, 'terms');
  const productCategories =
    terms && typeof terms === 'object' ? (terms as { product_cat?: unknown }).product_cat : null;

  if (!Array.isArray(productCategories)) return [];

  return productCategories
    .map((category) => {
      if (typeof category === 'string') {
        return { name: category };
      }

      if (typeof category === 'object' && category !== null) {
        const record = category as { id?: unknown; term_id?: unknown; name?: unknown };
        const id = valueAsNumber(record.id) ?? valueAsNumber(record.term_id) ?? undefined;
        const name = valueAsString(record.name);
        return { id, name };
      }

      return null;
    })
    .filter((category) => category !== null) as Array<{ id?: number; name?: string | null }>;
}

function materialTitleForProduct(result: unknown): string | null {
  const direct = valueAsString(getRaw(result, 'material_title'));
  if (direct) return direct;

  const material = getRaw(result, 'material');
  if (material && typeof material === 'object') {
    return valueAsString((material as { title?: unknown }).title);
  }

  return null;
}

function skuForProduct(result: unknown): string | null {
  return valueAsString(getRaw(result, 'sku')) ?? valueAsString(getMetaValue(result, '_sku'));
}

function toDisplayImageUrl(url: string | null): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) return url;

  // Load remote product media through same-origin route to avoid browser-side host/protocol issues.
  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}

function sortValueFromState(sortField?: string, sortDirection?: string, queryMode = false): OverlaySortValue {
  if (!sortField && !sortDirection) return queryMode ? 'relevance' : 'latest';

  const match = SORT_OPTIONS.find((option) => {
    const mapped = SORT_TO_SEARCH_UI[option.value];
    if (!mapped.field || !mapped.direction) return false;
    return mapped.field === sortField && mapped.direction === sortDirection;
  });

  return match?.value ?? (queryMode ? 'relevance' : 'latest');
}

function OverlayContent({ onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    searchTerm,
    setSearchTerm,
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
    searchTerm: state.searchTerm,
    setSearchTerm: state.setSearchTerm,
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
  const [inputValue, setInputValue] = useState(searchTerm || '');
  const [manualSort, setManualSort] = useState<OverlaySortValue | null>(null);
  const activeFilters = filters ?? [];
  const queryValue = inputValue.trim();
  const queryMode = queryValue.length >= MIN_QUERY_LENGTH;

  const applySort = (sortValue: OverlaySortValue) => {
    const mapped = SORT_TO_SEARCH_UI[sortValue];

    // Empty sort in Search UI means fallback to Elasticsearch relevance (_score).
    if (!mapped.field || !mapped.direction) {
      (setSort as unknown as (field: unknown, direction?: unknown) => void)([], undefined);
      return;
    }

    setSort(mapped.field, mapped.direction);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const currentSearch = (searchTerm || '').trim();

      if (queryValue.length < MIN_QUERY_LENGTH) {
        if (currentSearch !== '') {
          setSearchTerm('', {
            refresh: true,
            shouldClearFilters: false,
          });
          setCurrent(1);
        }
        return;
      }

      if (queryValue === currentSearch) return;

      setSearchTerm(queryValue, {
        refresh: true,
        shouldClearFilters: false,
      });
      setCurrent(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [queryValue, searchTerm, setCurrent, setSearchTerm]);

  useEffect(() => {
    if (manualSort) return;
    applySort(queryMode ? 'relevance' : 'latest');
  }, [manualSort, queryMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedSort = manualSort ?? sortValueFromState(sortField, sortDirection, queryMode);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/25 flex items-center justify-center p-0 md:p-10"
      onClick={onClose}
    >
      <div
        className="w-full h-full bg-white overflow-hidden shadow-2xl md:h-[calc(100vh-80px)] md:w-[calc(100vw-80px)] md:max-w-[1680px] md:max-h-[920px] md:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-360 mx-auto flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full flex items-center h-12 bg-white border border-slate-200 rounded-md px-3 gap-2">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <circle cx="6.75" cy="6.75" r="5.25" stroke="#9CA3AF" strokeWidth="1.5" />
                <path d="M11.5 11.5L14.5 14.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                }}
                placeholder="Search products..."
                className="w-full h-full bg-transparent outline-none text-base text-neutral-800"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedSort}
                onChange={(event) => {
                  const key = event.target.value as OverlaySortValue;
                  setManualSort(key);
                  applySort(key);
                }}
                className="h-10 px-3 border border-slate-300 rounded-md bg-white text-sm text-neutral-700 w-full md:w-[220px]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 border border-slate-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="h-[calc(100%-81px)] flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar */}
          <aside className="scrollbar-none w-full md:w-96 lg:w-96 border-r border-slate-100 overflow-y-auto p-4 lg:p-6 bg-slate-50/50">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-neutral-800 text-xl font-bold">Filters</h2>
                {activeFilters.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      activeFilters.forEach(f => removeFilter(f.field));
                    }}
                    className="text-amber-500 text-sm font-medium hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <SearchFilters />
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
            <div className="max-w-360 mx-auto">
              <div className="mb-4 text-sm text-neutral-600">
                {isLoading ? 'Searching...' : `${totalResults || 0} results`}
              </div>

            {error ? (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">{String(error)}</div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-72 rounded-xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : (results?.length || 0) === 0 ? (
              <EmptyState
                title="No products found"
                description="Try a different search term or adjust the filters to see more results."
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {(results || []).map((result, resultIndex) => {
                    const normalizedType = normalizeResultType(getRaw(result, 'product_type')) ?? normalizeResultType(getRaw(result, 'type'));
                    const slug = valueAsString(getRaw(result, 'slug')) ?? valueAsString(getRaw(result, 'post_name'));
                    const image = toDisplayImageUrl(imageForProduct(result));
                    const sku = skuForProduct(result);
                    const id = valueAsString(getRaw(result, 'id')) ?? valueAsString(getRaw(result, 'ID')) ?? `result-${resultIndex}`;
                    const cardProduct: ProductCardData = {
                      id,
                      sku: sku || '-',
                      name: titleForProduct(result),
                      subtitle: valueAsString(getRaw(result, 'subtitle')),
                      excerpt: valueAsString(getRaw(result, 'excerpt')),
                      materialTitle: materialTitleForProduct(result),
                      price: valueAsNumber(getRaw(result, 'price')),
                      originalPrice: valueAsNumber(getRaw(result, 'original_price')),
                      inStock: valueAsBoolean(getRaw(result, 'in_stock')),
                      mainImage: image,
                      categories: categoriesForProduct(result),
                      slug,
                      type: normalizedType,
                    };

                    const href =
                      slug && normalizedType
                        ? {
                            pathname: `/products/${slug}`,
                            query: { type: normalizedType },
                          }
                        : slug
                          ? `/products/${slug}`
                          : undefined;

                    return <ProductCard key={id} product={cardProduct} href={href} onClick={onClose} />;
                  })}
                </div>

                {(totalPages || 0) > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      type="button"
                      onClick={() => setCurrent(Math.max(1, (current || 1) - 1))}
                      disabled={(current || 1) <= 1}
                      className="h-9 px-3 border border-slate-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Prev
                    </button>

                    <div className="text-sm text-neutral-600 px-2">
                      Page {current || 1} of {totalPages || 1}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrent(Math.min(totalPages || 1, (current || 1) + 1))}
                      disabled={(current || 1) >= (totalPages || 1)}
                      className="h-9 px-3 border border-slate-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const routingOptions = useNextRoutingOptions();

  const config = useMemo<SearchDriverOptions>(
    () => ({
      apiConnector,
      trackUrlState: true,
      routingOptions,
      alwaysSearchOnInitialLoad: true,
      initialState: {
        resultsPerPage: PAGE_SIZE,
        sortField: 'created_at_timestamp',
        sortDirection: 'desc',
      },
      searchQuery: {
        search_fields: {
          article_number: { weight: 10 },
          sku: { weight: 10 },
          'meta._sku.value': { weight: 10 },
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
        },
      },
    }),
    [routingOptions]
  );

  return (
    <SearchProvider config={config}>
      <OverlayContent onClose={onClose} />
    </SearchProvider>
  );
}
