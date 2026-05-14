import 'server-only';

import { DEFAULT_LOCALE, normalizeLocale } from './config';
import { MESSAGES_V4 } from './messages';

/**
 * Resolve serialized messages for NextIntlClientProvider.
 * @param {unknown} locale
 */
export async function getMessages(locale) {
  const normalized = normalizeLocale(locale);
  return MESSAGES_V4[normalized] ?? MESSAGES_V4[DEFAULT_LOCALE];
}
// Force reload cache 2
