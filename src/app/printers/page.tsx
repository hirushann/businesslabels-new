import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { materialReviews } from "@/lib/materialCatalog";
import ProductsListing from "@/components/ProductsListing";
import { parseCatalogSearchParams, searchCatalogProducts } from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.printersMetadataTitle"),
    description: t("pages.printersMetadataDescription"),
  };
}

type PrintersPageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(query: PrintersPageSearchParams): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  });

  return params;
}

const emptyCatalogResponse: CatalogSearchResponse = {
  products: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { ranges: [], options: [] },
};

export default async function PrinterPage({
  searchParams,
}: {
  searchParams: Promise<PrintersPageSearchParams>;
}) {
  const t = await getTranslations();
  const rawParams = await searchParams;
  const routeQuery = toUrlSearchParams(rawParams);
  const scopeQuery = new URLSearchParams({ category: "labelprinters" });
  const initialSearchQuery = new URLSearchParams(scopeQuery);

  routeQuery.forEach((value, key) => {
    initialSearchQuery.append(key, value);
  });

  let initialCatalog = emptyCatalogResponse;
  let baselineCatalog = emptyCatalogResponse;

  try {
    [initialCatalog, baselineCatalog] = await Promise.all([
      searchCatalogProducts(parseCatalogSearchParams(initialSearchQuery)),
      searchCatalogProducts(parseCatalogSearchParams(scopeQuery)),
    ]);
  } catch (error) {
    console.error("Failed to load printer catalog.", error);
  }

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-64 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />
      <div className="pointer-events-none absolute right-0 top-[900px] h-48 w-48 translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />

      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <div className="border-b border-slate-200 pb-5">
            <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
              <span>{t("common.home")}</span>
              <span>/</span>
              <span>{t("common.printers")}</span>
            </div>
            <div className="flex flex-col gap-5">
              <h1 className="text-3xl font-bold font-['Segoe_UI'] leading-8 text-neutral-800">
                {t("common.printers")}
              </h1>
              <ProductsListing
                initialCatalog={initialCatalog}
                initialQueryString={routeQuery.toString()}
                scopeQueryString={scopeQuery.toString()}
                baselineRangeFilters={baselineCatalog.filters.ranges}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">{t("reviewsSection.title")}</h2>
            <div className="flex items-center gap-6">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-neutral-700 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)]"
                aria-label={t("reviewsSection.previous")}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500 bg-white text-amber-500 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)]"
                aria-label={t("reviewsSection.next")}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {materialReviews.map((review) => (
              <article
                key={review.name}
                className="flex min-h-72 flex-col justify-between gap-8 rounded-xl border border-gray-100 bg-white p-5 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src={`https://placehold.co/96x96?text=${encodeURIComponent(review.name.charAt(0))}`}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-full"
                      unoptimized
                    />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold leading-5 text-neutral-800">{review.name}</h3>
                      <p className="text-sm leading-5 text-zinc-500">{review.time}</p>
                    </div>
                  </div>
                  <p className="text-base leading-6 text-neutral-700">{review.text}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm leading-5 text-zinc-500">{t("reviewsSection.postedOn")}</span>
                  <span className="text-sm font-semibold leading-5 text-neutral-800">{t("reviewsSection.google")}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
