import CartPageClient from '@/components/CartPageClient';
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { mapLaravelProductToCardData } from "@/lib/mappings/product";

export const metadata = {
  title: 'Your Shopping Cart | Businesslabels',
  description: 'Review the items in your shopping cart before proceeding to checkout.',
};

export default async function CartPage() {
  const locale = await getServerLocale();
  let popularProducts = [];

  try {
    const backendUrl = process.env.BBNL_API_BASE_URL;
    if (backendUrl) {
      const url = withLocaleParam(`${backendUrl}/api/popular-products`, locale);
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data && Array.isArray(json.data)) {
          // Limit to 6 recommendations
          popularProducts = json.data.slice(0, 6).map((p) => mapLaravelProductToCardData(p, locale));
        }
      }
    }
  } catch (error) {
    console.error('Error fetching popular products for cart page:', error);
  }

  return (
    <main className="min-h-screen bg-slate-50/50 relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_5%_20%,rgba(241,136,0,0.12),transparent_40%)]" />
      <CartPageClient popularProducts={popularProducts} />
    </main>
  );
}

