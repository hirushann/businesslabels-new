/**
 * i18n utilities — locale cookie access (browser) and field resolution.
 *
 * For server-side cookie access, use `cookies()` from `next/headers` directly.
 */

import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, normalizeLocale } from './config';

/**
 * Read the active locale from the document cookie. Browser-only.
 * @returns {'en' | 'nl'}
 */
export function readLocaleCookieClient() {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  return normalizeLocale(match ? decodeURIComponent(match[1]) : null);
}

/**
 * Persist the active locale in a cookie. Browser-only.
 * @param {'en' | 'nl'} locale
 */
export function writeLocaleCookieClient(locale) {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(normalizeLocale(locale));
  document.cookie = `${LOCALE_COOKIE}=${value}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Resolve a multi-locale field to a string for the active locale.
 *
 * Accepts the API's `{ en, nl }` shape, a plain string, null, or undefined.
 * Falls back to the default locale, then any non-empty value.
 *
 * @param {string | { en?: string; nl?: string } | null | undefined} value
 * @param {'en' | 'nl'} locale
 * @returns {string}
 */
export function pickLocale(value, locale) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return '';

  const active = value[locale];
  if (typeof active === 'string' && active.length > 0) return active;

  const fallback = value[DEFAULT_LOCALE];
  if (typeof fallback === 'string' && fallback.length > 0) return fallback;

  for (const key of Object.keys(value)) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  return '';
}

/**
 * Build a locale-aware internal path.
 *
 * - EN: prepends '/en'  → '/en/products/some-slug'
 * - NL: returns path as-is → '/product/some-slug'
 *
 * @param {string} path   Internal path, must start with '/'
 * @param {string} locale
 * @returns {string}
 */
export function localePath(path, locale) {
  const normalized = normalizeLocale(locale);
  if (normalized === 'en') {
    if (path === '/software') {
      return '/en/software-2';
    }
    return '/en' + path;
  }
  return path;
}

/**
 * Strip any locale prefix from a path.
 * '/en/products/foo' → '/product/foo'
 * '/product/foo'   → '/product/foo'
 *
 * @param {string} path
 * @returns {string}
 */
export function stripLocalePath(path) {
  if (path.startsWith('/en/')) {
    const rest = path.slice(3);
    if (rest === '/software-2') {
      return '/software';
    }
    return rest;
  }
  if (path === '/en') return '/';
  return path;
}
