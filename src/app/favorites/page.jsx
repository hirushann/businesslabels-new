import FavoritesPageClient from '@/components/FavoritesPageClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('favoritesPage');
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  };
}

export default function FavoritesPage() {
  return (
    <main className="bg-slate-50/50">
      <FavoritesPageClient />
    </main>
  );
}
