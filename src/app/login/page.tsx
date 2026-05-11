import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import LoginClient from '@/components/LoginClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('pages.loginMetadataTitle'),
    description: t('pages.loginMetadataDescription'),
  };
}

export default function LoginPage() {
  return <LoginClient />;
}
