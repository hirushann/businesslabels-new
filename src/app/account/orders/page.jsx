import { getTranslations } from 'next-intl/server';

export default async function OrdersPage() {
  const t = await getTranslations();
  return <h1>{t('pages.myOrders')}</h1>;
}
