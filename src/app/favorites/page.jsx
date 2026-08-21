import FavoritesPageClient from '@/components/FavoritesPageClient';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: t('favoritesPage.metadataTitle') || 'My favorite label products | Businesslabels',
    description: 'View and manage your favorite label printers and supplies.',
    alternates: {
      canonical: null,
      languages: {
        en: null,
        nl: null,
        'x-default': null,
      },
    },
  };
}

export default function FavoritesPage() {
  return (
    <main className="bg-slate-50/50">
      <FavoritesPageClient />
    </main>
  );
}
