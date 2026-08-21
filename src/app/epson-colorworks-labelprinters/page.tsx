import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import EpsonLabelprintersPageClient from './EpsonLabelprintersPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return {
    title: t('epsonColorworksMetadataTitle'),
    description: t('epsonColorworksMetadataDescription'),
  };
}

export default function EpsonLabelprintersPage() {
  return <EpsonLabelprintersPageClient />;
}

