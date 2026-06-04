import { normalizeLocale } from "@/lib/i18n/config";
import { localePath, stripLocalePath } from "@/lib/i18n/utils";

export type PrinterCategoryKey =
  | "root"
  | "color"
  | "thermal"
  | "starterkits"
  | "consumables";

const printerCategoryRoutes: Record<"en" | "nl", Record<PrinterCategoryKey, string>> = {
  en: {
    root: "/product-category/labelprinters",
    color: "/product-category/labelprinters/color-labelprinters",
    thermal: "/product-category/labelprinters/thermal-labelprinters",
    starterkits: "/product-category/labelprinters/starterkits-2",
    consumables: "/product-category/labelprinters/consumables",
  },
  nl: {
    root: "/product-categorie/labelprinters",
    color: "/product-categorie/labelprinters/kleuren-labelprinters-nl",
    thermal: "/product-categorie/labelprinters/thermische-labelprinters-nl",
    starterkits: "/product-categorie/labelprinters/starterkits",
    consumables: "/product-categorie/labelprinters/verbruiksmaterialen-nl",
  },
};

function lastPathSegment(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? "";
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function getPrinterCategoryPath(
  locale: string,
  category: PrinterCategoryKey = "root",
): string {
  const normalizedLocale = normalizeLocale(locale);
  return localePath(printerCategoryRoutes[normalizedLocale][category], normalizedLocale);
}

export function getPrinterCategoryLookupSlug(slug: string): string {
  const decodedSlug = decodeURIComponent(slug);
  const category = getPrinterCategoryKeyBySlug(decodedSlug);
  return category ? lastPathSegment(printerCategoryRoutes.nl[category]) : decodedSlug;
}

export function getPrinterCategoryKeyBySlug(slug: string): PrinterCategoryKey | null {
  const decodedSlug = decodeURIComponent(slug);

  for (const category of Object.keys(printerCategoryRoutes.en) as PrinterCategoryKey[]) {
    const routeSlugs = [
      lastPathSegment(printerCategoryRoutes.en[category]),
      lastPathSegment(printerCategoryRoutes.nl[category]),
      ...(category === "starterkits" ? ["starterkits"] : []),
    ];

    if (routeSlugs.includes(decodedSlug)) {
      return category;
    }
  }

  return null;
}

export function getLocalizedPrinterCategoryPathForPath(
  pathname: string,
  locale: string,
): string | null {
  const cleanPath = normalizePath(stripLocalePath(pathname));
  const category = (Object.keys(printerCategoryRoutes.en) as PrinterCategoryKey[]).find((key) => {
    return (
      cleanPath === normalizePath(printerCategoryRoutes.en[key]) ||
      cleanPath === normalizePath(printerCategoryRoutes.nl[key])
    );
  });

  return category ? getPrinterCategoryPath(locale, category) : null;
}
