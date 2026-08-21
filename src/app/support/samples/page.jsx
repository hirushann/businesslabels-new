import { getTranslations } from 'next-intl/server';
import SupportSamplesClient from './SupportSamplesClient';

export async function generateMetadata() {
  const t = await getTranslations('pages');
  return {
    title: t('supportSamplesMetadataTitle'),
    description: t('supportSamplesMetadataDescription'),
  };
}

export default function SupportSamplesPage() {
  return <SupportSamplesClient />;
}
