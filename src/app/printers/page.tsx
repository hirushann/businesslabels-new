import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import FinderListing from "@/components/FinderListing";

export const dynamic = "force-dynamic";
import ProductsListing from "@/components/ProductsListing";
import CTABanner from "@/components/CTABanner";
import {
  parseCatalogSearchParams,
  searchCatalogProducts,
} from "@/lib/search/products";
import {
  getPrinterById,
  parsePrinterSearchParams,
  searchPrinters,
  type FinderPrinterDetails,
} from "@/lib/search/printers";
import type { CatalogSearchResponse } from "@/lib/search/types";
import type { PrinterSearchResponse } from "@/lib/search/printerTypes";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("pages.finderMetadataTitle"),
    description: t("pages.finderMetadataDescription"),
  };
}

type FinderPageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(query: FinderPageSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  });
  return params;
}

const emptyPrinterCatalog: PrinterSearchResponse = {
  printers: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { options: [] },
};

const emptyProductCatalog: CatalogSearchResponse = {
  products: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { ranges: [], options: [] },
};

type TranslationFn = Awaited<ReturnType<typeof getTranslations>>;

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  )
    return trimmed;
  return `/api/media-proxy?url=${encodeURIComponent(trimmed)}`;
}

function flattenPropertyValues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return typeof value === "string" || typeof value === "number"
      ? [String(value)]
      : [];
  }

  return value.flatMap((item) => flattenPropertyValues(item));
}

function firstProperty(
  properties: Record<string, unknown> | undefined,
  keys: string[],
): string[] {
  if (!properties) return [];

  for (const key of keys) {
    const value = flattenPropertyValues(properties[key]);
    if (value.length) return value;
  }

  return [];
}

function numericParts(value: string): number[] {
  return Array.from(value.matchAll(/\d+(?:[,.]\d+)?/g))
    .map((match) => Number(match[0].replace(",", ".")))
    .filter((number) => Number.isFinite(number));
}

function formatMillimeterRange(
  min: number,
  max: number,
  t: TranslationFn,
): string {
  return `${t("finder.min")} ${min} mm, ${t("finder.max")} ${max} mm`;
}

function numberRangeLabel(values: string[], t: TranslationFn): string | null {
  const numbers = values
    .flatMap(numericParts)
    .filter((value) => Number.isFinite(value));

  if (numbers.length < 2) return null;

  return formatMillimeterRange(Math.min(...numbers), Math.max(...numbers), t);
}

function withMillimeterUnit(value: string): string {
  if (value.toLowerCase() === "fan-fold") return "Fan-fold";
  return /\bmm\b/i.test(value) ? value : `${value} mm`;
}

function PrinterSummary({
  printer,
  baselineCatalog,
  t,
}: {
  printer: FinderPrinterDetails;
  baselineCatalog?: CatalogSearchResponse;
  t: TranslationFn;
}) {
  const imageUrl = toDisplayImageUrl(printer.image);
  const properties = printer.properties;
  const printMethods = firstProperty(properties, ["printmethode", "druktype"]);
  const cores = firstProperty(properties, ["kern"]).map(withMillimeterUnit);

  if (baselineCatalog) {
    const hasFanFold = baselineCatalog.filters.options
      .find((f) => f.key === "kern_string")
      ?.options.some((o) => o.value.toLowerCase() === "fan-fold");

    if (hasFanFold && !cores.some((c) => c.toLowerCase() === "fan-fold")) {
      cores.push("Fan-fold");
    }
  }
  const minWidths = firstProperty(properties, [
    "label-breedte-min",
    "label_breedte_min",
  ]);
  const maxWidths = firstProperty(properties, [
    "label-breedte-max",
    "label_breedte_max",
  ]);
  const widthRange = firstProperty(properties, [
    "label-breedte",
    "label_breedte",
  ]);
  const widths = firstProperty(properties, ["breedte", "width"]);
  const maxOuterDiameter = firstProperty(properties, [
    "max-buiten-diameter",
    "max_buiten_diameter",
  ]);
  const parsedMinWidth = minWidths[0]
    ? numericParts(minWidths[0])[0]
    : undefined;
  const parsedMaxWidth = maxWidths[0]
    ? numericParts(maxWidths[0])[0]
    : undefined;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:min-h-64">
        {/* ── Left: Content (50%) ── */}
        <div className="flex-1 basis-1/2 p-6 flex flex-col">
          <h1 className="text-3xl font-bold leading-9 text-neutral-800">
            {printer.title}
          </h1>
          {printer.subtitle ? (
            <p className="mt-2 text-lg text-sky-600">{printer.subtitle}</p>
          ) : null}

          {printer.content ? (
            <div className="mt-4 rounded-lg">
              <div className="text-sm font-medium text-neutral-500">
                {t("product.productDescription")}
              </div>
              <div
                className="mt-2 text-sm leading-relaxed text-neutral-700 font-normal [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_a]:underline hover:[&_a]:text-[var(--brand-hover)] [&_a]:transition-colors"
                dangerouslySetInnerHTML={{ __html: printer.content }}
              />
            </div>
          ) : printer.excerpt ? (
            <div className="mt-4 rounded-lg">
              <div className="text-sm font-medium text-neutral-500">
                {t("product.productDescription")}
              </div>
              <div
                className="mt-2 text-sm leading-relaxed text-neutral-700 font-normal [&_p]:mb-2 [&_a]:text-brand [&_a]:underline hover:[&_a]:text-[var(--brand-hover)] [&_a]:transition-colors"
                dangerouslySetInnerHTML={{ __html: printer.excerpt }}
              />
            </div>
          ) : null}

          {properties ? (
            <div className="mt-2 pt-3">
              <h3 className="text-xl font-bold text-neutral-800">
                {t("finder.mediaSpecifications")}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {printMethods.length > 0 ? (
                  <SpecItem
                    label={t("finder.printTechnology")}
                    value={
                      printMethods.includes("TD") && printMethods.includes("TT")
                        ? "Thermal Direct & Thermal Transfer"
                        : printMethods.join(", ")
                    }
                  />
                ) : null}
                {cores.length > 0 ? (
                  <SpecItem label={t("finder.core")} value={cores.join(", ")} />
                ) : null}
                {parsedMinWidth != null && parsedMaxWidth != null ? (
                  <SpecItem
                    label={t("finder.mediaWidth")}
                    value={formatMillimeterRange(
                      parsedMinWidth,
                      parsedMaxWidth,
                      t,
                    )}
                  />
                ) : widthRange.length > 0 ? (
                  <SpecItem
                    label={t("finder.mediaWidth")}
                    value={
                      numberRangeLabel(widthRange, t) ?? widthRange.join(", ")
                    }
                  />
                ) : widths.length > 0 ? (
                  <SpecItem
                    label={t("finder.mediaWidth")}
                    value={numberRangeLabel(widths, t) ?? widths.join(", ")}
                  />
                ) : null}
                {maxOuterDiameter[0] ? (
                  <SpecItem
                    label={t("finder.maxOuterDiameter")}
                    value={withMillimeterUnit(maxOuterDiameter[0])}
                  />
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        {/* ── Right: Image (50%) ── */}
        {imageUrl ? (
          <div className="flex-1 basis-1/2 bg-slate-50 border-t border-slate-100 lg:border-t-0 lg:border-l lg:border-slate-100 flex items-center justify-center p-8 min-h-56 lg:min-h-0">
            <img
              src={imageUrl}
              alt={printer.title}
              className="w-full h-full max-h-80 object-contain"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  const cleanLabel = label.endsWith(":") ? label.slice(0, -1) : label;
  return (
    <li className="flex items-start gap-3">
      {/* Green checkmark circle icon */}
      <svg
        className="mt-0.5 shrink-0"
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="11"
          cy="11"
          r="10"
          stroke="#22c55e"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M7 11.5l2.5 2.5 5.5-5.5"
          stroke="#22c55e"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-base text-neutral-700">
        <span className="font-semibold text-neutral-800">{cleanLabel}:</span>{" "}
        {value}
      </span>
    </li>
  );
}

import { getServerLocale } from "@/lib/i18n";

export default async function PrintersPage({
  searchParams,
}: {
  searchParams: Promise<FinderPageSearchParams>;
}) {
  const t = await getTranslations();
  const locale = await getServerLocale();
  const rawParams = await searchParams;

  // If printer_id is present, show the products view
  if (rawParams.printer_id) {
    const printerId = Number.parseInt(
      firstQueryValue(rawParams.printer_id) ?? "",
      10,
    );
    const query = toUrlSearchParams(rawParams);
    let printer: FinderPrinterDetails | null = null;
    let initialCatalog = emptyProductCatalog;
    let baselineCatalog = emptyProductCatalog;

    if (Number.isFinite(printerId)) {
      const baselineQuery = new URLSearchParams();
      baselineQuery.set("printer_id", String(printerId));

      try {
        [printer, initialCatalog, baselineCatalog] = await Promise.all([
          getPrinterById(printerId, locale),
          searchCatalogProducts(parseCatalogSearchParams(query, locale)),
          searchCatalogProducts(
            parseCatalogSearchParams(baselineQuery, locale),
          ),
        ]);
        console.log(
          "[Finder Page] Server-side printer details loaded:",
          { params: rawParams, printer }
        );
      } catch (error) {
        console.error("Failed to load finder product catalog.", error);
      }
    }

    return (
      <section className="bg-slate-50 px-4 py-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-6">
          <Breadcrumbs
            items={[
              { label: t("finder.printerFinder"), href: "/printers" },
              { label: printer?.title || "Printer" },
            ]}
          />

          {printer ? (
            <PrinterSummary
              printer={printer}
              baselineCatalog={baselineCatalog}
              t={t}
            />
          ) : null}

          <ProductsListing
            initialCatalog={initialCatalog}
            initialQueryString={query.toString()}
            baselineCatalog={baselineCatalog}
            baselineRangeFilters={baselineCatalog.filters.ranges}
            printer={printer}
          />
        </div>
      </section>
    );
  }

  // Otherwise show the printer listing
  const query = toUrlSearchParams(rawParams);
  let initialCatalog = emptyPrinterCatalog;

  try {
    initialCatalog = await searchPrinters(
      parsePrinterSearchParams(query, locale),
    );
    // Log to local file for debugging
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'api-log.txt');
    const logEntry = `[${new Date().toISOString()}] PAGE RENDER - Query: ${query.toString()}\n` +
      `Printers: ${initialCatalog.printers.map(p => `${p.id}:${p.name}(featured:${p.featured})`).join(', ')}\n\n`;
    fs.appendFileSync(logPath, logEntry);

    console.log(
      `[Finder Page] Server-side initial catalog loaded (${initialCatalog.printers.length} printers):`,
      initialCatalog.printers,
    );
  } catch (error) {
    console.error("Failed to load printer catalog.", error);
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'api-log.txt');
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] PAGE RENDER ERROR: ${(error as any).message}\n\n`);
    } catch {}
  }

  return (
    <div className="bg-white">
      {/* ── Hero Banner ── */}
      <div className="px-4 pt-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px] mx-auto">
          <div
            className="relative overflow-hidden rounded-xl"
            style={{ height: "224px" }}
          >
            {/* Background image */}
            <Image
              src="/labelprinters.jpeg"
              alt="Label printers"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            {/* Dark overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.25) 100%)",
              }}
            />
            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col justify-center gap-4 px-6 py-6">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6L8 1.5L14 6V14H10V10H6V14H2V6Z"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className="text-sm"
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "Segoe UI, sans-serif",
                  }}
                >
                  /
                </span>
                <span
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "Segoe UI, sans-serif" }}
                >
                  Printers
                </span>
              </div>
              {/* Title */}
              <h1
                className="text-white font-bold"
                style={{
                  fontFamily: "Segoe UI, sans-serif",
                  fontSize: "40px",
                  lineHeight: "120%",
                }}
              >
                {t("finder.productFinder")}
              </h1>
              {/* Description */}
              <p
                className="text-white max-w-3xl"
                style={{
                  fontFamily: "Segoe UI, sans-serif",
                  fontSize: "18px",
                  lineHeight: "26px",
                  fontWeight: 400,
                }}
              >
                {t("finder.heroDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full">
          <FinderListing
            initialCatalog={initialCatalog}
            initialQueryString={query.toString()}
          />
        </div>
        
      </div>
      <CTABanner />
    </div>
  );
  
}
