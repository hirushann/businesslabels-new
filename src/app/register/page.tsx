import { redirect } from 'next/navigation';
import { getServerLocale } from '@/lib/i18n/server';

export default async function RegisterPage() {
  // Preserve the visitor's locale (proxy.ts strips /en before this renders,
  // so the URL alone can't tell us) — losing it here would silently drop an
  // English visitor back onto the Dutch homepage.
  const locale = await getServerLocale();
  redirect(`${locale === 'en' ? '/en' : ''}/?auth=register`);
}
