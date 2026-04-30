import { Suspense } from "react";
import FinderPageClient from "./FinderPageClient";

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

export default function FinderPage() {
  return (
    <Suspense fallback={<FinderPageFallback />}>
      <FinderPageClient />
    </Suspense>
  );
}
