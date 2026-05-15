"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Accordion from "@/components/Accordion";
import EmptyState from "@/components/EmptyState";
import PrinterCard from "@/components/PrinterCard";
import ProductPaginationSwitcher from "@/components/ProductPaginationSwitcher";
import { useDebouncedSearchParam } from "@/components/search/useDebouncedSearchParam";
import type {
  PrinterCardData,
  PrinterOptionFilterKey,
  PrinterSearchResponse,
  PrinterSortValue,
} from "@/lib/search/printerTypes";
import { PRINTER_SORT_VALUES } from "@/lib/search/printerTypes";

type PrintersListingProps = {
  initialCatalog: PrinterSearchResponse;
  initialQueryString: string;
};

const OPTION_PARAM_KEY: Record<PrinterOptionFilterKey, string> = {
  druktype: "druktype",
  kern: "kern",
  detectie: "detectie",
  width: "width",
  buiten_diameter: "buiten_diameter",
};

const KNOWN_FILTER_PARAMS = [
  "search",
  "q",
  "sort",
  "page",
  "per_page",
  "druktype",
  "kern",
  "detectie",
  "width",
  "buiten_diameter",
];

function getFilterTitle(t: (key: string) => string, key: string, fallbackTitle?: string): string {
  const filterKey = `filters.${key}`;
  try {
    const translated = t(filterKey);
    if (translated && translated !== filterKey) {
      return translated;
    }
  } catch {
    // Translation not found
  }
  return fallbackTitle || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

export default function FinderListing({
  initialCatalog,
  initialQueryString,
}: PrintersListingProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedSearchRef = useRef(false);

  const [catalog, setCatalog] = useState<PrinterSearchResponse>(initialCatalog);
  const [queryString, setQueryString] = useState(initialQueryString);
  const [isFetching, setIsFetching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState<Record<string, boolean>>({});

  const currentQueryString = searchParams.toString();
  const currentPage = catalog.currentPage;
  const lastPage = catalog.lastPage;
  const total = catalog.total;
  const loading = isPending || isFetching;

  useEffect(() => {
    if (!hasFocusedSearchRef.current || searchParams.get("focus") === "true") {
      hasFocusedSearchRef.current = true;
      searchInputRef.current?.focus();
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentQueryString === queryString) return;

    const controller = new AbortController();
    let isCurrent = true;
    const loadingTimeoutId = window.setTimeout(() => {
      if (isCurrent) {
        setIsFetching(true);
      }
    }, 0);

    async function fetchPrinters() {
      try {
        const endpoint = currentQueryString ? `/api/printers?${currentQueryString}` : "/api/printers";
        const response = await fetch(endpoint, {
          signal: controller.signal,
        });
        if (response.ok && isCurrent) {
          const data = await response.json();
          setCatalog(data);
        }
      } catch (error) {
        if (isCurrent && (error as { name?: string }).name !== "AbortError") {
          console.error("Failed to fetch printers:", error);
        }
      } finally {
        window.clearTimeout(loadingTimeoutId);
        if (isCurrent) {
          setQueryString(currentQueryString);
          setIsFetching(false);
        }
      }
    }

    fetchPrinters();

    return () => {
      isCurrent = false;
      window.clearTimeout(loadingTimeoutId);
      controller.abort();
    };
  }, [currentQueryString, queryString]);

  // Extract current filter values from URL
  const activeFilters = useMemo(() => {
    const filters: Record<string, string[]> = {};
    
    Object.entries(OPTION_PARAM_KEY).forEach(([key, paramKey]) => {
      const values = searchParams.getAll(paramKey);
      if (values.length > 0) {
        filters[key] = values.flatMap(v => v.split(",")).filter(Boolean);
      }
    });

    return filters;
  }, [searchParams]);

  const searchValue = searchParams.get("search") || searchParams.get("q") || "";
  const currentSort: PrinterSortValue = 
    PRINTER_SORT_VALUES.includes(searchParams.get("sort") as PrinterSortValue)
      ? (searchParams.get("sort") as PrinterSortValue)
      : "latest";

  const SORT_OPTIONS: Array<{ value: PrinterSortValue; label: string }> = [
    { value: "latest", label: t('sort.latest') },
    { value: "oldest", label: t('sort.oldest') },
    { value: "title_asc", label: t('sort.nameAsc') },
    { value: "title_desc", label: t('sort.nameDesc') },
  ];

  // Helper to update URL params
  const setParams = useCallback((updater: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    updater(next);
    const nextString = next.toString();
    const href = nextString ? `${pathname}?${nextString}` : pathname;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
}, [pathname, router, searchParams]);

  const setSearch = useCallback((value: string) => {
    setParams((params) => {
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
        params.delete("q");
      }
      params.set("page", "1");
    });
  }, [setParams]);

  const {
    inputValue: searchInput,
    setInputValue: setSearchInput,
    commitNow: commitSearchNow,
  } = useDebouncedSearchParam({
    value: searchValue,
    onCommit: setSearch,
    delay: 300,
  });

  const setSort = (value: PrinterSortValue) => {
    setParams((params) => {
      params.set("sort", value);
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

  const toggleOption = (key: PrinterOptionFilterKey, value: string) => {
    setParams((params) => {
      const paramKey = OPTION_PARAM_KEY[key];
      const current = params.getAll(paramKey).flatMap(v => v.split(",")).filter(Boolean);
      const selected = new Set(current);
      
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

  const clearFilters = () => {
    setParams((params) => {
      KNOWN_FILTER_PARAMS.forEach(key => {
        if (key !== "search" && key !== "q" && key !== "sort") {
          params.delete(key);
        }
      });
      params.set("page", "1");
    });
  };

  const activeFilterCount = Object.values(activeFilters).reduce(
    (sum, values) => sum + values.length,
    0
  );

  const printers: PrinterCardData[] = catalog.printers;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-slate-200 px-3 lg:max-w-xl">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
            <circle cx="6.75" cy="6.75" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11.5 11.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={searchInputRef}
            value={searchInput}
            onChange={(event) => {
              const newValue = event.target.value;
              setSearchInput(newValue);
              // Debounced search execution via useEffect
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitSearchNow();
              }
            }}
            placeholder={t('hero.searchPrinters')}
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
              <span className="text-lg font-semibold font-['Segoe_UI'] leading-6">{t('search.filters')}</span>
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-600">
                  {activeFilterCount}
                </span>
              ) : null}
            </span>
          </button>

          <label className="flex h-10 items-center gap-3 rounded-[42px] border border-slate-200 px-5 py-2 text-neutral-800">
            <span className="sr-only">Sort printers</span>
            <select
              value={currentSort}
              onChange={(event) => setSort(event.target.value as PrinterSortValue)}
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
                {catalog.filters.options.map((filter) => {
                  const paramKey = OPTION_PARAM_KEY[filter.key];
                  const current = searchParams.getAll(paramKey).flatMap(v => v.split(",")).filter(Boolean);
                  const selectedValues = new Set(current);
                  const showAll = showAllFilters[filter.key] ?? false;
                  const DISPLAY_LIMIT = 10;
                  const displayedOptions = showAll ? filter.options : filter.options.slice(0, DISPLAY_LIMIT);
                  const hasMore = filter.options.length > DISPLAY_LIMIT;

                  return (
                    <Accordion 
                      key={filter.key} 
                      title={getFilterTitle(t, filter.key, filter.title)} 
                      defaultOpen={true} 
                      size="compact" 
                      className="bg-white"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                          {displayedOptions.map((option) => {
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
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowAllFilters((prev) => ({
                                ...prev,
                                [filter.key]: !prev[filter.key],
                              }))
                            }
                            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            {showAll ? "Show less" : `Show more (${filter.options.length - DISPLAY_LIMIT} more)`}
                          </button>
                        )}
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
            {loading ? t('search.loadingProducts') : t('search.results', { count: total })}
          </div>

          {loading && printers.length === 0 ? (
            <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[520px] rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : printers.length === 0 ? (
            <EmptyState title={t('finder.noPrintersFound')} description={t('finder.noPrintersDescription')} />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                  isSidebarOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"
                }`}
              >
                {printers.map((printer) => {
                  const href = `/finder?printer_id=${printer.id}`;
                  return <PrinterCard key={printer.id} printer={printer} href={href} />;
                })}
              </div>

              {lastPage > 1 ? (
                <ProductPaginationSwitcher
                  currentPage={currentPage}
                  pageCount={lastPage}
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
