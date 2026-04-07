'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchProvider, useSearch } from '@elastic/react-search-ui';
import type { SearchDriverOptions } from '@elastic/search-ui';
import { apiConnector, SORT_TO_SEARCH_UI, type OverlaySortValue } from './api';
import { useNextRoutingOptions } from './useNextRouting';

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

function formatPrice(value: unknown): string {
  const numericValue = valueAsNumber(value);
  if (numericValue === null) return '-';

  return `€${numericValue.toFixed(2)}`;
}

function getRaw(result: unknown, field: string): unknown {
  const entry = (result as Record<string, { raw?: unknown }>)?.[field];
  return entry?.raw;
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

function titleForProduct(result: unknown): string {
  const title = valueAsString(getRaw(result, 'title'));
  const name = valueAsString(getRaw(result, 'name'));

  if (typeof title === 'string' && title.trim() !== '') return title;
  if (typeof name === 'string' && name.trim() !== '') return name;
  return 'Unnamed product';
}

function imageForProduct(result: unknown): string | null {
  const mainImage = valueAsString(getRaw(result, 'main_image'));
  if (mainImage && mainImage.trim() !== '') return mainImage;

  const fallbackImage = valueAsString(getRaw(result, 'image'));
  if (fallbackImage && fallbackImage.trim() !== '') return fallbackImage;

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
  }));
  const [inputValue, setInputValue] = useState(searchTerm || '');
  const [manualSort, setManualSort] = useState<OverlaySortValue | null>(null);
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
        className="w-full h-full bg-[#F7F7F7] overflow-hidden shadow-2xl md:h-[calc(100vh-80px)] md:w-[calc(100vw-80px)] md:max-w-[1680px] md:max-h-[920px] md:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center gap-4">
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

        <div className="h-[calc(100%-81px)] overflow-y-auto px-4 py-6">
          <div className="max-w-[1440px] mx-auto">
            <div className="mb-4 text-sm text-neutral-600">
              {isLoading ? 'Searching...' : `${totalResults || 0} results`}
            </div>

            {error ? (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">{String(error)}</div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-72 rounded-xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : (results?.length || 0) === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-neutral-500">
                No products found.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {(results || []).map((result, resultIndex) => {
                    const type = valueAsString(getRaw(result, 'product_type')) ?? valueAsString(getRaw(result, 'type'));
                    const inStock = valueAsBoolean(getRaw(result, 'in_stock'));
                    const image = toDisplayImageUrl(imageForProduct(result));
                    const articleNumber = valueAsString(getRaw(result, 'article_number'));
                    const sku = valueAsString(getRaw(result, 'sku'));
                    const stock = valueAsNumber(getRaw(result, 'stock'));
                    const id = valueAsString(getRaw(result, 'id')) ?? `result-${resultIndex}`;

                    return (
                      <div
                        key={id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                      >
                        <div className="h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                          {typeof image === 'string' && image ? (
                            <img src={image} alt={titleForProduct(result)} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm text-slate-400">No image</span>
                          )}
                        </div>

                        <div className="p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-blue-500 uppercase tracking-wide">{String(type ?? '-')}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                inStock ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {inStock ? 'In stock' : 'Out of stock'}
                            </span>
                          </div>

                          <h3 className="text-base font-semibold text-neutral-800 line-clamp-2 min-h-12">
                            {titleForProduct(result)}
                          </h3>

                          <div className="text-sm text-neutral-500">
                            {typeof articleNumber === 'string' && articleNumber
                              ? `Art: ${articleNumber}`
                              : typeof sku === 'string' && sku
                                ? `SKU: ${sku}`
                                : '-'}
                          </div>

                          <div className="flex items-end justify-between gap-3">
                            <div className="text-lg font-bold text-neutral-800">{formatPrice(getRaw(result, 'price'))}</div>
                            {typeof stock === 'number' && <div className="text-xs text-neutral-500">Stock: {stock}</div>}
                          </div>
                        </div>
                      </div>
                    );
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
          title: { weight: 8 },
          name: { weight: 7 },
          slug: { weight: 2 },
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
          product_information: { weight: 0.3 },
        },
        result_fields: {
          id: { raw: {} },
          product_type: { raw: {} },
          type: { raw: {} },
          title: { raw: {} },
          name: { raw: {} },
          article_number: { raw: {} },
          sku: { raw: {} },
          price: { raw: {} },
          stock: { raw: {} },
          in_stock: { raw: {} },
          main_image: { raw: {} },
          image: { raw: {} },
          images: { raw: {} },
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
