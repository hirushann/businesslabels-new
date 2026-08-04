import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function SearchPageFallback() {
  return <div className="min-h-screen bg-[#F7F7F7]" />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient />
    </Suspense>
  );
}
