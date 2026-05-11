'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import EmptyState from '@/components/EmptyState';
import { useCart } from '@/components/CartProvider';
import DrawerProductCard from '@/components/DrawerProductCard';
import { useTranslations } from 'next-intl';

type CartDrawerProps = {
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

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const t = useTranslations();
  const {
    items,
    totalItemCount,
    totalAmount,
    removeItem,
    incrementItemQuantity,
    decrementItemQuantity,
  } = useCart();

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
      <div className="fixed inset-0 bg-black/60 z-[10000]" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('cart.dialogLabel')}
        className="fixed top-0 right-0 h-full w-[480px] bg-white z-[10001] shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="shrink-0 p-6 bg-slate-100 border-b border-slate-200 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-neutral-800 text-2xl font-semibold font-['Segoe_UI'] leading-7">
                {t('cart.title')}
              </h2>
              <span className="text-neutral-600 text-sm font-normal font-['Segoe_UI'] leading-5">
                {totalItemCount} {totalItemCount === 1 ? t('cart.item') : t('cart.items')}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t('cart.close')}
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
              title={t('cart.emptyTitle')}
              description={t('cart.emptyDescription')}
              className="px-6 py-14"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => {
                const unitPrice =
                  typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
                const linePrice = unitPrice * item.quantity;
                const imageSrc = item.mainImage?.trim() || 'https://placehold.co/140x100';
                const isWarrantyItem = item.itemKind === 'warranty';
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
                    href={isWarrantyItem ? undefined : href}
                    onCardClick={onClose}
                    removeLabel={t('cart.removeFromCart', { name: item.name })}
                    onRemove={() => removeItem(item.key)}
                    descriptionNode={
                      isWarrantyItem ? (
                        <p className="text-xs leading-4 text-neutral-500">{t('cart.linkedWarranty')}</p>
                      ) : undefined
                    }
                    priceNode={
                      <span className="text-neutral-800 text-lg font-bold leading-6">
                        {formatEuro(linePrice)}
                      </span>
                    }
                    actionNode={
                      isWarrantyItem ? (
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                          {t('cart.qty', { count: item.quantity })}
                        </div>
                      ) : (
                        <div className="flex h-10 items-center rounded-full border border-slate-200 bg-white px-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              decrementItemQuantity(item.key);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-slate-100"
                            aria-label={t('cart.decreaseQuantity', { name: item.name })}
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-neutral-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              incrementItemQuantity(item.key);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-slate-100"
                            aria-label={t('cart.increaseQuantity', { name: item.name })}
                          >
                            +
                          </button>
                        </div>
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-5 flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-600 text-sm font-normal font-['Segoe_UI'] leading-5">
                {t('cart.total')}
              </span>
              <span className="text-neutral-800 text-3xl font-bold font-['Segoe_UI'] leading-9">
                {formatEuro(totalAmount)}
              </span>
            </div>
            <span className="text-zinc-500 text-xs font-normal font-['Segoe_UI'] leading-4">
              {t('cart.selectedQuantities')}
            </span>
          </div>

          <Link
            href="/checkout"
            onClick={onClose}
            aria-disabled={items.length === 0}
            className={`h-12 px-4 py-2.5 rounded-full text-white text-base font-semibold font-['Segoe_UI'] leading-6 transition-colors flex items-center justify-center ${
              items.length === 0
                ? 'bg-slate-200 text-slate-500 pointer-events-none'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {t('cart.checkout')}
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
