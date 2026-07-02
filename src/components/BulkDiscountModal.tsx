"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { BulkDiscountTier } from "@/components/ProductCard";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type NormalizedTier = {
  quantity: number;
  discountPct: number;
  unitPrice: number;
};

type BulkDiscountModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, unitPrice: number) => void;
  productName: string;
  productSku?: string | null;
  productImage?: string | null;
  price: number;
  discounts: BulkDiscountTier[] | string;
  packingGroup?: number | null;
  allowSingulars?: boolean;
  rollsStackLabel?: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseTiers(
  raw: BulkDiscountTier[] | string,
  basePrice: number,
  minimumQuantity: number = 1
): NormalizedTier[] {
  let parsed: BulkDiscountTier[];

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as BulkDiscountTier[];
    } catch {
      return [];
    }
  } else {
    parsed = raw;
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((tier) => {
      const qty = Number(tier?.quantity ?? 0);
      const pct = Number(tier?.discount ?? 0);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(pct) || pct <= 0) {
        return null;
      }
      return {
        quantity: Math.floor(qty),
        discountPct: pct,
        unitPrice: basePrice * (1 - pct / 100),
      };
    })
    .filter((t): t is NormalizedTier => t !== null && t.quantity >= minimumQuantity)
    .sort((a, b) => a.quantity - b.quantity);
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function BulkDiscountModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  productSku,
  productImage,
  price,
  discounts,
  packingGroup,
  allowSingulars,
  rollsStackLabel,
}: BulkDiscountModalProps) {
  const t = useTranslations();
  const normalizedPackingGroup = packingGroup && packingGroup > 0 ? packingGroup : null;
  const initialQty = !allowSingulars && normalizedPackingGroup ? normalizedPackingGroup : 1;

  const [quantity, setQuantity] = useState(initialQty);
  const [inputValue, setInputValue] = useState(String(initialQty));
  const overlayRef = useRef<HTMLDivElement>(null);

  const tiers = useMemo(() => parseTiers(discounts, price, initialQty), [discounts, price, initialQty]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQty);
      setInputValue(String(initialQty));
    }
  }, [isOpen, initialQty]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const activeTier = useMemo(() => {
    if (tiers.length === 0) return null;
    let match: NormalizedTier | null = null;
    for (const tier of tiers) {
      if (quantity >= tier.quantity) {
        match = tier;
      }
    }
    return match;
  }, [tiers, quantity]);

  const activeUnitPrice = activeTier ? activeTier.unitPrice : price;

  const nextTier = useMemo(() => {
    if (tiers.length === 0) return null;
    return tiers.find((tier) => tier.quantity > quantity) ?? null;
  }, [tiers, quantity]);

  const qtyToNextTier = nextTier ? nextTier.quantity - quantity : null;

  /* ─── Quantity helpers ──────────────────────────────────────────────── */
  const snapUp = (qty: number): number => {
    if (!normalizedPackingGroup) return Math.max(1, qty);
    if (allowSingulars && qty < normalizedPackingGroup) return Math.max(1, qty);
    if (qty < normalizedPackingGroup) return normalizedPackingGroup;
    return Math.ceil(qty / normalizedPackingGroup) * normalizedPackingGroup;
  };

  const snapDown = (qty: number): number => {
    if (!normalizedPackingGroup) return Math.max(1, qty);
    if (qty <= 1) return 1;
    if (allowSingulars && qty <= normalizedPackingGroup) return Math.max(1, qty - 1);
    if (qty <= normalizedPackingGroup) return 1;
    return Math.max(1, Math.floor((qty - 1) / normalizedPackingGroup) * normalizedPackingGroup);
  };

  const increment = () => {
    const next = snapUp(quantity + 1);
    setQuantity(next);
    setInputValue(String(next));
  };

  const decrement = () => {
    const next = snapDown(quantity - 1);
    setQuantity(next);
    setInputValue(String(next));
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val === "") return;
    const n = Number.parseInt(val, 10);
    if (Number.isFinite(n) && n >= 0) setQuantity(n);
  };

  const handleInputBlur = () => {
    if (!Number.isFinite(quantity) || quantity < 1) {
      setQuantity(initialQty);
      setInputValue(String(initialQty));
    } else {
      setInputValue(String(quantity));
    }
  };

  /* ─── Tier row click: set quantity to that tier's minimum ──────────── */
  const handleTierClick = (tier: NormalizedTier) => {
    const snapped = normalizedPackingGroup
      ? Math.ceil(tier.quantity / normalizedPackingGroup) * normalizedPackingGroup
      : tier.quantity;
    setQuantity(snapped);
    setInputValue(String(snapped));
  };

  /* ─── Confirm ───────────────────────────────────────────────────────── */
  const handleConfirm = (usePackingGroup = false) => {
    const qty = usePackingGroup && normalizedPackingGroup
      ? Math.max(1, Math.ceil(quantity / normalizedPackingGroup)) * normalizedPackingGroup
      : Math.max(1, quantity);
    const tierForQty = [...tiers].reverse().find((t) => qty >= t.quantity) ?? null;
    const finalPrice = tierForQty ? tierForQty.unitPrice : price;
    onConfirm(qty, finalPrice);
    onClose();
  };

  /* ─── Overlay click to close ─────────────────────────────────────────── */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  /* ─── Tier label (e.g. "1-9", "10-49", "50-99", "100+") ────────────── */
  const tierLabel = (index: number): string => {
    const tier = tiers[index];
    const next = tiers[index + 1];
    if (!tier) return "";
    if (!next) return `${tier.quantity}+`;
    return `${tier.quantity}–${next.quantity - 1}`;
  };

  const totalSavings = activeTier
    ? (price - activeTier.unitPrice) * quantity
    : 0;

  /* ─── Render ──────────────────────────────────────────────────────────── */
  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t("bulkDiscount.title")}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-neutral-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-6 flex flex-col gap-5">

          {/* Product Header */}
          <div className="flex items-start gap-4 pr-8">
            {productImage ? (
              <div className="shrink-0 w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                <Image
                  src={productImage}
                  alt={productName}
                  width={64}
                  height={64}
                  className="object-contain w-full h-full p-1"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="min-w-0 flex flex-col gap-0.5">
              {productSku ? (
                <span className="text-[#479EF5] text-sm font-normal leading-5">
                  SKU: {productSku}
                </span>
              ) : null}
              <h2 className="text-neutral-800 text-lg font-bold leading-tight">
                {productName}
              </h2>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-neutral-800 text-2xl font-bold">
                  {formatEuro(activeUnitPrice)}
                </span>
                {activeTier && (
                  <span className="text-zinc-400 text-sm line-through">
                    {formatEuro(price)}
                  </span>
                )}
                <span className="text-zinc-500 text-sm">{t("bulkDiscount.exclTax")}</span>
              </div>
            </div>
          </div>

          {/* Bulk Pricing Tiers Table */}
          <div className="flex flex-col gap-2">
            <h3 className="text-neutral-800 text-base font-bold">{t("bulkDiscount.title")}</h3>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-3 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                <span className="text-neutral-700 text-xs font-semibold uppercase tracking-wide">{t("bulkDiscount.quantity")}</span>
                <span className="text-neutral-700 text-xs font-semibold uppercase tracking-wide">{t("bulkDiscount.priceUnit")}</span>
                <span className="text-neutral-700 text-xs font-semibold uppercase tracking-wide">{t("bulkDiscount.savings")}</span>
              </div>

              {/* Discount tiers */}
              {tiers.map((tier, index) => {
                const isActive = activeTier?.quantity === tier.quantity;
                const savings = price - tier.unitPrice;
                return (
                  <button
                    key={tier.quantity}
                    type="button"
                    onClick={() => handleTierClick(tier)}
                    className={`w-full grid grid-cols-3 px-4 py-3 text-left transition-all border-b border-slate-100 last:border-b-0 ${
                      isActive
                        ? "bg-green-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isActive ? "text-neutral-900" : "text-neutral-700"}`}>
                        {tierLabel(index)}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-bold uppercase tracking-wide">
                          {t("bulkDiscount.active")}
                        </span>
                      )}
                    </span>
                    <span className={`text-sm font-bold ${isActive ? "text-neutral-900" : "text-neutral-700"}`}>
                      {formatEuro(tier.unitPrice)}
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? "text-green-600" : "text-green-500"}`}>
                      {tier.discountPct}%{isActive && (
                        <span className="text-zinc-500 font-normal text-xs ml-1">
                          (–{formatEuro(savings)}/unit)
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          {/* Add to Cart Section */}
          <div className="flex flex-col gap-3">
            {normalizedPackingGroup && normalizedPackingGroup > 1 ? (
              // Label product layout with Rolls/Stack and Box buttons
              allowSingulars ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full">
                    {/* Quantity selector */}
                    <div className="h-12 w-full sm:w-32 px-1 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-between items-center bg-white shrink-0">
                      <button
                        type="button"
                        onClick={decrement}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                          <path strokeLinecap="round" d="M2 6h8" />
                        </svg>
                      </button>
                      <div className="flex-1 self-stretch flex justify-center items-center overflow-hidden">
                        <input
                          type="number"
                          min="1"
                          value={inputValue}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onBlur={handleInputBlur}
                          className="w-full text-center text-neutral-800 text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={increment}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                          <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                        </svg>
                      </button>
                    </div>

                    <button
                      type="button"
                      id="bulk-modal-add-rolls"
                      onClick={() => handleConfirm(false)}
                      className="w-full sm:flex-1 h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm flex"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-white text-base font-bold whitespace-nowrap">{rollsStackLabel || t("bulkDiscount.rollsStack")}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    id="bulk-modal-add-box"
                    onClick={() => handleConfirm(true)}
                    className="w-full h-12 px-4 py-2.5 bg-amber-100 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-amber-300 justify-center items-center gap-2 hover:bg-amber-300 transition-colors flex"
                  >
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-amber-600 text-base font-bold whitespace-nowrap">
                      {t("bulkDiscount.box")}{" "}
                      <span className="text-xs text-amber-600">
                        ({normalizedPackingGroup} {rollsStackLabel ? rollsStackLabel.toLowerCase() : t("bulkDiscount.rollsStack").toLowerCase()})
                      </span>
                    </span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full">
                  {/* Quantity selector */}
                  <div className="h-12 w-full sm:w-32 px-1 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-between items-center bg-white shrink-0">
                    <button
                      type="button"
                      onClick={decrement}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                        <path strokeLinecap="round" d="M2 6h8" />
                      </svg>
                    </button>
                    <div className="flex-1 self-stretch flex justify-center items-center overflow-hidden">
                      <input
                        type="number"
                        min="1"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onBlur={handleInputBlur}
                        className="w-full text-center text-neutral-800 text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={increment}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                        <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    id="bulk-modal-add-box"
                    onClick={() => handleConfirm(true)}
                    className="w-full sm:flex-1 h-12 px-4 py-2.5 bg-amber-100 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-amber-300 justify-center items-center gap-2 hover:bg-amber-300 transition-colors flex"
                  >
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-amber-600 text-base font-bold whitespace-nowrap">
                      {t("bulkDiscount.box")}{" "}
                      <span className="text-xs text-amber-600">
                        ({normalizedPackingGroup} {rollsStackLabel ? rollsStackLabel.toLowerCase() : t("bulkDiscount.rollsStack").toLowerCase()})
                      </span>
                    </span>
                  </button>
                </div>
              )
            ) : (
              // Original single-button layout with quantity selector
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 w-full">
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <span className="text-neutral-800 text-sm font-bold w-full">Quantity</span>
                  <div className="h-12 w-full sm:w-32 px-1 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-between items-center bg-white">
                    <button
                      type="button"
                      onClick={decrement}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                        <path strokeLinecap="round" d="M2 6h8" />
                      </svg>
                    </button>
                    <div className="flex-1 self-stretch flex justify-center items-center overflow-hidden">
                      <input
                        type="number"
                        min="1"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onBlur={handleInputBlur}
                        className="w-full text-center text-neutral-800 text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={increment}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                        <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  id="bulk-modal-add-to-cart"
                  onClick={() => handleConfirm(false)}
                  className="w-full sm:flex-1 h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm flex"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-white text-base font-bold whitespace-nowrap">{t("bulkDiscount.addToCart")}</span>
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Banners Container - Fixed minimum height to prevent layout shift when banners appear/disappear */}
          <div className="flex flex-col gap-3 min-h-[140px]">
            {/* Savings Banner */}
            {activeTier && totalSavings > 0 ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50 border border-green-100">
                <span className="shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-green-600 text-white text-xs font-bold">
                  -{activeTier.discountPct}%
                </span>
                <p className="text-green-700 text-sm font-semibold">
                  {t("bulkDiscount.savingAmount", { amount: formatEuro(totalSavings) })}
                </p>
              </div>
            ) : null}

            {/* Next-tier tip */}
            {nextTier && qtyToNextTier && qtyToNextTier > 0 ? (
              <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                <svg className="shrink-0 mt-0.5 text-amber-500" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <p className="text-amber-700 text-sm">
                  {t.rich("bulkDiscount.tipMore", {
                    more: qtyToNextTier,
                    price: formatEuro(nextTier.unitPrice),
                    savings: formatEuro((price - nextTier.unitPrice) * (quantity + qtyToNextTier)),
                    bold: (chunks) => <span className="font-bold">{chunks}</span>,
                    semibold: (chunks) => <span className="font-semibold">{chunks}</span>,
                  })}
                </p>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}
