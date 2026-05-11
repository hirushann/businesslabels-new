import { getTranslations } from 'next-intl/server';

export default async function AccountPage() {
  const t = await getTranslations();
  return <h1>{t('pages.myAccount')}</h1>;
}
