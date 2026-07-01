import Link from 'next/link';
import { connection } from 'next/server';
import EmptyState from "@/components/EmptyState";
import ProductCard from "@/components/ProductCard";
import { getTranslations } from 'next-intl/server';
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/utils";
import { mapLaravelProductToCardData, type LaravelProduct } from "@/lib/mappings/product";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export default async function PopularProducts() {
  await connection();

  const locale = await getServerLocale();
  const t = await getTranslations();

  let products: LaravelProduct[] = [];
  try {
    const backendUrl = process.env.BBNL_API_BASE_URL;
    if (!backendUrl) {
      console.warn('BBNL_API_BASE_URL is not configured');
    } else {
      const url = withLocaleParam(`${backendUrl}/api/popular-products`, locale);
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });
      if (response.ok) {
        const json = (await response.json()) as { data?: LaravelProduct[] };
        if (json.data && Array.isArray(json.data)) {
          products = shuffleArray(json.data).slice(0, 6);
        }
      } else {
        console.error(`Failed to fetch popular products: ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    console.error('Error fetching popular products:', error);
  }

  return (
    <section className="relative w-full px-4 md:px-8 lg:px-10 py-16 lg:py-28 overflow-hidden">
      {/* Decorative blobs */}
      <div className="w-48 h-48 absolute right-52 top-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
      <div className="w-48 h-48 absolute left-0 top-0 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />

      <div className="max-w-360 mx-auto w-full flex flex-col gap-12">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
          <h2 className="text-neutral-800 text-3xl md:text-4xl font-bold font-['Segoe_UI'] leading-tight md:leading-[48px]">
            {t('popularProducts.title')}
          </h2>
          <Link
            href={localePath('/product', locale)}
            className="w-fit px-6 py-4 rounded-full border border-amber-500 flex items-center gap-2.5 text-amber-500 text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-50 transition-colors"
          >
            {t('popularProducts.viewAll')}
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-center gap-8 mx-auto w-full">
          {products.length === 0 ? (
            <EmptyState
              className="col-span-full"
              title={t('common.noProductsFound')}
              description={t('common.noProductsDescription')}
            />
          ) : (
            products.map((product) => {
              const cardProduct = mapLaravelProductToCardData(product, locale);

              const href = cardProduct.slug
                ? (cardProduct.type === "simple" || cardProduct.type === "variable")
                  ? { pathname: `/product/${cardProduct.slug}`, query: { type: cardProduct.type } }
                  : { pathname: `/product/${cardProduct.slug}` }
                : undefined;

              return <ProductCard key={cardProduct.sku} product={cardProduct} href={href} />;
            })
          )}
        </div>
      </div>
    </section>
  );
}
