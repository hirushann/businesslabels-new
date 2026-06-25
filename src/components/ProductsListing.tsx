"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Accordion from "@/components/Accordion";
import EmptyState from "@/components/EmptyState";
import ProductCard from "@/components/ProductCard";
import RangeSlider from "@/components/RangeSlider";
import Image from "next/image";
import ProductPaginationSwitcher from "@/components/ProductPaginationSwitcher";
import { useDebouncedSearchParam } from "@/components/search/useDebouncedSearchParam";
import type {
  CatalogOptionFilter,
  CatalogOptionFilterKey,
  CatalogRangeFilter,
  CatalogRangeKey,
  CatalogSearchResponse,
  CatalogSortValue,
} from "@/lib/search/types";

type ProductsListingProps = {
  initialCatalog: CatalogSearchResponse;
  initialQueryString: string;
  scopeQueryString?: string;
  // Deprecated: filter bounds now come from the currently scoped ES result set.
  baselineRangeFilters?: CatalogRangeFilter[];
  printer?: { title: string; slug: string } | null;
  // Filter keys to omit from the sidebar.
  hiddenFilterKeys?: CatalogOptionFilterKey[];
  // When provided, the category facet's options are filtered against this
  // allowlist of live slugs. Products that weren't reindexed after a taxon
  // delete can still emit the old slug in ES aggregations; passing the live
  // tree's slugs here keeps the accordion intact but drops the ghost entries.
  validCategorySlugs?: string[];
  hideSearchInput?: boolean;
};

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
  kern_string: "kern_string",
  outer_diameter_string: "outer_diameter_string",
};

const RANGE_PARAM_KEYS = {
  price: { min: "price_min", max: "price_max" },
  width: { min: "width_min", max: "width_max" },
  height: { min: "height_min", max: "height_max" },
  core: { min: "core_min", max: "core_max" },
  outer_diameter: { min: "outer_diameter_min", max: "outer_diameter_max" },
} as const;

const HEIGHT_RANGE_CAP = 800;

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
  "scope_category",
  "category_id",
  "brand",
  "material_id",
  "material_category",
  "material_category_id",
  "material_code",
  "materiaal_code",
  "material",
  "materiaal",
  "finishing",
  "afwerking",
  "glue",
  "lijm",
  "adhesive",
  "print_method",
  "printmethode",
  "druktype",
  "printer_type",
  "detectie",
  "merken",
  "kern_string",
  "outer_diameter_string",
];

type OrderedFilterEntry =
  | { kind: "range"; key: CatalogRangeKey }
  | { kind: "option"; key: CatalogOptionFilterKey };

const FILTER_UI_ORDER: OrderedFilterEntry[] = [
  { kind: "range", key: "price" },
  { kind: "option", key: "category" },
  { kind: "option", key: "brand" },
  { kind: "option", key: "print_method" },
  { kind: "option", key: "printer_type" },
  { kind: "option", key: "detectie" },
  { kind: "option", key: "merken" },
  { kind: "range", key: "width" },
  { kind: "range", key: "height" },
  { kind: "option", key: "material_code" },
  { kind: "option", key: "material" },
  { kind: "option", key: "finishing" },
  { kind: "option", key: "glue" },
  { kind: "range", key: "core" },
  { kind: "range", key: "outer_diameter" },
];

function paramsToString(params: URLSearchParams): string {
  params.sort();
  return params.toString();
}

function mergeQueryStrings(
  baseQueryString: string | undefined,
  queryString: string,
): string {
  const params = new URLSearchParams(baseQueryString ?? "");
  const next = new URLSearchParams(queryString);

  next.forEach((value, key) => {
    params.append(key, value);
  });

  return paramsToString(params);
}

function sanitizeOptionParams(
  queryString: string,
  hiddenFilterKeys?: CatalogOptionFilterKey[],
): string {
  if (!hiddenFilterKeys?.length) return queryString;

  const params = new URLSearchParams(queryString);
  hiddenFilterKeys.forEach((key) => params.delete(OPTION_PARAM_KEY[key]));
  return paramsToString(params);
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

function formatRangeValue(
  value: number,
  unitPrefix?: string,
  unitSuffix?: string,
): string {
  return `${unitPrefix ?? ""}${value}${unitSuffix ? ` ${unitSuffix}` : ""}`;
}

function hasUsableRange(filter: CatalogRangeFilter): boolean {
  return Number.isFinite(filter.min) && Number.isFinite(filter.max) && Math.round(filter.max) > Math.round(filter.min);
}

function normalizeSortValue(
  value: string | null,
  hasSearch: boolean,
  sortOptions: Array<{ value: CatalogSortValue; label: string }>,
): CatalogSortValue {
  const allowed = new Set(sortOptions.map((option) => option.value));
  return allowed.has(value as CatalogSortValue)
    ? (value as CatalogSortValue)
    : hasSearch
      ? "relevance"
      : "latest";
}

function ProductSkeletonGrid({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  return (
    <div
      className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isSidebarOpen ? "xl:grid-cols-3" : "lg:grid-cols-3"}`}
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="h-[520px] rounded-xl bg-slate-100 animate-pulse"
        />
      ))}
    </div>
  );
}

const getLocalizedCategoryLabel = (key: string, locale: string) => {
  const dictionary: Record<string, Record<string, string>> = {
    en: {
      inktsets: "Ink sets",
      lints: "Ribbons",
      labels: "Labels",
      inktsetsDesc: "Compatible ink cartridges",
      lintsDesc: "Thermal transfer ribbons",
      labelsDesc: "Compatible label rolls",
    },
    nl: {
      inktsets: "Inktsets",
      lints: "Linten",
      labels: "Labels",
      inktsetsDesc: "Compatibele inktcartridges",
      lintsDesc: "Thermal transfer printlinten",
      labelsDesc: "Compatibele labelrollen",
    },
  };
  const lang = locale === "nl" ? "nl" : "en";
  return dictionary[lang][key] || key;
};

function CatalogProductsListing({
  initialCatalog,
  initialQueryString,
  scopeQueryString,
  printer,
  hiddenFilterKeys,
  validCategorySlugs,
  hideSearchInput = false,
}: ProductsListingProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedRangeScales, setExpandedRangeScales] = useState<Record<string, boolean>>(
    {},
  );
  const [optimisticQueryString, setOptimisticQueryString] = useState<
    string | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedSearchRef = useRef(false);

  useEffect(() => {
    if (
      !hideSearchInput &&
      searchParams.get("focus") === "true" &&
      !hasFocusedSearchRef.current
    ) {
      hasFocusedSearchRef.current = true;
      searchInputRef.current?.focus();
    }
  }, [hideSearchInput, searchParams]);

  const SORT_OPTIONS: Array<{ value: CatalogSortValue; label: string }> = [
    { value: "relevance", label: t("sort.relevance") },
    { value: "latest", label: t("sort.latest") },
    { value: "oldest", label: t("sort.oldest") },
    { value: "title_asc", label: t("sort.nameAsc") },
    { value: "title_desc", label: t("sort.nameDesc") },
    { value: "price_asc", label: t("sort.priceAsc") },
    { value: "price_desc", label: t("sort.priceDesc") },
  ];

  const getFilterTitle = (key: string, fallbackTitle?: string): string => {
    const filterKey = `filters.${key}` as const;

    if (t.has(filterKey)) {
      const translated = t(filterKey);
      if (typeof translated === "string" && translated !== filterKey) {
        return translated;
      }
    }

    // Fallback to the original title from API or capitalize key
    return (
      fallbackTitle ||
      key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
    );
  };

  const currentQueryString = useMemo(
    () => paramsToString(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const rawDisplayQueryString = optimisticQueryString ?? currentQueryString;
  const displayQueryString = useMemo(
    () => sanitizeOptionParams(rawDisplayQueryString, hiddenFilterKeys),
    [hiddenFilterKeys, rawDisplayQueryString],
  );
  const displayParams = useMemo(
    () => new URLSearchParams(displayQueryString),
    [displayQueryString],
  );
  const isEpson = printer?.slug?.toLowerCase().includes("epson") || printer?.title?.toLowerCase().includes("epson");
  const scopedCurrentQueryString = useMemo(() => {
    let queryStr = displayQueryString;
    const params = new URLSearchParams(queryStr);
    if (isEpson && params.get("category") === "inkt-cartridges-nl") {
      params.set("category", "inkt-cartridges-nl,maintenance-boxen-nl");
      queryStr = params.toString();
    }
    return mergeQueryStrings(scopeQueryString, queryStr);
  }, [scopeQueryString, displayQueryString, isEpson]);
  const listingResetKey = useMemo(() => {
    const params = new URLSearchParams(scopedCurrentQueryString);
    params.delete("page");
    return paramsToString(params);
  }, [scopedCurrentQueryString]);
  const initialSortedQueryString = useMemo(
    () => mergeQueryStrings(scopeQueryString, initialQueryString),
    [scopeQueryString, initialQueryString],
  );
  const searchValue =  searchParams.get("search") ?? searchParams.get("q") ?? "";
  const displaySearchValue =
    displayParams.get("search") ?? displayParams.get("q") ?? "";
  const selectedSort = normalizeSortValue(
    displayParams.get("sort"),
    Boolean(displaySearchValue),
    SORT_OPTIONS,
  );
  const hasInitialCatalog =
    scopedCurrentQueryString === initialSortedQueryString;
 
  useEffect(() => {
    if (
      optimisticQueryString === null ||
      optimisticQueryString === currentQueryString
    ) {
      const timeoutId = window.setTimeout(() => {
        setOptimisticQueryString(null);
      }, 0);
 
      return () => window.clearTimeout(timeoutId);
    }
  }, [currentQueryString, optimisticQueryString]);
 
  const setParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(displayQueryString);
      updater(next);
      const nextString = paramsToString(next);
      const href = nextString ? `${pathname}?${nextString}` : pathname;
      setOptimisticQueryString(nextString);
      startTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [displayQueryString, pathname, router],
  );
 
  const activeCategory = displayParams.get("category") || "";

  const categoryCards = isEpson
    ? [
        {
          id: "inkt-cartridges-nl",
          title: getLocalizedCategoryLabel("inktsets", locale),
          desc: getLocalizedCategoryLabel("inktsetsDesc", locale),
          image: "/inkandsupplies.png",
        },
        {
          id: "labels-en-tickets",
          title: getLocalizedCategoryLabel("labels", locale),
          desc: getLocalizedCategoryLabel("labelsDesc", locale),
          image: "/labelrolls.png",
        },
      ]
    : [
        {
          id: "tt-printlinten-nl",
          title: getLocalizedCategoryLabel("lints", locale),
          desc: getLocalizedCategoryLabel("lintsDesc", locale),
          image: "/images/thermal_transfer_preview.png",
        },
        {
          id: "labels-en-tickets",
          title: getLocalizedCategoryLabel("labels", locale),
          desc: getLocalizedCategoryLabel("labelsDesc", locale),
          image: "/labelrolls.png",
        },
      ];

  const handleCategoryClick = (categorySlug: string) => {
    setParams((params) => {
      const currentCategory = params.get("category") || "";
      if (currentCategory === categorySlug) {
        params.delete("category");
      } else {
        params.set("category", categorySlug);
      }
      params.set("page", "1");
    });
  };

  const commitSearch = useCallback(
    (nextSearch: string) => {
      setParams((params) => {
        params.delete("q");
        if (nextSearch) {
          params.set("search", nextSearch);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
      });
    },
    [setParams],
  );

  const { inputValue: searchInput, setInputValue: setSearchInput } =
    useDebouncedSearchParam({
      value: searchValue,
      onCommit: commitSearch,
    });

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
    let isCurrent = true;
    const loadingTimeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
    }, 0);

    fetch(`/api/catalog/products?${scopedCurrentQueryString}&locale=${locale}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(t("search.catalogUnavailable"));
        }
        return response.json() as Promise<CatalogSearchResponse>;
      })
      .then((nextCatalog) => {
        if (isCurrent) {
          setCatalog(nextCatalog);
        }
      })
      .catch((fetchError) => {
        if (
          isCurrent &&
          (fetchError as { name?: string }).name !== "AbortError"
        ) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : t("search.catalogFailed"),
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
      window.clearTimeout(loadingTimeoutId);
    };
  }, [scopedCurrentQueryString, hasInitialCatalog, initialCatalog, t, locale]);

  useEffect(() => {
    // This effect is intentionally empty as we no longer maintain visibleProducts state.
    // It's kept temporarily empty to match the diff cleanly.
  }, [catalog.currentPage, catalog.products, listingResetKey]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    catalog.filters.options.forEach((filter) => {
      count += valuesFor(displayParams, OPTION_PARAM_KEY[filter.key]).length;
    });

    Object.values(RANGE_PARAM_KEYS).forEach((rangeKeys) => {
      if (
        displayParams.has(rangeKeys.min) ||
        displayParams.has(rangeKeys.max)
      ) {
        count += 1;
      }
    });

    if (displayParams.has("type") || displayParams.has("product_type"))
      count += 1;
    return count;
  }, [catalog.filters.options, displayParams]);

  const orderedFilters = useMemo(() => {
    const rangeMap = new Map(
      catalog.filters.ranges.map((filter) => [filter.key, filter]),
    );
    const optionMap = new Map(
      catalog.filters.options.map((filter) => [filter.key, filter]),
    );

    const hidden = new Set(hiddenFilterKeys ?? []);
    const liveCategorySlugs = validCategorySlugs
      ? new Set(validCategorySlugs)
      : null;

    return FILTER_UI_ORDER.flatMap(
      (
        entry,
      ): Array<
        | { kind: "range"; filter: CatalogRangeFilter }
        | { kind: "option"; filter: CatalogOptionFilter }
      > => {
        if (entry.kind === "range") {
          const filter = rangeMap.get(entry.key);
          return filter && hasUsableRange(filter) ? [{ kind: "range" as const, filter }] : [];
        }

        if (hidden.has(entry.key)) return [];

        const filter = optionMap.get(entry.key);
        if (!filter) return [];

        if (entry.key === "category" && liveCategorySlugs) {
          const liveOptions = filter.options.filter((option) =>
            liveCategorySlugs.has(option.value),
          );
          if (liveOptions.length === 0) return [];
          return [
            {
              kind: "option" as const,
              filter: { ...filter, options: liveOptions },
            },
          ];
        }

        return [{ kind: "option" as const, filter }];
      },
    );
  }, [
    catalog.filters.options,
    catalog.filters.ranges,
    hiddenFilterKeys,
    validCategorySlugs,
  ]);

  const clearFilters = () => {
    setParams((params) => {
      KNOWN_FILTER_PARAMS.forEach((key) => params.delete(key));
    });
    setSearchInput("");
  };

  const applySearchSuggestion = (suggestion: string) => {
    setParams((params) => {
      params.delete("q");
      params.set("search", suggestion);
      params.set("page", "1");
    });
  };

  const setSort = (value: CatalogSortValue) => {
    setParams((params) => {
      if (
        (searchValue && value === "relevance") ||
        (!searchValue && value === "latest")
      ) {
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

  const setRange = (
    key: keyof typeof RANGE_PARAM_KEYS,
    range: [number, number],
    min: number,
    max: number,
  ) => {
    setParams((params) => {
      const rangeKeys = RANGE_PARAM_KEYS[key];
      if (range[0] <= min) {
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

  const loading = isLoading || isPending;
  const products = catalog.products;

  return (
    <div className="flex flex-col gap-8">
      {printer && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-4xl">
          {categoryCards.map((card) => {
            const isActive = activeCategory === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCategoryClick(card.id)}
                className={`group flex flex-col overflow-hidden text-left rounded-xl border p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                  isActive
                    ? "border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/5"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div className="relative h-24 w-full overflow-hidden rounded-lg bg-slate-50">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex flex-1 flex-col justify-between w-full">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center justify-between">
                      {card.title}
                      <span
                        className={`h-2 w-2 rounded-full transition-all duration-200 ${
                          isActive ? "bg-amber-500 scale-125" : "bg-slate-200"
                        }`}
                      />
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-normal">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!hideSearchInput ? (
          <div className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-slate-200 px-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
              aria-hidden="true"
            >
              <circle
                cx="6.75"
                cy="6.75"
                r="5.25"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11.5 11.5L14.5 14.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={searchInputRef}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("search.searchProducts")}
              className="h-11 w-full bg-transparent text-base text-neutral-800 outline-none"
            />
          </div>
        ) : null}

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((currentValue) => !currentValue)}
            className={`inline-flex h-10 w-fit items-center gap-4 rounded-[42px] border px-5 py-2 text-neutral-800 transition-colors ${
              isSidebarOpen
                ? "border-amber-500 bg-amber-50 text-amber-600"
                : "border-slate-200 hover:border-amber-200"
            }`}
            aria-expanded={isSidebarOpen}
          >
            <span className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 5H17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5.5 10H14.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M8 15H12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-lg font-semibold font-['Segoe_UI'] leading-6">
                {t("search.filters")}
              </span>
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-600">
                  {activeFilterCount}
                </span>
              ) : null}
            </span>
          </button>

          <label className="flex h-10 shrink-0 items-center gap-3 rounded-[42px] border border-slate-200 px-5 py-2 text-neutral-800">
            <span className="sr-only">{t("search.sortProducts")}</span>
            <select
              value={selectedSort}
              onChange={(event) =>
                setSort(event.target.value as CatalogSortValue)
              }
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

      <div
        className={`flex flex-col gap-6 ${isSidebarOpen ? "lg:flex-row lg:items-start" : ""}`}
      >
        {isSidebarOpen ? (
          <aside className="w-full shrink-0 rounded-xl border border-slate-100 bg-white p-4 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.08)] md:w-96 lg:w-96 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-800">
                    {t("search.filters")}
                  </h2>
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
                    {t("search.clearAll")}
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col gap-3">
                {/* No availability filter — every product stays listed; only
                    the "In Stock" label is conditional on delivery time. */}
                {orderedFilters.map((entry) => {
                  if (entry.kind === "range") {
                    const filter = entry.filter;
                    const keys = RANGE_PARAM_KEYS[filter.key];
                    const min = filter.min;
                    const rawMax = filter.max;
                    const isHeight = filter.key === "height";
                    const selectedMin = numberFor(displayParams, keys.min);
                    const selectedMax = numberFor(displayParams, keys.max);
                    const hasFullScaleAvailable = isHeight && rawMax > HEIGHT_RANGE_CAP;
                    const isFullScale =
                      Boolean(expandedRangeScales[filter.key]) ||
                      (hasFullScaleAvailable && selectedMax !== null && selectedMax > HEIGHT_RANGE_CAP);
                    const scaleMax = hasFullScaleAvailable && !isFullScale ? HEIGHT_RANGE_CAP : rawMax;

                    const value: [number, number] = [
                      Math.max(
                        min,
                        Math.min(selectedMin ?? min, scaleMax),
                      ),
                      Math.max(
                        min,
                        Math.min(selectedMax ?? scaleMax, scaleMax),
                      ),
                    ];

                    const fanFoldFilterKey: CatalogOptionFilterKey | null =
                      filter.key === "core"
                        ? "kern_string"
                        : filter.key === "outer_diameter"
                          ? "outer_diameter_string"
                          : null;

                    const fanFoldSelected = fanFoldFilterKey
                      ? valuesFor(
                          displayParams,
                          OPTION_PARAM_KEY[fanFoldFilterKey],
                        ).some(
                          (selectedValue) =>
                             selectedValue.toLowerCase() === "fan-fold",
                        )
                      : false;

                    const fanFoldCount = fanFoldFilterKey
                      ? (catalog.filters.options
                          .find(
                            (optionFilter) =>
                              optionFilter.key === fanFoldFilterKey,
                          )
                          ?.options.find(
                            (option) =>
                              option.value.toLowerCase() === "fan-fold",
                          )?.count ?? 0)
                      : 0;

                    return (
                      <Accordion
                        key={filter.key}
                        title={getFilterTitle(filter.key, filter.title)}
                        defaultOpen={true}
                        size="compact"
                        className="bg-white"
                      >
                        <div className="flex flex-col gap-3">
                          <RangeSlider
                            min={min}
                            max={scaleMax}
                            value={value}
                            onChange={() => {}}
                            onAfterChange={(range) =>
                              setRange(filter.key, range, min, scaleMax)
                            }
                            formatValue={(rangeValue) =>
                              formatRangeValue(
                                rangeValue,
                                filter.unitPrefix,
                                filter.unitSuffix,
                              )
                            }
                            inputPrefix={filter.unitPrefix}
                          />

                          {hasFullScaleAvailable ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!isFullScale) {
                                  setExpandedRangeScales((current) => ({
                                    ...current,
                                    [filter.key]: true,
                                  }));
                                  return;
                                }

                                setExpandedRangeScales((current) => ({
                                  ...current,
                                  [filter.key]: false,
                                }));

                                if (
                                  (selectedMin !== null && selectedMin > HEIGHT_RANGE_CAP) ||
                                  (selectedMax !== null && selectedMax > HEIGHT_RANGE_CAP)
                                ) {
                                  setParams((params) => {
                                    const cappedMin = Math.min(selectedMin ?? min, HEIGHT_RANGE_CAP);
                                    if (cappedMin <= min) {
                                      params.delete(keys.min);
                                    } else {
                                      params.set(keys.min, String(cappedMin));
                                    }
                                    params.set(keys.max, String(HEIGHT_RANGE_CAP));
                                    params.set("page", "1");
                                  });
                                }
                              }}
                              className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                            >
                              {isFullScale ? t("filters.collapseScale") : t("filters.expandScale")}
                            </button>
                          ) : null}

                          {fanFoldFilterKey ? (
                            <button
                              type="button"
                              onClick={() =>
                                toggleOption(fanFoldFilterKey, "Fan-fold")
                              }
                              className={`inline-flex min-h-9 w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                fanFoldSelected
                                  ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                  : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                              }`}
                              aria-pressed={fanFoldSelected}
                            >
                              <span>{t("filters.fanFold")}</span>
                              <span
                                className={
                                  fanFoldSelected
                                    ? "text-white/75"
                                    : "text-slate-400"
                                }
                              >
                                {fanFoldCount}
                              </span>
                              {fanFoldSelected ? (
                                <span className="text-base leading-none text-white/80">
                                  ×
                                </span>
                              ) : null}
                            </button>
                          ) : null}
                        </div>
                      </Accordion>
                    );
                  }

                  const filter = entry.filter;
                  const paramKey = OPTION_PARAM_KEY[filter.key];
                  const selectedValues = new Set(
                    valuesFor(displayParams, paramKey),
                  );
                  const showAll = showAllFilters[filter.key] ?? false;
                  const DISPLAY_LIMIT = 10;
                  const displayedOptions = showAll
                    ? filter.options
                    : filter.options.slice(0, DISPLAY_LIMIT);
                  const hasMore = filter.options.length > DISPLAY_LIMIT;

                  return (
                    <Accordion
                      key={filter.key}
                      title={getFilterTitle(filter.key, filter.title)}
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
                                onClick={() =>
                                  toggleOption(filter.key, option.value)
                                }
                                className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                  selected
                                    ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                    : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                                }`}
                                aria-pressed={selected}
                              >
                                <span>{option.label}</span>
                                <span
                                  className={
                                    selected
                                      ? "text-white/75"
                                      : "text-slate-400"
                                  }
                                >
                                  {option.count}
                                </span>
                                {selected ? (
                                  <span className="text-base leading-none text-white/80">
                                    ×
                                  </span>
                                ) : null}
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
                            {showAll
                              ? t("filters.showLess")
                              : t("filters.showMore", {
                                  count: filter.options.length - DISPLAY_LIMIT,
                                })}
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
            {loading
              ? t("search.loadingProducts")
              : t("search.results", { count: catalog.total })}
          </div>

          {/* Display "Did you mean" suggestion when no results found */}
          {!loading &&
          catalog.total === 0 &&
          catalog.suggestion &&
          searchValue ? (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                {t("search.didYouMean")}{" "}
                <button
                  type="button"
                  onClick={() => applySearchSuggestion(catalog.suggestion!)}
                  className="font-semibold text-blue-600 underline hover:text-blue-700"
                >
                  {catalog.suggestion}
                </button>
                ?
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          ) : loading && products.length === 0 ? (
            <ProductSkeletonGrid isSidebarOpen={isSidebarOpen} />
          ) : products.length === 0 ? (
            <EmptyState
              title={t("common.noProductsFound")}
              description={t("search.tryAdjustingFilters")}
            />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                  isSidebarOpen ? "xl:grid-cols-3" : "lg:grid-cols-3"
                }`}
              >
                {products.map(({ id, product, href }) => (
                  <ProductCard key={id} product={product} href={href} />
                ))}
              </div>

              {loading && products.length > 0 ? (
                <ProductSkeletonGrid isSidebarOpen={isSidebarOpen} />
              ) : null}

              {catalog.lastPage > 1 ? (
                <ProductPaginationSwitcher
                  currentPage={catalog.currentPage}
                  pageCount={catalog.lastPage}
                  onPageChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsListing(props: ProductsListingProps) {
  return <CatalogProductsListing {...props} />;
}
