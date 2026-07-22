'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/components/CartProvider';
import { useTranslations } from 'next-intl';
import { useLocalePath } from '@/hooks/useLocalePath';
import { useShippingRules } from '@/hooks/useShippingRules';

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
  const lp = useLocalePath();
  const { defaultRule } = useShippingRules();
  const shippingThreshold = defaultRule ? defaultRule.free_shipping_threshold : 100;
  
  const {
    items,
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
        {items.length === 0 ? (
          <div className="flex flex-col h-full w-full bg-white">
            {/* Header */}
            <div className="shrink-0 px-6 py-4 bg-white shadow-[2px_6px_20px_rgba(17,17,17,0.04)] border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-ink text-xl font-semibold leading-6">
                {t('cart.title')}
              </h2>
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

            {/* Empty Body */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-10">
              <div className="w-full max-w-[404px] flex flex-col items-center gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cart-empty.png"
                  alt=""
                  className="w-[220px] h-[160px] object-contain"
                />
                <div className="w-full flex flex-col items-center gap-4">
                  <h3 className="text-center text-ink text-2xl font-bold leading-[28.8px]">
                    {t('cart.emptyTitle')}
                  </h3>
                  <p className="text-center text-copy text-base font-normal leading-6">
                    {t('cart.emptyDescription')}
                  </p>
                  <Link
                    href={lp('/product')}
                    onClick={onClose}
                    className="h-[38px] px-5 py-2 rounded-[100px] bg-brand hover:bg-brand-hover active:bg-brand-active flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="text-center text-white text-base font-medium leading-6 whitespace-nowrap">
                      {t('common.browseProducts')}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="shrink-0 px-6 py-4 bg-white shadow-[2px_6px_20px_rgba(17,17,17,0.04)] border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-ink text-xl font-bold leading-[24px]">
                {t('cart.title')}
              </h2>
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

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
              <div className="flex flex-col divide-y divide-slate-100">
                {items
                  .filter((item) => item.itemKind !== 'warranty')
                  .map((item) => {
                    const unitPrice =
                      typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
                    const baseUnitPrice =
                      typeof item.basePrice === 'number' && Number.isFinite(item.basePrice)
                        ? item.basePrice
                        : unitPrice;
                    const hasDiscount = baseUnitPrice > unitPrice;

                    const linePrice = unitPrice * item.quantity;
                    const baseLinePrice = baseUnitPrice * item.quantity;
                    const linkedWarranty = items.find(
                      (warrantyItem) => warrantyItem.itemKind === 'warranty' && warrantyItem.linkedToKey === item.key
                    );
                    const warrantyDurationYears = linkedWarranty?.warranty?.durationMonths
                      ? Math.round(linkedWarranty.warranty.durationMonths / 12)
                      : null;

                    const imageSrc = item.mainImage?.trim() || 'https://placehold.co/80x80';
                    const productSlug = item.slug?.trim();
                    const href = productSlug
                      ? lp(`/product/${productSlug}${item.type ? `?type=${item.type}` : ''}`)
                      : undefined;

                    return (
                      <div key={item.key} className="py-4 flex flex-col gap-3">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="w-20 h-20 relative bg-line rounded-[6px] overflow-hidden shrink-0">
                            {href ? (
                              <Link href={href} onClick={onClose} className="w-full h-full block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imageSrc}
                                  alt={item.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              </Link>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={imageSrc}
                                alt={item.name}
                                className="w-full h-full object-contain p-1"
                              />
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="text-link text-sm font-normal leading-[18.2px] block">
                                  SKU: {item.sku}
                                </span>
                                <h3 className="text-ink text-base font-bold leading-[21.6px] mt-0.5 line-clamp-2">
                                  {href ? (
                                    <Link href={href} onClick={onClose} className="hover:text-brand transition-colors">
                                      {item.name}
                                    </Link>
                                  ) : (
                                    item.name
                                  )}
                                </h3>
                              </div>

                              {/* Remove Item Button */}
                              <button
                                type="button"
                                onClick={() => removeItem(item.key)}
                                aria-label={t('cart.removeFromCart', { name: item.name })}
                                className="w-6 h-6 bg-line rounded-[2px] flex items-center justify-center text-ink hover:bg-[#e2e8f0] transition-colors shrink-0"
                              >
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </button>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {hasDiscount && (
                                <span className="text-subtle text-base font-normal line-through leading-5">
                                  {formatEuro(baseLinePrice)}
                                </span>
                              )}
                              <span className="text-brand text-xl font-semibold leading-6">
                                {formatEuro(linePrice)}
                              </span>
                              <span className="text-subtle text-sm font-normal leading-[20.8px]">
                                {t('product.exVat') || 'ex. VAT'}
                              </span>
                            </div>

                            {/* Quantity and Actions */}
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {/* Quantity stepper */}
                              <div className="h-[38px] bg-white rounded-[44px] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] border border-black/10 flex items-center overflow-hidden shrink-0">
                                <button
                                  type="button"
                                  onClick={() => decrementItemQuantity(item.key)}
                                  className="w-[38px] h-[38px] flex items-center justify-center border-r border-black/10 text-neutral-700 hover:bg-slate-50 transition-colors text-lg"
                                >
                                  -
                                </button>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[1-9][0-9]*"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (Number.isInteger(val) && val > 0) {
                                      setItemQuantity(item.key, val);
                                    }
                                  }}
                                  className="w-[38px] h-[38px] border-r border-black/10 bg-transparent text-center text-base font-bold text-ink focus:outline-none focus:ring-0 p-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => incrementItemQuantity(item.key)}
                                  className="w-[38px] h-[38px] flex items-center justify-center text-neutral-700 hover:bg-slate-50 transition-colors text-lg"
                                >
                                  +
                                </button>
                              </div>

                              {/* Box Option */}
                              {item.isLabelProduct && item.packingGroup && item.packingGroup > 0 && (
                                <>
                                  <span className="text-subtle text-xs font-normal">
                                    {t('cart.or')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const pg = item.packingGroup!;
                                      const nextBoxQty = Math.ceil((item.quantity + 1) / pg) * pg;
                                      setItemQuantity(item.key, nextBoxQty);
                                    }}
                                    className="h-[38px] px-4 rounded-[100px] border border-brand text-brand text-sm font-semibold hover:bg-brand-soft transition-colors whitespace-nowrap"
                                  >
                                    {t('cart.boxOption', { count: item.packingGroup })}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {linkedWarranty ? (
                          <div className="ml-24 rounded-lg border border-amber-100 bg-brand-soft/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                  {t('cart.linkedWarranty')}
                                </span>
                                <p className="mt-0.5 text-sm font-semibold leading-5 text-ink">
                                  {linkedWarranty.name}
                                </p>
                                {linkedWarranty.warranty?.description ? (
                                  <p className="mt-0.5 text-xs leading-4 text-[#666666]">
                                    {linkedWarranty.warranty.description}
                                  </p>
                                ) : null}
                                {warrantyDurationYears ? (
                                  <p className="mt-1 text-xs font-medium text-copy">
                                    {t('cart.years', { count: warrantyDurationYears })}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <span className="text-base font-bold text-ink">
                                  {formatEuro((linkedWarranty.price ?? 0) * linkedWarranty.quantity)}
                                </span>
                                <span className="text-xs text-subtle">
                                  {linkedWarranty.quantity} x {formatEuro(linkedWarranty.price ?? 0)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeItem(linkedWarranty.key)}
                                  className="text-xs font-semibold text-danger underline transition-colors hover:text-red-700"
                                >
                                  {t.has('common.remove') ? t('common.remove') : 'Remove'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Summary */}
            <div className="shrink-0 border-t border-line bg-white pt-4 pb-6 flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {/* Discount */}
                {(() => {
                  const discountTotal = items.reduce((sum, item) => {
                    const unitPrice = typeof item.price === 'number' ? item.price : 0;
                    const baseUnitPrice = typeof item.basePrice === 'number' ? item.basePrice : unitPrice;
                    return sum + (baseUnitPrice - unitPrice) * item.quantity;
                  }, 0);

                  if (discountTotal > 0) {
                    return (
                      <div className="px-6 flex justify-between items-center">
                        <span className="text-danger text-lg font-normal leading-[21.6px]">
                          {t('cart.discount')}
                        </span>
                        <span className="text-danger text-lg font-normal leading-[21.6px]">
                          -{formatEuro(discountTotal)}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Total */}
                <div className="px-6 flex justify-between items-center">
                  <span className="text-copy text-lg font-medium leading-[21.6px]">
                    {t('cart.totalInclVat')}
                  </span>
                  <span className="text-ink text-lg font-semibold leading-[21.6px]">
                    {formatEuro(totalAmount * 1.21)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 flex flex-col gap-4">
                <Link
                  href={lp('/winkelmand')}
                  onClick={onClose}
                  className="w-full h-[38px] bg-brand hover:bg-brand-hover active:bg-brand-active rounded-[100px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="text-center text-white text-base font-medium leading-6 whitespace-nowrap">
                    {t('cart.goToShoppingCart')}
                  </span>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="text-white">
                    <path d="M1 9l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* Free shipping progress */}
                {totalAmount < shippingThreshold ? (
                  <div className="flex justify-center items-center">
                    <p className="text-subtle text-base leading-[20.8px]">
                      {t.rich('cart.freeShippingProgress', {
                        amount: formatEuro(shippingThreshold - totalAmount),
                        amountStyle: (chunks) => <span className="font-bold text-subtle">{chunks}</span>,
                        shippingStyle: (chunks) => <span className="font-bold text-subtle">{chunks}</span>,
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-center items-center">
                    <p className="text-emerald-600 text-base font-bold leading-[20.8px]">
                      {t('cart.freeShippingQualified')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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
