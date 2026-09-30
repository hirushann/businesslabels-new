import axios from 'axios';
import { readLocaleCookieClient } from '@/lib/i18n/utils';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

if (
  process.env.DOMAIN_LOCK === 'true' &&
  process.env.DOMAIN_LOCK_USER &&
  process.env.DOMAIN_LOCK_PASSWORD
) {
  const creds = Buffer.from(
    `${process.env.DOMAIN_LOCK_USER}:${process.env.DOMAIN_LOCK_PASSWORD}`,
  ).toString('base64');
  defaultHeaders['Authorization'] = `Basic ${creds}`;
}

const api = axios.create({
  baseURL: `${process.env.BBNL_API_BASE_URL}/api`,
  headers: defaultHeaders,
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
