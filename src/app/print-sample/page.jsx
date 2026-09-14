import { getTranslations } from 'next-intl/server';
import ReCaptchaProvider from '@/components/ReCaptchaProvider';
import PrintSampleClient from './PrintSampleClient';

export async function generateMetadata() {
  const t = await getTranslations('pages');
  return {
    title: t('printSampleMetadataTitle'),
    description: t('printSampleMetadataDescription'),
  };
}

export default function PrintSamplePage() {
  return (
    <ReCaptchaProvider>
      <PrintSampleClient />
    </ReCaptchaProvider>
  );
}
