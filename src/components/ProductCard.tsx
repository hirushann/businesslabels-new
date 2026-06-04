"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LinkProps } from "next/link";
import { buildCartItemKey, useCart } from "@/components/CartProvider";
import { Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocale, useTranslations } from "next-intl";
import BulkDiscountModal from "@/components/BulkDiscountModal";
import { localePath } from "@/lib/i18n/utils";
import { localizeProductSpecValue } from "@/lib/products/specValues";

export type ProductRouteType = "simple" | "variable" | "group_product";

export type ProductWarrantyData = {
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
};

export type BulkDiscountTier = {
  quantity?: string | number | null;
  discount?: string | number | null;
};

export type ProductCardData = {
  id: string | number;
  sku: string;
  name: string;
  subtitle?: string | null;
  excerpt?: string | null;
  materialTitle?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  inStock: boolean;
  mainImage?: string | null;
  categories?: Array<{ id?: number; name?: string | null; slug?: string | null }>;
  slug?: string | null;
  type?: ProductRouteType | null;
  packing_group?: number | null;
  allow_singulars?: string | number | boolean | null;
  warranty?: ProductWarrantyData | null;
  discount?: number | 0;
  discounts?: BulkDiscountTier[] | string | null;
  is_label?: boolean | null;
  is_label_product?: boolean | null;
  is_group_product?: boolean | null;
  properties?: Record<string, unknown> | null;
};

type ProductCardProps = {
  product: ProductCardData;
  href?: LinkProps["href"];
  onClick?: () => void;
};

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeProductLocale(locale: string): "en" | "nl" {
  return locale === "nl" ? "nl" : "en";
}

function featureLines(product: ProductCardData, locale: "en" | "nl"): string[] {
  const materialTitle = product.materialTitle
    ? localizeProductSpecValue("material", product.materialTitle, locale)
    : product.materialTitle;

  return [product.subtitle, materialTitle, product.excerpt]
    .map((value) => normalizeText(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizePositiveInteger(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
}

function normalizeWarrantyOptions(warranty: ProductWarrantyData | null | undefined) {
  const options = (warranty?.options || [])
    .map((option) => {
      if (typeof option?.id !== "number" || !Number.isFinite(option.id)) {
        return null;
      }

      return {
        id: option.id,
        name: option.name?.trim() || "Warranty",
        durationMonths:
          typeof option.duration_months === "number" && Number.isFinite(option.duration_months)
            ? option.duration_months
            : null,
        price: typeof option.price === "number" && Number.isFinite(option.price) ? option.price : 0,
        description: option.description?.trim() || null,
        sortOrder:
          typeof option.sort_order === "number" && Number.isFinite(option.sort_order)
            ? option.sort_order
            : 0,
      };
    })
    .filter((option): option is NonNullable<typeof option> => Boolean(option))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  return {
    options,
    defaultOptionId:
      options.find((option) => option.id === warranty?.default_option?.id)?.id ??
      options.find((option) => option.price <= 0)?.id ??
      options[0]?.id ??
      null,
  };
}

export function lastCategoryLabel(categories: ProductCardData["categories"]): string | null {
  const label = categories?.[categories.length - 1]?.name?.trim();
  return label || null;
}

const truncateWords = (text: string, count: number) => {
  const words = text.split(/\s+/);
  if (words.length <= count) return text;
  return words.slice(0, count).join(' ') + ' .....';
};

export default function ProductCard({ product, href, onClick }: ProductCardProps) {
  const locale = useLocale();
  const productLocale = normalizeProductLocale(locale);
  const t = useTranslations();
  const { addItem, openCart } = useCart();
  const productName = product.name ?? "";
  const categoryBadge = lastCategoryLabel(product.categories);
  const features = featureLines(product, productLocale);
  const hasPrice = typeof product.price === "number" && Number.isFinite(product.price);
  const hasOriginalPrice =
    typeof product.originalPrice === "number" &&
    Number.isFinite(product.originalPrice) &&
    (!hasPrice || (hasPrice && (product.price !== undefined && product.price !== null) && product.originalPrice > product.price));
  const imageSrc = normalizeText(product.mainImage) || "https://placehold.co/600x400?text=" + encodeURIComponent(productName);
  
  const properties = product.properties as Record<string, unknown> | null;
  const kernValue = properties?.kern;
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

  const normalizedPackingGroup = normalizePositiveInteger(product.packing_group);
  const addQuantity = normalizeBoolean(product.allow_singulars) ? 1 : normalizedPackingGroup ?? 1;
  const normalizedWarranty = useMemo(() => normalizeWarrantyOptions(product.warranty), [product.warranty]);
  const defaultWarrantyOption = normalizedWarranty.options.find(
    (option) => option.id === normalizedWarranty.defaultOptionId,
  ) ?? null;
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | null>(
    normalizedWarranty.defaultOptionId,
  );
  const [isWarrantyPopoverOpen, setIsWarrantyPopoverOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const selectedWarrantyOption =
    normalizedWarranty.options.find((option) => option.id === selectedWarrantyId) ??
    defaultWarrantyOption;
  const hasWarrantyOptions = normalizedWarranty.options.length > 0;

  // Normalize bulk discounts: only truthy arrays with valid tiers
  const hasBulkDiscounts = useMemo(() => {
    const raw = product.discounts;
    if (!raw) return false;
    let arr: Array<{ discount?: string | number | null; quantity?: string | number | null }>;
    if (typeof raw === "string") {
      try { arr = JSON.parse(raw); } catch { return false; }
    } else {
      arr = raw;
    }
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((tier) => {
      const qty = Number(tier?.quantity);
      const pct = Number(tier?.discount);
      return Number.isFinite(qty) && qty > 0 && Number.isFinite(pct) && pct > 0;
    });
  }, [product.discounts]);

  const addProductWithWarranty = (selectedOption: typeof selectedWarrantyOption, overrideQty?: number, overridePrice?: number) => {
    const finalQty = overrideQty ?? addQuantity;
    const finalPrice = overridePrice ?? product.price ?? null;

    addItem(
      {
        id: product.id,
        slug: product.slug,
        type: product.type,
        name: product.name,
        sku: product.sku,
        price: finalPrice,
        basePrice: product.price,
        discounts: product.discounts,
        mainImage: product.mainImage ?? null,
        packingGroup: normalizedPackingGroup,
        allowSingulars: normalizeBoolean(product.allow_singulars),
      },
      finalQty,
    );

    const warrantyPrice =
      selectedOption && typeof selectedOption.price === "number" && Number.isFinite(selectedOption.price)
        ? selectedOption.price
        : 0;

    if (selectedOption && warrantyPrice > 0) {
      const parentKey = buildCartItemKey({ id: product.id, slug: product.slug, type: product.type });
      const warrantyName = selectedOption.name || `${productName} Extended Warranty`;

      addItem(
        {
          id: `warranty-${parentKey}-${selectedOption.id}`,
          name: warrantyName,
          sku: `${product.sku}-WARRANTY`,
          price: warrantyPrice,
          mainImage: product.mainImage ?? null,
          itemKind: "warranty",
          linkedToKey: parentKey,
          packingGroup: normalizedPackingGroup,
          allowSingulars: normalizeBoolean(product.allow_singulars),
          warranty: {
            optionId: selectedOption.id,
            durationMonths: selectedOption.durationMonths,
            parentSku: product.sku,
            parentName: productName,
          },
        },
        finalQty,
      );
    }
    
    openCart();
  };

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Products with bulk discounts get the dedicated pricing modal
    if (hasBulkDiscounts) {
      setIsBulkModalOpen(true);
      return;
    }

    if (hasWarrantyOptions) {
      setSelectedWarrantyId(selectedWarrantyId ?? normalizedWarranty.defaultOptionId);
      setIsWarrantyPopoverOpen(true);
      return;
    }

    addProductWithWarranty(null);
  };

  const handleConfirmWarrantyAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addProductWithWarranty(selectedWarrantyOption);
    setIsWarrantyPopoverOpen(false);
  };

  // Called when user confirms from bulk discount modal
  const handleBulkModalConfirm = (quantity: number, unitPrice: number) => {
    setIsBulkModalOpen(false);
    addProductWithWarranty(null, quantity, unitPrice);
  };

  // Apply locale prefix to pathname-style hrefs (e.g. { pathname: '/product/...' })
  const localizedHref: LinkProps["href"] | undefined = (() => {
    if (typeof href === "string") {
      return localePath(href, locale);
    }
    if (typeof href === "object" && "pathname" in href && typeof href.pathname === "string") {
      return { ...href, pathname: localePath(href.pathname, locale) };
    }
    return href;
  })();

  const cardContent = (
    console.log("Rendering ProductCard for:", product),
    <div className="mx-auto h-full w-full max-w-88 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] border border-slate-100 flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-56 bg-slate-100 overflow-hidden">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          {categoryBadge ? (
            <div className="px-2.5 py-1 bg-white rounded-full flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_757_440)">
                  <path d="M3 9H2C1.73478 9 1.48043 8.89464 1.29289 8.70711C1.10536 8.51957 1 8.26522 1 8V5.5C1 5.23478 1.10536 4.98043 1.29289 4.79289C1.48043 4.60536 1.73478 4.5 2 4.5H10C10.2652 4.5 10.5196 4.60536 10.7071 4.79289C10.8946 4.98043 11 5.23478 11 5.5V8C11 8.26522 10.8946 8.51957 10.7071 8.70711C10.5196 8.89464 10.2652 9 10 9H9" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 4.5V1.5C3 1.36739 3.05268 1.24021 3.14645 1.14645C3.24021 1.05268 3.36739 1 3.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645C8.94732 1.24021 9 1.36739 9 1.5V4.5" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.5 7H3.5C3.22386 7 3 7.22386 3 7.5V10.5C3 10.7761 3.22386 11 3.5 11H8.5C8.77614 11 9 10.7761 9 10.5V7.5C9 7.22386 8.77614 7 8.5 7Z" stroke="#444444" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs>
                  <clipPath id="clip0_757_440">
                    <rect width="12" height="12" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              {categoryBadge && (
                (() => {
                  const truncated = truncateWords(categoryBadge, 2);
                  const isTruncated = categoryBadge !== truncated;
                  return isTruncated ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-neutral-700 text-xs font-normal font-['Segoe_UI'] leading-4 cursor-default">{truncated}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{categoryBadge}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-neutral-700 text-xs font-normal font-['Segoe_UI'] leading-4">{categoryBadge}</span>
                  );
                })()
              )}
            </div>
          ) : <div className="w-8" />}
          {/* Only an in-stock badge is ever shown — out-of-stock products are
              filtered out of listings, never flagged. */}
          {product.inStock ? (
            <div className="px-2.5 py-1 bg-green-600 rounded-full flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1768_8264)">
                  <path d="M10.9013 4.99975C11.1296 6.1204 10.9669 7.28546 10.4402 8.30065C9.91352 9.31583 9.05473 10.1198 8.00704 10.5784C6.95935 11.037 5.7861 11.1226 4.68293 10.8209C3.57977 10.5192 2.61338 9.84845 1.94492 8.92046C1.27646 7.99247 0.946343 6.86337 1.00961 5.72144C1.07289 4.57952 1.52572 3.4938 2.29261 2.64534C3.05949 1.79688 4.09407 1.23697 5.22381 1.05898C6.35356 0.880989 7.51017 1.09568 8.50078 1.66725" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.5 5.5L6 7L11 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <defs>
                  <clipPath id="clip0_1768_8264">
                    <rect width="12" height="12" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <span className="text-white text-xs font-normal font-['Segoe_UI'] leading-4">{t("product.inStock")}</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full flex items-center gap-1.5">
              {/* <span className="text-gray-600 text-xs font-normal font-['Segoe_UI'] leading-4">Out of Stock</span> */}
            </div>
          )}
        </div>
        <Link href={localizedHref || "#"} className="absolute inset-0 z-0" onClick={onClick}>
        <Image
          src={imageSrc}
          alt={productName}
          width={600}
          height={400}
          className="h-full w-auto object-contain mx-auto py-5"
          unoptimized
        />
        </Link>
        {product.is_label_product === true && product.packing_group != null && Number(product.packing_group) > 0 && (
          <div className="absolute bottom-4 right-4 z-10 px-2.5 py-1 bg-white rounded-full flex items-center gap-1.5 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] border border-slate-100">
            <span className="text-neutral-700 text-xs font-normal font-['Segoe_UI'] leading-4">
              {t("product.perBox", { count: product.packing_group })}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-blue-400 text-sm font-normal font-['Segoe_UI'] leading-5">SKU: {product.sku}</span>
            </div>
            <Link href={localizedHref || "#"} className="block" onClick={onClick}>
            <h3 className="text-neutral-800 text-xl font-semibold font-['Segoe_UI'] leading-6">{product.name}</h3>
            </Link>
          </div>
          {features.length > 0 && (
            <div className="flex flex-col gap-4">
              {features.map((feature, index) => (
                <div key={`${feature}-${index}`} className="flex items-start gap-2">
                  <svg className="shrink-0 mt-1" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_757_364)">
                      <path d="M10.9013 4.99975C11.1296 6.1204 10.9669 7.28546 10.4402 8.30065C9.91352 9.31583 9.05473 10.1198 8.00704 10.5784C6.95935 11.037 5.7861 11.1226 4.68293 10.8209C3.57977 10.5192 2.61338 9.84845 1.94492 8.92046C1.27646 7.99247 0.946343 6.86337 1.00961 5.72144C1.07289 4.57952 1.52572 3.4938 2.29261 2.64534C3.05949 1.79688 4.09407 1.23697 5.22381 1.05898C6.35356 0.880989 7.51017 1.09568 8.50078 1.66725" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.5 5.5L6 7L11 2" stroke="#00C950" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_757_364">
                        <rect width="12" height="12" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="line-clamp-2 break-words text-neutral-700 text-base font-normal font-['Segoe_UI'] leading-5">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 mt-auto">
          <div className="bg-slate-100" />
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <span className="text-neutral-800 text-2xl font-bold font-['Segoe_UI'] leading-7">
                  {hasPrice ? formatEuro(product.price!) : "-"}
                </span>
                {hasOriginalPrice ? (
                  <span className="text-zinc-400 text-sm font-normal font-['Segoe_UI'] leading-5 line-through">
                    {formatEuro(product.originalPrice!)}
                  </span>
                ) : null}
              </div>
              <span className="text-zinc-500 text-xs font-normal font-['Segoe_UI'] leading-4">{t('product.priceExclTax')}</span>
            </div>
            <Popover open={isWarrantyPopoverOpen} onOpenChange={setIsWarrantyPopoverOpen}>
              <PopoverAnchor asChild>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-4 py-2.5 bg-amber-500 rounded-full flex items-center gap-2 text-white text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors"
                  aria-label={t("product.addProductToCart", { name: product.name })}
                >
                  {t("common.add")}
                  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.33268 14.6663C7.83894 14.6663 8.24935 14.3679 8.24935 13.9997C8.24935 13.6315 7.83894 13.333 7.33268 13.333C6.82642 13.333 6.41602 13.6315 6.41602 13.9997C6.41602 14.3679 6.82642 14.6663 7.33268 14.6663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.4167 14.6663C17.9229 14.6663 18.3333 14.3679 18.3333 13.9997C18.3333 13.6315 17.9229 13.333 17.4167 13.333C16.9104 13.333 16.5 13.6315 16.5 13.9997C16.5 14.3679 16.9104 14.6663 17.4167 14.6663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M1.87891 1.36621H3.71224L6.15057 9.64621C6.24002 9.94945 6.47202 10.2205 6.80664 10.4128C7.14126 10.605 7.55757 10.7064 7.9839 10.6995H16.9489C17.3661 10.6991 17.7707 10.5951 18.0957 10.4048C18.4207 10.2145 18.6467 9.94923 18.7364 9.65288L20.2489 4.69954H4.69307" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </PopoverAnchor>
              {hasWarrantyOptions ? (
                <PopoverContent
                  align="end"
                  className="w-80 p-4"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <PopoverHeader>
                    <PopoverTitle className="text-base">{t("product.chooseWarranty")}</PopoverTitle>
                    <PopoverDescription>{t("product.warrantyDescription")}</PopoverDescription>
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
                      const hasExtraPrice = option.price > 0;
                      return (
                        <label
                          key={option.id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm"
                        >
                          <RadioGroupItem value={String(option.id)} className="mt-1" />
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="flex items-start justify-between gap-2 font-semibold text-neutral-800">
                              <span>{option.name}</span>
                              <span className={hasExtraPrice ? "text-amber-600" : "text-emerald-600"}>
                                {hasExtraPrice ? `+${formatEuro(option.price)}` : t("product.noExtraCost")}
                              </span>
                            </span>
                            <span className="text-xs text-neutral-500">
                              {option.description || (option.durationMonths ? t("product.monthsCoverage", { count: option.durationMonths }) : t("product.extendedCoverage"))}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setIsWarrantyPopoverOpen(false);
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
          </div>
        </div>
      </div>
    </div>
  );

  const bulkModal = hasBulkDiscounts && hasPrice && product.discounts ? (
    <BulkDiscountModal
      isOpen={isBulkModalOpen}
      onClose={() => setIsBulkModalOpen(false)}
      onConfirm={handleBulkModalConfirm}
      productName={productName}
      productSku={product.sku}
      productImage={normalizeText(product.mainImage)}
      price={product.price!}
      discounts={product.discounts}
      packingGroup={normalizedPackingGroup}
      allowSingulars={normalizeBoolean(product.allow_singulars)}
      rollsStackLabel={rollsStackLabel}
    />
  ) : null;

  if (!href) {
    return (
      <>
        <div>{cardContent}</div>
        {bulkModal}
      </>
    );
  }

  

  return (
    <>
      {/* <Link href={href} className="block h-full w-full" onClick={onClick}> */}
        {cardContent}
      {/* </Link> */}
      {bulkModal}
    </>
  );
}
