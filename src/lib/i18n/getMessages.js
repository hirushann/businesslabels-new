import 'server-only';

import { DEFAULT_LOCALE, normalizeLocale } from './config';
import { MESSAGES_V3 } from './messages';

/**
 * Resolve serialized messages for NextIntlClientProvider.
 * @param {unknown} locale
 */
export async function getMessages(locale) {
  const normalized = normalizeLocale(locale);
  return MESSAGES_V3[normalized] ?? MESSAGES_V3[DEFAULT_LOCALE];
}
// Force reload cache 1
