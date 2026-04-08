'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useNextRoutingOptions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathnameRef = useRef(pathname);
  const searchRef = useRef(searchParams?.toString() ?? '');

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    searchRef.current = searchParams?.toString() ?? '';
  }, [searchParams]);

  const readUrl = useCallback(() => {
    const current = searchRef.current;
    return current ? `?${current}` : '';
  }, []);

  const writeUrl = useCallback(
    (url: string, { replaceUrl }: { replaceUrl?: boolean } = {}) => {
      const query = url.startsWith('?') ? url.slice(1) : url;
      const basePath = pathnameRef.current || '/';
      const href = query ? `${basePath}?${query}` : basePath;

      // Keep URL state updates smooth while typing; Search UI still controls replace/push intent.
      if (replaceUrl !== false) {
        router.replace(href, { scroll: false });
        return;
      }

      router.push(href, { scroll: false });
    },
    [router]
  );

  const routeChangeHandler = useCallback((callback: (url: string) => void) => {
    const onPopState = () => callback(window.location.search);

    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return useMemo(() => {
    return {
      readUrl,
      writeUrl,
      routeChangeHandler,
    };
  }, [readUrl, routeChangeHandler, writeUrl]);
}
