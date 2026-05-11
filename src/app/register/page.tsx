import RegisterClient from '@/components/RegisterClient';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('pages.registerMetadataTitle'),
    description: t('pages.registerMetadataDescription'),
  };
}

export default function RegisterPage() {
  return <RegisterClient />;
}
