import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('printSample');
  return {
    title: t('metadataTitle'),
  };
}

export default function Layout({ children }) {
  return children;
}
