'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchSearchResults } from './api';
import type { SearchApiResponse, SearchProduct, SearchSort } from './types';

type SearchOverlayProps = {
  onClose: () => void;
};

const SORT_OPTIONS: Array<{ value: SearchSort; label: string }> = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title_asc', label: 'Name: A - Z' },
  { value: 'title_desc', label: 'Name: Z - A' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const PAGE_SIZE = 24;

function formatPrice(value: number | null | undefined): string {
  if (typeof value !== 'number') return '-';

  return `€${value.toFixed(2)}`;
}

function titleForProduct(product: SearchProduct): string {
  return product.title || product.name || 'Unnamed product';
}

function pageNumbers(current: number, total: number): number[] {
  const maxVisible = 5;
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const start = Math.max(1, Math.min(current - 2, total - (maxVisible - 1)));
  return Array.from({ length: maxVisible }, (_, i) => start + i);
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SearchSort>('latest');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<SearchProduct[]>([]);
  const [pagination, setPagination] = useState<SearchApiResponse['pagination']>({
    page: 1,
    perPage: PAGE_SIZE,
    totalPages: 1,
    totalItems: 0,
  });
  const [inStockCount, setInStockCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
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
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSearchResults({
          q: debouncedQuery,
          page,
          perPage: PAGE_SIZE,
          sort: sortBy,
        });

        if (isCancelled) return;

        setItems(result.items);
        setPagination(result.pagination);
        setInStockCount(result.inStockCount);
        setError(result.error ?? null);
      } catch {
        if (isCancelled) return;
        setItems([]);
        setPagination({
          page: 1,
          perPage: PAGE_SIZE,
          totalPages: 1,
          totalItems: 0,
        });
        setInStockCount(0);
        setError('Search is temporarily unavailable.');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, page, sortBy]);

  const pages = useMemo(() => pageNumbers(pagination.page, pagination.totalPages), [pagination.page, pagination.totalPages]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/25" onClick={onClose}>
      <div
        className="w-full h-full bg-[#F7F7F7] md:m-10 md:h-[calc(100%-80px)] md:rounded-xl overflow-hidden shadow-2xl"
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
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search products..."
                className="w-full h-full bg-transparent outline-none text-base text-neutral-800"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as SearchSort);
                  setPage(1);
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
              {loading
                ? 'Searching...'
                : `${pagination.totalItems} results` +
                  (pagination.totalItems > 0 ? ` (${inStockCount} in stock)` : '')}
            </div>

            {error ? (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">{error}</div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-72 rounded-xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-neutral-500">
                No products found.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {items.map((product) => (
                    <div
                      key={`${product.type}-${product.id}`}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                        {product.main_image ? (
                          <img
                            src={product.main_image}
                            alt={titleForProduct(product)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-slate-400">No image</span>
                        )}
                      </div>

                      <div className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-blue-500 uppercase tracking-wide">{product.type}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              product.in_stock ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {product.in_stock ? 'In stock' : 'Out of stock'}
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-neutral-800 line-clamp-2 min-h-12">
                          {titleForProduct(product)}
                        </h3>

                        <div className="text-sm text-neutral-500">
                          {product.article_number ? `Art: ${product.article_number}` : product.sku ? `SKU: ${product.sku}` : '-'}
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div className="text-lg font-bold text-neutral-800">{formatPrice(product.price)}</div>
                          {typeof product.stock === 'number' && (
                            <div className="text-xs text-neutral-500">Stock: {product.stock}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={pagination.page <= 1}
                      className="h-9 px-3 border border-slate-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Prev
                    </button>

                    {pages.map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`h-9 min-w-9 px-3 rounded-md text-sm border ${
                          pageNumber === pagination.page
                            ? 'bg-sky-900 text-white border-sky-900'
                            : 'bg-white text-neutral-700 border-slate-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                      disabled={pagination.page >= pagination.totalPages}
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
