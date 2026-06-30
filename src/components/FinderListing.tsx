"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import EmptyState from "@/components/EmptyState";
import PrinterCard from "@/components/PrinterCard";
import { useDebouncedSearchParam } from "@/components/search/useDebouncedSearchParam";
import { RequestPrinterModal } from "@/components/RequestPrinterModal";
import { getPrinterPath } from "@/lib/routes/printers";

import type {
  PrinterCardData,
  PrinterSearchResponse,
} from "@/lib/search/printerTypes";


type PrintersListingProps = {
  initialCatalog: PrinterSearchResponse;
  initialQueryString: string;
};

export default function FinderListing({
  initialCatalog,
  initialQueryString,
}: PrintersListingProps) {
  const t = useTranslations();
  const locale = useLocale();
  const faqItems = useMemo(() => [
    {
      title: t("finder.faqNotListedTitle"),
      body: t("finder.faqNotListedBody"),
    },
    {
      title: t("finder.faqHowItWorksTitle"),
      body: t("finder.faqHowItWorksBody"),
    },
    {
      title: t("finder.faqSavePrintersTitle"),
      body: t("finder.faqSavePrintersBody"),
    },
  ], [t]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasFocusedSearchRef = useRef(false);

  // Accumulated printers across pages
  const [printers, setPrinters] = useState<PrinterCardData[]>(
    initialCatalog.printers,
  );
  const [currentPage, setCurrentPage] = useState(initialCatalog.currentPage);
  const [lastPage, setLastPage] = useState(initialCatalog.lastPage);
  const [total, setTotal] = useState(initialCatalog.total);

  // Track the query string that the current printer list was fetched for,
  // so we know when to reset vs. append
  const [queryString, setQueryString] = useState(initialQueryString);

  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentQueryString = searchParams.toString();
  const loading = isPending || isFetching;
  const hasMore = currentPage < lastPage;

  // Auto-focus search on mount / when focus param present
  useEffect(() => {
    if (!hasFocusedSearchRef.current || searchParams.get("focus") === "true") {
      hasFocusedSearchRef.current = true;
      searchInputRef.current?.focus();
    }
  }, [searchParams]);

  // When the search/filter query changes, reset list back to page 1
  useEffect(() => {
    if (currentQueryString === queryString) return;

    const controller = new AbortController();
    let isCurrent = true;

    const loadingTimeoutId = window.setTimeout(() => {
      if (isCurrent) setIsFetching(true);
    }, 0);

    async function fetchPage1() {
      // Strip any existing page param and fetch page 1
      const params = new URLSearchParams(currentQueryString);
      params.delete("page");
      const endpoint = params.toString()
        ? `/api/printers?${params.toString()}`
        : "/api/printers";

      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (response.ok && isCurrent) {
          const data: PrinterSearchResponse = await response.json();
          console.log("[FinderListing] Client-side fetchPage1 printers received:", data.printers);
          setPrinters(data.printers);
          setCurrentPage(data.currentPage);
          setLastPage(data.lastPage);
          setTotal(data.total);
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

    fetchPage1();

    return () => {
      isCurrent = false;
      window.clearTimeout(loadingTimeoutId);
      controller.abort();
    };
  }, [currentQueryString, queryString]);

  // Load next page and append to existing list
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    const params = new URLSearchParams(currentQueryString);
    params.set("page", String(nextPage));
    const endpoint = `/api/printers?${params.toString()}`;

    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data: PrinterSearchResponse = await response.json();
        console.log("[FinderListing] Client-side loadMore printers received:", data.printers);
        setPrinters((prev) => [...prev, ...data.printers]);
        setCurrentPage(data.currentPage);
        setLastPage(data.lastPage);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to load more printers:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, currentPage, currentQueryString]);

  const searchValue = searchParams.get("search") || searchParams.get("q") || "";

  const setParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      updater(next);
      const nextString = next.toString();
      const href = nextString ? `${pathname}?${nextString}` : pathname;
      startTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      setParams((params) => {
        if (value) {
          params.set("search", value);
        } else {
          params.delete("search");
          params.delete("q");
        }
        params.delete("page");
      });
    },
    [setParams],
  );

  const {
    inputValue: searchInput,
    setInputValue: setSearchInput,
    commitNow: commitSearchNow,
  } = useDebouncedSearchParam({
    value: searchValue,
    onCommit: setSearch,
    delay: 300,
  });

  return (
    <div className="flex flex-col">
      {/* ── Search section ── */}
      <div className="flex flex-col gap-4 pb-4 border-b border-[#EDF0F4] lg:flex-row lg:items-center lg:justify-between max-w-[1440px] mx-auto">
        <h2
          className="text-[#222222] text-3xl font-bold leading-[120%] shrink-0"
          style={{ fontFamily: "Segoe UI, sans-serif" }}
        >
          {t("finder.findYourPrinter")}
        </h2>

        <div className="flex items-stretch gap-4 w-full lg:max-w-200">
          {/* Search input */}
          <div className="flex items-center gap-2 h-10 flex-1 rounded-full border border-[#EDF0F4] bg-white px-4">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
              className="shrink-0 text-[#888888]"
            >
              <circle
                cx="7.875"
                cy="7.875"
                r="5.625"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12.375 12.375L15.75 15.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={searchInputRef}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearchNow();
              }}
              placeholder={t("common.search")}
              className="flex-1 bg-transparent text-sm text-[#222222] placeholder-[#888888] outline-none"
              style={{ fontFamily: "Segoe UI, sans-serif" }}
            />
          </div>

          {/* Request a New Printer button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-5 rounded-full border border-[#F18800] text-[#F18800] font-semibold text-base leading-6 hover:bg-orange-50 transition-colors duration-150 whitespace-nowrap"
            style={{ fontFamily: "Segoe UI, sans-serif" }}
          >
            {t("finder.requestNewPrinter")}
          </button>
        </div>
      </div>

      {/* ── Results count ── */}
      <div
        className="py-4 text-sm text-[#666666] max-w-[1440px] mx-auto"
        style={{ fontFamily: "Segoe UI, sans-serif" }}
      >
        {loading
          ? t("search.loadingProducts")
          : t("search.results", { count: total })}
      </div>

      {/* ── Printer grid ── */}
      {loading && printers.length === 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-[360px] rounded-xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : printers.length === 0 ? (
        <EmptyState
          title={t("finder.noPrintersFound")}
          description={t("finder.noPrintersDescription")}
        />
      ) : (
        <div
          className={`grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200 max-w-[1440px] mx-auto ${
            loading ? "opacity-60 pointer-events-none" : "opacity-100"
          }`}
        >
          {printers.map((printer) => (
            <PrinterCard
              key={printer.id}
              printer={printer}
              href={getPrinterPath(locale, printer.slug)}
            />
          ))}

          {/* Skeleton cards appended at the end while loading more */}
          {isLoadingMore &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="h-[360px] rounded-xl bg-slate-100 animate-pulse"
              />
            ))}
        </div>
      )}

      {/* ── View more Printers button — only shown when more pages exist ── */}
      {!loading && hasMore && (
        <div className="mt-10 flex justify-center  max-w-[1440px] mx-auto">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-full border-[1.5px] border-[#F18800] text-[#F18800] font-semibold text-lg leading-6 hover:bg-orange-50 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: "Segoe UI, sans-serif" }}
          >
            {isLoadingMore ? (
              <>
                <svg
                  className="animate-spin"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="#F18800"
                    strokeWidth="2"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M10 2a8 8 0 0 1 8 8"
                    stroke="#F18800"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {t("common.loading")}
              </>
            ) : (
              t("finder.viewMorePrinters")
            )}
          </button>
        </div>
      )}

      {/* ── FAQ / Info cards section ── */}
      <div className="mt-16 -mx-6 px-6 py-20 bg-[#F7F9FA] sm:-mx-10 sm:px-10 lg:-mx-10 lg:px-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3  max-w-[1440px] mx-auto">
          {faqItems.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl border border-[#EDF0F4] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-5"
            >
              <h3
                className="text-[#222222] text-2xl font-bold leading-[120%]"
                style={{ fontFamily: "Segoe UI, sans-serif" }}
              >
                {item.title}
              </h3>
              <p
                className="text-[#444444] text-base font-normal leading-[150%]"
                style={{ fontFamily: "Segoe UI, sans-serif" }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Request Printer Modal */}
      <RequestPrinterModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
    
  );
}
