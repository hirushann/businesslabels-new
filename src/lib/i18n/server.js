import 'server-only';

import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, LOCALE_HEADER, normalizeLocale } from './config';

/**
 * Read the active locale from the request cookie. Server Components only.
 * @returns {Promise<'en' | 'nl'>}
 */
export async function getServerLocale() {
  const requestHeaders = await headers();
  const proxiedLocale = requestHeaders.get(LOCALE_HEADER);
  if (proxiedLocale) {
    return normalizeLocale(proxiedLocale);
  }

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
