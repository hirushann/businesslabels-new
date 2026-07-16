import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import RecyclePageClient from './RecyclePageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('recycle');
  return {
    title: t('metadataTitle'),
    description: t('metadataDescription'),
  };
}

export default function RecyclePage() {
  return <RecyclePageClient />;
}
