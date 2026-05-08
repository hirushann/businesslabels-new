'use client';

import { useEffect } from 'react';
import EmptyState from '@/components/EmptyState';
import DrawerProductCard from '@/components/DrawerProductCard';
import { useWishlist } from '@/components/WishlistProvider';

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
  const { items, uniqueItemCount, removeItem, moveToCart } = useWishlist();

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

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[999]" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your wishlist"
        className="fixed top-0 right-0 h-full w-[480px] bg-white z-[1000] shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="shrink-0 p-6 bg-slate-100 border-b border-slate-200 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">
                Your Wishlist
              </h2>
              <span className="text-neutral-600 text-sm font-normal font-['Segoe_UI'] leading-5">
                {uniqueItemCount} {uniqueItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close wishlist"
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <EmptyState
              title="Your wishlist is empty"
              description="Save products to your wishlist so you can review them and add them to cart later."
              className="px-6 py-14"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => {
                const imageSrc = item.mainImage?.trim() || 'https://placehold.co/140x100';
                const hasPrice = typeof item.price === 'number' && Number.isFinite(item.price);
                const href = item.slug
                  ? item.type
                    ? { pathname: `/products/${item.slug}`, query: { type: item.type } }
                    : { pathname: `/products/${item.slug}` }
                  : undefined;

                return (
                  <DrawerProductCard
                    key={item.key}
                    name={item.name}
                    sku={item.sku}
                    imageSrc={imageSrc}
                    removeLabel={`Remove ${item.name} from wishlist`}
                    onRemove={() => removeItem(item.key)}
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
                          moveToCart(item.key);
                        }}
                        disabled={!item.inStock}
                        className={`h-10 px-4 rounded-full text-sm font-semibold leading-5 transition-colors flex items-center justify-center ${
                          item.inStock
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Add to Cart
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
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
