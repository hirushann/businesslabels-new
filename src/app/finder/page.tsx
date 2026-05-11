import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import FinderPageClient from "./FinderPageClient";
import PrinterSelectionClient from "./PrinterSelectionClient";

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t("pages.finderMetadataTitle"),
    description: t("pages.finderMetadataDescription"),
  };
}

function FinderPageFallback({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="text-neutral-600">{label}</div>
    </div>
  );
}

type FinderSearchParams = {
  page?: string | string[];
  printer_id?: string | string[];
  product_type?: string | string[];
};

export default async function FinderPage({
  searchParams,
}: {
  searchParams: Promise<FinderSearchParams>;
}) {
  const query = await searchParams;
  const t = await getTranslations();
  const hasFinderParameters = Boolean(query.printer_id || query.product_type);

  if (!hasFinderParameters) {
    return (
      <Suspense fallback={<FinderPageFallback label={t("pages.loadingProducts")} />}>
        <PrinterSelectionClient />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<FinderPageFallback label={t("pages.loadingProducts")} />}>
      <FinderPageClient />
    </Suspense>
  );
}
