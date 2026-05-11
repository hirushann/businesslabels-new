import 'server-only';

import { DEFAULT_LOCALE, normalizeLocale } from './config';
import { MESSAGES } from './messages';

/**
 * Resolve serialized messages for NextIntlClientProvider.
 * @param {unknown} locale
 */
export async function getMessages(locale) {
  const normalized = normalizeLocale(locale);
  return MESSAGES[normalized] ?? MESSAGES[DEFAULT_LOCALE];
}
