import 'server-only';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale } from './config';

/**
 * Read the active locale from the request cookie. Server Components only.
 * @returns {Promise<'en' | 'nl'>}
 */
export async function getServerLocale() {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

/**
 * Append `?lang=<locale>` to a URL, preserving any existing query string.
 * @param {string} url
 * @param {'en' | 'nl'} locale
 * @returns {string}
 */
export function withLocaleParam(url, locale) {
  const lang = normalizeLocale(locale);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}lang=${encodeURIComponent(lang)}`;
}
