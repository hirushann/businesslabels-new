import { Suspense } from "react";
import FinderPageClient from "./FinderPageClient";
import PrinterSelectionClient from "./PrinterSelectionClient";

export const metadata = {
  title: "Product Finder — BusinessLabels",
  description: "Find compatible labels and ink for your Epson ColorWorks printer",
};

function FinderPageFallback() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="text-neutral-600">Loading products...</div>
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
  const hasFinderParameters = Boolean(query.printer_id || query.product_type);

  if (!hasFinderParameters) {
    return (
      <Suspense fallback={<FinderPageFallback />}>
        <PrinterSelectionClient />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<FinderPageFallback />}>
      <FinderPageClient />
    </Suspense>
  );
}
