import axios from 'axios';
import { readLocaleCookieClient } from '@/lib/i18n/utils';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Forward the active locale to the Laravel API on every browser-initiated
// request. The backend reads `?lang=` (see App\Support\ApiLocale).
// Server Components fetch directly via `serverFetch`/raw fetch and read the
// cookie via `next/headers` — they do not pass through this interceptor.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const locale = readLocaleCookieClient();
    config.params = { ...(config.params || {}), lang: locale };
  }
  return config;
});

export default api;
