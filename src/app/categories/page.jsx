import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('pages');
  return {
    title: t('categoriesMetadataTitle'),
    description: t('categoriesMetadataDescription'),
  };
}

export default async function CategoriesPage() {
  const t = await getTranslations();
  return <h1>{t('pages.categories')}</h1>;
}

