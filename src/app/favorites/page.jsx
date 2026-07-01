import FavoritesPageClient from '@/components/FavoritesPageClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: `${t('pages.myFavorites') || 'Favorites'} | Businesslabels`,
    description: 'View and manage your favorite label printers and supplies.',
  };
}

export default function FavoritesPage() {
  return (
    <main className="bg-slate-50/50">
      <FavoritesPageClient />
    </main>
  );
}
