/**
 * i18n configuration.
 *
 * Backend (Laravel) resolves the active locale from the `?lang=` query param
 * (see App\Support\ApiLocale). The frontend persists the user's choice in a
 * cookie and forwards it to every API request.
 */

export const LOCALES = /** @type {const} */ (['en', 'nl']);
export const DEFAULT_LOCALE = 'en';
export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const LOCALE_LABELS = {
  en: { name: 'English', short: 'EN' },
  nl: { name: 'Nederlands', short: 'NL' },
};

/**
 * @param {unknown} value
 * @returns {'en' | 'nl'}
 */
export function normalizeLocale(value) {
  if (typeof value !== 'string') return DEFAULT_LOCALE;
  const lower = value.toLowerCase().split('-')[0];
  return LOCALES.includes(lower) ? lower : DEFAULT_LOCALE;
}
