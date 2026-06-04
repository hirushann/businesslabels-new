"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { ProductRouteType } from "@/components/ProductCard";
import { buildCartItemKey, useCart } from "@/components/CartProvider";
import { useWishlist } from "@/components/WishlistProvider";
import { getExpectedDeliveryMessage, isDeliverableInStock } from "@/lib/utils/delivery";
import Link from "next/link";
import { toast } from "sonner";
import { Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { useTranslations, useLocale } from "next-intl";

type BulkDiscount = {
  discount: string;
  quantity: string;
};

type ProductDiscountInput = string | Array<{ discount?: string | number | null; quantity?: string | number | null }> | null | undefined;

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
  allowSingulars?: boolean | null;
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
  componentCount?: number | null;
  isLabelProduct?: boolean | null;
  properties?: any;
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

function normalizeBulkDiscounts(discounts: ProductDiscountInput | undefined, minimumQuantity: number = 1): BulkDiscount[] {
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
    .filter((discount) => Number(discount.quantity) >= minimumQuantity)
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
  allowSingulars,
  stock,
  deliveryDatesInStock,
  deliveryDatesNoStock,
  discounts,
  warranty,
  componentCount,
  isLabelProduct,
  properties,
}: ProductPurchaseProps) {
  const { addItem, openCart, isCartOpen } = useCart();
  const t = useTranslations();
  const wishlist = useWishlist();
  const locale = useLocale();

  const kernValue = useMemo(() => {
    if (!properties || typeof properties !== 'object') return null;
    const kern = properties.kern;
    if (!kern) return null;
    if (typeof kern === 'string') {
      return kern;
    }
    if (typeof kern === 'object') {
      if (Array.isArray(kern)) {
        for (const item of kern) {
          if (item && typeof item === 'object') {
            if ('value' in item && typeof item.value === 'string') {
              return item.value;
            }
          } else if (typeof item === 'string') {
            return item;
          }
        }
      } else {
        if ('value' in kern && typeof kern.value === 'string') {
          return kern.value;
        }
      }
    }
    return null;
  }, [properties]);

  const rollsStackLabel = useMemo(() => {
    if (!kernValue) {
      return t("product.rollsStack");
    }
    const isFanFold = typeof kernValue === "string" && kernValue.toLowerCase() === "fan-fold";
    if (locale === "nl") {
      return isFanFold ? "Stapel" : "Rollen";
    } else {
      return isFanFold ? "Stack" : "Rolls";
    }
  }, [kernValue, locale, t]);
  const normalizedPackingGroup = packingGroup ? Number.parseInt(packingGroup, 10) : null;
  const hasPackingGroup =
    typeof normalizedPackingGroup === "number" &&
    Number.isFinite(normalizedPackingGroup) &&
    normalizedPackingGroup > 0;
  const initialQuantity = !allowSingulars && hasPackingGroup ? normalizedPackingGroup : 1;
  const [quantity, setQuantity] = useState(initialQuantity);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isWarrantyPopoverOpen, setIsWarrantyPopoverOpen] = useState(false);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  // Update countdown every minute
  useEffect(() => {
    setCurrentTime(new Date());

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Sync quantity state when initialQuantity changes
  useEffect(() => {
    setQuantity(initialQuantity);
    setQuantityError(null);
  }, [initialQuantity]);

  const increment = () => {
    setQuantityError(null);
    setQuantity((prev) => {
      if (!hasPackingGroup || !normalizedPackingGroup) {
        return prev + 1;
      }

      if (allowSingulars && prev < normalizedPackingGroup) {
        return prev + 1;
      }

      if (prev < normalizedPackingGroup) {
        return normalizedPackingGroup;
      }

      return Math.ceil((prev + 1) / normalizedPackingGroup) * normalizedPackingGroup;
    });
  };
  const decrement = () => {
    setQuantityError(null);
    setQuantity((prev) => {
      if (!hasPackingGroup || !normalizedPackingGroup) {
        return prev > 1 ? prev - 1 : 1;
      }

      const minQty = allowSingulars ? 1 : normalizedPackingGroup;

      if (prev <= minQty) {
        return minQty;
      }

      if (allowSingulars && prev <= normalizedPackingGroup) {
        return prev - 1;
      }

      if (prev <= normalizedPackingGroup) {
        return minQty;
      }

      return Math.max(minQty, Math.floor((prev - 1) / normalizedPackingGroup) * normalizedPackingGroup);
    });
  };
  const handleQuantityChange = (value: string) => {
    setQuantityError(null);
    if (value === "") {
      setQuantity(0);
      return;
    }

    const nextQuantity = Number.parseInt(value, 10);
    if (!Number.isFinite(nextQuantity)) {
      return;
    }

    setQuantity(Math.max(0, nextQuantity));
  };

  const handleQuantityBlur = () => {
    const minQty = allowSingulars ? 1 : (normalizedPackingGroup ?? 1);
    if (quantity < minQty) {
      setQuantity(initialQuantity);
    }
  };

  const displaySku = sku?.trim() ? sku : "-";
  const displayName = name?.trim() ? name : "Product";
  const hasPrice = typeof price === "number" && Number.isFinite(price);
  const hasOriginalPrice =
    typeof originalPrice === "number" &&
    Number.isFinite(originalPrice) &&
    (hasPrice ? originalPrice > price : true);
  const resolvedInStock =
    isDeliverableInStock({
      stock,
      delivery_dates_in_stock: deliveryDatesInStock,
      delivery_dates_no_stock: deliveryDatesNoStock,
    }) ?? Boolean(inStock);

  const stockText = resolvedInStock ? t("product.inStock") : t("product.outOfStock");

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
  const quantityStep =
    allowSingulars && hasPackingGroup && normalizedPackingGroup
      ? quantity < normalizedPackingGroup
        ? 1
        : normalizedPackingGroup
      : hasPackingGroup
        ? normalizedPackingGroup
        : 1;
  const normalizedWarranty = useMemo(() => normalizeWarrantyOptions(warranty), [warranty]);
  const minimumQuantity = (!allowSingulars && normalizedPackingGroup) ? normalizedPackingGroup : 1;

  const bulkDiscounts = useMemo(() => {
    return normalizeBulkDiscounts(discounts, minimumQuantity);
  }, [discounts, minimumQuantity]);
  const hasBulkDiscounts = bulkDiscounts.length > 0;
  const hasWarrantyOptions = normalizedWarranty.options.length > 0;
  const defaultWarrantyOption = normalizedWarranty.options.find(
    (option) => option.id === normalizedWarranty.defaultOptionId,
  ) ?? null;
  const selectedWarrantyOption = normalizedWarranty.options.find(
    (option) => option.id === selectedWarrantyId,
  ) ?? defaultWarrantyOption;

  // Find active discount percentage based on quantity
  const activeTier = useMemo(() => {
    if (!hasPrice || !hasBulkDiscounts) return null;
    // Find the highest tier that matches the current quantity
    return [...bulkDiscounts]
      .reverse()
      .find((tier) => quantity >= Number.parseInt(tier.quantity, 10)) ?? null;
  }, [bulkDiscounts, hasBulkDiscounts, hasPrice, quantity]);

  const activeDiscountPercent = useMemo(() => {
    if (!activeTier) return 0;
    const pct = Number.parseFloat(activeTier.discount.replace("%", ""));
    return Number.isFinite(pct) ? pct : 0;
  }, [activeTier]);

  const getUnitPriceForQuantity = useCallback((qty: number) => {
    if (!hasPrice) return null;
    if (!bulkDiscounts || bulkDiscounts.length === 0) return price;

    const matchingTier = [...bulkDiscounts]
      .reverse()
      .find((tier) => qty >= Number.parseInt(tier.quantity, 10));

    if (matchingTier) {
      const pct = Number.parseFloat(matchingTier.discount.replace("%", ""));
      if (Number.isFinite(pct) && pct > 0) {
        return price * (1 - pct / 100);
      }
    }
    return price;
  }, [price, hasPrice, bulkDiscounts]);

  const activeUnitPrice = useMemo(() => {
    return getUnitPriceForQuantity(quantity);
  }, [quantity, getUnitPriceForQuantity]);

  const tierLabel = (index: number): string => {
    const tier = bulkDiscounts[index];
    const next = bulkDiscounts[index + 1];
    if (!tier) return "";
    const tierQty = Number.parseInt(tier.quantity, 10);
    if (!next) return `${tierQty}+`;
    const nextQty = Number.parseInt(next.quantity, 10);
    return `${tierQty}–${nextQty - 1}`;
  };

  const handleTierClick = (tierQty: number) => {
    const snapped = normalizedPackingGroup
      ? Math.ceil(tierQty / normalizedPackingGroup) * normalizedPackingGroup
      : tierQty;
    setQuantity(snapped);
    setQuantityError(null);
  };


  // Calculate delivery message
  const deliveryInfo = useMemo(() => {
    if (
      typeof stock !== "number" ||
      typeof deliveryDatesInStock !== "number" ||
      typeof deliveryDatesNoStock !== "number" ||
      deliveryDatesInStock === 0 ||
      deliveryDatesNoStock === 0 ||
      !currentTime
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
    const normalizedQuantity = Number.isFinite(qtyToAdd) ? Math.floor(qtyToAdd) : 0;

    const minQty = allowSingulars ? 1 : (normalizedPackingGroup ?? 1);
    if (normalizedQuantity < minQty) {
      setQuantityError(
        allowSingulars
          ? t("product.quantityMinError")
          : t("product.quantityLimitErrorMultiple", { limit: normalizedPackingGroup ?? 1 })
      );
      return null;
    }
    
    if (hasPackingGroup) {
      const singularQuantityAllowed = Boolean(allowSingulars && normalizedQuantity <= (normalizedPackingGroup ?? 1));

      if (
        !singularQuantityAllowed &&
        (allowSingulars ? normalizedQuantity !== 1 : true) &&
        normalizedQuantity % (normalizedPackingGroup ?? 1) !== 0
      ) {
        setQuantityError(
          allowSingulars
            ? t("product.quantityLimitErrorSingular", { limit: normalizedPackingGroup ?? 1 })
            : t("product.quantityLimitErrorMultiple", { limit: normalizedPackingGroup ?? 1 }),
        );
        return null;
      }
    }

    return normalizedQuantity;
  };

  const addProductWithWarranty = (qtyToAdd: number, selectedOption: WarrantyOption | null) => {
    const itemPrice = getUnitPriceForQuantity(qtyToAdd) ?? price;

    addItem(
      {
        id: id ?? displaySku,
        slug,
        type,
        name: displayName,
        sku: displaySku,
        price: itemPrice,
        basePrice: price,
        discounts: discounts,
        mainImage,
        componentCount,
        packingGroup: normalizedPackingGroup,
        allowSingulars: Boolean(allowSingulars),
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
          packingGroup: normalizedPackingGroup,
          allowSingulars: Boolean(allowSingulars),
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

    openCart();
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
      inStock: resolvedInStock,
      packingGroup: normalizedPackingGroup,
      allowSingulars: Boolean(allowSingulars),
    });
    toast.success(t("product.savedToWishlist") || "Saved to Wishlist");
  };

  const handleRemoveFromWishlist = () => {
    const key = wishlist.items.find(
      (item) =>
        item.id === id ||
        (item.slug === slug && item.type === type)
    )?.key;
    if (key) {
      wishlist.removeItem(key);
      toast.success(locale === "nl" ? "Verwijderd van verlanglijst" : "Removed from Wishlist");
    }
  };

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      handleRemoveFromWishlist();
    } else {
      handleAddToWishlist();
    }
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
      toast.success(t("product.linkCopied"));
    }
  };

  return (
    <>
    <div ref={containerRef} className="p-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.06)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col gap-6">
      {/* Price Section */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-blue-400 text-base font-normal leading-5">{t("product.sku", { sku: displaySku })}</span>
          {((stock != null && stock > 0) || deliveryDatesNoStock == null || deliveryDatesNoStock < 10) ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${resolvedInStock ? "bg-[#00A63E]" : "bg-zinc-400"}`}>
              {resolvedInStock ? (
                <svg className="w-3 h-3 text-white" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12">
                  <g clipPath="url(#clip0_1768_8264)">
                    <path d="M10.9013 4.99975C11.1296 6.1204 10.9669 7.28546 10.4402 8.30065C9.91352 9.31583 9.05473 10.1198 8.00704 10.5784C6.95935 11.037 5.7861 11.1226 4.68293 10.8209C3.57977 10.5192 2.61338 9.84845 1.94492 8.92046C1.27646 7.99247 0.946343 6.86337 1.00961 5.72144C1.07289 4.57952 1.52572 3.4938 2.29261 2.64534C3.05949 1.79688 4.09407 1.23697 5.22381 1.05898C6.35356 0.880989 7.51017 1.09568 8.50078 1.66725" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.5 5.5L6 7L11 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_1768_8264">
                      <rect width="12" height="12" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              ) : (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                  <circle cx="6" cy="6" r="5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l4 4m0-4L4 8" />
                </svg>
              )}
              <span className="text-white text-xs font-semibold leading-none">{stockText}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-neutral-800 text-4xl font-bold leading-[48px]">
            {hasPrice ? formatEuro(activeUnitPrice ?? price ?? 0) : "-"}
          </span>
          {activeDiscountPercent > 0 ? (
            <span className="text-zinc-500 text-2xl font-normal line-through leading-7">
              {formatEuro(price ?? 0)}
            </span>
          ) : hasOriginalPrice ? (
            <span className="text-zinc-500 text-2xl font-normal line-through leading-7">
              {formatEuro(originalPrice ?? 0)}
            </span>
          ) : null}
          {activeDiscountPercent > 0 ? (
            <span className="text-red-600 text-2xl font-semibold leading-7">-{activeDiscountPercent}%</span>
          ) : discountPercentage ? (
            <span className="text-red-600 text-2xl font-semibold leading-7">-{discountPercentage}%</span>
          ) : null}
        </div>
        <span className="text-zinc-500 text-base font-normal leading-5 text-left">{t("product.exVat")}</span>
      </div>

      {hasBulkDiscounts ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-neutral-800 text-base font-bold">
            {t("product.bulkDiscounts")}
          </h3>
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <span className="text-neutral-700 text-xs font-semibold uppercase tracking-wide">
                {t("product.quantity")}
              </span>
              <span className="text-neutral-700 text-xs font-semibold uppercase tracking-wide">
                {locale === "nl" ? "Prijs / stuk" : "Price / unit"}
              </span>
              <span className="text-neutral-700 text-xs font-semibold uppercase tracking-wide">
                {locale === "nl" ? "Besparing" : "Savings"}
              </span>
            </div>

            {/* Discount tiers */}
            {bulkDiscounts.map((tier, index) => {
              const tierQty = Number.parseInt(tier.quantity, 10);
              const isActive = activeTier?.quantity === tier.quantity;
              const tierUnitPrice = getUnitPriceForQuantity(tierQty) ?? price ?? 0;
              const savingsPct = Number.parseFloat(tier.discount.replace("%", ""));
              const savingsPerUnit = (price ?? 0) - tierUnitPrice;

              return (
                <button
                  key={`${tier.quantity}-${tier.discount}`}
                  type="button"
                  onClick={() => handleTierClick(tierQty)}
                  className={`w-full grid grid-cols-3 px-4 py-3 text-left transition-all border-b border-slate-100 last:border-b-0 cursor-pointer ${
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
                        {locale === "nl" ? "Actief" : "Active"}
                      </span>
                    )}
                  </span>
                  <span className={`text-sm font-bold ${isActive ? "text-neutral-900" : "text-neutral-700"}`}>
                    {formatEuro(tierUnitPrice)}
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? "text-green-600" : "text-green-500"}`}>
                    {savingsPct}%{isActive && (
                      <span className="text-zinc-500 font-normal text-xs ml-1">
                        (–{formatEuro(savingsPerUnit)}/unit)
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
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
        {isLabelProduct ? (
          // Label product layout with Rolls/Stack and Box buttons
          <PopoverAnchor asChild>
            <div className="flex flex-col gap-3">
              {allowSingulars ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full">
                    {/* Quantity selector */}
                    <div className="h-12 w-full sm:w-32 px-1 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-between items-center bg-white shrink-0">
                      <button
                        onClick={decrement}
                        type="button"
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
                          value={quantity === 0 ? "" : quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          onBlur={handleQuantityBlur}
                          className="w-full text-center text-neutral-800 text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                        />
                      </div>
                      <button
                        onClick={increment}
                        type="button"
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                          <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                        </svg>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(quantity)}
                      aria-describedby={quantityError ? "quantity-error" : undefined}
                      className="w-full sm:flex-1 h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm flex"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-white text-base font-bold whitespace-nowrap">{rollsStackLabel}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(Math.max(1, Math.ceil(quantity / (normalizedPackingGroup || 1))) * (normalizedPackingGroup || 1))}
                    className="w-full h-12 px-4 py-2.5 bg-amber-100 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-amber-300 justify-center items-center gap-2 hover:bg-amber-300 transition-colors flex"
                  >
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-amber-600 text-base font-bold whitespace-nowrap">
                      {t("product.box")}{" "}
                      <span className="text-xs text-amber-600">
                        ({normalizedPackingGroup ?? 0} {rollsStackLabel})
                      </span>
                    </span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full">
                  {/* Quantity selector */}
                  <div className="h-12 w-full sm:w-32 px-1 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-between items-center bg-white shrink-0">
                    <button
                      onClick={decrement}
                      type="button"
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
                        value={quantity === 0 ? "" : quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        onBlur={handleQuantityBlur}
                        className="w-full text-center text-neutral-800 text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                      />
                    </div>
                    <button
                      onClick={increment}
                      type="button"
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-3 h-3 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 12 12">
                        <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(Math.max(1, Math.ceil(quantity / (normalizedPackingGroup || 1))) * (normalizedPackingGroup || 1))}
                    className="w-full sm:flex-1 h-12 px-4 py-2.5 bg-amber-100 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-amber-300 justify-center items-center gap-2 hover:bg-amber-300 transition-colors flex"
                  >
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-amber-600 text-base font-bold whitespace-nowrap">
                      {t("product.box")}{" "}
                      <span className="text-xs text-amber-600">
                        ({normalizedPackingGroup ?? 0} {rollsStackLabel})
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </PopoverAnchor>
        ) : (
          // Original single-button layout with quantity selector
          <PopoverAnchor asChild>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <span className="text-neutral-800 text-lg font-bold leading-5 w-full">{t("product.selectQuantity")}</span>
                <div className="h-12 w-full sm:w-32 px-1 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-between items-center bg-white">
                  <button
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
                      value={quantity === 0 ? "" : quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      onBlur={handleQuantityBlur}
                      className="w-full text-center text-neutral-800 text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                    />
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
              <div className="flex flex-col gap-2 w-full sm:flex-1">
                <button
                  type="button"
                  onClick={() => handleAddToCart(quantity)}
                  aria-describedby={quantityError ? "quantity-error" : undefined}
                  className="flex h-12 px-4 py-2.5 bg-amber-500 rounded-[100px] justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-white text-base font-bold whitespace-nowrap">{t("product.addToCart")}</span>
                </button>
              </div>
            </div>
          </PopoverAnchor>
        )}

        {hasWarrantyOptions ? (
          <PopoverContent align="end" className="w-[420px] p-4">
            <PopoverHeader>
              <PopoverTitle className="text-base">{t("product.chooseWarranty")}</PopoverTitle>
              <PopoverDescription>
                {t("product.warrantyDescription")}
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
                            {hasExtraPrice ? `+${formatEuro(option.price)}` : t("product.noExtraCost")}
                          </span>
                        </div>
                        <FieldDescription className="text-xs">
                          {option.description || (option.durationMonths ? `${option.durationMonths} months coverage` : "Extended coverage")}
                        </FieldDescription>
                        {isDefaultOption ? (
                          <span className="mt-1 inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {t("product.defaultOption")}
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
                {t("product.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmWarrantyAdd}
                className="h-9 rounded-full bg-amber-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                {t("product.addToCart")}
              </button>
            </div>
          </PopoverContent>
        ) : null}
      </Popover>

      <div>
        {!hasPackingGroup && quantityError ? (
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
          <span className="text-sm sm:text-base font-semibold">{isWishlisted ? t("product.savedToWishlist") : t("product.addToWishlist")}</span>
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-12 h-12 p-3 bg-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              aria-label={t("product.shareOptions")}
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
                {t("product.copyLink")}
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
            <span className="text-neutral-800 text-base font-semibold leading-5">{t("product.expectedDelivery")}</span>
          </div>
          <p className="text-xs text-neutral-700 leading-5">
            {t("product.orderWithinPrefix")}
            <span className="text-green-600 font-semibold">
              {deliveryInfo.countdown.hours} {t("product.hours")} {deliveryInfo.countdown.formattedMinutes} {t("product.minutes")}
            </span>
            {t("product.forDelivery")}
            <span className="text-green-600 font-semibold">{deliveryInfo.deliveryLabel}</span>
          </p>
        </div>
      </div>
    )}

    {/* Need Help Section with Custom Icons */}
    <div className="flex flex-col gap-4">
      <h3 className="text-neutral-700 text-lg font-bold leading-5">{t("supportPanel.title")}</h3>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          {
            label: t("supportPanel.callUs"),
            href: "tel:0031318590465",
            icon: (
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            )
          },
          {
            label: t("supportPanel.email"),
            href: "mailto:verkoop@businesslabels.nl?&subject=Business%20Labels&body=" + (sku ?? ''),
            icon: (
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )
          },
          {
            label: t("supportPanel.whatsapp"),
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
            <span className="text-neutral-800 text-xs sm:text-sm md:text-base font-semibold leading-5 text-center">{label}</span>
          </Link>
        ))}
      </div>
    </div>
    </div>

    {/* Mobile/Tablet Sticky Bottom Bar */}
    <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-4 py-3 pb-safe flex flex-col gap-3 transition-transform duration-300 ${
      isStickyVisible && !isCartOpen ? "translate-y-0" : "translate-y-full"
    }`}>
      {/* Row 1: Price, Quantity Selector, Wishlist */}
      <div className="flex items-center justify-between gap-4">
        {/* Price info */}
        <div className="flex flex-col">
          <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold leading-3">{t("common.total") || "Total"}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-neutral-800 text-xl font-bold leading-7">
              {hasPrice ? formatEuro((activeUnitPrice ?? price ?? 0) * quantity) : "-"}
            </span>
          </div>
          <span className="text-zinc-500 text-[10px] font-normal leading-3">{t("product.exVat")}</span>
        </div>

        {/* Quantity + Wishlist wrapper */}
        <div className="flex items-center gap-2">
          {/* Compact Quantity selector */}
          {(!isLabelProduct || allowSingulars) && (
            <div className="h-9 px-1 rounded-[50px] outline outline-1 outline-black/10 flex items-center bg-white w-24">
              <button
                onClick={decrement}
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-2.5 h-2.5 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 12 12">
                  <path strokeLinecap="round" d="M2 6h8" />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                value={quantity === 0 ? "" : quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={handleQuantityBlur}
                className="flex-1 min-w-0 text-center text-sm font-semibold text-neutral-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
              />
              <button
                onClick={increment}
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-2.5 h-2.5 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 12 12">
                  <path strokeLinecap="round" d="M6 2v8M2 6h8" />
                </svg>
              </button>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${isWishlisted
                ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                : "border-slate-200 text-neutral-700 hover:bg-slate-50"
              }`}
          >
            <svg className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: Add to Cart Button(s) */}
      <div>
        {isLabelProduct ? (
          <div className="flex items-center gap-3">
            {allowSingulars && (
              <button
                type="button"
                onClick={() => handleAddToCart(quantity)}
                aria-describedby={quantityError ? "quantity-error" : undefined}
                className="flex-1 h-11 px-4 bg-amber-500 rounded-[100px] justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm flex"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-white text-sm font-bold whitespace-nowrap">{rollsStackLabel}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleAddToCart(Math.max(1, Math.ceil(quantity / (normalizedPackingGroup || 1))) * (normalizedPackingGroup || 1))}
              className="flex-1 h-11 px-4 bg-amber-100 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-amber-300 justify-center items-center gap-2 hover:bg-amber-300 transition-colors flex"
            >
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-amber-600 text-sm font-bold whitespace-nowrap">
                {t("product.box")}{" "}
                <span className="text-[10px] text-amber-600">
                  ({normalizedPackingGroup ?? 0} {rollsStackLabel})
                </span>
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleAddToCart(quantity)}
            aria-describedby={quantityError ? "quantity-error" : undefined}
            className="w-full h-11 bg-amber-500 rounded-[100px] justify-center items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm flex"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-white text-base font-bold whitespace-nowrap">{t("product.addToCart")}</span>
          </button>
        )}
      </div>
    </div>
  </>
  );
}
