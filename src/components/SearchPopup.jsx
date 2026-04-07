'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from 'boneyard-js/react';
import { getFilters, listProducts } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import { ROUTES } from '@/config/routes';

export default function SearchPopup({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(null);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [inStockCount, setInStockCount] = useState(null);
  const [filtersData, setFiltersData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedFilters, setExpandedFilters] = useState({});
  const [inStockOnly, setInStockOnly] = useState(false);

  // Dynamic filter values: { material_id: [1,2], finishing: ['gloss'], price_min: 10, price_max: 50, width: ['25mm'] }
  const [filterValues, setFilterValues] = useState({});

  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const debounceRef = useRef(null);
  const sortRef = useRef(null);

  // Fetch filters on mount
  useEffect(() => {
    if (!open) return;
    setFiltersLoading(true);
    getFilters()
      .then((res) => setFiltersData(res.data || null))
      .catch(() => { setFiltersData(null); })
      .finally(() => setFiltersLoading(false));
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSort('');
      setCategoryId(null);
      setPage(1);
      setProducts([]);
      setMeta(null);
      setSortOpen(false);
      setFilterValues({});
      setInStockOnly(false);
      setExpandedFilters({});
      setExpandedCategories({});
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sortOpen]);

  // Build query params from all filter state
  const buildParams = useCallback(() => {
    const params = { per_page: 12, page };
    if (query) params.search = query;
    if (sort) params.sort = sort;
    if (categoryId && typeof categoryId === 'number') params.category_id = categoryId;
    if (inStockOnly) params.in_stock = true;

    // Dynamic filters (explicit + meta-derived)
    const allFilters = buildDynamicFilters(filtersData);
    for (const filter of allFilters) {
      if (filter.type === 'multi_select') {
        const selected = filterValues[filter.key];
        if (selected && selected.length > 0) {
          params[filter.query] = selected.join(',');
        }
      } else if (filter.type === 'range') {
        // Exact values (checkboxes like width=25mm,50mm)
        if (filter.query.exact) {
          const exactVals = filterValues[filter.key + '_exact'];
          if (exactVals && exactVals.length > 0) {
            params[filter.query.exact] = exactVals.join(',');
          }
        }
        // Range min/max
        const minVal = filterValues[filter.key + '_min'];
        const maxVal = filterValues[filter.key + '_max'];
        if (minVal !== undefined && minVal !== '' && minVal !== filter.min) {
          params[filter.query.min] = minVal;
        }
        if (maxVal !== undefined && maxVal !== '' && maxVal !== filter.max) {
          params[filter.query.max] = maxVal;
        }
      }
    }

    return params;
  }, [page, query, sort, categoryId, inStockOnly, filterValues, filtersData]);

  // Track previous query to detect search typing vs filter changes
  const prevQueryRef = useRef(query);

  // Fetch products whenever filters change
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const doFetch = async () => {
      setLoading(true);
      try {
        const res = await listProducts(buildParams());
        if (!cancelled) {
          setProducts(res.data || []);
          setMeta(res.meta || null);
          setInStockCount(res.in_stock_count ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setMeta(null);
          setLoading(false);
        }
      }
    };

    const queryChanged = query !== prevQueryRef.current;
    prevQueryRef.current = query;

    if (queryChanged && query) {
      debounceRef.current = setTimeout(doFetch, 400);
    } else {
      doFetch();
    }

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [open, buildParams, query]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const toggleCategory = (id) => {
    setCategoryId((prev) => (prev === id ? null : id));
    setPage(1);
  };

  const toggleExpanded = (id) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFilterExpanded = (key) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));
  };

  const toggleMultiSelect = (filterKey, value) => {
    setFilterValues((prev) => {
      const current = prev[filterKey] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [filterKey]: next };
    });
    setPage(1);
  };

  const toggleExactValue = (filterKey, value) => {
    const key = filterKey + '_exact';
    setFilterValues((prev) => {
      const current = prev[key] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
    setPage(1);
  };

  const setRangeValue = (filterKey, bound, value) => {
    const key = filterKey + '_' + bound;
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilterValues({});
    setCategoryId(null);
    setSort('');
    setInStockOnly(false);
    setPage(1);
  };

  const hasActiveFilters = categoryId || sort || inStockOnly ||
    Object.values(filterValues).some((v) => Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '');

  const sortOptions = filtersData?.sort || [];
  const categories = filtersData?.categories || [];
  const dynamicFilters = buildDynamicFilters(filtersData);
  const sortLabel = sortOptions.find((o) => o.value === sort)?.label || 'Sort by';

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      className="fixed inset-0 z-100 bg-black/50 flex items-start justify-center pt-8 pb-8 overflow-y-auto"
    >
      <div className="w-full max-w-400 mx-6 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header: Search input + Close */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-100">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-full border border-slate-200 bg-gray-50">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="6" stroke="#9CA3AF" strokeWidth="1.5" />
              <path d="M14 14L18 18" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Look for something..."
              aria-label="Search products"
              className="flex-1 bg-transparent text-neutral-800 text-base outline-none placeholder:text-zinc-400"
            />
            {query && (
              <button onClick={() => { setQuery(''); setPage(1); }} aria-label="Clear search" className="text-zinc-400 hover:text-zinc-600">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <button onClick={onClose} aria-label="Close search" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M18 6L6 18" stroke="#404040" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body: Sidebar + Results */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 border-r border-slate-100 p-5 overflow-y-auto shrink-0">
            <Skeleton name="search-filters" loading={filtersLoading} animate="shimmer" color="#e2e8f0">
              <div className="space-y-1">
                {/* Clear all filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mb-3 text-xs font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    Clear all filters
                  </button>
                )}

                {/* In Stock toggle */}
                <div className="pb-4 border-b border-slate-100">
                  <label className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
                      className="w-4 h-4 accent-sky-950 rounded"
                    />
                    <span className={`flex-1 text-[13px] ${inStockOnly ? 'text-sky-950 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                      In Stock Only
                    </span>
                    {inStockCount !== null && (
                      <span className="text-[12px] text-zinc-400 tabular-nums">{inStockCount}</span>
                    )}
                  </label>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="py-4 border-b border-slate-100">
                    <button
                      onClick={() => toggleFilterExpanded('_categories')}
                      className="w-full flex items-center justify-between text-neutral-800 text-xs font-semibold uppercase tracking-wide mb-2.5 px-2 py-1.5 -mx-2 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      Categories
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform duration-200 ${expandedFilters['_categories'] !== false ? 'rotate-180' : ''}`}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </button>
                    {expandedFilters['_categories'] !== false && (
                      <div className="flex flex-col gap-0.5">
                        {categories.map((taxonomy) => {
                          const mapped = { ...taxonomy, _uid: `tax-${taxonomy.id}`, children: (taxonomy.categories || []).map((c) => ({ ...c, _uid: c.id })) };
                          const fixed = fixCategoryCounts(mapped);
                          return (
                          <CategoryItem
                            key={`tax-${taxonomy.id}`}
                            category={fixed}
                            selectedId={categoryId}
                            onSelect={toggleCategory}
                            expanded={expandedCategories}
                            onToggleExpand={toggleExpanded}
                          />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Dynamic Filters */}
                {dynamicFilters.map((filter, idx) => (
                  <div key={filter.key} className={`py-4 ${idx < dynamicFilters.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <FilterSection
                      filter={filter}
                      filterValues={filterValues}
                      expanded={expandedFilters[filter.key] !== false}
                      onToggleExpanded={() => toggleFilterExpanded(filter.key)}
                      onToggleMultiSelect={toggleMultiSelect}
                      onToggleExactValue={toggleExactValue}
                      onSetRangeValue={setRangeValue}
                    />
                  </div>
                ))}
              </div>
            </Skeleton>
          </div>

          {/* Results area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Results header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <span className="text-zinc-500 text-[13px]">
                {meta ? `${meta.total} result${meta.total !== 1 ? 's' : ''} found` : '\u00A0'}
              </span>

              {/* Sort dropdown */}
              {sortOptions.length > 0 && (
                <div ref={sortRef} className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-neutral-700 hover:border-slate-300 transition-colors"
                  >
                    {sortLabel}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`}>
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                  {sortOpen && (
                    <div role="listbox" className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          role="option"
                          aria-selected={sort === opt.value}
                          onClick={() => { setSort(opt.value); setSortOpen(false); setPage(1); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sort === opt.value
                            ? 'text-sky-950 font-semibold bg-sky-50'
                            : 'text-neutral-700 hover:bg-gray-50'
                            }`}
                        >
                          {sort === opt.value && <span className="mr-1.5">&#10003;</span>}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading && products.length === 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                      <div className="h-40 bg-slate-100 animate-[shimmer_1.5s_ease-in-out_infinite]" />
                      <div className="p-3.5 space-y-2.5">
                        <div className="h-4 bg-slate-100 rounded-md w-4/5 animate-[shimmer_1.5s_ease-in-out_infinite_0.1s]" />
                        <div className="h-4 bg-slate-100 rounded-md w-1/2 animate-[shimmer_1.5s_ease-in-out_infinite_0.2s]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loading && products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="12" cy="12" r="8" stroke="#94A3B8" strokeWidth="1.5" />
                      <path d="M18 18L24 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-zinc-500 text-sm">
                    {query ? 'No products found for your search.' : 'Start typing to search products.'}
                  </p>
                </div>
              ) : (
                <div className={`grid grid-cols-4 gap-4 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  {products.map((product, index) => (
                    <ProductCard key={`${product.type}-${product.id}-${index}`} product={product} onClose={onClose} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-5 pt-5 border-t border-slate-100">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    Prev
                  </button>
                  {generatePageNumbers(page, meta.last_page).map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1.5 text-zinc-400 text-xs">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p
                          ? 'bg-sky-950 text-white'
                          : 'text-neutral-600 hover:bg-slate-100'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                    disabled={page >= meta.last_page}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Build dynamic filters (merge data.filters + data.meta) ─── */

// Meta keys that map to the same concept as an explicit filter (meta key → explicit label lowercase)
const META_TO_EXPLICIT = {
  glue: 'adhesive',
  druktype: 'print_method',
  meta_width: 'width',
  meta_height: 'height',
  kern: 'core',
  buitendia: 'outer_diameter',
  finishing: 'finishing',
  material_code: 'material_code',
};

const META_LABELS = {
  finishing: 'Finishing',
  glue: 'Glue',
  brand: 'Brand',
  material_code: 'Material Code',
  druktype: 'Print Type',
  printer_type: 'Printer Type',
  meta_width: 'Width',
  meta_height: 'Height',
  kern: 'Core',
  buitendia: 'Outer Diameter',
  detectie: 'Detection',
  merken: 'Brands',
};

function fixCategoryCounts(category) {
  if (!category.children || category.children.length === 0) return category;
  const fixedChildren = category.children.map(fixCategoryCounts);
  const count = fixedChildren.reduce((sum, c) => sum + (c.count || 0), 0);
  return { ...category, children: fixedChildren, count };
}

function buildDynamicFilters(filtersData) {
  if (!filtersData) return [];

  const explicit = filtersData.filters || [];
  const meta = filtersData.meta || {};

  // Keys already covered by explicit filters (by key and by label match)
  const coveredKeys = new Set(explicit.map((f) => f.key));
  const coveredLabels = new Set(explicit.map((f) => f.label?.toLowerCase()));

  const metaFilters = Object.entries(meta)
    .filter(([key, options]) => {
      if (!Array.isArray(options) || options.length === 0) return false;
      // Skip if the meta key is directly covered
      if (coveredKeys.has(key)) return false;
      // Skip if this meta key maps to an explicit filter key
      const explicitKey = META_TO_EXPLICIT[key];
      if (explicitKey && coveredKeys.has(explicitKey)) return false;
      // Skip if an explicit filter already has the same label
      const metaLabel = META_LABELS[key]?.toLowerCase();
      if (metaLabel && coveredLabels.has(metaLabel)) return false;
      return true;
    })
    .map(([key, options]) => ({
      key,
      label: META_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type: 'multi_select',
      query: key,
      options,
    }));

  return [...explicit, ...metaFilters];
}

/* ─── Filter Section ─── */

function FilterSection({ filter, filterValues, expanded, onToggleExpanded, onToggleMultiSelect, onToggleExactValue, onSetRangeValue }) {
  return (
    <div>
      <button
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between text-neutral-800 text-xs font-semibold uppercase tracking-wide mb-2.5 px-2 py-1.5 -mx-2 rounded-md hover:bg-slate-50 transition-colors"
      >
        {filter.label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {expanded && (
        <>
          {filter.type === 'multi_select' && (
            <MultiSelectFilter
              filterKey={filter.key}
              options={filter.options}
              selected={filterValues[filter.key] || []}
              onToggle={onToggleMultiSelect}
            />
          )}

          {filter.type === 'range' && (
            <RangeFilter
              filter={filter}
              filterValues={filterValues}
              onSetRangeValue={onSetRangeValue}
              onToggleExactValue={onToggleExactValue}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ─── Multi-Select Filter ─── */

function MultiSelectFilter({ filterKey, options, selected, onToggle }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? options : options.slice(0, 6);

  return (
    <div className="flex flex-col gap-0.5">
      {visible.map((opt) => {
        const isChecked = selected.includes(opt.value);
        return (
          <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(filterKey, opt.value)}
              className="w-4 h-4 accent-sky-950 rounded"
            />
            <span className={`flex-1 text-[13px] ${isChecked ? 'text-sky-950 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
              {opt.label}
            </span>
            {opt.count !== undefined && (
              <span className="text-[12px] text-zinc-400 tabular-nums">{opt.count}</span>
            )}
          </label>
        );
      })}
      {options.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[11px] text-sky-700 hover:text-sky-900 mt-1.5 font-medium"
        >
          {showAll ? 'Show less' : `+${options.length - 6} more`}
        </button>
      )}
    </div>
  );
}

/* ─── Range Filter ─── */

function RangeFilter({ filter, filterValues, onSetRangeValue, onToggleExactValue }) {
  const minKey = filter.key + '_min';
  const maxKey = filter.key + '_max';
  const exactKey = filter.key + '_exact';
  const currentMin = filterValues[minKey] ?? '';
  const currentMax = filterValues[maxKey] ?? '';
  const selectedExact = filterValues[exactKey] || [];
  const inputDebounceRef = useRef(null);

  // Local input state for debounced typing
  const [localMin, setLocalMin] = useState(currentMin);
  const [localMax, setLocalMax] = useState(currentMax);

  // Sync local state when parent filterValues change (e.g. from slider or clear)
  useEffect(() => { setLocalMin(currentMin); }, [currentMin]);
  useEffect(() => { setLocalMax(currentMax); }, [currentMax]);

  const rangeMin = filter.min ?? 0;
  const rangeMax = filter.max ?? 1000;
  const sliderMin = currentMin !== '' ? Number(currentMin) : rangeMin;
  const sliderMax = currentMax !== '' ? Number(currentMax) : rangeMax;

  const handleInputChange = (bound, value) => {
    if (bound === 'min') setLocalMin(value);
    else setLocalMax(value);
    if (inputDebounceRef.current) clearTimeout(inputDebounceRef.current);
    inputDebounceRef.current = setTimeout(() => {
      onSetRangeValue(filter.key, bound, value);
    }, 500);
  };

  const handleSliderChange = (bound, value) => {
    // Prevent min from exceeding max and vice versa
    if (bound === 'min' && value > sliderMax) return;
    if (bound === 'max' && value < sliderMin) return;
    onSetRangeValue(filter.key, bound, value);
  };

  // Calculate slider track fill percentage
  const minPercent = ((sliderMin - rangeMin) / (rangeMax - rangeMin)) * 100;
  const maxPercent = ((sliderMax - rangeMin) / (rangeMax - rangeMin)) * 100;

  const isPrice = filter.key === 'price' || filter.label?.toLowerCase().includes('price');
  const prefix = isPrice ? '€' : '';

  return (
    <div className="space-y-3">
      {/* Exact value options */}
      {filter.options && filter.options.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {filter.options.map((opt) => {
            const isSelected = selectedExact.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleExactValue(filter.key, opt.value)}
                  className="w-4 h-4 accent-sky-950 rounded"
                />
                <span className={`flex-1 text-[13px] ${isSelected ? 'text-sky-950 font-medium' : 'text-neutral-600 group-hover:text-neutral-800'}`}>
                  {opt.label}
                </span>
                {opt.count !== undefined && (
                  <span className="text-[12px] text-zinc-400 tabular-nums">{opt.count}</span>
                )}
              </label>
            );
          })}
        </div>
      )}

      {/* Min / Max inputs */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] text-zinc-400 font-medium z-1">
            From {prefix}
          </label>
          <input
            type="number"
            placeholder={rangeMin.toString()}
            value={localMin}
            onChange={(e) => handleInputChange('min', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-full outline-none focus:border-amber-400 transition-colors text-neutral-800"
            min={rangeMin}
            max={rangeMax}
            step="any"
          />
        </div>
        <span className="text-zinc-400 text-sm font-medium">—</span>
        <div className="relative flex-1">
          <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] text-zinc-400 font-medium z-1">
            To {prefix}
          </label>
          <input
            type="number"
            placeholder={rangeMax.toString()}
            value={localMax}
            onChange={(e) => handleInputChange('max', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-full outline-none focus:border-amber-400 transition-colors text-neutral-800"
            min={rangeMin}
            max={rangeMax}
            step="any"
          />
        </div>
      </div>

      {/* Dual range slider */}
      <div className="relative h-5 flex items-center">
        {/* Track background */}
        <div className="absolute left-0 right-0 h-1 bg-slate-200 rounded-full" />
        {/* Active track */}
        <div
          className="absolute h-1 bg-amber-500 rounded-full"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={rangeMin}
          max={rangeMax}
          value={sliderMin}
          onChange={(e) => handleSliderChange('min', Number(e.target.value))}
          className="range-slider-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: sliderMin > rangeMax - 10 ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={rangeMin}
          max={rangeMax}
          value={sliderMax}
          onChange={(e) => handleSliderChange('max', Number(e.target.value))}
          className="range-slider-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}

/* ─── Category Item ─── */

function CategoryItem({ category, selectedId, onSelect, expanded, onToggleExpand, depth = 0 }) {
  const hasChildren = category.children && category.children.length > 0;
  const uid = category._uid ?? category.id;
  const isExpanded = expanded[uid];
  const isSelected = selectedId === uid;
  const name = typeof category.name === 'object' ? (category.name.en || category.name.nl) : category.name;

  return (
    <div>
      <div
        className={`flex items-center h-8 rounded-md transition-colors cursor-pointer ${isSelected
          ? 'text-sky-950 font-medium bg-sky-50'
          : 'text-neutral-600 hover:text-neutral-800 hover:bg-slate-50'
          }`}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => onSelect(uid)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(uid); }}
            className="w-6 h-6 flex items-center justify-center shrink-0 rounded hover:bg-gray-200/60"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <path d="M3.5 2L7 5L3.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <span className="flex-1 text-[13px] leading-tight truncate">{name}</span>
        {category.count !== undefined && (
          <span className="text-[12px] text-zinc-400 tabular-nums shrink-0 pr-2">{category.count}</span>
        )}
      </div>
      {hasChildren && isExpanded && category.children.map((child) => (
        <CategoryItem
          key={child._uid ?? child.id}
          category={child}
          selectedId={selectedId}
          onSelect={onSelect}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

/* ─── Product Card ─── */

function ProductCard({ product, onClose }) {
  const name = typeof product.name === 'object' ? (product.name.en || product.name.nl) : product.name;
  const slug = typeof product.slug === 'object' ? (product.slug.en || product.slug.nl) : product.slug;
  const image = product.main_image || 'https://placehold.co/300x200';

  return (
    <Link
      href={ROUTES.productDetail(product.type, slug)}
      onClick={onClose}
      className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col"
    >
      <div className="relative h-40 bg-slate-50 flex items-center justify-center overflow-hidden">
        <div className="absolute top-2.5 right-2.5 z-10">
          {product.in_stock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full border border-slate-200">
              Out of Stock
            </span>
          )}
        </div>
        <Image
          src={image}
          alt={name}
          width={160}
          height={130}
          className="object-contain max-h-32 group-hover:scale-105 transition-transform duration-200"
          unoptimized
        />
      </div>
      <div className="p-3.5 flex flex-col gap-1.5 flex-1 border-t border-slate-100">
        <h4 className="text-neutral-800 text-[13px] font-medium leading-[1.4] line-clamp-2">{name}</h4>
        <div className="mt-auto flex items-baseline gap-1.5 pt-1">
          <span className="text-neutral-900 text-base font-bold">{formatPrice(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-zinc-400 text-xs line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
        <span className="text-zinc-400 text-[11px]">excl. VAT</span>
      </div>
    </Link>
  );
}

/* ─── Pagination helper ─── */

function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
