'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOCALE, normalizeLocale } from './config';
import { pickLocale, writeLocaleCookieClient } from './utils';

const LocaleContext = createContext(null);

/**
 * @param {{ initialLocale?: 'en' | 'nl', children: React.ReactNode }} props
 */
export function LocaleProvider({ initialLocale = DEFAULT_LOCALE, children }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(() => normalizeLocale(initialLocale));

  const setLocale = useCallback(
    (next) => {
      const normalized = normalizeLocale(next);
      if (normalized === locale) return;
      writeLocaleCookieClient(normalized);
      setLocaleState(normalized);
      router.refresh();
    }, [locale, router],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (field) => pickLocale(field, locale),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}
