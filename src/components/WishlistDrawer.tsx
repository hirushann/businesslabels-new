'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import EmptyState from '@/components/EmptyState';
import DrawerProductCard from '@/components/DrawerProductCard';
import { useWishlist } from '@/components/WishlistProvider';
import { useCart } from '@/components/CartProvider';

type WishlistDrawerProps = {
  onClose: () => void;
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function WishlistDrawer({ onClose }: WishlistDrawerProps) {
  const t = useTranslations();
  const { items: localItems, removeItem, moveToCart } = useWishlist();
  const cart = useCart();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    function loadFavorites() {
      if (typeof window !== 'undefined' && localStorage.getItem('auth_user')) {
        setIsLoadingFavorites(true);
        fetch('/api/account/favorites')
          .then((res) => res.json())
          .then((data) => {
            if (!isMounted) return;
            const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
            setFavorites(list);
          })
          .catch((err) => console.error('Failed to load favorites in drawer:', err))
          .finally(() => {
            if (isMounted) setIsLoadingFavorites(false);
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

  // Merge local wishlist items and backend favorites
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
    // 1. Remove from local wishlist if it exists there
    removeItem(item.key);

    // 2. Also remove from backend favorites if user is logged in
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

  const handleMoveToCart = (item: any) => {
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
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[999]" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('wishlist.title')}
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] max-w-full bg-white z-[1000] shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="shrink-0 p-6 bg-slate-100 border-b border-slate-200 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">
                {t('wishlist.title')}
              </h2>
              <span className="text-neutral-600 text-sm font-normal font-['Segoe_UI'] leading-5">
                {t('wishlist.items', { count: mergedItems.length })}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoadingFavorites && mergedItems.length === 0 ? (
            <div className="flex justify-center items-center py-14">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : mergedItems.length === 0 ? (
            <EmptyState
              title={t('wishlist.empty')}
              description={t('wishlist.emptyDescription')}
              className="px-6 py-14"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {mergedItems.map((item) => {
                const imageSrc = item.mainImage?.trim() || 'https://placehold.co/140x100';
                const hasPrice = typeof item.price === 'number' && Number.isFinite(item.price);
                const href = item.slug
                  ? item.type
                    ? { pathname: `/product/${item.slug}`, query: { type: item.type } }
                    : { pathname: `/product/${item.slug}` }
                  : undefined;

                return (
                  <DrawerProductCard
                    key={item.key}
                    name={item.name}
                    sku={item.sku}
                    imageSrc={imageSrc}
                    removeLabel={t('wishlist.remove', { name: item.name })}
                    onRemove={() => handleRemove(item)}
                    href={href}
                    onCardClick={onClose}
                    priceNode={
                      <span className="text-neutral-800 text-lg font-bold leading-6">
                        {hasPrice ? formatEuro(item.price as number) : '-'}
                      </span>
                    }
                    actionNode={
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleMoveToCart(item);
                        }}
                        disabled={!item.inStock}
                        className={`h-10 px-4 rounded-full text-sm font-semibold leading-5 transition-colors flex items-center justify-center ${
                          item.inStock
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {item.inStock ? t('wishlist.moveToCart') : t('wishlist.outOfStock')}
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 p-6 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
          <Link
            href="/my-account?tab=favourites"
            onClick={onClose}
            className="w-full h-11 bg-amber-500 text-white rounded-full font-black text-sm hover:shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
            {t('account.favouriteProducts')}
          </Link>
          <Link
            href="/my-account?tab=printers"
            onClick={onClose}
            className="w-full h-11 bg-white border border-slate-200 text-neutral-700 hover:bg-slate-50 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            {t('account.myPrinters')}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
