import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FinderListing from "@/components/FinderListing";
import FinderPageClient from "./FinderPageClient";
import { parsePrinterSearchParams, searchPrinters } from "@/lib/search/printers";
import type { PrinterSearchResponse } from "@/lib/search/printerTypes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.finderMetadataTitle"),
    description: t("pages.finderMetadataDescription"),
  };
}

type FinderPageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(query: FinderPageSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  });
  return params;
}

const emptyPrinterCatalog: PrinterSearchResponse = {
  printers: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { options: [] },
};

export default async function FinderPage({
  searchParams,
}: {
  searchParams: Promise<FinderPageSearchParams>;
}) {
  const t = await getTranslations();
  const rawParams = await searchParams;
  
  // If printer_id is present, show the products view
  if (rawParams.printer_id) {
    return <FinderPageClient />;
  }
  
  // Otherwise show the printer listing
  const query = toUrlSearchParams(rawParams);
  let initialCatalog = emptyPrinterCatalog;

  try {
    initialCatalog = await searchPrinters(parsePrinterSearchParams(query));
  } catch (error) {
    console.error("Failed to load printer catalog.", error);
  }

  return (
    <section className="bg-white px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-360 flex-col gap-10">
        <div className="border-b border-slate-200 pb-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
            <span>{t("common.home")}</span>
            <span>/</span>
            <span>{t("common.printers") || "Printers"}</span>
          </div>
          <h1 className="text-3xl font-bold font-['Segoe_UI'] leading-8 text-neutral-800">
            {t("finder.printerFinder")}
          </h1>
        </div>
        
        <FinderListing initialCatalog={initialCatalog} initialQueryString={query.toString()} />
      </div>
    </section>
  );
}
