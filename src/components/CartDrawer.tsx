'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/components/CartProvider';
import { useTranslations } from 'next-intl';
import { useLocalePath } from '@/hooks/useLocalePath';

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
              <h2 className="text-[#222222] text-xl font-semibold font-['Segoe_UI'] leading-6">
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
                  <h3 className="text-center text-[#222222] text-2xl font-bold font-['Segoe_UI'] leading-[28.8px]">
                    {t('cart.emptyTitle')}
                  </h3>
                  <p className="text-center text-[#444444] text-base font-normal font-['Segoe_UI'] leading-6">
                    {t('cart.emptyDescription')}
                  </p>
                  <Link
                    href={lp('/product')}
                    onClick={onClose}
                    className="h-[38px] px-5 py-2 rounded-[100px] bg-[#F18800] hover:bg-[#d87a00] active:bg-[#c26e00] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="text-center text-white text-base font-semibold font-['Segoe_UI'] leading-6 whitespace-nowrap">
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
              <h2 className="text-[#222222] text-xl font-semibold font-['Segoe_UI'] leading-[24px]">
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
              <div className="flex flex-col">
                {items
                  .filter((item) => item.itemKind !== 'warranty')
                  .map((item, index, arr) => {
                    const unitPrice =
                      typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
                    const baseUnitPrice =
                      typeof item.basePrice === 'number' && Number.isFinite(item.basePrice)
                        ? item.basePrice
                        : unitPrice;
                    const hasDiscount = baseUnitPrice > unitPrice;

                    const linePrice = unitPrice * item.quantity;
                    const baseLinePrice = baseUnitPrice * item.quantity;

                    const imageSrc = item.mainImage?.trim() || 'https://placehold.co/80x80';
                    const href = item.slug
                      ? item.type
                        ? { pathname: `/product/${item.slug}`, query: { type: item.type } }
                        : { pathname: `/product/${item.slug}` }
                      : undefined;

                    const linkedWarranty = items.find(
                      (w) => w.itemKind === 'warranty' && w.linkedToKey === item.key
                    );

                    return (
                      <div key={item.key} className="flex flex-col">
                        <div className="py-4 flex gap-4">
                          {/* Product Image */}
                          <div className="w-20 h-20 relative bg-[#EDF0F4] rounded-[6px] overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageSrc}
                              alt={item.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="text-[#479EF5] text-sm font-['Segoe_UI'] font-normal leading-[18.2px] block">
                                  SKU: {item.sku}
                                </span>
                                <h3 className="text-[#222222] text-lg font-semibold font-['Segoe_UI'] leading-[21.6px] mt-0.5 truncate">
                                  {href ? (
                                    <Link href={href} onClick={onClose} className="hover:text-amber-600 transition-colors">
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
                                className="w-6 h-6 bg-[#EDF2F7] rounded-[2px] flex items-center justify-center text-[#222222] hover:bg-[#e2e8f0] transition-colors shrink-0"
                              >
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </button>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {hasDiscount && (
                                <span className="text-[#888888] text-base font-normal font-['Segoe_UI'] line-through leading-5">
                                  {formatEuro(baseLinePrice)}
                                </span>
                              )}
                              <span className="text-[#F18800] text-xl font-semibold font-['Segoe_UI'] leading-6">
                                {formatEuro(linePrice)}
                              </span>
                              <span className="text-[#888888] text-base font-normal font-['Segoe_UI'] leading-[20.8px]">
                                {t('product.exVat') || 'ex. VAT'}
                              </span>
                            </div>

                            {/* Quantity and Actions */}
                            <div className="flex justify-between items-center gap-4 mt-1">
                              <span className="text-[#888888] text-lg font-semibold font-['Segoe_UI'] leading-5">
                                {item.quantity}x
                              </span>

                              <div className="flex items-center gap-2">
                                {/* Custom Pill Quantity Input */}
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
                                    className="w-[38px] h-[38px] border-r border-black/10 bg-transparent text-center text-base font-semibold text-[#222222] focus:outline-none focus:ring-0 p-0"
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
                                {item.packingGroup && item.packingGroup > 0 && (
                                  <>
                                    <span className="text-[#888888] text-xs font-normal font-['Segoe_UI']">
                                      {t('cart.or')}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setItemQuantity(item.key, item.quantity + (item.packingGroup ?? 6))}
                                      className="h-[38px] px-4 rounded-[100px] border border-[#F18800] text-[#F18800] text-base font-semibold font-['Segoe_UI'] hover:bg-orange-50 transition-colors whitespace-nowrap"
                                    >
                                      {t('cart.boxOption', { count: item.packingGroup })}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Nested Warranty Item */}
                        {linkedWarranty && (
                          <div className="mb-4 w-full p-3 bg-[#F7F9FA] rounded-[12px] flex justify-between items-start gap-4">
                            <div className="flex flex-col gap-2 min-w-0 flex-1">
                              <div className="text-[#222222] text-base font-semibold font-['Segoe_UI'] leading-[19.2px] truncate">
                                {linkedWarranty.name}
                              </div>
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-[#F18800] text-xl font-semibold font-['Segoe_UI'] leading-6">
                                  {formatEuro(linkedWarranty.price ?? 0)}
                                </span>
                                <span className="text-[#888888] text-base font-normal font-['Segoe_UI'] leading-[20.8px]">
                                  {t('product.exVat') || 'ex. VAT'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className="text-[#222222] text-base font-semibold font-['Segoe_UI'] leading-5">
                                {t('cart.years', {
                                  count: linkedWarranty.warranty?.durationMonths
                                    ? Math.round(linkedWarranty.warranty.durationMonths / 12)
                                    : 3,
                                })}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeItem(linkedWarranty.key)}
                                className="text-[#DD3333] text-sm font-normal font-['Segoe_UI'] underline leading-[18.2px] hover:text-red-700 transition-colors"
                              >
                                {t('cart.remove')}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Separator */}
                        {index < arr.length - 1 && (
                          <div className="w-full h-[1px] bg-[#EDF2F7] my-1" />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Summary */}
            <div className="shrink-0 border-t border-[#EDF2F7] bg-white pt-4 pb-6 flex flex-col gap-4">
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
                      <div className="px-6 flex justify-between items-center bg-white/50">
                        <span className="text-[#DD3333] text-lg font-normal font-['Segoe_UI'] leading-[21.6px]">
                          {t('cart.discount')}
                        </span>
                        <span className="text-[#DD3333] text-lg font-normal font-['Segoe_UI'] leading-[21.6px]">
                          -{formatEuro(discountTotal)}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Total */}
                <div className="px-6 flex justify-between items-center bg-white/50">
                  <span className="text-[#444444] text-lg font-semibold font-['Segoe_UI'] leading-[21.6px]">
                    {t('cart.totalInclVat')}
                  </span>
                  <span className="text-[#222222] text-lg font-semibold font-['Segoe_UI'] leading-[21.6px]">
                    {formatEuro(totalAmount * 1.21)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 flex flex-col gap-4">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="w-full h-[38px] bg-[#F18800] hover:bg-[#d87a00] active:bg-[#c26e00] rounded-[100px] flex items-center justify-center gap-2 cursor-pointer transition-colors relative"
                >
                  <span className="text-center text-white text-base font-semibold font-['Segoe_UI'] leading-6 whitespace-nowrap">
                    {t('cart.goToShoppingCart')}
                  </span>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="text-white">
                    <path d="M1 9l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>

                {/* Free shipping banner progress */}
                {totalAmount < 500 ? (
                  <div className="flex justify-center items-center">
                    <p className="text-[#888888] text-base font-['Segoe_UI'] leading-[20.8px]">
                      {t.rich('cart.freeShippingProgress', {
                        amount: formatEuro(500 - totalAmount),
                        amountStyle: (chunks) => <span className="font-semibold text-[#888888]">{chunks}</span>,
                        shippingStyle: (chunks) => <span className="font-semibold text-[#888888]">{chunks}</span>,
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-center items-center">
                    <p className="text-emerald-600 text-base font-semibold font-['Segoe_UI'] leading-[20.8px]">
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
