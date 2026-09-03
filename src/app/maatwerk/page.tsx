import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerLocale } from '@/lib/i18n/server';
import CustomMadeFormClient from './CustomMadeFormClient';

type CustomMadeFormPageProps = {
  searchParams: Promise<{
    materialId?: string | string[];
  }>;
};

export async function generateMetadata({ searchParams }: CustomMadeFormPageProps): Promise<Metadata> {
  const t = await getTranslations("customForm");
  const locale = await getServerLocale();
  const search = await searchParams;
  const materialCodeParam = search.materialId;
  const materialCode = Array.isArray(materialCodeParam) ? materialCodeParam[0] : materialCodeParam;
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://businesslabels.nl").replace(/\/$/, "");

  const querySuffix = materialCode ? `?materialId=${encodeURIComponent(materialCode)}` : '';
  const nlPath = `/maatwerk${querySuffix}`;
  const enPath = `/en/material-customization${querySuffix}`;
  const canonicalPath = locale === 'en' ? enPath : nlPath;

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
      languages: {
        nl: `${siteUrl}${nlPath}`,
        en: `${siteUrl}${enPath}`,
        'x-default': `${siteUrl}${nlPath}`,
      },
    },
  };
}

export default async function CustomMadeFormPage({ searchParams }: CustomMadeFormPageProps) {
  const materialCodeParam = (await searchParams).materialId;
  const materialCode = Array.isArray(materialCodeParam) ? materialCodeParam[0] : materialCodeParam;
  return <CustomMadeFormClient matCode={materialCode} />;
}
