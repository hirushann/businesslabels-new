import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import BadgeMakenPageClient from './BadgeMakenPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return {
    title: t('badgeMakenMetadataTitle'),
    description: t('badgeMakenMetadataDescription'),
  };
}

export default function BadgeMakenPage() {
  return <BadgeMakenPageClient />;
}

