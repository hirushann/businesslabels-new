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
        className="absolute top-1/2 -translate-y-1/2 -left-[300px] w-[600px] h-[600px] bg-brand/12 rounded-full blur-[140px] pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative max-w-360 mx-auto w-full py-8 md:py-12 z-10">
        <Breadcrumbs items={breadcrumbs} className="mb-6 md:mb-8" />

      {isLoading && mergedItems.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
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
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
            {t('favoritesPage.emptyTitle') || 'Your Favorite list is Empty'}
          </h2>
          <p className="text-neutral-500 text-sm md:text-base max-w-md mx-auto mb-8 font-normal leading-relaxed">
            {t('favoritesPage.emptyDescription') || "It seems you haven't saved any items yet. Explore our collection and add your favorites!"}
          </p>
          <Link
            href={localePath('/product', locale)}
            className="h-12 px-10 rounded-full bg-brand hover:bg-brand-active text-white font-bold text-base transition-colors flex items-center justify-center"
          >
            {t('favoritesPage.exploreProduct') || 'Explore Product'}
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-3xl md:text-5xl font-extrabold text-neutral-800 text-center mb-8 md:mb-12">
            {t('account.favorites') || 'Favorites'}
          </h1>
          <div className="w-full bg-white p-6 relative shadow-[2px_4px_20px_rgba(109,109,120,0.10)] overflow-hidden rounded-xl border border-line">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-neutral-500 text-sm font-semibold bg-white relative z-10">
                  <th className="py-4 pl-[56px] pr-4 w-[600px] text-copy text-[16px] font-bold">{t('common.products') || 'Products'}</th>
                  <th className="py-4 px-4 w-[200px] text-copy text-[16px] font-semibold">{t('cart.price') || 'Price'}</th>
                  <th className="py-4 px-4 w-[120px] text-copy text-[16px] font-semibold">{t('account.status') || 'Status'}</th>
                  <th className="py-4 pr-4 pl-4 w-[180px] text-copy text-[16px] font-semibold">{t('account.status') || 'STATUS'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
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
                            className="text-subtle hover:text-red-500 transition-colors text-lg font-light leading-none w-4 h-4 flex items-center justify-center"
                            title={t('account.removeFromFavorites') || 'Remove from favorites'}
                          >
                            ✕
                          </button>
                          <div className="w-20 h-20 shrink-0 bg-line flex items-center justify-center p-2 overflow-hidden rounded-none">
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
                              className="text-link hover:underline text-[14px] font-light text-left truncate"
                            >
                              {item.sku}
                            </Link>
                            <Link
                              href={localizedHref}
                              className="text-ink font-bold hover:text-brand transition-colors text-[18px] leading-[21.60px] text-left"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-end gap-x-1 gap-y-0.5">
                          {!isButtonAddToCart && (
                            <span className="text-copy text-[16px] font-normal">
                              {t('product.fromPrice') || 'From'}
                            </span>
                          )}
                          <span className="text-ink text-[20px] font-bold leading-normal">
                            {item.price ? formatEuro(item.price).replace(/\s+/g, '') : '-'}
                          </span>
                          <span className="text-subtle text-[12px] font-normal pb-[2px]">
                            {t('product.exVat') || 'ex. VAT'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {item.inStock ? (
                          <span className="text-success font-medium text-[18px]">
                            {t('product.inStock') || 'In Stock'}
                          </span>
                        ) : (
                          <span className="text-danger font-medium text-[18px]">
                            {t('product.outOfStock') || 'Out of Stock'}
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 pr-4 pl-4">
                        <button
                          type="button"
                          onClick={() => handleAction(item)}
                          className="h-[38px] px-4 bg-brand hover:bg-brand-hover text-white rounded-[100px] text-[16px] font-medium transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <span>
                            {isButtonAddToCart
                              ? t('wishlist.moveToCart') || 'Add to cart'
                              : t('common.select') || 'Select option'}
                          </span>
                          <div className="w-[22px] height-[16px] relative overflow-hidden flex items-center">
                            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7.33268 14.6654C7.83894 14.6654 8.24935 14.3669 8.24935 13.9987C8.24935 13.6305 7.83894 13.332 7.33268 13.332C6.82642 13.332 6.41602 13.6305 6.41602 13.9987C6.41602 14.3669 6.82642 14.6654 7.33268 14.6654Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M17.4167 14.6654C17.9229 14.6654 18.3333 14.3669 18.3333 13.9987C18.3333 13.6305 17.9229 13.332 17.4167 13.332C16.9104 13.332 16.5 13.6305 16.5 13.9987C16.5 14.3669 16.9104 14.6654 17.4167 14.6654Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M1.87891 1.36719H3.71224L6.15057 9.64719C6.24002 9.95043 6.47202 10.2215 6.80664 10.4138C7.14126 10.606 7.55757 10.7074 7.9839 10.7005H16.9489C17.3661 10.7 17.7707 10.596 18.0957 10.4057C18.4207 10.2154 18.6467 9.95021 18.7364 9.65385L20.2489 4.70052H4.69307" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
          <div className="md:hidden divide-y divide-slate-100">
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
                        className="text-neutral-800 font-bold hover:text-brand transition-colors text-sm line-clamp-2"
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
                    className="w-full h-10 bg-brand hover:bg-brand-active text-white rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <span>
                      {isButtonAddToCart
                        ? t('wishlist.moveToCart') || 'Add to cart'
                        : t('common.select') || 'Select option'}
                    </span>
                    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.33268 14.6654C7.83894 14.6654 8.24935 14.3669 8.24935 13.9987C8.24935 13.6305 7.83894 13.332 7.33268 13.332C6.82642 13.332 6.41602 13.6305 6.41602 13.9987C6.41602 14.3669 6.82642 14.6654 7.33268 14.6654Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17.4167 14.6654C17.9229 14.6654 18.3333 14.3669 18.3333 13.9987C18.3333 13.6305 17.9229 13.332 17.4167 13.332C16.9104 13.332 16.5 13.6305 16.5 13.9987C16.5 14.3669 16.9104 14.6654 17.4167 14.6654Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1.87891 1.36719H3.71224L6.15057 9.64719C6.24002 9.95043 6.47202 10.2215 6.80664 10.4138C7.14126 10.606 7.55757 10.7074 7.9839 10.7005H16.9489C17.3661 10.7 17.7707 10.596 18.0957 10.4057C18.4207 10.2154 18.6467 9.95021 18.7364 9.65385L20.2489 4.70052H4.69307" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
