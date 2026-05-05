import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';

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
