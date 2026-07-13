import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import ResetPasswordClient from '@/components/ResetPasswordClient';

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
    email?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('pages.resetPasswordMetadataTitle'),
    description: t('pages.resetPasswordMetadataDescription'),
  };
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <ResetPasswordClient
      initialEmail={firstParam(params.email)}
      initialToken={firstParam(params.token)}
    />
  );
}
