'use client';

import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useCart, type CartItem } from '@/components/CartProvider';
import { useLocale, useTranslations } from 'next-intl';
import CartProductSlider from '@/components/CartProductSlider';
import type { ProductCardData } from '@/components/ProductCard';
import { localePath } from '@/lib/i18n/utils';
import { useState, useEffect } from 'react';
import { getExpectedDeliveryMessage } from '@/lib/utils/delivery';
import { useShippingRules } from '@/hooks/useShippingRules';

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

function warrantyTypeNameFor(item: CartItem | undefined): string | null {
  const candidates = [
    item?.warranty?.typeName,
    item?.warranty?.type_name,
    item?.warranty?.warranty_type_name,
    item?.warranty?.type,
  ];

  const typeName = candidates.find((value) => typeof value === 'string' && value.trim() !== '');

  return typeof typeName === 'string' ? typeName.trim() : null;
}

export default function CartPageClient({ popularProducts = [] }: { popularProducts?: ProductCardData[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const {
    items,
    totalAmount,
    removeItem,
    incrementItemQuantity,
    decrementItemQuantity,
    setItemQuantity,
  } = useCart();
  
  const { defaultRule } = useShippingRules();

  const subtotal = totalAmount;
  const shippingThreshold = defaultRule ? defaultRule.free_shipping_threshold : 100;
  const shipping = subtotal >= shippingThreshold ? 0 : (defaultRule ? defaultRule.shipping_cost : 15);
  const tax = subtotal * 0.21;
  const total = subtotal + shipping;

  const [countdown, setCountdown] = useState({ hours: 2, minutes: 34, formattedMinutes: '34' });

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const { countdown } = getExpectedDeliveryMessage({
          stock: 1,
          delivery_dates_in_stock: 1,
          delivery_dates_no_stock: 1
        });
        setCountdown(countdown);
      } catch (e) {
        console.error(e);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const breadcrumbs = [
    { label: t('cart.title') }
  ];

  if (items.length === 0) {
    return (
      <>
        <div className="px-4 md:px-8 lg:px-10 py-12">
          <div className="max-w-360 mx-auto w-full">
            <Breadcrumbs items={breadcrumbs} className="mb-8" />
            
            <div className="w-full flex flex-col justify-start items-center gap-10 py-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cart-empty.png"
                alt=""
                className="w-[275px] h-[200px] object-contain"
              />
              <div className="w-full flex flex-col justify-start items-center gap-4">
                <h2 className="w-full text-center text-[#222222] text-2xl md:text-[32px] lg:text-[40px] font-['Segoe_UI'] font-bold leading-tight md:leading-[48px]">
                  {t('cart.emptyTitle')}
                </h2>
                <p className="w-full max-w-[800px] text-center text-[#444444] text-lg font-['Segoe_UI'] font-normal leading-[26px]">
                  {t('cart.emptyDescription')}
                </p>
                <Link
                  href={localePath("/product", locale)}
                  className="h-[52px] px-[30px] py-4 bg-[#F18800] hover:bg-[#e07d00] transition-colors rounded-[50px] flex justify-center items-center gap-2.5 text-center text-white text-lg font-['Segoe_UI'] font-semibold leading-6 mt-2"
                >
                  {t('common.browseProducts')}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <CartProductSlider products={popularProducts} />
      </>
    );
  }

  const mainItems = items.filter((item) => item.itemKind !== 'warranty');
  const discountTotal = items.reduce((sum, item) => {
    const unitPrice = typeof item.price === 'number' ? item.price : 0;
    const baseUnitPrice = typeof item.basePrice === 'number' ? item.basePrice : unitPrice;
    return sum + (baseUnitPrice - unitPrice) * item.quantity;
  }, 0);



  return (
    <>
      <div className="px-4 md:px-8 lg:px-10 py-12">
        <div className="max-w-360 mx-auto w-full">
          <Breadcrumbs items={breadcrumbs} className="mb-8" />
          
          <h1 className="text-[32px] font-bold text-[#222222] font-['Segoe_UI'] mb-10 text-center md:text-center">
            {t('cart.title')}
          </h1>

          <div className="w-full grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] items-start">
            {/* Left Panel: Products List */}
            <div className="w-full min-w-0 bg-white rounded-xl border border-[#EDF2F7] overflow-hidden shadow-[2px_4px_20px_rgba(109,109,120,0.06)] relative flex flex-col">
              
              {/* Table Headers - hidden on mobile/tablet, visible on desktop */}
              <div className="hidden lg:grid w-full min-h-[68px] grid-cols-[minmax(16rem,1fr)_minmax(6rem,0.28fr)_minmax(12rem,0.42fr)_minmax(6rem,0.22fr)] gap-6 border-b border-[#EDF2F7] items-center px-6">
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-4 shrink-0" />
                  <div className="text-base font-bold font-['Segoe_UI'] text-[#444444]">
                    {t('cart.products')}
                  </div>
                </div>
                <div className="text-sm font-bold font-['Segoe_UI'] text-[#444444]">
                  {t('cart.unitPrice')}
                </div>
                <div className="text-sm font-bold font-['Segoe_UI'] text-[#444444]">
                  {t('cart.quantity')}
                </div>
                <div className="text-base font-bold font-['Segoe_UI'] text-[#444444] text-right">
                  {t('common.total')}
                </div>
              </div>

              {/* Products List Body */}
              <div className="p-4 md:p-6 flex flex-col gap-6">
                {mainItems.map((item, index) => {
                  const href = item.slug ? `/product/${item.slug}${item.type ? `?type=${item.type}` : ''}` : undefined;
                  const linkedWarranty = items.find(
                    (w) => w.itemKind === 'warranty' && w.linkedToKey === item.key
                  );
                  
                  const hasTierPrices = item.discounts && (
                    typeof item.discounts === 'string' 
                      ? JSON.parse(item.discounts).length > 0 
                      : Array.isArray(item.discounts) && item.discounts.length > 0
                  );
                  const warrantyTypeName = warrantyTypeNameFor(linkedWarranty);

                  return (
                    <div key={item.key} className="flex flex-col gap-3">
                      {/* Product Row */}
                      <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(16rem,1fr)_minmax(6rem,0.28fr)_minmax(12rem,0.42fr)_minmax(6rem,0.22fr)] lg:items-center gap-4 lg:gap-6 py-2">
                        
                        {/* Image & Title Info */}
                        <div className="flex items-start md:items-center gap-3 md:gap-6 min-w-0">
                          {/* Close/Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="w-4 text-[#888888] hover:text-[#EF4444] transition-colors flex justify-center shrink-0"
                            aria-label={t('cart.removeFromCart', { name: item.name })}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.60938 2.89062L2.89062 3.60938L7.28125 8L2.89062 12.3906L3.60938 13.1094L8 8.71875L12.3906 13.1094L13.1094 12.3906L8.71875 8L13.1094 3.60938L12.3906 2.89062L8 7.28125L3.60938 2.89062Z" fill="currentColor"/>
                            </svg>
                          </button>
                          
                          <div className="flex-1 flex items-start md:items-center gap-3 md:gap-4 min-w-0">
                            {/* Product Image */}
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#EDF2F7] rounded-lg overflow-hidden flex items-center justify-center p-2 shrink-0">
                              <img
                                src={item.mainImage || 'https://placehold.co/80x80'}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            
                            {/* SKU & Name */}
                            <div className="flex-1 flex flex-col gap-1 min-w-0">
                              <span className="text-sm font-semibold font-['Segoe_UI'] text-[#479EF5] truncate">
                                {item.sku}
                              </span>
                              <h3 className="text-lg font-bold font-['Segoe_UI'] text-[#222222] leading-tight min-w-0">
                                {href ? (
                                  <Link href={href} className="hover:text-[#F18800] transition-colors block whitespace-normal break-words">
                                    {item.name}
                                  </Link>
                                ) : (
                                  <span className="block whitespace-normal break-words">{item.name}</span>
                                )}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* Unit Price */}
                        <div className="flex flex-col justify-center items-start min-w-0 pl-7 md:pl-0">
                            <span className="text-xs font-semibold text-[#888888] uppercase tracking-wide lg:hidden mb-0.5">
                              {t('cart.unitPrice')}
                            </span>
                            <div className="flex flex-wrap items-baseline gap-x-1">
                              {hasTierPrices && (
                                <span className="text-[#444444] text-base font-normal font-['Segoe_UI']">
                                  {t('product.fromPrice')}
                                </span>
                              )}
                              <span className="text-lg md:text-xl font-bold font-['Segoe_UI'] text-[#222222]">
                                {formatEuro(item.price ?? 0)}
                              </span>
                            </div>
                            <span className="text-sm font-normal font-['Segoe_UI'] text-[#888888]">
                              {t('product.exVat')}
                            </span>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex flex-wrap items-center gap-2 pl-7 md:pl-0">
                            {/* Pill Input */}
                            <div className="h-[38px] bg-white rounded-[44px] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] border border-black/10 flex items-center overflow-hidden shrink-0">
                              <button
                                type="button"
                                onClick={() => decrementItemQuantity(item.key)}
                                className="w-[38px] h-[38px] flex items-center justify-center border-r border-black/10 text-[#222222] hover:bg-slate-50 transition-colors text-lg"
                              >
                                -
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[1-9][0-9]*"
                                value={String(item.quantity)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (Number.isInteger(val) && val > 0) {
                                    setItemQuantity(item.key, val);
                                  }
                                }}
                                className="w-[38px] h-[38px] border-r border-black/10 bg-transparent text-center text-base font-bold text-[#222222] focus:outline-none focus:ring-0 p-0"
                              />
                              <button
                                type="button"
                                onClick={() => incrementItemQuantity(item.key)}
                                className="w-[38px] h-[38px] flex items-center justify-center text-[#222222] hover:bg-slate-50 transition-colors text-lg"
                              >
                                +
                              </button>
                            </div>

                            {/* Box Option */}
                            {item.isLabelProduct && item.packingGroup && item.packingGroup > 0 ? (
                              <>
                                <span className="text-xs font-normal font-['Segoe_UI'] text-[#888888]">
                                  {t('cart.or')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setItemQuantity(item.key, item.quantity + (item.packingGroup ?? 6))}
                                  className="h-[38px] px-4 rounded-[100px] border border-[#F18800] text-[#F18800] text-base font-semibold font-['Segoe_UI'] hover:bg-orange-50 transition-colors whitespace-nowrap"
                                >
                                  {t('cart.boxOption', { count: item.packingGroup }) || `Box (+${item.packingGroup})`}
                                </button>
                              </>
                            ) : null}
                        </div>

                        {/* Line Total */}
                        <div className="flex flex-col justify-center items-start lg:items-end min-w-0 pl-7 md:pl-0">
                            <span className="text-xs font-semibold text-[#888888] uppercase tracking-wide lg:hidden mb-0.5">
                              {t('common.total')}
                            </span>
                            <span className="text-lg md:text-xl font-bold font-['Segoe_UI'] text-[#222222]">
                              {formatEuro(linePrice(item))}
                            </span>
                            <span className="text-sm font-normal font-['Segoe_UI'] text-[#888888]">
                              {t('product.exVat')}
                            </span>
                        </div>
                      </div>

                      {/* Nested Warranty Item */}
                      {linkedWarranty ? (
                        <div className="ml-0 md:ml-10 lg:ml-0 w-full md:w-auto p-3 lg:px-0 bg-[#F7F9FA] rounded-[12px] grid grid-cols-1 gap-4 md:grid-cols-[minmax(10rem,1.1fr)_minmax(5.5rem,0.5fr)_minmax(5rem,0.7fr)_minmax(5rem,0.45fr)] lg:grid-cols-[minmax(16rem,1fr)_minmax(6rem,0.28fr)_minmax(12rem,0.42fr)_minmax(6rem,0.22fr)] md:items-start lg:gap-6">
                          <div className="flex flex-col gap-1.5 min-w-0 lg:pl-10">
                            <span className="text-base font-semibold font-['Segoe_UI'] text-[#222222] leading-tight">
                              {linkedWarranty.name}
                            </span>
                            {warrantyTypeName ? (
                              <span className="text-xs font-semibold font-['Segoe_UI'] text-[#888888] leading-[1.3]">
                                {t.has('cart.warrantyType') ? t('cart.warrantyType') : 'Warranty type'}: {warrantyTypeName}
                              </span>
                            ) : null}
                            {linkedWarranty.warranty?.description ? (
                              <span className="text-sm font-normal font-['Segoe_UI'] text-[#444444]">
                                {linkedWarranty.warranty.description}
                              </span>
                            ) : null}
                          </div>
                          
                          <div className="w-full flex flex-col justify-center items-start gap-1">
                            <span className="text-lg md:text-xl font-semibold font-['Segoe_UI'] text-[#222222]">
                              {formatEuro(linkedWarranty.price ?? 0)}
                            </span>
                            <span className="text-sm font-normal font-['Segoe_UI'] text-[#888888]">
                              {t('product.exVat')}
                            </span>
                          </div>

                          <div className="text-base font-semibold font-['Segoe_UI'] text-[#222222] leading-5">
                            {t('cart.years', {
                              count: linkedWarranty.warranty?.durationMonths
                                ? Math.round(linkedWarranty.warranty.durationMonths / 12)
                                : 3,
                            })}
                          </div>

                          <div className="w-full flex flex-col justify-center items-start md:items-end gap-1.5 lg:pr-3">
                            <span className="text-lg md:text-xl font-bold font-['Segoe_UI'] text-[#222222]">
                              {formatEuro(linkedWarranty.price ?? 0)}
                            </span>
                            <span className="text-sm font-normal font-['Segoe_UI'] text-[#888888]">
                              {t('product.exVat')}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(linkedWarranty.key)}
                              className="text-[#DD3333] text-sm font-normal font-['Segoe_UI'] underline hover:text-red-700 transition-colors"
                            >
                              {t('common.remove')}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Separator */}
                      {index < mainItems.length - 1 ? (
                        <div className="w-full h-px bg-[#E5E7EB]" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Subtotal Footer */}
              <div className="w-full border-t border-[#EDF2F7] px-6 py-4 bg-white flex justify-end items-center gap-6 rounded-b-xl">
                <span className="text-lg font-normal font-['Segoe_UI'] text-[#222222]">
                  {t('cart.subtotal')}:
                </span>
                <span className="text-2xl font-semibold font-['Segoe_UI'] text-[#222222]">
                  {formatEuro(totalAmount)}
                </span>
              </div>
            </div>

            {/* Right Panel: Your Overview Sidebar */}
            <aside className="w-full bg-white rounded-xl border border-[#EDF2F7] overflow-hidden shadow-[2px_4px_20px_rgba(109,109,120,0.06)] flex flex-col">
              {/* Header */}
              <div className="w-full p-4 bg-[#F7F9FA] border-b border-[#E5E7EB] text-center">
                <h2 className="text-2xl font-bold font-['Segoe_UI'] text-[#222222] tracking-wider uppercase">
                  {t.has('cart.yourOverview') ? t('cart.yourOverview') : 'YOUR OVERVIEW'}
                </h2>
              </div>
              
              {/* Content Panel */}
              <div className="p-6 flex flex-col gap-6">
                
                {/* Shipping & Delivery Banners */}
                <div className="flex flex-col gap-4">
                  {/* Delivery Time Banner */}
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 mt-0.5">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask0_2505_9497" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                          <rect width="20" height="20" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask0_2505_9497)">
                          <path d="M9.99837 18.3385C8.84559 18.3385 7.76226 18.1198 6.74837 17.6823C5.73448 17.2448 4.85254 16.651 4.10254 15.901C3.35254 15.151 2.75879 14.2691 2.32129 13.2552C1.88379 12.2413 1.66504 11.158 1.66504 10.0052C1.66504 8.85243 1.88379 7.7691 2.32129 6.75521C2.75879 5.74132 3.35254 4.85937 4.10254 4.10937C4.85254 3.35937 5.73448 2.76562 6.74837 2.32812C7.76226 1.89062 8.84559 1.67188 9.99837 1.67188C11.165 1.67188 12.2518 1.89062 13.2588 2.32812C14.2657 2.76562 15.1442 3.35937 15.8942 4.10937C16.6442 4.85937 17.238 5.73785 17.6755 6.74479C18.113 7.75174 18.3317 8.83854 18.3317 10.0052C18.3317 10.1441 18.3282 10.2795 18.3213 10.4115C18.3143 10.5434 18.3039 10.6719 18.29 10.7969C18.2623 11.033 18.1616 11.2135 17.988 11.3385C17.8143 11.4635 17.6095 11.5052 17.3734 11.4635C17.1373 11.4219 16.9498 11.3038 16.8109 11.1094C16.672 10.9149 16.6164 10.6997 16.6442 10.4635C16.6442 10.3941 16.6477 10.3177 16.6546 10.2344C16.6616 10.151 16.665 10.0747 16.665 10.0052C16.665 9.07465 16.4949 8.2066 16.1546 7.40104C15.8143 6.59549 15.3386 5.88715 14.7275 5.27604C14.1164 4.66493 13.4081 4.18924 12.6025 3.84896C11.797 3.50868 10.9289 3.33854 9.99837 3.33854C8.13726 3.33854 6.56087 3.98437 5.26921 5.27604C3.97754 6.56771 3.33171 8.1441 3.33171 10.0052C3.33171 11.8663 3.97754 13.4427 5.26921 14.7344C6.56087 16.026 8.13726 16.6719 9.99837 16.6719C10.6234 16.6719 11.2241 16.592 11.8005 16.4323C12.3768 16.2726 12.922 16.033 13.4359 15.7135C13.6303 15.6024 13.8421 15.5608 14.0713 15.5885C14.3005 15.6163 14.4775 15.7274 14.6025 15.9219C14.7414 16.1163 14.7866 16.3281 14.738 16.5573C14.6893 16.7865 14.5678 16.9635 14.3734 17.0885C13.7206 17.4913 13.0296 17.8003 12.3005 18.0156C11.5713 18.2309 10.8039 18.3385 9.99837 18.3385ZM15.3005 14.7031C15.0991 14.5017 14.9984 14.2552 14.9984 13.9635C14.9984 13.6719 15.0991 13.4253 15.3005 13.224C15.5018 13.0226 15.7484 12.9219 16.04 12.9219C16.3317 12.9219 16.5782 13.0226 16.7796 13.224C16.981 13.4253 17.0817 13.6719 17.0817 13.9635C17.0817 14.2552 16.981 14.5017 16.7796 14.7031C16.5782 14.9045 16.3317 15.0052 16.04 15.0052C15.7484 15.0052 15.5018 14.9045 15.3005 14.7031ZM10.8317 9.67187L13.3317 12.1719C13.4845 12.3247 13.5609 12.5191 13.5609 12.7552C13.5609 12.9913 13.4845 13.1858 13.3317 13.3385C13.1789 13.4913 12.9845 13.5677 12.7484 13.5677C12.5123 13.5677 12.3178 13.4913 12.165 13.3385L9.41504 10.5885C9.3317 10.5052 9.2692 10.4115 9.22754 10.3073C9.18587 10.2031 9.16504 10.0955 9.16504 9.98437V6.67187C9.16504 6.43576 9.2449 6.23785 9.40462 6.07812C9.56434 5.9184 9.76226 5.83854 9.99837 5.83854C10.2345 5.83854 10.4324 5.9184 10.5921 6.07812C10.7518 6.23785 10.8317 6.43576 10.8317 6.67187V9.67187Z" fill="#444444"/>
                        </g>
                      </svg>
                    </div>
                    <p className="text-base font-normal font-['Segoe_UI'] text-[#444444] leading-tight">
                      {t.rich('cart.orderWithin', {
                        timeStyle: () => <span className="font-bold">{countdown.hours} {t.has('product.hours') ? t('product.hours') : 'hours'} {countdown.formattedMinutes} {t.has('product.minutes') ? t('product.minutes') : 'minutes'}</span>,
                        deliveryStyle: (chunks) => <span className="font-bold">{chunks}</span>,
                        shippedStyle: (chunks) => <span className="font-bold">{chunks}</span>,
                      })}
                    </p>
                  </div>
                  
                  {/* Free Delivery Threshold */}
                  <div className="flex items-center gap-2">
                    <div className="shrink-0">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.666 15.0026V5.0026C11.666 4.56058 11.4904 4.13665 11.1779 3.82409C10.8653 3.51153 10.4414 3.33594 9.99935 3.33594H3.33268C2.89065 3.33594 2.46673 3.51153 2.15417 3.82409C1.84161 4.13665 1.66602 4.56058 1.66602 5.0026V14.1693C1.66602 14.3903 1.75381 14.6022 1.91009 14.7585C2.06637 14.9148 2.27834 15.0026 2.49935 15.0026H4.16602" stroke="#444444" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12.5 15H7.5" stroke="#444444" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15.8327 14.9974H17.4993C17.7204 14.9974 17.9323 14.9096 18.0886 14.7533C18.2449 14.597 18.3327 14.3851 18.3327 14.1641V11.1224C18.3323 10.9333 18.2677 10.7499 18.1493 10.6024L15.2493 6.9774C15.1714 6.8798 15.0725 6.80096 14.96 6.74673C14.8475 6.69249 14.7242 6.66424 14.5993 6.66406H11.666" stroke="#444444" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.1667 16.6693C15.0871 16.6693 15.8333 15.9231 15.8333 15.0026C15.8333 14.0821 15.0871 13.3359 14.1667 13.3359C13.2462 13.3359 12.5 14.0821 12.5 15.0026C12.5 15.9231 13.2462 16.6693 14.1667 16.6693Z" stroke="#444444" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5.83268 16.6693C6.75316 16.6693 7.49935 15.9231 7.49935 15.0026C7.49935 14.0821 6.75316 13.3359 5.83268 13.3359C4.91221 13.3359 4.16602 14.0821 4.16602 15.0026C4.16602 15.9231 4.91221 16.6693 5.83268 16.6693Z" stroke="#444444" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-base font-normal font-['Segoe_UI'] text-[#444444] leading-tight">
                      {t.rich('cart.freeDeliveryThreshold', {
                        amountStyle: (chunks) => <span className="font-bold">{chunks}</span>,
                      })}
                    </p>
                  </div>

                  {/* Add more for Free Shipping Progress Banner */}
                  {totalAmount < shippingThreshold ? (
                    <div className="w-full p-3 bg-gradient-to-br from-[#FFF7ED] to-white rounded-xl border border-[#FFEDD4] flex items-center gap-2">
                      <div className="shrink-0">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.99935 1.66536C14.5827 1.66536 18.3327 5.41536 18.3327 9.9987C18.3327 14.582 14.5827 18.332 9.99935 18.332C5.41602 18.332 1.66602 14.582 1.66602 9.9987C1.66602 5.41536 5.41602 1.66536 9.99935 1.66536Z" stroke="#BB8F06" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 13.332V9.16536" stroke="#BB8F06" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9.99609 6.66797H10.0036" stroke="#BB8F06" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-[#BB8F06] text-base font-normal font-['Segoe_UI'] leading-tight flex-1">
                        {t.rich('cart.freeShippingProgress', {
                          amount: formatEuro(shippingThreshold - totalAmount),
                          amountStyle: (chunks) => <span className="font-semibold">{chunks}</span>,
                          shippingStyle: (chunks) => <span className="font-semibold">{chunks}</span>,
                        })}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="w-full h-px bg-[#EDF2F7]" />

                {/* Pricing Summary */}
                <div className="flex flex-col gap-4">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center bg-white/50">
                    <span className="text-lg font-bold font-['Segoe_UI'] text-[#222222]">
                      {t('cart.subtotal')}
                    </span>
                    <span className="text-lg font-bold font-['Segoe_UI'] text-[#222222]">
                      {formatEuro(totalAmount)}
                    </span>
                  </div>

                  {/* Shipping */}
                  <div className="flex justify-between items-center bg-white/50">
                    <span className="text-lg font-bold font-['Segoe_UI'] text-[#222222]">
                      {t('checkout.shipping')}
                    </span>
                    <span className="text-lg font-bold font-['Segoe_UI'] text-[#222222]">
                      {shipping === 0 ? t('checkout.free') : formatEuro(shipping)}
                    </span>
                  </div>

                  {/* VAT */}
                  <div className="flex justify-between items-center bg-white/50">
                    <div>
                      <span className="text-lg font-bold font-['Segoe_UI'] text-[#222222]">
                        {t.has('checkout.vat') ? t('checkout.vat') : 'VAT'}{' '}
                      </span>
                      <span className="text-lg font-normal font-['Segoe_UI'] text-[#222222]">
                        (21%)
                      </span>
                    </div>
                    <span className="text-lg font-bold font-['Segoe_UI'] text-[#222222]">
                      {formatEuro(tax)}
                    </span>
                  </div>

                  {/* Discount */}
                  {discountTotal > 0 ? (
                    <div className="flex justify-between items-center bg-white/50">
                      <span className="text-lg font-bold font-['Segoe_UI'] text-[#222222]">
                        {t('cart.discount')}
                      </span>
                      <span className="text-lg font-semibold font-['Segoe_UI'] text-[#DD3333]">
                        -{formatEuro(discountTotal)}
                      </span>
                    </div>
                  ) : null}

                  <div className="w-full h-px bg-[#D9E3ED]" />

                  {/* Total incl. VAT */}
                  <div className="flex justify-between items-center bg-white/50">
                    <span className="text-xl font-bold font-['Segoe_UI'] text-[#222222]">
                      {t('cart.totalInclVat')}
                    </span>
                    <span className="text-xl font-semibold font-['Segoe_UI'] text-[#222222]">
                      {formatEuro(total * 1.21)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Link
                  href={localePath("/checkout", locale)}
                  className="w-full h-13 bg-[#F18800] hover:bg-[#d87a00] active:bg-[#c26e00] rounded-[100px] flex items-center justify-center cursor-pointer transition-colors px-6"
                >
                  <span className="text-center text-white text-lg font-bold font-['Segoe_UI'] leading-6 whitespace-nowrap">
                    {t.has('cart.proceedToCheckout') ? t('cart.proceedToCheckout') : 'Proceed to checkout'}
                  </span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <CartProductSlider products={popularProducts} />
    </>
  );
}
