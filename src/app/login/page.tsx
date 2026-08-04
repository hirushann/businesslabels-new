import { redirect } from 'next/navigation';
import { getServerLocale } from '@/lib/i18n/server';

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, locale] = await Promise.all([searchParams, getServerLocale()]);
  const redirectTo = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;

  const query = new URLSearchParams({ auth: 'login' });
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    query.set('redirect', redirectTo);
  }

  // Preserve the visitor's locale (proxy.ts strips /en before this renders,
  // so the URL alone can't tell us) — losing it here would silently drop an
  // English visitor back onto the Dutch homepage.
  redirect(`${locale === 'en' ? '/en' : ''}/?${query.toString()}`);
}
