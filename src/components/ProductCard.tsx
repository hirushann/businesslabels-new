"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LinkProps } from "next/link";
import { buildCartItemKey, useCart } from "@/components/CartProvider";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InfoIcon, DownloadIcon, TruckIcon, HomeIcon } from "lucide-react";
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

type WarrantyOption = {
  id: number | string;
  name: string;
  durationMonths: number;
  price: number;
  description: string;
  sortOrder?: number;
};

type NormalizedWarrantyType = {
  id: number | string;
  name: string;
  description: string;
  icon: string;
  badgeText: string;
  badgeColor: string;
  options: WarrantyOption[];
};

export type ProductWarrantyData = {
  is_available?: boolean | null;
  has_options?: boolean | null;
  default_option?: {
    type?: string | null;
    warranty_option_id?: number | string | null;
    sku?: string | null;
    name?: string | null;
    duration_years?: number | null;
    price?: number | null;
    description?: string | null;
  } | null;
  types?: Array<{
    id: number;
    name?: string | null;
    description?: string | null;
    icon?: string | null;
    badge_text?: string | null;
    badge_color?: string | null;
    options?: Array<{
      id?: number | string | null;
      type?: string | null;
      warranty_option_id?: number | string | null;
      sku?: string | null;
      name?: string | null;
      duration_years?: number | null;
      description?: string | null;
      price?: number | null;
      cart?: {
        type?: string | null;
        warranty_option_id?: number | string | null;
        sku?: string | null;
      } | null;
    }> | null;
  }> | null;
  options?: Array<{
    id: number;
    name?: string | null;
    duration_months?: number | null;
    price?: number | null;
    description?: string | null;
    sort_order?: number | null;
  }> | null;
};

export type BulkDiscountTier = {
  quantity?: string | number | null;
  discount?: string | number | null;
};

type NormalizedBulkDiscountTier = {
  quantity: number;
  discountPct: number;
};

export type ProductCardTranslation = {
  language?: string | null;
  name?: string | null;
  title?: string | null;
  subtitle?: string | null;
  slug?: string | null;
  excerpt?: string | null;
};

export type ProductCardTranslations =
  | Array<Record<string, ProductCardTranslation | null> | ProductCardTranslation | string>
  | Record<string, Record<string, string | null> | string | null>
  | string
  | null;

export type ProductCardCategory = {
  id?: number;
  name?: string | string[] | null;
  slug?: string | string[] | null;
  name_en?: string | null;
  name_nl?: string | null;
  slug_en?: string | null;
  slug_nl?: string | null;
  translations?: ProductCardTranslations;
};

export type ProductCardData = {
  id: string | number;
  sku: string;
  name: string;
  title?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  materialTitle?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  original_price?: number | null;
  stock?: number | string | null;
  inStock: boolean;
  in_stock?: boolean | null;
  mainImage?: string | null;
  main_image?: string | null;
  api_path_by_slug?: string | null;
  categories?: ProductCardCategory[];
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
  translations?: ProductCardTranslations;
};

type ProductCardProps = {
  product: ProductCardData;
  href?: LinkProps["href"];
  onClick?: () => void;
};

function normalizeBulkDiscountTiers(
  discounts: ProductCardData["discounts"],
): NormalizedBulkDiscountTier[] {
  if (!discounts) return [];

  let parsed: BulkDiscountTier[];
  if (typeof discounts === "string") {
    try {
      parsed = JSON.parse(discounts) as BulkDiscountTier[];
    } catch {
      return [];
    }
  } else {
    parsed = discounts;
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((tier) => {
      const quantity = Number(tier?.quantity);
      const discountPct = Number(tier?.discount);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(discountPct) ||
        discountPct <= 0
      ) {
        return null;
      }

      return {
        quantity: Math.floor(quantity),
        discountPct,
      };
    })
    .filter((tier): tier is NormalizedBulkDiscountTier => tier !== null);
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeProductLocale(locale: string): "en" | "nl" {
  return locale === "nl" ? "nl" : "en";
}

function localizedProductField(
  translations: ProductCardData["translations"],
  locale: "en" | "nl",
  fields: Array<keyof ProductCardTranslation>,
): string | null {
  if (!translations) return null;

  let parsed: NonNullable<ProductCardData["translations"]> = translations;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as NonNullable<ProductCardData["translations"]>;
    } catch {
      return null;
    }
  }

  const valueFromRecord = (record: Record<string, unknown> | null | undefined): string | null => {
    if (!record) return null;
    for (const field of fields) {
      const value = record[field];
      if (typeof value === "string" && value.trim() !== "") {
        return value;
      }
    }
    return null;
  };

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      let item = entry;
      if (typeof item === "string") {
        try {
          item = JSON.parse(item) as ProductCardTranslation;
        } catch {
          continue;
        }
      }

      if (!item || typeof item !== "object") continue;
      const keyed = (item as Record<string, ProductCardTranslation | null>)[locale];
      const keyedValue = valueFromRecord(keyed as Record<string, unknown> | null);
      if (keyedValue) return keyedValue;

      const direct = item as ProductCardTranslation;
      if (direct.language === locale) {
        const directValue = valueFromRecord(direct as Record<string, unknown>);
        if (directValue) return directValue;
      }
    }
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const record = parsed as Record<string, Record<string, string | null> | string | null>;

    for (const field of fields) {
      const localizedByField = record[field];
      if (localizedByField && typeof localizedByField === "object") {
        const value = localizedByField[locale];
        if (typeof value === "string" && value.trim() !== "") {
          return value;
        }
      }
    }

    const localizedEntry = record[locale];
    if (localizedEntry && typeof localizedEntry === "object") {
      const value = valueFromRecord(localizedEntry);
      if (value) return value;
    }
  }

  return null;
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

function formatWarrantyEuro(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

function normalizeWarrantyOptions(warranty: ProductWarrantyData | null | undefined, locale: string) {
  const defaultOption = warranty?.default_option ? {
    id: warranty.default_option.warranty_option_id ?? "default",
    name: warranty.default_option.name || "Warranty",
    durationMonths: warranty.default_option.duration_years ? warranty.default_option.duration_years * 12 : 0,
    price: warranty.default_option.price || 0,
    description: warranty.default_option.description || "",
  } : null;

  let types: NormalizedWarrantyType[] = (warranty?.types || []).map((t) => ({
    id: t.id,
    name: t.name || "",
    description: t.description || "",
    icon: t.icon || "",
    badgeText: t.badge_text || "",
    badgeColor: t.badge_color || "",
    options: (t.options || []).map((opt) => ({
      id: opt.warranty_option_id ?? opt.id ?? opt.cart?.warranty_option_id ?? 0,
      name: opt.name || "Warranty",
      durationMonths: opt.duration_years ? opt.duration_years * 12 : 0,
      price: opt.price || 0,
      description: opt.description || (opt.duration_years ? (locale === "nl" ? `${opt.duration_years * 12} maanden dekking` : `${opt.duration_years * 12} months coverage`) : (locale === "nl" ? "Uitgebreide dekking" : "Extended coverage")),
    })),
  }));

  const oldOptions: WarrantyOption[] = (warranty?.options || []).map((opt) => ({
    id: opt.id,
    name: opt.name || "Warranty",
    durationMonths: opt.duration_months || 0,
    price: opt.price || 0,
    description: opt.description || (opt.duration_months ? (locale === "nl" ? `${opt.duration_months} maanden dekking` : `${opt.duration_months} months coverage`) : (locale === "nl" ? "Uitgebreide dekking" : "Extended coverage")),
    sortOrder: opt.sort_order || 0,
  })).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (types.length === 0 && oldOptions.length > 0) {
    types = [{
      id: "legacy",
      name: locale === "nl" ? "Garantie Opties" : "Extended Warranty",
      description: locale === "nl" ? "Verleng de dekking van uw printer." : "Extend your printer coverage.",
      icon: "shield-check",
      badgeText: "",
      badgeColor: "",
      options: oldOptions
    }];
  }

  let allOptions = types.flatMap((t) => t.options);
  if (oldOptions.length > 0 && types[0]?.id !== "legacy") {
    allOptions = [...allOptions, ...oldOptions];
  }

  return {
    defaultOption,
    types,
    oldOptions: types[0]?.id === "legacy" ? [] : oldOptions,
    allOptions,
  };
}

function localizedCategoryValue(
  category: NonNullable<ProductCardData["categories"]>[number],
  locale: "en" | "nl",
  field: "name" | "slug",
): string | null {
  const explicit = category[`${field}_${locale}`];
  if (typeof explicit === "string" && explicit.trim() !== "") {
    return explicit;
  }

  const translated = localizedProductField(category.translations, locale, [field]);
  if (translated) return translated;

  const value = category[field];
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  if (Array.isArray(value)) {
    const strings = value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
    if (strings.length === 0) return null;
    return locale === "nl" ? strings[1] ?? strings[0] : strings[0];
  }

  return null;
}

export function lastCategoryLabel(categories: ProductCardData["categories"], locale: "en" | "nl" = "nl"): string | null {
  const category = categories?.[categories.length - 1];
  if (!category) return null;

  return localizedCategoryValue(category, locale, "name");
}

const truncateWords = (text: string, count: number) => {
  const words = text.split(/\s+/);
  if (words.length <= count) return text;
  return words.slice(0, count).join(' ') + ' .....';
};

function productHrefWithSlug(href: LinkProps["href"] | undefined, slug: string | null): LinkProps["href"] | undefined {
  if (!slug) return href;

  const productPath = `/product/${slug}`;

  if (!href) {
    return productPath;
  }

  if (typeof href === "string") {
    return href
      .replace(/^\/products\/[^/?#]+/, productPath)
      .replace(/^\/product\/[^/?#]+/, productPath);
  }

  if (typeof href === "object" && "pathname" in href && typeof href.pathname === "string") {
    const pathname = href.pathname
      .replace(/^\/products\/[^/?#]+/, productPath)
      .replace(/^\/product\/[^/?#]+/, productPath);
    return { ...href, pathname };
  }

  return href;
}

function slugFromApiPath(apiPath: string | null | undefined): string | null {
  if (!apiPath) return null;
  const match = apiPath.match(/\/slug\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ProductCard({ product, href, onClick }: ProductCardProps) {
  const locale = useLocale();
  const productLocale = normalizeProductLocale(locale);
  const t = useTranslations();
  const getTrans = (key: string, fbEn: string, fbNl: string) => {
    if (t.has(key)) return t(key);
    return locale === "nl" ? fbNl : fbEn;
  };
  const { addItem, openCart } = useCart();
  const productName = localizedProductField(product.translations, productLocale, ["title", "name"]) ?? product.name ?? product.title ?? "";
  const productSlug = localizedProductField(product.translations, productLocale, ["slug"]) ?? product.slug ?? slugFromApiPath(product.api_path_by_slug);
  const categoryBadge = lastCategoryLabel(product.categories, productLocale);
  const features = featureLines(product, productLocale);
  const productPrice = product.price;
  const productOriginalPrice = product.originalPrice ?? product.original_price;
  const productInStock = product.inStock ?? product.in_stock ?? normalizeBoolean(product.stock);
  const productMainImage = product.mainImage ?? product.main_image ?? null;
  const hasPrice = typeof product.price === "number" && Number.isFinite(product.price);
  const hasOriginalPrice =
    typeof productOriginalPrice === "number" &&
    Number.isFinite(productOriginalPrice) &&
    (!hasPrice || (hasPrice && productPrice !== undefined && productPrice !== null && productOriginalPrice > productPrice));
  const imageSrc = normalizeText(productMainImage) || "https://placehold.co/600x400?text=" + encodeURIComponent(productName);
  
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
  const normalizedWarranty = useMemo(() => normalizeWarrantyOptions(product.warranty, locale), [product.warranty, locale]);
  const defaultWarrantyOption = normalizedWarranty.defaultOption;
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | string | null>(
    defaultWarrantyOption?.id ?? null,
  );
  const [isWarrantyPopoverOpen, setIsWarrantyPopoverOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const defaultWarrantyId = defaultWarrantyOption?.id ?? null;
  const selectedWarrantyOption =
    normalizedWarranty.allOptions.find((option) => option.id === selectedWarrantyId) ??
    (selectedWarrantyId === defaultWarrantyId ? defaultWarrantyOption : null);
  const selectedWarrantyPrice =
    selectedWarrantyOption && typeof selectedWarrantyOption.price === "number" && Number.isFinite(selectedWarrantyOption.price)
      ? selectedWarrantyOption.price
      : 0;
  const hasSelectedPaidWarranty = selectedWarrantyPrice > 0;
  const hasWarrantyOptions = Boolean(defaultWarrantyOption) || normalizedWarranty.allOptions.length > 0 || normalizedWarranty.oldOptions.length > 0;

  const bulkDiscountTiers = useMemo(
    () => normalizeBulkDiscountTiers(product.discounts),
    [product.discounts],
  );
  const hasBulkDiscounts = bulkDiscountTiers.length > 0;
  const overviewPrice = useMemo(() => {
    if (!hasPrice || !hasBulkDiscounts) {
      return productPrice ?? null;
    }

    return bulkDiscountTiers.reduce(
      (lowestPrice, tier) =>
        Math.min(lowestPrice, productPrice! * (1 - tier.discountPct / 100)),
      productPrice!,
    );
  }, [bulkDiscountTiers, hasBulkDiscounts, hasPrice, productPrice]);

  const addProductWithWarranty = (selectedOption: typeof selectedWarrantyOption, overrideQty?: number, overridePrice?: number) => {
    const finalQty = overrideQty ?? addQuantity;
    const finalPrice = overridePrice ?? productPrice ?? null;

    addItem(
      {
        id: product.id,
        slug: productSlug,
        type: product.type,
        name: productName,
        sku: product.sku,
        price: finalPrice,
        basePrice: productPrice,
        discounts: product.discounts,
        mainImage: productMainImage,
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
      const parentKey = buildCartItemKey({ id: product.id, slug: productSlug, type: product.type });
      const warrantyName = selectedOption.name || `${productName} Extended Warranty`;

      addItem(
        {
          id: `warranty-${parentKey}-${selectedOption.id}`,
          name: warrantyName,
          sku: `${product.sku}-WARRANTY`,
          price: warrantyPrice,
          mainImage: productMainImage,
          itemKind: "warranty",
          linkedToKey: parentKey,
          packingGroup: normalizedPackingGroup,
          allowSingulars: normalizeBoolean(product.allow_singulars),
          warranty: {
            optionId: Number(selectedOption.id),
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
      setSelectedWarrantyId(selectedWarrantyId ?? defaultWarrantyId);
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
    const sluggedHref = productHrefWithSlug(href, productSlug);
    if (typeof sluggedHref === "string") {
      return localePath(sluggedHref, locale);
    }
    if (typeof sluggedHref === "object" && "pathname" in sluggedHref && typeof sluggedHref.pathname === "string") {
      return { ...sluggedHref, pathname: localePath(sluggedHref.pathname, locale) };
    }
    return sluggedHref;
  })();

  const cardContent = (
    console.log("Rendering ProductCard for:", product),
    <div className="h-full w-full bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] border border-slate-100 flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
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
          {productInStock ? (
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
              <span className="text-[#479EF5] text-sm font-semibold font-['Segoe_UI'] leading-5">SKU: {product.sku}</span>
            </div>
            <Link href={localizedHref || "#"} className="block" onClick={onClick}>
            <h3 className="text-neutral-800 text-xl font-bold font-['Segoe_UI'] leading-6">{productName}</h3>
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
                {hasBulkDiscounts && hasPrice ? (
                  <span className="text-neutral-500 text-sm font-semibold font-['Segoe_UI'] leading-5">
                    {t("product.fromPrice")}
                  </span>
                ) : null}
                <span className="text-neutral-800 text-2xl font-extrabold font-['Segoe_UI'] leading-7">
                  {hasPrice && overviewPrice !== null ? formatEuro(overviewPrice) : "-"}
                </span>
                {hasOriginalPrice ? (
                  <span className="text-zinc-400 text-sm font-normal font-['Segoe_UI'] leading-5 line-through">
                    {formatEuro(productOriginalPrice!)}
                  </span>
                ) : null}
              </div>
              <span className="text-zinc-500 text-xs font-normal font-['Segoe_UI'] leading-4">{t('product.priceExclTax')}</span>
            </div>
            <Dialog open={isWarrantyPopoverOpen} onOpenChange={setIsWarrantyPopoverOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-4 py-2.5 bg-amber-500 rounded-full flex items-center gap-2 text-white text-base font-semibold font-['Segoe_UI'] leading-6 hover:bg-amber-600 transition-colors"
                  aria-label={t(hasBulkDiscounts ? "product.selectProductQuantity" : "product.addProductToCart", { name: productName })}
                >
                  {t(hasBulkDiscounts ? "common.select" : "common.add")}
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.33366 20.1663C7.83992 20.1663 8.25033 19.7559 8.25033 19.2497C8.25033 18.7434 7.83992 18.333 7.33366 18.333C6.8274 18.333 6.41699 18.7434 6.41699 19.2497C6.41699 19.7559 6.8274 20.1663 7.33366 20.1663Z" stroke="white" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M17.4167 20.1663C17.9229 20.1663 18.3333 19.7559 18.3333 19.2497C18.3333 18.7434 17.9229 18.333 17.4167 18.333C16.9104 18.333 16.5 18.7434 16.5 19.2497C16.5 19.7559 16.9104 20.1663 17.4167 20.1663Z" stroke="white" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M1.87988 1.87988H3.71322L6.15155 13.2649C6.241 13.6818 6.473 14.0546 6.80762 14.3189C7.14224 14.5833 7.55855 14.7227 7.98488 14.7132H16.9499C17.3671 14.7125 17.7717 14.5696 18.0967 14.3079C18.4217 14.0462 18.6477 13.6815 18.7374 13.274L20.2499 6.46322H16.3609C16.3609 6.46322 15.5833 9.16667 12.375 9.16667C9.16667 9.16667 8.58301 6.46322 8.58301 6.46322H4.69405" stroke="white" strokeWidth="1.375" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M10.083 4.125H14.6663" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M12.375 1.83301V6.41634" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
                </button>
              </DialogTrigger>
              {hasWarrantyOptions ? (
                <DialogContent className="w-[calc(100vw-1rem)] max-w-xl gap-0 overflow-hidden bg-background p-0 text-foreground shadow-xl sm:max-w-xl sm:rounded-2xl" showCloseButton={false}>
                  <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto p-4 sm:p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <DialogTitle className="mb-1 text-xl font-bold leading-tight text-foreground sm:text-2xl">
                          {getTrans("product.chooseWarranty", "Extend Your Warranty", "Breid uw garantie uit")}
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-5 text-muted-foreground">
                          {productName}
                        </DialogDescription>
                      </div>
                      <DialogClose className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="sr-only">Close</span>
                      </DialogClose>
                    </div>

                    <div className="flex flex-col gap-4">
                      {normalizedWarranty.defaultOption && (
                        <button
                          type="button"
                          onClick={() => setSelectedWarrantyId(normalizedWarranty.defaultOption?.id ?? "default")}
                          className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedWarrantyId === defaultWarrantyId ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/15' : 'border-amber-400 bg-amber-50/40 hover:bg-amber-50/70'}`}
                          aria-pressed={selectedWarrantyId === defaultWarrantyId}
                        >
                          <div className="flex items-start gap-2">
                            <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold leading-5 text-foreground">
                                {normalizedWarranty.defaultOption.name}
                              </h3>
                              <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                                {normalizedWarranty.defaultOption.description || getTrans("product.defaultWarrantyDescription", "Standard coverage included with this product.", "Standaarddekking inbegrepen bij dit product.")}
                              </p>
                              <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold leading-normal text-amber-600 underline underline-offset-2">
                                <DownloadIcon className="size-4" strokeWidth={1.8} />
                                {locale === "nl" ? "Downloaden als markdown" : "Download as markdown"}
                              </span>
                            </div>
                          </div>
                        </button>
                      )}

                      <div className="flex flex-col gap-4" role="group" aria-label={getTrans("product.chooseWarranty", "Choose Warranty", "Kies garantie")}>
                        {normalizedWarranty.types.map((type) => (
                          <section key={type.id || type.name} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {type.icon === "truck" ? (
                                  <TruckIcon className="size-4 text-amber-600" strokeWidth={2.2} />
                                ) : type.icon === "home" ? (
                                  <HomeIcon className="size-4 text-amber-600" strokeWidth={2.2} />
                                ) : type.icon ? (
                                  <InfoIcon className="size-4 text-amber-600" strokeWidth={2.2} />
                                ) : null}
                                <h3 className="text-base font-bold leading-5 text-foreground">{type.name}</h3>
                              </div>
                              {type.badgeText && (
                                <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium leading-none ${type.badgeColor === 'blue' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' : type.badgeColor === 'green' ? 'bg-green-50 text-green-700 ring-1 ring-green-100' : 'bg-muted text-muted-foreground ring-1 ring-border'}`}>
                                  {type.badgeText}
                                </span>
                              )}
                            </div>

                            {type.description && (
                              <p className="text-sm leading-5 text-muted-foreground">{type.description}</p>
                            )}

                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {type.options.map((option) => {
                                const optionId = `card-warranty-option-${option.id}`;
                                const isSelected = selectedWarrantyId == option.id;
                                return (
                                  <label
                                    key={option.id}
                                    htmlFor={optionId}
                                    className={`relative flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 pr-9 transition-all ${isSelected ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/15' : 'border-border bg-muted/40 hover:border-muted-foreground/30 hover:bg-muted/60'}`}
                                  >
                                    <Checkbox
                                      id={optionId}
                                      checked={isSelected}
                                      onCheckedChange={() => setSelectedWarrantyId(isSelected ? defaultWarrantyId : option.id)}
                                      className="absolute right-3 top-3 size-4 rounded bg-background text-white data-checked:border-amber-600 data-checked:bg-amber-600"
                                    />
                                    <div className="pr-2 text-sm font-bold leading-snug text-foreground">{option.name}</div>
                                    <div className={`text-xl font-bold leading-tight ${isSelected ? 'text-amber-600' : 'text-foreground'}`}>{formatWarrantyEuro(option.price)}</div>
                                    <div className="text-xs leading-5 text-muted-foreground">{option.description || getTrans("product.warrantyDescription", "Extended warranty coverage.", "Uitgebreide garantiedekking.")}</div>
                                  </label>
                                );
                              })}
                            </div>
                          </section>
                        ))}

                        {normalizedWarranty.oldOptions.length > 0 && (
                          <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                            <h3 className="text-base font-bold leading-5 text-foreground">{getTrans("product.additionalOptions", "Additional Options", "Extra opties")}</h3>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {normalizedWarranty.oldOptions.map((option) => {
                                const optionId = `card-warranty-option-${option.id}`;
                                const isSelected = selectedWarrantyId == option.id;
                                return (
                                  <label
                                    key={option.id}
                                    htmlFor={optionId}
                                    className={`relative flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 pr-9 transition-all ${isSelected ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/15' : 'border-border bg-muted/40 hover:border-muted-foreground/30 hover:bg-muted/60'}`}
                                  >
                                    <Checkbox
                                      id={optionId}
                                      checked={isSelected}
                                      onCheckedChange={() => setSelectedWarrantyId(isSelected ? defaultWarrantyId : option.id)}
                                      className="absolute right-3 top-3 size-4 rounded bg-background text-white data-checked:border-amber-600 data-checked:bg-amber-600"
                                    />
                                    <div className="pr-2 text-sm font-bold leading-snug text-foreground">{option.name}</div>
                                    <div className={`text-xl font-bold leading-tight ${isSelected ? 'text-amber-600' : 'text-foreground'}`}>{formatWarrantyEuro(option.price)}</div>
                                    <div className="text-xs leading-5 text-muted-foreground">{option.description || getTrans("product.warrantyDescription", "Extended warranty coverage.", "Uitgebreide garantiedekking.")}</div>
                                  </label>
                                );
                              })}
                            </div>
                          </section>
                        )}
                      </div>

                      <p className="text-xs leading-5 text-muted-foreground">
                        {getTrans("product.warrantyFooterText", "Extend your existing warranty with additional years. These options are only available for printers with an active warranty.", "Verleng uw bestaande garantie met extra jaren. Deze opties zijn alleen beschikbaar voor printers met een actieve garantie.")}
                      </p>
                    </div>
                  </div>

                  <Separator />
                  <div className="flex flex-col gap-2 bg-background/95 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => {
                        addProductWithWarranty(null);
                        setIsWarrantyPopoverOpen(false);
                      }}
                      className="h-8 w-full rounded-full px-4 text-sm font-semibold sm:w-auto"
                    >
                      {getTrans("product.noThanks", "No, thanks", "Nee bedankt")}
                    </Button>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                      {hasSelectedPaidWarranty ? (
                        <div className="flex items-baseline justify-between gap-2 whitespace-nowrap sm:flex-col sm:items-end sm:gap-0">
                          <span className="text-xs leading-tight text-muted-foreground">
                            {locale === "nl" ? "Garantie toevoegen:" : "Add warranty:"}
                          </span>
                          <span className="text-base font-bold leading-5 text-foreground">
                            +{formatWarrantyEuro(selectedWarrantyPrice)}
                          </span>
                        </div>
                      ) : null}
                      <Button
                        type="button"
                        size="default"
                        onClick={handleConfirmWarrantyAdd}
                        disabled={selectedWarrantyId == null}
                        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold sm:w-auto"
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.5l2.7 12.15a2.25 2.25 0 0 0 2.2 1.76h8.7a2.25 2.25 0 0 0 2.2-1.78l1.2-5.63H6.3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21a.75.75 0 1 0 0-1.5A.75.75 0 0 0 9 21Zm9 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12 5.25h4.5M14.25 3v4.5" />
                        </svg>
                        {t("product.addToCart")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              ) : null}
            </Dialog>
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
      productImage={normalizeText(productMainImage)}
      price={productPrice!}
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
