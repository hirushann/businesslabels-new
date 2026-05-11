import { getTranslations } from 'next-intl/server';

export default async function FavoritesPage() {
  const t = await getTranslations();
  return <h1>{t('pages.myFavorites')}</h1>;
}
