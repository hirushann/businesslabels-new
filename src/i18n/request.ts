import { getRequestConfig } from 'next-intl/server';
import { getServerLocale } from '@/lib/i18n/server';
import { getMessages } from '@/lib/i18n/getMessages';

export default getRequestConfig(async () => {
  // Get locale from cookie (server-side) - reload 3
  const locale = await getServerLocale();

  return {
    locale,
    messages: await getMessages(locale),
  };
});
