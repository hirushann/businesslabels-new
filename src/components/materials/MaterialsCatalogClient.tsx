"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Accordion from "@/components/Accordion";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";
import EmptyState from "@/components/EmptyState";
import { useDebouncedSearchParam } from "@/components/search/useDebouncedSearchParam";
import type { Material, MaterialSearchResponse } from "@/lib/search/materials";
import MaterialCard from "./MaterialCard";

// Inline helper for labels
const getLocalizedLabel = (key: string, locale: string) => {
  const dictionary: Record<string, Record<string, string>> = {
    en: {
      "Inkjet": "Inkjet",
      "Thermal Transfer": "Thermal Transfer",
      "Thermal Direct": "Thermal Direct",
      "Paper": "Paper",
      "PE (polyethylene)": "PE (polyethylene)",
      "PP (polypropylene)": "PP (polypropylene)",
      "PO (polyolefin)": "PO (polyolefin)",
      "Glossy": "Glossy",
      "Matte": "Matte",
      "Top Coated": "Top Coated",
      "Permanent": "Permanent",
      "Removable": "Removable",
      "Weight": "Weight",
      "Thickness": "Thickness",
      "full_color_media": "Full color media",
      "print_with_ribbon": "Print with ribbon",
      "print_without_ribbon": "Print without ribbon",
      "all_materials": "All Materials",
      "filters": "Filters",
      "sort_by": "Name: A to Z",
      "sort_by_desc": "Name: Z to A",
      "base_material": "Base Material",
      "finish": "Finish",
      "adhesive": "Adhesive",
      "clear_all": "Clear all filters",
      "view_details": "View Details",
      "no_materials_found": "No materials found",
      "no_materials_desc": "Try clearing some filters or selecting another printing method.",
      "previous": "Previous",
      "next": "Next",
      "all_printers": "All Printing Methods",
      "search_placeholder": "Search materials by name, code or brand",
      "no_search_results_desc": "Try a different keyword or clear filters."
    },
    nl: {
      "Inkjet": "Inkjet",
      "Thermal Transfer": "Thermal Transfer",
      "Thermal Direct": "Thermal Direct",
      "Paper": "Papier",
      "PE (polyethylene)": "PE (polyethyleen)",
      "PP (polypropylene)": "PP (polypropyleen)",
      "PO (polyolefin)": "PO (polyolefine)",
      "Glossy": "Glanzend",
      "Matte": "Mat",
      "Top Coated": "Top Coated",
      "Permanent": "Permanent",
      "Removable": "Verwijderbaar",
      "Weight": "Gewicht",
      "Thickness": "Dikte",
      "full_color_media": "Full-color media",
      "print_with_ribbon": "Printen met lint",
      "print_without_ribbon": "Printen zonder lint",
      "all_materials": "Alle materialen",
      "filters": "Filters",
      "sort_by": "Naam: A tot Z",
      "sort_by_desc": "Naam: Z tot A",
      "base_material": "Basismateriaal",
      "finish": "Afwerking",
      "adhesive": "Lijm",
      "clear_all": "Filters wissen",
      "view_details": "Bekijk Details",
      "no_materials_found": "Geen materialen gevonden",
      "no_materials_desc": "Probeer filters te wissen of selecteer een andere printtechnologie.",
      "previous": "Vorige",
      "next": "Volgende",
      "all_printers": "Alle printtechnologieën",
      "search_placeholder": "Zoek materialen op naam, code of merk",
      "no_search_results_desc": "Probeer een ander zoekwoord of wis de filters."
    }
  };
  const lang = locale === "nl" ? "nl" : "en";
  return dictionary[lang][key] || key;
};



export default function MaterialsCatalogClient({
  initialCatalog,
  initialQueryString,
  locale,
  defaultPrintMethod = "",
}: {
  initialCatalog: MaterialSearchResponse;
  initialQueryString: string;
  locale: string;
  /** When set, the print method is locked to this value via the URL path (e.g. /material/inkjet). */
  defaultPrintMethod?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Filters sidebar toggle state (collapsible like category/shop pages)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effective print method: path-based prop takes priority over URL query param
  const printMethod = defaultPrintMethod || searchParams.get("print_method") || "";
  const sort = searchParams.get("sort") || "name_asc";
  const searchValue = searchParams.get("search") || "";

  const selectedBaseMaterials = useMemo(() => {
    const val = searchParams.get("base_material");
    return val ? val.split(",") : [];
  }, [searchParams]);

  const selectedFinishes = useMemo(() => {
    const val = searchParams.get("finish");
    return val ? val.split(",") : [];
  }, [searchParams]);

  const selectedAdhesives = useMemo(() => {
    const val = searchParams.get("adhesive");
    return val ? val.split(",") : [];
  }, [searchParams]);

  // Update query parameters helper
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    // Reset page to 1 when changing filters
    if (!updates.hasOwnProperty("page")) {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Toggle filter item
  const toggleFilter = (type: "base_material" | "finish" | "adhesive", value: string) => {
    let current: string[] = [];
    if (type === "base_material") current = [...selectedBaseMaterials];
    if (type === "finish") current = [...selectedFinishes];
    if (type === "adhesive") current = [...selectedAdhesives];

    const idx = current.indexOf(value);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }

    updateQuery({ [type]: current.join(",") });
  };

  // Toggle Print Method — navigates to /material/{method} path URLs
  const togglePrintMethod = (method: string) => {
    // Resolve the /material base preserving any locale prefix (e.g. /en/material)
    const materialsBase = pathname.replace(/\/material.*$/, "/material");
    if (printMethod === method) {
      // Deselect: go back to the main materials page
      router.push(materialsBase);
    } else {
      // Navigate to the method-specific page
      router.push(`${materialsBase}/${method}`);
    }
  };

  // Clear all filters (query-param filters only; path-based method is cleared by clicking the card)
  const clearAllFilters = () => {
    updateQuery({
      base_material: null,
      finish: null,
      adhesive: null,
      search: null,
      page: null,
    });
  };

  // Search input wired to URL ?search= via debounce
  const commitSearch = useCallback(
    (next: string) => {
      updateQuery({ search: next || null });
    },
    // updateQuery closes over searchParams/router/pathname; safe to omit since
    // useDebouncedSearchParam stores the latest callback in a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, pathname, router],
  );

  const { inputValue: searchInput, setInputValue: setSearchInput } =
    useDebouncedSearchParam({
      value: searchValue,
      onCommit: commitSearch,
    });

  const scopedQueryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (defaultPrintMethod) {
      params.set("print_method", defaultPrintMethod);
    }
    return params.toString();
  }, [defaultPrintMethod, searchParams]);

  useEffect(() => {
    if (scopedQueryString === initialQueryString) {
      const timeoutId = window.setTimeout(() => {
        setCatalog(initialCatalog);
        setError(null);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const controller = new AbortController();
    let isCurrent = true;
    const loadingTimeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    const params = new URLSearchParams(scopedQueryString);
    params.set("locale", locale);

    fetch(`/api/materials?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Material search is temporarily unavailable.");
        }
        return response.json() as Promise<MaterialSearchResponse>;
      })
      .then((nextCatalog) => {
        if (isCurrent) setCatalog(nextCatalog);
      })
      .catch((fetchError) => {
        if (isCurrent && (fetchError as { name?: string }).name !== "AbortError") {
          setError(fetchError instanceof Error ? fetchError.message : "Material search failed.");
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
      window.clearTimeout(loadingTimeoutId);
      controller.abort();
    };
  }, [initialCatalog, initialQueryString, locale, scopedQueryString]);

  const total = catalog.total;
  const lastPage = catalog.lastPage;
  const activePage = catalog.currentPage;
  const paginatedMaterials = catalog.materials;

  // Filter choices
  const filterSections = [
    {
      type: "base_material" as const,
      title: getLocalizedLabel("base_material", locale),
      options: [
        { value: "paper", label: getLocalizedLabel("Paper", locale) },
        { value: "pe (polyethylene)", label: getLocalizedLabel("PE (polyethylene)", locale) },
        { value: "pp (polypropylene)", label: getLocalizedLabel("PP (polypropylene)", locale) },
        { value: "po (polyolefin)", label: getLocalizedLabel("PO (polyolefin)", locale) },
      ],
      selected: selectedBaseMaterials,
    },
    {
      type: "finish" as const,
      title: getLocalizedLabel("finish", locale),
      options: [
        { value: "glossy", label: getLocalizedLabel("Glossy", locale) },
        { value: "matte", label: getLocalizedLabel("Matte", locale) },
        { value: "top coated", label: getLocalizedLabel("Top Coated", locale) },
      ],
      selected: selectedFinishes,
    },
    {
      type: "adhesive" as const,
      title: getLocalizedLabel("adhesive", locale),
      options: [
        { value: "permanent", label: getLocalizedLabel("Permanent", locale) },
        { value: "removable", label: getLocalizedLabel("Removable", locale) },
      ],
      selected: selectedAdhesives,
    },
  ];


  // Don't count the path-baked print method (defaultPrintMethod) as a user-added filter
  const activeFilterCount =
    selectedBaseMaterials.length +
    selectedFinishes.length +
    selectedAdhesives.length +
    (!defaultPrintMethod && printMethod ? 1 : 0) +
    (searchValue ? 1 : 0);

  // Sync scroll on change
  useEffect(() => {
    window.scrollTo({ top: 400, behavior: "smooth" });
  }, [searchParams]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-10 !w-full">
      {/* Print Technology Selector Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Inkjet Card */}
        <button
          type="button"
          onClick={() => togglePrintMethod("inkjet")}
          className={`group flex flex-col overflow-hidden text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${printMethod === "inkjet" ? "border-brand ring-2 ring-brand/20" : "border-slate-100"
            }`}
        >
          <div className="relative h-44 w-full overflow-hidden rounded-xl">
            <Image
              src="/images/inkjet_preview.png"
              alt="Inkjet printer preview"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                {getLocalizedLabel("Inkjet", locale)}
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${printMethod === "inkjet" ? "bg-brand scale-125" : "bg-slate-200"
                    }`}
                />
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                {getLocalizedLabel("full_color_media", locale)}
              </p>
            </div>
          </div>
        </button>

        {/* Thermal Transfer Card */}
        <button
          type="button"
          onClick={() => togglePrintMethod("thermal-transfer")}
          className={`group flex flex-col overflow-hidden text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${printMethod === "thermal-transfer" ? "border-slate-800 ring-2 ring-slate-800/10" : "border-slate-100"
            }`}
        >
          <div className="relative h-44 w-full overflow-hidden rounded-xl">
            <Image
              src="/images/thermal_transfer_preview.png"
              alt="Thermal transfer printer preview"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                {getLocalizedLabel("Thermal Transfer", locale)}
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${printMethod === "thermal-transfer" ? "bg-slate-800 scale-125" : "bg-slate-200"
                    }`}
                />
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                {getLocalizedLabel("print_with_ribbon", locale)}
              </p>
            </div>
          </div>
        </button>

        {/* Thermal Direct Card */}
        <button
          type="button"
          onClick={() => togglePrintMethod("thermal-direct")}
          className={`group flex flex-col overflow-hidden text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${printMethod === "thermal-direct" ? "border-emerald-600 ring-2 ring-emerald-500/15" : "border-slate-100"
            }`}
        >
          <div className="relative h-44 w-full overflow-hidden rounded-xl">
            <Image
              src="/images/thermal_direct_preview.png"
              alt="Thermal direct printer preview"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                {getLocalizedLabel("Thermal Direct", locale)}
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${printMethod === "thermal-direct" ? "bg-emerald-600 scale-125" : "bg-slate-200"
                    }`}
                />
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                {getLocalizedLabel("print_without_ribbon", locale)}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Materials Catalog Block */}
      <div className="flex flex-col gap-6">
        {/* Section heading with controls */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              {getLocalizedLabel("all_materials", locale)}
              {total > 0 && <span className="ml-2.5 text-sm font-normal text-slate-400">({total})</span>}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EDF2F7]">
            <div className="flex items-center gap-4">
              {/* Filters Toggle Button */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className={`inline-flex h-[42px] w-fit items-center gap-2 px-1 py-2 transition-colors ${
                  isSidebarOpen ? "text-brand" : "text-neutral-800 hover:text-brand"
                }`}
                aria-expanded={isSidebarOpen}
              >
                <span className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand">
                    <path d="M17.4993 3.33398H11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.33333 3.33398H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.5 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.66667 10H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.5007 16.666H13.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 16.666H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.666 1.66602V4.99935" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.334 15V18.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-lg font-bold font-sans leading-6">
                    {getLocalizedLabel("filters", locale)}
                  </span>
                  {activeFilterCount > 0 ? (
                    <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      isSidebarOpen ? "bg-amber-100 text-brand" : "bg-brand text-white"
                    }`}>
                      {activeFilterCount}
                    </span>
                  ) : null}
                </span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 flex-1 sm:w-[280px]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0 text-slate-400"
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
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={getLocalizedLabel("search_placeholder", locale)}
                  aria-label={getLocalizedLabel("search_placeholder", locale)}
                  className="h-full w-full bg-transparent text-sm text-neutral-800 outline-none"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    aria-label="Clear search"
                    className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path
                        d="M3 3l8 8M11 3l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>

              {/* Sort select indicator */}
              <div className="relative flex shrink-0 items-center h-10 self-end sm:self-auto">
                <select
                  value={sort}
                  onChange={(e) => updateQuery({ sort: e.target.value })}
                  className="appearance-none bg-transparent text-sm font-medium font-sans outline-none cursor-pointer hover:text-brand pr-6 text-neutral-800"
                >
                  <option value="name_asc">{getLocalizedLabel("sort_by", locale)}</option>
                  <option value="name_desc">{getLocalizedLabel("sort_by_desc", locale)}</option>
                </select>
                <div className="pointer-events-none absolute right-0 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                    <path d="M7 15l5 5 5-5"/>
                    <path d="M7 9l5-5 5 5"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className={`flex flex-col gap-6 lg:grid ${isSidebarOpen ? "lg:grid-cols-4 lg:items-start" : "lg:grid-cols-4"}`}>
          {/* Collapsible Filters Sidebar */}
          {isSidebarOpen && (
            <aside className="w-full shrink-0 rounded-xl border border-slate-100 bg-white p-4 shadow-[2px_4px_20px_0px_rgba(109,109,120,0.08)] lg:col-span-1 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-neutral-800">
                      {getLocalizedLabel("filters", locale)}
                    </h2>
                    {activeFilterCount > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-brand">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </div>
                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      {getLocalizedLabel("clear_all", locale)}
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  {filterSections.map((sec) => (
                    <Accordion
                      key={sec.type}
                      title={sec.title}
                      defaultOpen={true}
                      size="compact"
                      className="bg-white"
                    >
                      <div className="flex flex-col gap-3 pt-2">
                        <div className="flex flex-wrap gap-2">
                          {sec.options.map((opt) => {
                            const selected = sec.selected.includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggleFilter(sec.type, opt.value)}
                                className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selected
                                  ? "bg-brand text-white shadow-sm hover:bg-brand-hover"
                                  : "bg-slate-100 text-neutral-700 hover:bg-brand-soft hover:text-brand"
                                  }`}
                                aria-pressed={selected}
                              >
                                <span>{opt.label}</span>
                                {selected && (
                                  <span className="text-base leading-none text-white/80">
                                    ×
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </Accordion>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Grid listing */}
          <div className={`min-w-0 flex-1 flex flex-col gap-8 ${isSidebarOpen ? "lg:col-span-3" : "lg:col-span-4"}`}>
            {error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {paginatedMaterials.length > 0 ? (
              <div
                className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 ${loading ? "opacity-60" : "opacity-100"} ${isSidebarOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
              >
                {paginatedMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    locale={locale}
                    printMethod={printMethod}
                  />
                ))}
              </div>
            ) : loading ? (
              <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${isSidebarOpen ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
                {Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={index}
                    className="h-[520px] animate-pulse rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(109,109,120,0.05)]"
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={getLocalizedLabel("no_materials_found", locale)}
                description={
                  searchValue
                    ? getLocalizedLabel("no_search_results_desc", locale)
                    : getLocalizedLabel("no_materials_desc", locale)
                }
                className="my-10 w-full"
              />
            )}

            {/* Pagination controls */}
            {lastPage > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-6 pb-4">
                {activePage > 1 && (
                  <button
                    onClick={() => updateQuery({ page: String(activePage - 1) })}
                    className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    {getLocalizedLabel("previous", locale)}
                  </button>
                )}
                {Array.from({ length: lastPage }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => updateQuery({ page: String(p) })}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3.5 text-xs font-bold transition-all ${p === activePage
                        ? "bg-brand border-brand text-white shadow-md shadow-brand/10"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {activePage < lastPage && (
                  <button
                    onClick={() => updateQuery({ page: String(activePage + 1) })}
                    className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    {getLocalizedLabel("next", locale)}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
