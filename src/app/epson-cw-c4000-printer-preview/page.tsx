import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import EpsonCWC4000PageClient from './EpsonCWC4000PageClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return {
    title: t('epsonCwc4000MetadataTitle'),
    description: t('epsonCwc4000MetadataDescription'),
  };
}

export default function EpsonCWC4000Page() {
  return <EpsonCWC4000PageClient />;
}

