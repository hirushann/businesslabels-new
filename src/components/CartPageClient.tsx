'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import { useCart, type CartItem } from '@/components/CartProvider';
import { useTranslations } from 'next-intl';

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function linePrice(item: CartItem): number {
  const price = typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
  return price * item.quantity;
}

export default function CartPageClient() {
  const t = useTranslations();
  const {
    items,
    totalItemCount,
    totalAmount,
    removeItem,
    incrementItemQuantity,
    decrementItemQuantity,
  } = useCart();

  const subtotal = totalAmount;
  const shipping = subtotal >= 500 ? 0 : 15; // Example logic: free over 500
  const tax = subtotal * 0.21; // 21% BTW
  const total = subtotal + shipping;

  const breadcrumbs = [
    { label: t('cart.title') }
  ];

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Breadcrumbs items={breadcrumbs} className="mb-8" />
        <div className="bg-white rounded-3xl border border-slate-100 p-12 shadow-sm">
          <EmptyState
            title={t('cart.emptyTitle')}
            description={t('cart.emptyDescription')}
          />
          <div className="mt-8 flex justify-center">
            <Link
              href="/products"
              className="h-12 px-8 py-3 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
            >
              {t('common.browseProducts')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />
      
      <h1 className="text-4xl font-bold text-neutral-800 mb-10">{t('cart.title')}</h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Items List */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-neutral-500">
            <div className="col-span-6">{t('cart.product')}</div>
            <div className="col-span-2 text-center">{t('cart.price')}</div>
            <div className="col-span-2 text-center">{t('cart.quantity')}</div>
            <div className="col-span-2 text-right">{t('common.total')}</div>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {items.map((item) => {
              const isWarranty = item.itemKind === 'warranty';
              const href = item.slug ? `/products/${item.slug}${item.type ? `?type=${item.type}` : ''}` : undefined;

              return (
                <div key={item.key} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-8 items-center relative group">
                  {/* Product Info */}
                  <div className="col-span-1 md:col-span-6 flex gap-4 items-center">
                    <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-2 overflow-hidden">
                      <Image
                        src={item.mainImage || 'https://placehold.co/100x100'}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      {href && !isWarranty ? (
                        <Link href={href} className="text-neutral-800 font-semibold hover:text-amber-600 transition-colors truncate">
                          {item.name}
                        </Link>
                      ) : (
                        <span className="text-neutral-800 font-semibold">{item.name}</span>
                      )}
                      <span className="text-xs text-neutral-500 font-mono">{item.sku}</span>
                      {isWarranty && (
                        <span className="text-xs text-amber-600 font-medium">{t('cart.linkedWarranty')}</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-1 md:col-span-2 text-left md:text-center">
                    <span className="md:hidden text-xs text-neutral-500 block mb-1">{t('cart.price')}</span>
                    <span className="text-neutral-700 font-medium">
                      {formatEuro(typeof item.price === 'number' ? item.price : 0)}
                    </span>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                    <div className="flex flex-col items-start md:items-center gap-1">
                      <span className="md:hidden text-xs text-neutral-500 block mb-1">{t('cart.quantity')}</span>
                      {isWarranty ? (
                        <div className="h-10 px-4 flex items-center rounded-full bg-slate-100 text-sm font-semibold text-neutral-600">
                          {item.quantity}
                        </div>
                      ) : (
                        <div className="flex h-10 items-center rounded-full border border-slate-200 bg-white px-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => decrementItemQuantity(item.key)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-neutral-600 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-neutral-800">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => incrementItemQuantity(item.key)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-neutral-600 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="col-span-1 md:col-span-2 text-left md:text-right flex flex-col items-start md:items-end gap-1">
                    <span className="md:hidden text-xs text-neutral-500 block mb-1">{t('common.total')}</span>
                    <span className="text-xl font-bold text-neutral-800">
                      {formatEuro(linePrice(item))}
                    </span>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="mt-2 text-xs text-red-500 font-medium hover:underline flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {t('common.remove')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Summary */}
        <aside className="w-full lg:w-[400px] shrink-0">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm sticky top-24 flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-neutral-800">{t('cart.summary')}</h2>
            
            <div className="flex flex-col gap-4 text-neutral-600">
              <div className="flex justify-between items-center">
                <span>{t('cart.subtotal')}</span>
                <span className="font-semibold text-neutral-800">{formatEuro(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t('checkout.shipping')}</span>
                <span className={shipping === 0 ? "text-green-600 font-bold" : "font-semibold text-neutral-800"}>
                  {shipping === 0 ? t('checkout.free') : formatEuro(shipping)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-neutral-400 -mt-2">
                <span>{t('checkout.tax')} (21% BTW)</span>
                <span>{formatEuro(tax)}</span>
              </div>
              
              <div className="h-px bg-slate-100 my-2" />
              
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-400 uppercase tracking-wider">{t('common.total')}</span>
                  <span className="text-4xl font-extrabold text-neutral-800 leading-none">{formatEuro(total)}</span>
                </div>
                <span className="text-xs text-neutral-400">{t('cart.selectedQuantities')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/checkout"
                className="h-14 w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg flex items-center justify-center transition-all shadow-lg shadow-amber-200"
              >
                {t('cart.checkout')}
              </Link>
              <Link
                href="/products"
                className="h-12 w-full rounded-full border border-slate-200 text-neutral-600 font-semibold flex items-center justify-center hover:bg-slate-50 transition-all"
              >
                {t('common.continueShopping')}
              </Link>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-xs text-neutral-500 leading-tight">
                <strong>Secure Payment.</strong> Your data is protected with 256-bit SSL encryption.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
