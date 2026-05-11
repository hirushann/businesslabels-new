import { getTranslations } from 'next-intl/server';

export default async function ContactPage() {
  const t = await getTranslations();
  return <h1>{t('pages.contact')}</h1>;
}
