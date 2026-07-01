'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import EmptyState from '@/components/EmptyState';
import { useCart } from '@/components/CartProvider';
import DrawerProductCard from '@/components/DrawerProductCard';
import CartQuantityInput from '@/components/CartQuantityInput';
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
    setItemQuantity,
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
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white z-[10001] shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <div className="shrink-0 px-4 sm:px-6 py-4 sm:py-6 bg-slate-100 border-b border-slate-200 flex flex-col gap-4 sm:gap-5">
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

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
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
                    ? { pathname: `/product/${item.slug}`, query: { type: item.type } }
                    : { pathname: `/product/${item.slug}` }
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
                        <div className="flex items-center gap-2">
                          <CartQuantityInput
                            quantity={item.quantity}
                            itemName={item.name}
                            decreaseLabel={t('cart.decreaseQuantity', { name: item.name })}
                            increaseLabel={t('cart.increaseQuantity', { name: item.name })}
                            onDecrease={() => decrementItemQuantity(item.key)}
                            onIncrease={() => incrementItemQuantity(item.key)}
                            onQuantityChange={(quantity) => setItemQuantity(item.key, quantity)}
                          />
                          {item.packingGroup && item.packingGroup > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const pg = item.packingGroup!;
                                const nextBoxQty = Math.ceil((item.quantity + 1) / pg) * pg;
                                setItemQuantity(item.key, nextBoxQty);
                              }}
                              className="flex items-center gap-1.5 h-10 px-3 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold whitespace-nowrap hover:bg-amber-100 transition-colors"
                              title={`${t('product.box')}: ${item.packingGroup} ${t('product.rollsStack')}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.33366 20.1663C7.83992 20.1663 8.25033 19.7559 8.25033 19.2497C8.25033 18.7434 7.83992 18.333 7.33366 18.333C6.8274 18.333 6.41699 18.7434 6.41699 19.2497C6.41699 19.7559 6.8274 20.1663 7.33366 20.1663Z" stroke="currentColor" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M17.4167 20.1663C17.9229 20.1663 18.3333 19.7559 18.3333 19.2497C18.3333 18.7434 17.9229 18.333 17.4167 18.333C16.9104 18.333 16.5 18.7434 16.5 19.2497C16.5 19.7559 16.9104 20.1663 17.4167 20.1663Z" stroke="currentColor" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M1.87988 1.87988H3.71322L6.15155 13.2649C6.241 13.6818 6.473 14.0546 6.80762 14.3189C7.14224 14.5833 7.55855 14.7227 7.98488 14.7132H16.9499C17.3671 14.7125 17.7717 14.5696 18.0967 14.3079C18.4217 14.0462 18.6477 13.6815 18.7374 13.274L20.2499 6.46322H16.3609C16.3609 6.46322 15.5833 9.16667 12.375 9.16667C9.16667 9.16667 8.58301 6.46322 8.58301 6.46322H4.69405" stroke="currentColor" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10.083 4.125H14.6663" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12.375 1.83301V6.41634" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              +{t('product.box')}
                              <span className="text-amber-500 font-normal">({item.packingGroup})</span>
                            </button>
                          ) : null}
                        </div>
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-3 sm:gap-4">
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

          <div className="flex flex-col gap-3">
            <Link
              href="/cart"
              onClick={onClose}
              className="h-12 px-4 py-2.5 rounded-full border border-amber-500 text-amber-600 text-base font-semibold font-['Segoe_UI'] leading-6 transition-colors flex items-center justify-center hover:bg-amber-50"
            >
              {t('cart.viewCart')}
            </Link>

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
