'use client';

import { useLocale } from 'next-intl';
import { localePath } from '@/lib/i18n/utils';

/**
 * Returns a `localePath(path)` function bound to the current locale.
 *
 * Usage:
 *   const lp = useLocalePath();
 *   <Link href={lp('/products')}>...</Link>
 *
 * @returns {(path: string) => string}
 */
export function useLocalePath() {
  const locale = useLocale();
  return (path) => localePath(path, locale);
}
