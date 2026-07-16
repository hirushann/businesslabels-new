import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CustomMadeFormClient from './CustomMadeFormClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("customForm");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

type CustomMadeFormPageProps = {
  searchParams: Promise<{
    materialId?: string | string[];
  }>;
};

export default async function CustomMadeFormPage({ searchParams }: CustomMadeFormPageProps) {
  const materialCodeParam = (await searchParams).materialId;
  const materialCode = Array.isArray(materialCodeParam) ? materialCodeParam[0] : materialCodeParam;
  return <CustomMadeFormClient matCode={materialCode} />;
}
