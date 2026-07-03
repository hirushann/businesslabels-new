'use client';

import { useMemo, useRef, useState } from 'react';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

import PrinterModelSelect, { type PrinterSearchResult } from '@/components/PrinterModelSelect';
import type { ProductRouteType } from '@/components/ProductCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { buildCartItemKey, useCart } from '@/components/CartProvider';
import { toDisplayImageUrl } from '@/lib/utils/imageProxy';
import { getPrinterPath } from '@/lib/routes/printers';
import type { ProductWarrantyData } from '@/components/ProductCard';
import { normalizeWarrantyOptions, type NormalizedWarrantyOption as WarrantyOption } from '@/lib/warranty/localize';
import WarrantyDialogContent from '@/components/WarrantyDialogContent';

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
  const warrantyDialogHandledRef = useRef(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterSearchResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);

  const normalizedProductId = normalizeId(productId);
  const normalizedProductType = normalizeProductRouteType(productType);
  const normalizedWarranty = useMemo(() => normalizeWarrantyOptions(warranty, locale), [warranty, locale]);
  const hasWarrantyOptions = Boolean(normalizedWarranty.defaultOption) || normalizedWarranty.types.length > 0 || normalizedWarranty.oldOptions.length > 0;

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
            typeName: selectedOption.typeName,
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
      setOpen(false);
      warrantyDialogHandledRef.current = false;
      setIsWarrantyDialogOpen(true);
      return;
    }

    addProductWithWarranty(null);
  };

  const handleWarrantyDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      warrantyDialogHandledRef.current = false;
      setIsWarrantyDialogOpen(true);
      return;
    }

    setIsWarrantyDialogOpen(false);

    if (!warrantyDialogHandledRef.current) {
      warrantyDialogHandledRef.current = true;
      addProductWithWarranty(null);
    }
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
    <Dialog open={isWarrantyDialogOpen} onOpenChange={handleWarrantyDialogOpenChange}>
      {hasWarrantyOptions ? (
        <WarrantyDialogContent
          open={isWarrantyDialogOpen}
          productName={productName ?? ""}
          warranty={normalizedWarranty}
          title={t.has("product.chooseWarranty") ? t("product.chooseWarranty") : locale === "nl" ? "Breid uw garantie uit" : "Extend Your Warranty"}
          defaultWarrantyDescription={locale === "nl" ? "Standaarddekking inbegrepen bij dit product." : "Standard coverage included with this product."}
          downloadLabel={locale === "nl" ? "Downloaden als markdown" : "Download as markdown"}
          groupLabel={t.has("product.chooseWarranty") ? t("product.chooseWarranty") : locale === "nl" ? "Breid uw garantie uit" : "Extend Your Warranty"}
          warrantyDescription={locale === "nl" ? "Uitgebreide garantiedekking." : "Extended warranty coverage."}
          additionalOptionsLabel={locale === "nl" ? "Extra opties" : "Additional Options"}
          footerText={locale === "nl" ? "Verleng uw bestaande garantie met extra jaren. Deze opties zijn alleen beschikbaar voor printers met een actieve garantie." : "Extend your existing warranty with additional years. These options are only available for printers with an active warranty."}
          noThanksLabel={locale === "nl" ? "Nee bedankt" : "No, thanks"}
          addWarrantyLabel={locale === "nl" ? "Garantie toevoegen:" : "Add warranty:"}
          selectWarrantyLabel={locale === "nl" ? "Selecteer een garantie" : "Select a Warranty"}
          addToCartLabel={t('product.addToCart')}
          onSkip={() => {
            warrantyDialogHandledRef.current = true;
            addProductWithWarranty(null);
          }}
          onConfirm={(selectedOption) => {
            warrantyDialogHandledRef.current = true;
            addProductWithWarranty(selectedOption);
          }}
        />
      ) : null}
    </Dialog>
    </>
  );
}
