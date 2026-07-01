'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { DownloadIcon, HomeIcon, InfoIcon, Loader2, ShoppingCart, TruckIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

import PrinterModelSelect, { type PrinterSearchResult } from '@/components/PrinterModelSelect';
import type { ProductRouteType } from '@/components/ProductCard';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { buildCartItemKey, useCart } from '@/components/CartProvider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toDisplayImageUrl } from '@/lib/utils/imageProxy';
import { getPrinterPath } from '@/lib/routes/printers';
import type { ProductWarrantyData } from '@/components/ProductCard';

type ProductCompatibilityDialogProps = {
  productId?: number | string | null;
  compatiblePrinterIds?: number[];
  productCategorySlugs?: string[];
  productMake?: string | null;
  productName?: string | null;
  productImage?: string | null;
  productSku?: string | null;
  productSlug?: string | null;
  productType?: string | null;
  productPrice?: number | null;
  packingGroup?: number | null;
  allowSingulars?: boolean | null;
  warranty?: ProductWarrantyData | null;
};

type CompatibilityResult = {
  compatible: boolean;
  printerName: string;
};

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

function normalizeId(value: number | string | null | undefined) {
  const number = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(number) ? Math.trunc(number) : null;
}

function normalizeProductRouteType(value: string | null | undefined): ProductRouteType | null {
  if (value === "simple" || value === "variable" || value === "group_product") {
    return value;
  }

  return null;
}

function hasId(ids: number[] | undefined, id: number | null) {
  return id !== null && Array.isArray(ids) && ids.includes(id);
}

function getCompatibleInkCategorySlugs(printerSlug: string): string[] {
  const slug = printerSlug.toLowerCase();
  if (slug.includes("cw-c8000")) {
    return [
      "inkt-cartridges-epson-cw-c8000",
      "inkt-cartridges-cw-c8000-bk",
      "inkt-cartridges-cw-c8000-mk",
      "maintenance-box-tm-c7500"
    ];
  }
  if (slug.includes("cw-c4000")) {
    return ["inkt-epson-cw-c4000", "maintenance-box-epson-cw-c4000"];
  }
  if (slug.includes("tm-c3500")) {
    return ["inkt-cartridges-tm-c3500-nl", "maintenance-box-tm-c3500"];
  }
  if (slug.includes("tm-c7500g")) {
    return ["inkt-cartridges-tm-c7500g-nl", "maintenance-box-tm-c7500"];
  }
  if (slug.includes("tm-c7500")) {
    return ["inkt-cartridges-tm-c7500-nl", "maintenance-box-tm-c7500"];
  }
  if (slug.includes("cw-c6000") || slug.includes("cw-c6500")) {
    return ["inkt-cartridges-cw-c6000-series", "maintenance-box-cw-c6000-series"];
  }
  if (slug.includes("gpc831") || slug.includes("gp-c831")) {
    return ["inkt-cartridges-gp-c831"];
  }
  if (slug.includes("tm-c3400")) {
    return ["inkt-cartridges-tm-c3400"];
  }
  if (slug.includes("cw-d6000") || slug.includes("cw-d6500")) {
    return ["inkt-cartridges-cw-d6000-series", "maintenance-box-cw-c6000-series"];
  }
  return [];
}

function getPrinterBrandFromSlug(printerSlug: string): string | null {
  const slug = printerSlug.toLowerCase();
  if (slug.startsWith("godex-")) return "Godex";
  if (slug.startsWith("zebra-")) return "Zebra";
  if (slug.startsWith("epson-")) return "Epson";
  if (slug.startsWith("citizen-")) return "Citizen";
  if (slug.startsWith("tsc-")) return "TSC";
  if (slug.startsWith("honeywell-")) return "Honeywell";
  if (slug.startsWith("metapace-")) return "Metapace";
  if (slug.startsWith("seiko-")) return "Seiko";
  if (slug.startsWith("primera-") || slug.startsWith("dtm-")) return "Primera";
  return null;
}

function normalizeToken(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function hasFinderFallbackCompatibility(
  printer: PrinterSearchResult,
  productCategorySlugs: string[],
  productMake?: string | null,
) {
  const categorySlugs = productCategorySlugs.map((slug) => slug.toLowerCase());
  const printerSlug = printer.slug ?? "";
  const printerBrand = getPrinterBrandFromSlug(printerSlug) ?? printer.brand;

  if (normalizeToken(printerBrand) === "epson") {
    const inkSlugs = getCompatibleInkCategorySlugs(printerSlug);

    return (categorySlugs.includes("inkt-cartridges-nl") || categorySlugs.includes("maintenance-boxen-nl"))
      && inkSlugs.some((slug) => categorySlugs.includes(slug));
  }

  const compatibleBrands = [printerBrand, "Diamondlabels"].map(normalizeToken);

  return categorySlugs.includes("tt-printlinten-nl")
    && compatibleBrands.includes(normalizeToken(productMake));
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
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeHexColor(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }

  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : null;
}

function hexToRgba(hexColor: string, alpha: number): string {
  const cleanHex = hexColor.replace("#", "");
  const r = Number.parseInt(cleanHex.slice(0, 2), 16);
  const g = Number.parseInt(cleanHex.slice(2, 4), 16);
  const b = Number.parseInt(cleanHex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getWarrantyBadgeStyle(color: string): CSSProperties | undefined {
  const hexColor = normalizeHexColor(color);
  if (!hexColor) return undefined;

  return {
    backgroundColor: hexToRgba(hexColor, 0.1),
    borderColor: hexToRgba(hexColor, 0.25),
    color: hexColor,
  };
}

function getWarrantyBadgeClass(color: string): string {
  if (normalizeHexColor(color)) {
    return "border";
  }

  if (color === "blue") {
    return "bg-blue-50 text-blue-600 ring-1 ring-blue-100";
  }

  if (color === "green") {
    return "bg-green-50 text-green-700 ring-1 ring-green-100";
  }

  return "bg-muted text-muted-foreground ring-1 ring-border";
}

function normalizeWarrantyOptions(warranty: ProductWarrantyData | null | undefined, locale: string) {
  const defaultOption = warranty?.default_option ? {
    id: warranty.default_option.warranty_option_id ?? "default",
    name: warranty.default_option.name || "Warranty",
    durationMonths: warranty.default_option.duration_years ? warranty.default_option.duration_years * 12 : 0,
    price: warranty.default_option.price || 0,
    description: warranty.default_option.description || "",
  } : null;

  let types: NormalizedWarrantyType[] = (warranty?.types || []).map((type) => ({
    id: type.id,
    name: type.name || "",
    description: type.description || "",
    icon: type.icon || "",
    badgeText: type.badge_text || "",
    badgeColor: type.badge_color || "",
    options: (type.options || []).map((option) => ({
      id: option.warranty_option_id ?? option.id ?? option.cart?.warranty_option_id ?? 0,
      name: option.name || "Warranty",
      durationMonths: option.duration_years ? option.duration_years * 12 : 0,
      price: option.price || 0,
      description: option.description || (option.duration_years ? (locale === "nl" ? `${option.duration_years * 12} maanden dekking` : `${option.duration_years * 12} months coverage`) : (locale === "nl" ? "Uitgebreide dekking" : "Extended coverage")),
    })),
  }));

  const oldOptions: WarrantyOption[] = (warranty?.options || []).map((option) => ({
    id: option.id,
    name: option.name || "Warranty",
    durationMonths: option.duration_months || 0,
    price: option.price || 0,
    description: option.description || (option.duration_months ? (locale === "nl" ? `${option.duration_months} maanden dekking` : `${option.duration_months} months coverage`) : (locale === "nl" ? "Uitgebreide dekking" : "Extended coverage")),
    sortOrder: option.sort_order || 0,
  })).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (types.length === 0 && oldOptions.length > 0) {
    types = [{
      id: "legacy",
      name: locale === "nl" ? "Garantie Opties" : "Extended Warranty",
      description: locale === "nl" ? "Verleng de dekking van uw printer." : "Extend your printer coverage.",
      icon: "shield-check",
      badgeText: "",
      badgeColor: "",
      options: oldOptions,
    }];
  }

  let allOptions = types.flatMap((type) => type.options);
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

export default function ProductCompatibilityDialog({
  productId,
  compatiblePrinterIds = [],
  productCategorySlugs = [],
  productMake = null,
  productName = null,
  productImage = null,
  productSku = null,
  productSlug = null,
  productType = null,
  productPrice = null,
  packingGroup = null,
  allowSingulars = null,
  warranty = null,
}: ProductCompatibilityDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { addItem, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const [isWarrantyDialogOpen, setIsWarrantyDialogOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterSearchResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);

  const normalizedProductId = normalizeId(productId);
  const normalizedProductType = normalizeProductRouteType(productType);
  const normalizedWarranty = useMemo(() => normalizeWarrantyOptions(warranty, locale), [warranty, locale]);
  const defaultWarrantyId = normalizedWarranty.defaultOption?.id ?? null;
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | string | null>(
    defaultWarrantyId,
  );
  const hasWarrantyOptions = Boolean(normalizedWarranty.defaultOption) || normalizedWarranty.types.length > 0 || normalizedWarranty.oldOptions.length > 0;
  const selectedWarrantyOption = normalizedWarranty.allOptions.find(
    (option) => option.id === selectedWarrantyId,
  ) ?? (selectedWarrantyId === defaultWarrantyId ? normalizedWarranty.defaultOption : null);
  const selectedWarrantyPrice =
    selectedWarrantyOption && typeof selectedWarrantyOption.price === "number" && Number.isFinite(selectedWarrantyOption.price)
      ? selectedWarrantyOption.price
      : 0;
  const hasSelectedPaidWarranty = selectedWarrantyPrice > 0;

  const handlePrinterChange = (printer: PrinterSearchResult | null) => {
    setSelectedPrinter(printer);
    setCompatibilityResult(null);
  };

  const handleCheckCompatibility = () => {
    if (!selectedPrinter || normalizedProductId === null || isChecking) {
      return;
    }

    setIsChecking(true);
    setCompatibilityResult(null);

    window.setTimeout(() => {
      const normalizedPrinterId = normalizeId(selectedPrinter.id);
      const productMatchedFromPrinter = hasId(selectedPrinter.productIds, normalizedProductId);
      const printerMatchedFromProduct = hasId(compatiblePrinterIds, normalizedPrinterId);
      const finderFallbackMatched = hasFinderFallbackCompatibility(
        selectedPrinter,
        productCategorySlugs,
        productMake,
      );

      setCompatibilityResult({
        compatible: productMatchedFromPrinter || printerMatchedFromProduct || finderFallbackMatched,
        printerName: selectedPrinter.name,
      });
      setIsChecking(false);
    }, 0);
  };

  const addProductWithWarranty = (selectedOption: WarrantyOption | null) => {
    if (!productId && !productSku) return;

    addItem(
      {
        id: productId ?? productSku ?? "",
        slug: productSlug,
        type: normalizedProductType,
        name: productName ?? "",
        sku: productSku ?? "",
        price: productPrice,
        mainImage: productImage,
        packingGroup: packingGroup ? Math.floor(Number(packingGroup)) : undefined,
        allowSingulars: allowSingulars != null ? Boolean(allowSingulars) : undefined,
      },
      1
    );

    const warrantyPrice =
      selectedOption && typeof selectedOption.price === "number" && Number.isFinite(selectedOption.price)
        ? selectedOption.price
        : 0;

    if (selectedOption && warrantyPrice > 0) {
      const parentKey = buildCartItemKey({
        id: productId ?? productSku ?? "",
        slug: productSlug,
        type: normalizedProductType,
      });
      const warrantyName = selectedOption.name || `${productName ?? ""} Extended Warranty`;

      addItem(
        {
          id: `warranty-${parentKey}-${selectedOption.id}`,
          name: warrantyName,
          sku: `${productSku ?? ""}-WARRANTY`,
          price: warrantyPrice,
          mainImage: productImage,
          itemKind: "warranty",
          linkedToKey: parentKey,
          packingGroup: packingGroup ? Math.floor(Number(packingGroup)) : undefined,
          allowSingulars: allowSingulars != null ? Boolean(allowSingulars) : undefined,
          warranty: {
            optionId: Number(selectedOption.id),
            durationMonths: selectedOption.durationMonths,
            parentSku: productSku,
            parentName: productName,
          },
        },
        1,
      );
    }

    setOpen(false);
    setIsWarrantyDialogOpen(false);
    openCart();
  };

  const handleAddToCart = () => {
    if (!productId && !productSku) return;

    if (hasWarrantyOptions) {
      setSelectedWarrantyId((currentId) => currentId ?? defaultWarrantyId);
      setOpen(false);
      setIsWarrantyDialogOpen(true);
      return;
    }

    addProductWithWarranty(null);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-amber-500 text-base font-semibold underline text-left">
          {t('compatibility.check')}
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] w-[min(calc(100vw-2rem),40rem)] max-w-none overflow-y-auto overflow-x-hidden p-0"
      >
        <div className="flex w-full min-w-0 flex-col gap-5 p-5 sm:p-6">
        <DialogHeader className="min-w-0 pr-10">
          <DialogTitle className="text-2xl font-black leading-tight text-neutral-800 sm:text-3xl">{t('compatibility.check')}</DialogTitle>
          <DialogDescription className="text-base leading-6 text-neutral-600">
            {t('compatibility.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-full min-w-0 flex-col gap-5">
          <div className="flex w-full min-w-0 flex-col gap-2">
            <label className="text-sm font-bold text-neutral-700" htmlFor="compatibility-printer">
              {t('compatibility.printerModel')}
            </label>
            <PrinterModelSelect
              key={selectedPrinter?.id ?? "empty-printer"}
              value={selectedPrinter}
              onValueChange={handlePrinterChange}
              inputId="compatibility-printer"
              placeholder={t('compatibility.searchPlaceholder')}
              className="h-12 w-full min-w-0 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
              autoFocus
            />
            {!selectedPrinter ? (
              <p className="text-xs font-semibold text-neutral-400">{t('compatibility.hint')}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleCheckCompatibility}
            disabled={normalizedProductId === null || !selectedPrinter || isChecking}
            className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full bg-amber-500 px-6 text-sm font-black text-white transition-colors hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-60"
          >
            {isChecking ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('compatibility.checking')}
              </>
            ) : (
              t('compatibility.check')
            )}
          </button>

          {compatibilityResult ? (
            <div className="flex w-full min-w-0 flex-col gap-4">
              <div className={`w-full min-w-0 rounded-2xl border p-4 sm:p-5 ${compatibilityResult.compatible ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
                <p className={`text-lg font-black ${compatibilityResult.compatible ? 'text-emerald-700' : 'text-red-700'}`}>
                  {compatibilityResult.compatible ? t('compatibility.compatible') : t('compatibility.notCompatible')}
                </p>
                <p className={`mt-1 break-words text-sm font-semibold ${compatibilityResult.compatible ? 'text-emerald-700' : 'text-red-600'}`}>
                  {t('compatibility.resultForPrinter', { printer: compatibilityResult.printerName })}
                </p>
              </div>

              {!compatibilityResult.compatible && selectedPrinter?.id && (
                <div className="mt-2 text-left">
                  <Link
                    href={getPrinterPath(locale, selectedPrinter.slug)}
                    onClick={() => setOpen(false)}
                    className="inline-block text-amber-500 hover:text-amber-600 font-bold text-sm underline transition-colors cursor-pointer"
                  >
                    {t('compatibility.seeFittingLabels')}
                  </Link>
                </div>
              )}

              {compatibilityResult.compatible && (
                <div className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-amber-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {productImage ? (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                        <Image
                          src={toDisplayImageUrl(productImage) || ""}
                          alt={productName ?? ""}
                          width={64}
                          height={64}
                          className="h-full w-full object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h4 className="line-clamp-2 text-sm font-bold leading-snug text-neutral-800">
                        {productName}
                      </h4>
                      {productSku && (
                        <span className="text-xs text-neutral-400 font-medium">
                          SKU: {productSku}
                        </span>
                      )}
                      {typeof productPrice === 'number' && productPrice > 0 && (
                        <span className="text-sm font-extrabold text-neutral-900">
                          {formatEuro(productPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-amber-500 px-5 text-xs font-black text-white shadow-sm transition-all duration-200 hover:bg-amber-600 hover:shadow-md active:scale-95 sm:w-auto"
                  >
                    <ShoppingCart className="size-3.5" />
                    {t('product.addToCart')}
                  </button>
                </div>
              )}
            </div>
          ) : null}

        </div>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={isWarrantyDialogOpen} onOpenChange={setIsWarrantyDialogOpen}>
      {hasWarrantyOptions ? (
        <DialogContent className="w-[calc(100vw-1rem)] max-w-xl gap-0 overflow-hidden bg-background p-0 text-foreground shadow-xl sm:max-w-xl sm:rounded-2xl" showCloseButton={false}>
          <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="mb-1 text-xl font-bold leading-tight text-foreground sm:text-2xl">
                  {t.has("product.chooseWarranty") ? t("product.chooseWarranty") : locale === "nl" ? "Kies garantie" : "Choose Warranty"}
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
                        {normalizedWarranty.defaultOption.description || (locale === "nl" ? "Standaarddekking inbegrepen bij dit product." : "Standard coverage included with this product.")}
                      </p>
                      <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold leading-normal text-amber-600 underline underline-offset-2">
                        <DownloadIcon className="size-4" strokeWidth={1.8} />
                        {locale === "nl" ? "Downloaden als markdown" : "Download as markdown"}
                      </span>
                    </div>
                  </div>
                </button>
              )}

              <div className="flex flex-col gap-4" role="group" aria-label={t.has("product.chooseWarranty") ? t("product.chooseWarranty") : locale === "nl" ? "Kies garantie" : "Choose Warranty"}>
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
                        <span
                          className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium leading-none ${getWarrantyBadgeClass(type.badgeColor)}`}
                          style={getWarrantyBadgeStyle(type.badgeColor)}
                        >
                          {type.badgeText}
                        </span>
                      )}
                    </div>

                    {type.description && (
                      <p className="text-sm leading-5 text-muted-foreground">{type.description}</p>
                    )}

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {type.options.map((option) => {
                        const optionId = `compat-warranty-option-${option.id}`;
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
                            <div className="text-xs leading-5 text-muted-foreground">{option.description || (locale === "nl" ? "Uitgebreide garantiedekking." : "Extended warranty coverage.")}</div>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}

                {normalizedWarranty.oldOptions.length > 0 && (
                  <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                    <h3 className="text-base font-bold leading-5 text-foreground">
                      {locale === "nl" ? "Extra opties" : "Additional Options"}
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {normalizedWarranty.oldOptions.map((option) => {
                        const optionId = `compat-warranty-option-${option.id}`;
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
                            <div className="text-xs leading-5 text-muted-foreground">{option.description || (locale === "nl" ? "Uitgebreide garantiedekking." : "Extended warranty coverage.")}</div>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                {locale === "nl" ? "Verleng uw bestaande garantie met extra jaren. Deze opties zijn alleen beschikbaar voor printers met een actieve garantie." : "Extend your existing warranty with additional years. These options are only available for printers with an active warranty."}
              </p>
            </div>
          </div>

          <Separator />
          <div className="flex flex-col gap-2 bg-background/95 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => addProductWithWarranty(null)}
                className="h-8 w-full rounded-full px-4 text-sm font-semibold sm:w-auto"
              >
                {locale === "nl" ? "Nee bedankt" : "No, thanks"}
              </Button>
            </div>
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
                onClick={() => addProductWithWarranty(selectedWarrantyOption ?? null)}
                disabled={selectedWarrantyId == null}
                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-amber-500 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:bg-amber-500 disabled:text-white disabled:opacity-50 sm:w-auto"
              >
                <ShoppingCart className="size-4" />
                {t('product.addToCart')}
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
    </>
  );
}
