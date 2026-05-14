import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ReviewsSection from "@/components/ReviewsSection";
import ProductsListing from "@/components/ProductsListing";
import {
  parseCatalogSearchParams,
  searchCatalogProducts,
} from "@/lib/search/products";
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

      <ReviewsSection />
    </div>
  );
}
