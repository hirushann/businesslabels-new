'use client';

import { useRouter } from 'next/navigation';
import SearchOverlay from '@/components/search/SearchOverlay';

export default function SearchPageClient() {
  const router = useRouter();

  return <SearchOverlay onClose={() => router.push('/')} />;
}
