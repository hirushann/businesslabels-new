import { getTranslations } from 'next-intl/server';

export default async function CategoriesPage() {
  const t = await getTranslations();
  return <h1>{t('pages.categories')}</h1>;
}
