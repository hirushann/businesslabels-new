'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import { useWishlist } from '@/components/WishlistProvider';
import { useCart } from '@/components/CartProvider';
import { localePath } from '@/lib/i18n/utils';

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function FavoritesPageClient() {
  const t = useTranslations();
  const locale = useLocale();
  const { items: localItems, removeItem, moveToCart } = useWishlist();
  const cart = useCart();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    function loadFavorites() {
      if (typeof window !== 'undefined' && localStorage.getItem('auth_user')) {
        setIsLoading(true);
        fetch('/api/account/favorites')
          .then((res) => res.json())
          .then((data) => {
            if (!isMounted) return;
            const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
            setFavorites(list);
          })
          .catch((err) => console.error('Failed to load favorites:', err))
          .finally(() => {
            if (isMounted) setIsLoading(false);
          });
      }
    }

    loadFavorites();
    window.addEventListener('favorites-updated', loadFavorites);

    return () => {
      isMounted = false;
      window.removeEventListener('favorites-updated', loadFavorites);
    };
  }, []);

  // Merge local items and backend favorites
  const mergedItems = [...localItems];
  favorites.forEach((fav) => {
    const key = fav.slug ? (fav.type ? `${fav.slug}::${fav.type}` : fav.slug) : String(fav.id);
    if (!mergedItems.some((item) => item.key === key)) {
      mergedItems.push({
        key,
        id: fav.id,
        slug: fav.slug,
        type: fav.type,
        name: fav.name,
        sku: fav.sku,
        price: fav.price,
        mainImage: fav.mainImage,
        subtitle: fav.subtitle,
        excerpt: fav.excerpt,
        materialTitle: fav.materialTitle,
        inStock: fav.inStock !== false,
      });
    }
  });

  const handleRemove = (item: any) => {
    removeItem(item.key);

    if (typeof window !== 'undefined' && localStorage.getItem('auth_user')) {
      fetch('/api/account/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: item.type || 'simple',
          id: item.id,
        }),
      })
        .then((res) => {
          if (res.ok) {
            setFavorites((prev) => prev.filter((f) => f.id !== item.id));
            window.dispatchEvent(new Event('favorites-updated'));
          }
        })
        .catch((err) => console.error('Failed to remove favorite:', err));
    }
  };

  const handleAction = (item: any) => {
    const isSimple = !item.type || item.type === 'simple';

    if (isSimple && item.inStock) {
      if (localItems.some((local) => local.key === item.key)) {
        moveToCart(item.key);
      } else {
        cart.addItem({
          id: item.id,
          slug: item.slug,
          type: item.type,
          name: item.name,
          sku: item.sku,
          price: item.price ?? null,
          mainImage: item.mainImage ?? null,
          packingGroup: null,
          allowSingulars: null,
        });
        handleRemove(item);
      }
    } else {
      // Redirect to product detail page if configurable/variable or out of stock
      const href = item.slug ? `/product/${item.slug}${item.type ? `?type=${item.type}` : ''}` : '/product';
      window.location.href = localePath(href, locale);
    }
  };

  const breadcrumbs = [{ label: t('account.favorites') || 'Favorites' }];

  return (
    <div className="relative min-h-[70vh] overflow-hidden px-4 md:px-8 lg:px-10">
      {/* Background warm orange circle glow on the left side */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -left-[300px] w-[600px] h-[600px] bg-amber-500/12 rounded-full blur-[140px] pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative max-w-360 mx-auto w-full py-8 md:py-12 z-10">
        <Breadcrumbs items={breadcrumbs} className="mb-6 md:mb-8" />

      {isLoading && mergedItems.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
        </div>
      ) : mergedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 md:py-16">
          <Image
            src="/empty.png"
            alt="Empty favorites"
            width={340}
            height={260}
            className="object-contain mb-8"
            unoptimized
          />
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4 font-['Segoe_UI']">
            {t('favoritesPage.emptyTitle') || 'Your Favorite list is Empty'}
          </h2>
          <p className="text-neutral-500 text-sm md:text-base max-w-md mx-auto mb-8 font-normal leading-relaxed font-['Segoe_UI']">
            {t('favoritesPage.emptyDescription') || "It seems you haven't saved any items yet. Explore our collection and add your favorites!"}
          </p>
          <Link
            href={localePath('/product', locale)}
            className="h-12 px-10 rounded-full bg-[#E37A08] hover:bg-[#c76a07] text-white font-bold text-base transition-colors flex items-center justify-center font-['Segoe_UI']"
          >
            {t('favoritesPage.exploreProduct') || 'Explore Product'}
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-3xl md:text-5xl font-extrabold text-neutral-800 text-center mb-8 md:mb-12 font-['Segoe_UI']">
            {t('account.favorites') || 'Favorites'}
          </h1>
          <div className="w-full bg-white p-6 relative shadow-[2px_4px_20px_rgba(109,109,120,0.10)] overflow-hidden rounded-xl border border-[#EDF2F7]">
          {/* Desktop Table */}
          <div className="hidden md:block font-['Segoe_UI']">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EDF2F7] text-neutral-500 text-sm font-semibold bg-white relative z-10">
                  <th className="py-4 pl-[56px] pr-4 w-[600px] text-[#444444] text-[16px] font-semibold">{t('common.products') || 'Products'}</th>
                  <th className="py-4 px-4 w-[200px] text-[#444444] text-[16px] font-semibold">{t('cart.price') || 'Price'}</th>
                  <th className="py-4 px-4 w-[120px] text-[#444444] text-[16px] font-semibold">{t('account.status') || 'Status'}</th>
                  <th className="py-4 pr-4 pl-4 w-[180px] text-[#444444] text-[16px] font-semibold">{t('account.status') || 'STATUS'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2F7]">
                {mergedItems.map((item) => {
                  const isSimple = !item.type || item.type === 'simple';
                  const isButtonAddToCart = isSimple && item.inStock;
                  const itemHref = item.slug ? `/product/${item.slug}${item.type ? `?type=${item.type}` : ''}` : undefined;
                  const localizedHref = itemHref ? localePath(itemHref, locale) : '#';

                  return (
                    <tr key={item.key} className="group hover:bg-slate-50/40 transition-colors">
                      {/* Product Name, SKU, Image and Remove */}
                      <td className="py-4 pl-4 pr-4">
                        <div className="flex items-center gap-6">
                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            className="text-[#888888] hover:text-red-500 transition-colors text-lg font-light leading-none w-4 h-4 flex items-center justify-center"
                            title={t('account.removeFromFavorites') || 'Remove from favorites'}
                          >
                            ✕
                          </button>
                          <div className="w-20 h-20 shrink-0 bg-[#EDF2F7] flex items-center justify-center p-2 overflow-hidden rounded-none">
                            <Image
                              src={item.mainImage || 'https://placehold.co/100x100'}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="object-contain w-full h-full"
                              unoptimized
                            />
                          </div>
                          <div className="flex flex-col min-w-0 gap-2">
                            <Link
                              href={localizedHref}
                              className="text-[#479EF5] hover:underline text-[14px] font-semibold text-left truncate"
                            >
                              {item.sku}
                            </Link>
                            <Link
                              href={localizedHref}
                              className="text-[#222222] font-semibold hover:text-amber-500 transition-colors text-[18px] leading-[21.60px] text-left"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div className="flex items-end gap-2">
                          {!isButtonAddToCart && (
                            <span className="text-[#444444] text-[16px] font-normal">
                              {t('product.fromPrice') || 'From'}
                            </span>
                          )}
                          <span className="text-[#222222] text-[20px] font-bold leading-normal">
                            {item.price ? formatEuro(item.price).replace(/\s+/g, '') : '-'}
                          </span>
                          <span className="text-[#888888] text-[12px] font-normal pb-[2px]">
                            {t('product.exVat') || 'ex. VAT'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {item.inStock ? (
                          <span className="text-[#00A63E] font-semibold text-[18px]">
                            {t('product.inStock') || 'In Stock'}
                          </span>
                        ) : (
                          <span className="text-[#DD3333] font-semibold text-[18px]">
                            {t('product.outOfStock') || 'Out of Stock'}
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 pr-4 pl-4">
                        <button
                          type="button"
                          onClick={() => handleAction(item)}
                          className="h-[38px] px-4 bg-[#F18800] hover:bg-[#d47800] text-white rounded-[100px] text-[16px] font-semibold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <span>
                            {isButtonAddToCart
                              ? t('wishlist.moveToCart') || 'Add to cart'
                              : t('common.select') || 'Select option'}
                          </span>
                          <div className="w-[22px] height-[16px] relative overflow-hidden flex items-center">
                            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="6.42" cy="13.33" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                              <circle cx="16.50" cy="13.33" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M1.88 1.37H3.71L6.15 11.26H16.95L18.74 1.37H1.88Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Layout */}
          <div className="md:hidden divide-y divide-slate-100 font-['Segoe_UI']">
            {mergedItems.map((item) => {
              const isSimple = !item.type || item.type === 'simple';
              const isButtonAddToCart = isSimple && item.inStock;
              const itemHref = item.slug ? `/product/${item.slug}${item.type ? `?type=${item.type}` : ''}` : undefined;
              const localizedHref = itemHref ? localePath(itemHref, locale) : '#';

              return (
                <div key={item.key} className="p-5 flex flex-col gap-4 relative">
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1"
                    title={t('account.removeFromFavorites') || 'Remove from favorites'}
                  >
                    ✕
                  </button>

                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-2 overflow-hidden">
                      <Image
                        src={item.mainImage || 'https://placehold.co/100x100'}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="object-contain w-full h-full"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col min-w-0 pr-6">
                      <Link
                        href={localizedHref}
                        className="text-sky-500 hover:underline text-xs font-semibold mb-0.5 truncate"
                      >
                        {item.sku}
                      </Link>
                      <Link
                        href={localizedHref}
                        className="text-neutral-800 font-bold hover:text-amber-500 transition-colors text-sm line-clamp-2"
                      >
                        {item.name}
                      </Link>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">{t('cart.price') || 'Price'}</span>
                      <div className="flex items-baseline gap-1">
                        {!isButtonAddToCart && (
                          <span className="text-zinc-400 text-xs font-medium">
                            {t('product.fromPrice') || 'From'}
                          </span>
                        )}
                        <span className="text-neutral-800 text-base font-extrabold">
                          {item.price ? formatEuro(item.price) : '-'}
                        </span>
                        <span className="text-zinc-400 text-[10px] font-normal">
                          {t('product.exVat') || 'ex. VAT'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-xs text-neutral-400">{t('account.status') || 'Status'}</span>
                      {item.inStock ? (
                        <span className="text-emerald-600 font-bold text-xs">
                          {t('product.inStock') || 'In Stock'}
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold text-xs">
                          {t('product.outOfStock') || 'Out of Stock'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAction(item)}
                    className="w-full h-10 bg-[#E37A08] hover:bg-[#c76a07] text-white rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <span>
                      {isButtonAddToCart
                        ? t('wishlist.moveToCart') || 'Add to cart'
                        : t('common.select') || 'Select option'}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </>
      )}
      </div>
    </div>
  );
}
