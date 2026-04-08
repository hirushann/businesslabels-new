"use client";

import { useState } from "react";

type ProductPurchaseProps = {
  sku?: string | null;
  inStock?: boolean | null;
  price?: number | null;
  originalPrice?: number | null;
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductPurchase({
  sku,
  inStock,
  price,
  originalPrice,
}: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1);

  const increment = () => setQuantity((prev) => prev + 1);
  const decrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const displaySku = sku?.trim() ? sku : "EP-C3500";
  const hasPrice = typeof price === "number" && Number.isFinite(price);
  const hasOriginalPrice =
    typeof originalPrice === "number" &&
    Number.isFinite(originalPrice) &&
    (hasPrice ? originalPrice > price : true);

  const stockText = inStock ? "In Stock" : "Out of Stock";
  const stockTextClass = inStock ? "text-green-600" : "text-zinc-500";
  const stockIconClass = inStock ? "text-green-600" : "text-zinc-500";

  const discountPercentage =
    hasPrice && hasOriginalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  return (
    <div className="p-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col gap-6">
      {/* Price Section */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-blue-400 text-base font-normal leading-5">SKU: {displaySku}</span>
          <div className="flex items-center gap-2">
            <svg className={`w-3 h-3 ${stockIconClass}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
            </svg>
            <span className={`${stockTextClass} text-xs font-normal leading-4`}>{stockText}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-neutral-800 text-4xl font-bold leading-[48px]">
            {hasPrice ? formatEuro(price) : "€0,00"}
          </span>
          {hasOriginalPrice ? (
            <span className="text-zinc-500 text-2xl font-normal line-through leading-7">
              {formatEuro(originalPrice)}
            </span>
          ) : null}
          {discountPercentage ? (
            <span className="text-red-600 text-2xl font-semibold leading-7">-{discountPercentage}%</span>
          ) : null}
        </div>
        <span className="text-zinc-500 text-base font-normal leading-5 text-left">ex. VAT</span>
      </div>

      {/* Bulk Discounts */}
      <div className="p-4 bg-slate-100 rounded-[10px]">
        <div className="flex flex-col gap-3">
          <span className="text-neutral-800 text-base font-bold leading-5">Bulk Discounts</span>
          <div className="flex-1 flex justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-base font-semibold leading-5">Quantity</span>
              {["10", "50", "100"].map((qty) => (
                <div key={qty} className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-white rounded-[3px] border border-zinc-500/20" />
                  <span className="text-neutral-700 text-base font-normal leading-5">{qty}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-neutral-700 text-base font-semibold leading-5">Discount</span>
              {["5%", "10%", "15%"].map((d) => (
                <span key={d} className="text-green-600 text-base font-normal leading-5">{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity + Add to Cart */}
      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-3">
          <span className="text-neutral-800 text-lg font-bold leading-5 w-full">Select Quantity</span>
          <div className="h-12 px-1 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-between items-center bg-white">
            <button
              onClick={decrement}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                <path strokeLinecap="round" d="M2 6h8" />
              </svg>
            </button>
            <div className="flex-1 self-stretch flex justify-center items-center overflow-hidden">
              <span className="text-neutral-800 text-sm font-semibold leading-5 px-2">{quantity}</span>
            </div>
            <button
              onClick={increment}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                <path strokeLinecap="round" d="M6 2v8M2 6h8" />
              </svg>
            </button>
          </div>
        </div>
        <button className="flex-1 h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] flex justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-white text-base font-bold whitespace-nowrap">Add to Cart</span>
        </button>
      </div>

      {/* Wishlist + Share (Standard logic) */}
      <div className="flex items-center gap-4">
        <button className="flex-1 h-12 px-4 py-2.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors">
          <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1.67} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span className="text-neutral-700 text-base font-semibold">Add to Wishlist</span>
        </button>
        <button className="w-12 h-12 p-3 bg-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors">
          <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        </button>
      </div>

      {/* Delivery Estimate */}
      <div className="p-3 bg-green-600/10 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-green-600/20">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.67} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0 m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0 m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <span className="text-neutral-800 text-base font-semibold leading-5">Expected Delivery</span>
          </div>
          <p className="text-xs text-neutral-700 leading-5">
            Order within <span className="text-green-600 font-semibold">2 hours 34 minutes</span> for delivery <span className="text-green-600 font-semibold">tomorrow</span>
          </p>
        </div>
      </div>

      {/* Need Help Section with Custom Icons */}
      <div className="flex flex-col gap-4">
        <h3 className="text-neutral-700 text-lg font-bold leading-5">Need help or advice?</h3>
        <div className="flex gap-4">
          {[
            {
              label: "Call Us",
              icon: (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )
            },
            {
              label: "Email",
              icon: (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              label: "WhatsApp",
              icon: (
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.602 6.06L0 24l6.105-1.602a11.832 11.832 0 005.937 1.578h.005c6.637 0 12.032-5.396 12.035-12.03a11.85 11.85 0 00-3.529-8.511z"/>
                </svg>
              )
            },
          ].map(({ label, icon }) => (
            <button
              key={label}
              className="flex-1 p-3 bg-slate-100/30 rounded-xl outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col items-center gap-3 hover:bg-orange-50 transition-colors"
            >
              <div className="w-8 h-8 p-1.5 bg-orange-50 rounded-lg shadow-sm flex items-center justify-center">
                {icon}
              </div>
              <span className="text-neutral-800 text-base font-semibold leading-5">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
