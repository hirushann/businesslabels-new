import { getTranslations } from 'next-intl/server';

export default async function AboutPage() {
  const t = await getTranslations();
  return <h1>{t('pages.about')}</h1>;
}
