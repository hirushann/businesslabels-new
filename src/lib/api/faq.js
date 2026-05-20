/**
 * FAQ API
 *
 * CMS-driven FAQ hub. `/faq` lists published FAQ pages; `/faq/slug/{slug}`
 * returns a single page with its ordered sections and the reusable FAQ items
 * inside each section.
 *
 * Localised server-side: pass a `locale` to receive the matching language.
 * Slugs are translatable, so the locale also affects slug resolution.
 *
 * @see Laravel: App\Http\Controllers\Api\FaqController
 * @see Laravel: App\Http\Resources\Api\FaqPageResource
 */

import api from './client';

/**
 * Build an axios config carrying the `?lang=` query when a locale is given.
 * @param {string} [locale]
 */
function langParams(locale) {
  return locale ? { params: { lang: locale } } : undefined;
}

/**
 * List all published FAQ pages (lightweight — without sections / items).
 * @param {string} [locale] - Language code, e.g. "en" | "nl".
 * @returns {Promise<{ data: import('./types').FaqPage[] }>}
 */
export async function listFaqPages(locale) {
  const { data } = await api.get('/faq', langParams(locale));
  return data;
}

/**
 * Get a single published FAQ page by slug, including its ordered sections
 * and the reusable FAQ items grouped under each section.
 * @param {string} slug
 * @param {string} [locale] - Language code, e.g. "en" | "nl".
 * @returns {Promise<{ data: import('./types').FaqPage }>}
 */
export async function getFaqPage(slug, locale) {
  const { data } = await api.get(`/faq/slug/${slug}`, langParams(locale));
  return data;
}
