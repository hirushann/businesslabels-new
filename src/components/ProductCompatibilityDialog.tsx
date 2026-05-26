'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import PrinterModelSelect, { type PrinterSearchResult } from '@/components/PrinterModelSelect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ProductCompatibilityDialogProps = {
  productId?: number | string | null;
  compatiblePrinterIds?: number[];
  productCategorySlugs?: string[];
  productMake?: string | null;
};

type CompatibilityResult = {
  compatible: boolean;
  printerName: string;
};

function normalizeId(value: number | string | null | undefined) {
  const number = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(number) ? Math.trunc(number) : null;
}

function hasId(ids: number[] | undefined, id: number | null) {
  return id !== null && Array.isArray(ids) && ids.includes(id);
}

function getCompatibleInkCategorySlugs(printerSlug: string): string[] {
  const slug = printerSlug.toLowerCase();
  if (slug.includes("cw-c8000")) {
    return ["inkt-cartridges-epson-cw-c8000", "inkt-cartridges-cw-c8000-bk", "inkt-cartridges-cw-c8000-mk"];
  }
  if (slug.includes("cw-c4000")) return ["inkt-epson-cw-c4000"];
  if (slug.includes("tm-c3500")) return ["inkt-cartridges-tm-c3500-nl"];
  if (slug.includes("tm-c7500g")) return ["inkt-cartridges-tm-c7500g-nl"];
  if (slug.includes("tm-c7500")) return ["inkt-cartridges-tm-c7500-nl"];
  if (slug.includes("cw-c6000") || slug.includes("cw-c6500")) return ["inkt-cartridges-cw-c6000-series"];
  if (slug.includes("gpc831") || slug.includes("gp-c831")) return ["inkt-cartridges-gp-c831"];
  if (slug.includes("tm-c3400")) return ["inkt-cartridges-tm-c3400"];
  if (slug.includes("cw-d6000") || slug.includes("cw-d6500")) return ["inkt-cartridges-cw-d6000-series"];
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

    return categorySlugs.includes("inkt-cartridges-nl")
      && inkSlugs.some((slug) => categorySlugs.includes(slug));
  }

  const compatibleBrands = [printerBrand, "Diamondlabels"].map(normalizeToken);

  return categorySlugs.includes("tt-printlinten-nl")
    && compatibleBrands.includes(normalizeToken(productMake));
}

export default function ProductCompatibilityDialog({
  productId,
  compatiblePrinterIds = [],
  productCategorySlugs = [],
  productMake = null,
}: ProductCompatibilityDialogProps) {
  const t = useTranslations();
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterSearchResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);

  const normalizedProductId = normalizeId(productId);

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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-amber-500 text-base font-semibold underline text-left">
          {t('compatibility.check')}
        </button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-neutral-800">{t('compatibility.check')}</DialogTitle>
          <DialogDescription>
            {t('compatibility.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-neutral-700" htmlFor="compatibility-printer">
              {t('compatibility.printerModel')}
            </label>
            <PrinterModelSelect
              key={selectedPrinter?.id ?? "empty-printer"}
              value={selectedPrinter}
              onValueChange={handlePrinterChange}
              inputId="compatibility-printer"
              placeholder={t('compatibility.searchPlaceholder')}
              className="w-full h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base font-semibold text-neutral-800 placeholder:font-medium focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
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
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-amber-500 px-6 text-sm font-black text-white transition-colors hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-60"
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
            <div className={`rounded-2xl border p-5 ${compatibilityResult.compatible ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
              <p className={`text-lg font-black ${compatibilityResult.compatible ? 'text-emerald-700' : 'text-red-700'}`}>
                {compatibilityResult.compatible ? t('compatibility.compatible') : t('compatibility.notCompatible')}
              </p>
              <p className={`mt-1 text-sm font-semibold ${compatibilityResult.compatible ? 'text-emerald-700' : 'text-red-600'}`}>
                {t('compatibility.resultForPrinter', { printer: compatibilityResult.printerName })}
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
