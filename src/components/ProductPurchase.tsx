"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { ProductRouteType } from "@/components/ProductCard";
import { buildCartItemKey, useCart } from "@/components/CartProvider";
import { useWishlist } from "@/components/WishlistProvider";
import { getExpectedDeliveryMessage } from "@/lib/utils/delivery";
import Link from "next/link";
import { toast } from "sonner";
import { Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";

type BulkDiscount = {
  discount: string;
  quantity: string;
};

type ProductDiscountInput = string | Array<{ discount?: string | number | null; quantity?: string | number | null }> | null;

type WarrantyOption = {
  id: number;
  name: string;
  durationMonths: number;
  price: number;
  description: string;
  sortOrder: number;
};

type ProductPurchaseProps = {
  id?: string | number | null;
  slug?: string | null;
  type?: ProductRouteType | null;
  name?: string | null;
  sku?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  materialTitle?: string | null;
  inStock?: boolean | null;
  price?: number | null;
  originalPrice?: number | null;
  mainImage?: string | null;
  packingGroup?: string | null;
  stock?: number | null;
  deliveryDatesInStock?: number | null;
  deliveryDatesNoStock?: number | null;
  discounts?: ProductDiscountInput;
  warranty?: {
    is_available?: boolean | null;
    has_options?: boolean | null;
    options?: Array<{
      id: number;
      name?: string | null;
      duration_months?: number | null;
      price?: number | null;
      description?: string | null;
      sort_order?: number | null;
    }> | null;
    default_option?: {
      id: number;
      name?: string | null;
      duration_months?: number | null;
      price?: number | null;
      description?: string | null;
      sort_order?: number | null;
    } | null;
  } | null;
};



function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeDiscountNumber(value: string | number | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const normalizedValue = typeof value === "number" ? String(value) : value.trim();
  if (!normalizedValue) {
    return null;
  }

  const numericValue = Number(normalizedValue);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Number.isInteger(numericValue) ? String(numericValue) : String(numericValue);
}

function normalizeBulkDiscounts(discounts: ProductDiscountInput | undefined): BulkDiscount[] {
  const parsedDiscounts = typeof discounts === "string"
    ? (() => {
        try {
          return JSON.parse(discounts) as unknown;
        } catch (error) {
          console.error("Failed to parse product discounts:", error);
          return null;
        }
      })()
    : discounts;

  if (!Array.isArray(parsedDiscounts)) {
    return [];
  }

  return parsedDiscounts
    .map((discount) => {
      if (!discount || typeof discount !== "object") {
        return null;
      }

      const tier = discount as { discount?: string | number | null; quantity?: string | number | null };
      const normalizedDiscount = normalizeDiscountNumber(tier.discount);
      const normalizedQuantity = normalizeDiscountNumber(tier.quantity);

      if (!normalizedDiscount || !normalizedQuantity) {
        return null;
      }

      return {
        discount: `${normalizedDiscount}%`,
        quantity: normalizedQuantity,
      };
    })
    .filter((discount): discount is BulkDiscount => Boolean(discount))
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));
}

function normalizeWarrantyOptions(warranty: ProductPurchaseProps["warranty"]) {
  const options: WarrantyOption[] = (warranty?.options || []).map((opt) => ({
    id: opt.id,
    name: opt.name || "Warranty",
    durationMonths: opt.duration_months || 0,
    price: opt.price || 0,
    description: opt.description || "",
    sortOrder: opt.sort_order || 0,
  })).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return {
    options,
    defaultOptionId: warranty?.default_option?.id || (options.length > 0 ? options[0].id : null),
  };
}

export default function ProductPurchase({
  id,
  slug,
  type,
  name,
  sku,
  subtitle,
  excerpt,
  materialTitle,
  inStock,
  price,
  originalPrice,
  mainImage,
  packingGroup,
  stock,
  deliveryDatesInStock,
  deliveryDatesNoStock,
  discounts,
  warranty,
}: ProductPurchaseProps) {
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isWarrantyPopoverOpen, setIsWarrantyPopoverOpen] = useState(false);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const increment = () => {
    setQuantityError(null);
    setQuantity((prev) => prev + 1);
  };
  const decrement = () => {
    setQuantityError(null);
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const displaySku = sku?.trim() ? sku : "-";
  const displayName = name?.trim() ? name : "Product";
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
  const itemIdentity = {
    id: id ?? displaySku,
    slug,
    type,
  };
  const isWishlisted = wishlist.hasItem(itemIdentity);
  const normalizedPackingGroup = packingGroup ? Number.parseInt(packingGroup, 10) : null;
  const hasPackingGroup =
    typeof normalizedPackingGroup === "number" &&
    Number.isFinite(normalizedPackingGroup) &&
    normalizedPackingGroup > 0;
  const normalizedWarranty = useMemo(() => normalizeWarrantyOptions(warranty), [warranty]);
  const bulkDiscounts = useMemo(() => normalizeBulkDiscounts(discounts), [discounts]);
  const hasBulkDiscounts = bulkDiscounts.length > 0;
  const hasWarrantyOptions = normalizedWarranty.options.length > 0;
  const defaultWarrantyOption = normalizedWarranty.options.find(
    (option) => option.id === normalizedWarranty.defaultOptionId,
  ) ?? null;
  const selectedWarrantyOption = normalizedWarranty.options.find(
    (option) => option.id === selectedWarrantyId,
  ) ?? defaultWarrantyOption;

  useEffect(() => {
    if (!hasWarrantyOptions) {
      setSelectedWarrantyId(null);
      return;
    }

    if (!selectedWarrantyId || !normalizedWarranty.options.some((option) => option.id === selectedWarrantyId)) {
      setSelectedWarrantyId(normalizedWarranty.defaultOptionId);
    }
  }, [hasWarrantyOptions, normalizedWarranty, selectedWarrantyId]);

  // Calculate delivery message
  const deliveryInfo = useMemo(() => {
    if (
      typeof stock !== "number" ||
      typeof deliveryDatesInStock !== "number" ||
      typeof deliveryDatesNoStock !== "number" ||
      deliveryDatesInStock === 0 ||
      deliveryDatesNoStock === 0
    ) {
      return null;
    }

    try {
      return getExpectedDeliveryMessage({
        stock,
        delivery_dates_in_stock: deliveryDatesInStock,
        delivery_dates_no_stock: deliveryDatesNoStock,
        now: currentTime,
      });
    } catch (error) {
      console.error("Failed to calculate delivery message:", error);
      return null;
    }
  }, [stock, deliveryDatesInStock, deliveryDatesNoStock, currentTime]);

  const validateQuantity = (customQuantity?: number): number | null => {
    setQuantityError(null);

    if (!hasPrice) return null;
    
    const qtyToAdd = customQuantity ?? quantity;
    
    if (hasPackingGroup && !customQuantity && quantity % normalizedPackingGroup !== 0) {
      setQuantityError(`Quantity must be divisible by the packing group (${normalizedPackingGroup}).`);
      return null;
    }

    return qtyToAdd;
  };

  const addProductWithWarranty = (qtyToAdd: number, selectedOption: WarrantyOption | null) => {
    addItem(
      {
        id: id ?? displaySku,
        slug,
        type,
        name: displayName,
        sku: displaySku,
        price,
        mainImage,
      },
      qtyToAdd,
    );

    const warrantyPrice =
      selectedOption && typeof selectedOption.price === "number" && Number.isFinite(selectedOption.price)
        ? selectedOption.price
        : 0;

    if (selectedOption && warrantyPrice > 0) {
      const parentKey = buildCartItemKey({ id: id ?? displaySku, slug, type });
      const warrantyName = selectedOption.name || `${displayName} Extended Warranty`;

      addItem(
        {
          id: `warranty-${parentKey}-${selectedOption.id}`,
          name: warrantyName,
          sku: `${displaySku}-WARRANTY`,
          price: warrantyPrice,
          mainImage,
          itemKind: "warranty",
          linkedToKey: parentKey,
          warranty: {
            optionId: selectedOption.id,
            durationMonths: selectedOption.durationMonths,
            parentSku: displaySku,
            parentName: displayName,
          },
        },
        qtyToAdd,
      );
    }
  };

  const handleAddToCart = (customQuantity?: number) => {
    const qtyToAdd = validateQuantity(customQuantity);
    if (!qtyToAdd) {
      return;
    }

    if (hasWarrantyOptions) {
      setPendingQuantity(qtyToAdd);
      setIsWarrantyPopoverOpen(true);
      return;
    }

    addProductWithWarranty(qtyToAdd, null);
  };

  const handleConfirmWarrantyAdd = () => {
    if (!pendingQuantity) {
      return;
    }

    addProductWithWarranty(pendingQuantity, selectedWarrantyOption ?? defaultWarrantyOption);
    setIsWarrantyPopoverOpen(false);
    setPendingQuantity(null);
  };

  const handleAddToWishlist = () => {
    wishlist.addItem({
      ...itemIdentity,
      name: displayName,
      sku: displaySku,
      price,
      mainImage,
      subtitle,
      excerpt,
      materialTitle,
      inStock: Boolean(inStock),
    });
  };
  
  const [isSharing, setIsSharing] = useState(false);
  const isSharingRef = useRef(false);
  
  /* 
  const handleShare = async () => {
    if (isSharingRef.current) return;
    isSharingRef.current = true;
    setIsSharing(true);

    const shareData = {
      title: displayName,
      text: excerpt || subtitle || "",
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard!");
        } catch (copyError) {
          console.error('Error copying to clipboard:', copyError);
        }
      }
    } finally {
      setTimeout(() => {
        isSharingRef.current = false;
        setIsSharing(false);
      }, 500);
    }
  };
  */

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

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
            {hasPrice ? formatEuro(price) : "-"}
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

      {hasBulkDiscounts ? (
        <div className="p-4 bg-slate-100 rounded-[10px]">
          <div className="flex flex-col gap-3">
            <span className="text-neutral-800 text-base font-bold leading-5">Bulk Discounts</span>
            <div className="flex-1 flex justify-between">
              <div className="flex flex-col gap-2">
                <span className="text-neutral-700 text-base font-semibold leading-5">Quantity</span>
                {bulkDiscounts.map((tier) => (
                  <div key={`${tier.quantity}-${tier.discount}`} className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-white rounded-[3px] border border-zinc-500/20" />
                    <span className="text-neutral-700 text-base font-normal leading-5">{tier.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-neutral-700 text-base font-semibold leading-5">Discount</span>
                {bulkDiscounts.map((tier) => (
                  <span key={`${tier.discount}-${tier.quantity}`} className="text-green-600 text-base font-normal leading-5">
                    {tier.discount}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quantity + Add to Cart */}
      <Popover
        open={isWarrantyPopoverOpen}
        onOpenChange={(nextOpen) => {
          setIsWarrantyPopoverOpen(nextOpen);
          if (!nextOpen) {
            setPendingQuantity(null);
          }
        }}
      >
        {hasPackingGroup ? (
          // Two-button layout for products with packing groups
          <PopoverAnchor asChild>
            <div className="flex flex-col gap-3">
              <span className="text-neutral-800 text-lg font-bold leading-5">Select Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(1)}
                  className="flex-1 h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm flex"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-white text-base font-bold whitespace-nowrap">Rolls/Stack</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(normalizedPackingGroup!)}
                  className="flex-1 h-12 px-4 py-2.5 bg-amber-100 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-amber-300 justify-center items-center gap-2 hover:bg-amber-300 transition-colors flex"
                >
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-amber-600 text-base font-bold whitespace-nowrap">Box <span className="text-xs text-amber-600">({normalizedPackingGroup} Rolls/Stack)</span></span>
                </button>
              </div>
            </div>
          </PopoverAnchor>
        ) : (
          // Original single-button layout with quantity selector
          <PopoverAnchor asChild>
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
              <div className="flex flex-1 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart()}
                  aria-describedby={quantityError ? "quantity-error" : undefined}
                  className="flex h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-white text-base font-bold whitespace-nowrap">Add to Cart</span>
                </button>
              </div>
            </div>
          </PopoverAnchor>
        )}

        {hasWarrantyOptions ? (
          <PopoverContent align="end" className="w-[420px] p-4">
            <PopoverHeader>
              <PopoverTitle className="text-base">Choose Warranty</PopoverTitle>
              <PopoverDescription>
                Select a warranty option before adding this item to your cart.
              </PopoverDescription>
            </PopoverHeader>

            <RadioGroup
              value={selectedWarrantyOption ? String(selectedWarrantyOption.id) : undefined}
              onValueChange={(value) => {
                const parsed = Number.parseInt(value, 10);
                if (Number.isFinite(parsed)) {
                  setSelectedWarrantyId(parsed);
                }
              }}
              className="gap-2"
            >
              {normalizedWarranty.options.map((option) => {
                const optionId = `warranty-option-${option.id}`;
                const isDefaultOption = option.id === normalizedWarranty.defaultOptionId;
                const hasExtraPrice = option.price > 0;

                return (
                  <FieldLabel key={option.id} htmlFor={optionId} className="cursor-pointer rounded-xl border border-slate-200 p-0">
                    <Field orientation="horizontal" className="items-start rounded-xl border-none p-3">
                      <RadioGroupItem id={optionId} value={String(option.id)} className="mt-1" />
                      <FieldContent>
                        <div className="flex items-start justify-between gap-3">
                          <FieldTitle className="text-sm font-semibold text-neutral-800">{option.name}</FieldTitle>
                          <span className={`text-sm font-semibold ${hasExtraPrice ? "text-amber-600" : "text-emerald-600"}`}>
                            {hasExtraPrice ? `+${formatEuro(option.price)}` : "No extra cost"}
                          </span>
                        </div>
                        <FieldDescription className="text-xs">
                          {option.description || (option.durationMonths ? `${option.durationMonths} months coverage` : "Extended coverage")}
                        </FieldDescription>
                        {isDefaultOption ? (
                          <span className="mt-1 inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Default Option
                          </span>
                        ) : null}
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                );
              })}
            </RadioGroup>

            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsWarrantyPopoverOpen(false);
                  setPendingQuantity(null);
                }}
                className="h-9 rounded-full border border-slate-200 px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWarrantyAdd}
                className="h-9 rounded-full bg-amber-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                Add to Cart
              </button>
            </div>
          </PopoverContent>
        ) : null}
      </Popover>

      <div>
        {quantityError ? (
          <p id="quantity-error" className="px-2 text-sm font-medium leading-5 text-red-600">
            {quantityError}
          </p>
        ) : null}
      </div>
      
      {/* Wishlist + Share (Standard logic) */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleAddToWishlist}
          disabled={isWishlisted}
          className={`flex-1 h-12 px-4 py-2.5 rounded-[100px] outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2 transition-colors ${isWishlisted
              ? "bg-slate-100 outline-slate-200 text-neutral-500"
              : "outline-black/10 text-neutral-700 hover:bg-slate-50"
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.67} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span className="text-base font-semibold">{isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}</span>
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-12 h-12 p-3 bg-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              aria-label="Share options"
            >
              <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2 bg-white border border-slate-200 shadow-xl rounded-2xl">
            <div className="flex flex-col gap-1">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Link
              </button>
              
              <div className="h-px bg-slate-100 my-1 mx-2" />
              
              <Link
                href={`https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Link>
              
              <Link
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(displayName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </Link>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.012 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126s1.384 1.078 2.126 1.384c.765.297 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.012 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384s1.078-1.384 1.384-2.126c.297-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126s-1.384-1.078-2.126-1.384c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.584-.071 4.85c-.055 1.17-.249 1.805-.415 2.227-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.057.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.584-.015-4.85-.071c-1.17-.055-1.805-.249-2.227-.415-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.36-1.057-.413-2.227-.057-1.266-.07-1.646-.07-4.85s.016-3.584.071-4.85c.055-1.17.249-1.805.415-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413 1.266-.057 1.646-.07 4.85-.07zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" />
                </svg>
                Instagram (Copy Link)
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Delivery Estimate */}
      {deliveryInfo && (
        <div className="p-3 bg-green-600/10 rounded-[10px] outline outline-1 outline-offset-[-1px] outline-green-600/20">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.67} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0 m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0 m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span className="text-neutral-800 text-base font-semibold leading-5">Expected Delivery</span>
            </div>
            <p className="text-xs text-neutral-700 leading-5">
              Order within{' '}
              <span className="text-green-600 font-semibold">
                {deliveryInfo.countdown.hours} hours {deliveryInfo.countdown.formattedMinutes} minutes
              </span>
              {' '}for delivery{' '}
              <span className="text-green-600 font-semibold">{deliveryInfo.deliveryLabel}</span>
            </p>
          </div>
        </div>
      )}

      {/* Need Help Section with Custom Icons */}
      <div className="flex flex-col gap-4">
        <h3 className="text-neutral-700 text-lg font-bold leading-5">Need help or advice?</h3>
        <div className="flex gap-4">
          {[
            {
              label: "Call Us",
              href: "tel:0031318590465",
              icon: (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )
            },
            {
              label: "Email",
              href: "mailto:verkoop@businesslabels.nl?&subject=Business%20Labels&body=" + (sku ?? ''),
              icon: (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              label: "WhatsApp",
              href: "https://wa.me/31318590212?text=" + (sku ?? ''),
              icon: (
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.602 6.06L0 24l6.105-1.602a11.832 11.832 0 005.937 1.578h.005c6.637 0 12.032-5.396 12.035-12.03a11.85 11.85 0 00-3.529-8.511z" />
                </svg>
              )
            },
          ].map(({ label, icon, href }) => (
            <Link
              key={label}
              href={href}
              className="flex-1 p-3 bg-slate-100/30 rounded-xl outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col items-center gap-3 hover:bg-orange-50 transition-colors"
            >
              <div className="w-8 h-8 p-1.5 bg-orange-50 rounded-lg shadow-sm flex items-center justify-center">
                {icon}
              </div>
              <span className="text-neutral-800 text-base font-semibold leading-5">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
