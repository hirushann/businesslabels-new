import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ProductsListing from "@/components/ProductsListing";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import PrinterActionButtons from "@/components/PrinterActionButtons";
import {
  parseCatalogSearchParams,
  searchCatalogProducts,
} from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";
import type { FinderPrinterDetails } from "@/lib/search/printers";
import type { Printer } from "@/lib/types/printer";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";

type PrinterResponse = {
  data: Printer;
};

type PrinterPageSearchParams = Record<string, string | string[] | undefined>;

type PrinterPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PrinterPageSearchParams>;
};

type TranslationFn = Awaited<ReturnType<typeof getTranslations>>;

const emptyProductCatalog: CatalogSearchResponse = {
  products: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { ranges: [], options: [] },
};

function toUrlSearchParams(query: PrinterPageSearchParams): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  });

  return params;
}

async function getPrinter(slug: string): Promise<Printer | null> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) return null;

  try {
    const locale = await getServerLocale();
    const response = await fetch(
      withLocaleParam(`${baseUrl}/api/printers/slug/${slug}`, locale),
      { cache: "no-store" },
    );

    if (!response.ok) return null;

    const json = (await response.json()) as PrinterResponse;
    return json.data;
  } catch (error) {
    console.error("Error fetching printer:", error);
    return null;
  }
}

function toFinderPrinter(printer: Printer): FinderPrinterDetails {
  return {
    id: printer.id,
    title: printer.title ?? "",
    subtitle: printer.subtitle,
    slug: printer.slug ?? "",
    image: printer.image ?? printer.thumbnail,
    properties: printer.properties as Record<string, string[]>,
    excerpt: printer.excerpt,
    content: printer.content,
    created_at: printer.created_at,
    updated_at: printer.updated_at,
    product_url: printer.product_url ?? null,
  };
}

export async function generateMetadata({
  params,
}: Pick<PrinterPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const printer = await getPrinter(slug);

  if (!printer) {
    return {
      title: "Printer — Businesslabels",
    };
  }

  return {
    title: `${printer.title} — Businesslabels`,
    description: printer.subtitle || undefined,
  };
}

function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
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

function SpecItem({ label, value }: { label: string; value: string }) {
  const cleanLabel = label.endsWith(":") ? label.slice(0, -1) : label;

  return (
    <li className="flex items-start gap-3">
      {/* <svg
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
      </svg> */}
      <span className="text-base text-neutral-700">
        <span className="font-normal text-copy">{cleanLabel}:</span>{" "}
        <span className="font-bold text-base text-copy">{value}</span>
      </span>
    </li>
  );
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
      .find((filter) => filter.key === "kern_string")
      ?.options.some((option) => option.value.toLowerCase() === "fan-fold");

    if (hasFanFold && !cores.some((core) => core.toLowerCase() === "fan-fold")) {
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

  const productUrls = firstProperty(properties, [
    "product_url",
    "product-url",
    "printer_url",
    "printer-url",
  ]);
  const productUrl = printer.product_url || productUrls[0] || (properties as any)?.printer_url || (properties as any)?.product_url || null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col lg:min-h-64 lg:flex-row">
        <div className="flex flex-1 basis-1/2 flex-col p-6">
          <h1 className=" text-[34px] font-semibold leading-[48px] text-neutral-800">
            {printer.title}
          </h1>
          {printer.subtitle ? (
            <p className="mt-2 text-lg text-sky-600">{printer.subtitle}</p>
          ) : null}

          {printer.content ? (
            <div className="mt-4 rounded-lg">
              {/* <div className="text-sm font-medium text-neutral-500">
                {t("product.productDescription")}
              </div> */}
              <div
                className="mt-2 text-base font-normal leading-relaxed text-neutral-700 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-brand [&_a]:underline hover:[&_a]:text-[var(--brand-hover)] [&_a]:transition-colors"
                dangerouslySetInnerHTML={{ __html: printer.content }}
              />
            </div>
          ) : printer.excerpt ? (
            <div className="mt-4 rounded-lg">
              <div className="text-sm font-medium text-neutral-500">
                {t("product.productDescription")}
              </div>
              <div
                className="mt-2 text-base font-normal leading-relaxed text-neutral-700 [&_p]:mb-2 [&_a]:text-brand [&_a]:underline hover:[&_a]:text-[var(--brand-hover)] [&_a]:transition-colors"
                dangerouslySetInnerHTML={{ __html: printer.excerpt }}
              />
            </div>
          ) : null}

          {properties ? (
            <div className="mt-6 pt-6 border-t border-line">
              <h3 className="text-xl font-semibold text-neutral-800">
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
              <PrinterActionButtons printer={printer} productUrl={productUrl} />
            </div>
          ) : null}
        </div>

        {imageUrl ? (
          <div className="flex min-h-56 flex-1 basis-1/2 items-center justify-center border-t border-slate-100 bg-slate-50 p-8 lg:min-h-0 lg:border-l lg:border-t-0 lg:border-slate-100">
            <img
              src={imageUrl}
              alt={printer.title}
              className="h-full max-h-80 w-full object-contain"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default async function PrinterFinderDetailPage({
  params,
  searchParams,
}: PrinterPageProps) {
  const { slug } = await params;
  const t = await getTranslations();
  const locale = await getServerLocale();
  const apiPrinter = await getPrinter(slug);

  if (!apiPrinter) {
    notFound();
  }

  const printer = toFinderPrinter(apiPrinter);
  const routeQuery = toUrlSearchParams(await searchParams);
  const printerId = String(printer.id);
  routeQuery.delete("printer_id");

  const scopedQuery = new URLSearchParams(routeQuery);
  scopedQuery.set("printer_id", printerId);

  const baselineQuery = new URLSearchParams();
  baselineQuery.set("printer_id", printerId);

  let initialCatalog = emptyProductCatalog;
  let baselineCatalog = emptyProductCatalog;

  try {
    [initialCatalog, baselineCatalog] = await Promise.all([
      searchCatalogProducts(parseCatalogSearchParams(scopedQuery, locale)),
      searchCatalogProducts(parseCatalogSearchParams(baselineQuery, locale)),
    ]);
  } catch (error) {
    console.error("Failed to load printer finder product catalog.", error);
  }

  return (
    <section className="bg-slate-50 px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-360 flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: t("finder.printerFinder"), href: "/printers" },
            { label: printer.title || "Printer" },
          ]}
        />

        <PrinterSummary
          printer={printer}
          baselineCatalog={baselineCatalog}
          t={t}
        />

        <ProductsListing
          initialCatalog={initialCatalog}
          initialQueryString={routeQuery.toString()}
          scopeQueryString={baselineQuery.toString()}
          baselineCatalog={baselineCatalog}
          baselineRangeFilters={baselineCatalog.filters.ranges}
          printer={printer}
        />
      </div>
    </section>
  );
}
