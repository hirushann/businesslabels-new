import { normalizeLocale } from "@/lib/i18n/config";
import { localePath, stripLocalePath } from "@/lib/i18n/utils";

export type AccessoryCategoryKey =
  | "root"
  | "reUnwinders"
  | "applicatorsDispensers"
  | "applicators"
  | "dispensers"
  | "printerAddOns"
  | "cutters"
  | "wifiBluetooth"
  | "cwC4000"
  | "miscellaneous"
  | "cables"
  | "maintenance"
  | "other";

const accessoryCategoryRoutes: Record<"en" | "nl", Record<AccessoryCategoryKey, string>> = {
  en: {
    root: "/product-category/labelprinters/accessories-1",
    reUnwinders: "/product-category/labelprinters/accessories-1/re-unwinders",
    applicatorsDispensers: "/product-category/labelprinters/accessories-1/applicators-and-dispensers",
    applicators: "/product-category/labelprinters/accessories-1/applicators",
    dispensers: "/product-category/labelprinters/accessories-1/dispenser",
    printerAddOns: "/product-category/labelprinters/accessories-1/printer-add-ons",
    cutters: "/product-category/labelprinters/accessories-1/cutters-en",
    wifiBluetooth: "/product-category/labelprinters/accessories-1/wifi-and-bluetooth-dongels",
    cwC4000: "/product-category/labelprinters/accessories-1/cw-c4000-accessories",
    miscellaneous: "/product-category/labelprinters/accessories-1/miscellaneous",
    cables: "/product-category/labelprinters/accessories-1/miscellaneous/cables",
    maintenance: "/product-category/labelprinters/accessories-1/miscellaneous/maintenance",
    other: "/product-category/labelprinters/accessories-1/miscellaneous/other",
  },
  nl: {
    root: "/product-categorie/labelprinters/accessoires",
    reUnwinders: "/product-categorie/labelprinters/accessoires/re-unwinders-nl",
    applicatorsDispensers: "/product-categorie/labelprinters/accessoires/applicatoren-en-dispensers",
    applicators: "/product-categorie/labelprinters/accessoires/applicatoren",
    dispensers: "/product-categorie/labelprinters/accessoires/dispenser-nl",
    printerAddOns: "/product-categorie/labelprinters/accessoires/printer-add-ons",
    cutters: "/product-categorie/labelprinters/accessoires/cutters",
    wifiBluetooth: "/product-categorie/labelprinters/accessoires/wifi-en-bluetooth-dongles",
    cwC4000: "/product-categorie/labelprinters/accessoires/cw-c4000-accessoires",
    miscellaneous: "/product-categorie/labelprinters/accessoires/diversen",
    cables: "/product-categorie/labelprinters/accessoires/diversen/kabels",
    maintenance: "/product-categorie/labelprinters/accessoires/diversen/onderhoud",
    other: "/product-categorie/labelprinters/accessoires/diversen/overig",
  },
};

const legacyAccessoryCategoryRoutes: Partial<Record<AccessoryCategoryKey, string[]>> = {
  root: ["/category/accessoires", "/category/accessories"],
  reUnwinders: ["/category/re-unwinders-nl"],
  applicatorsDispensers: ["/category/applicatoren", "/category/applicators"],
  applicators: ["/category/applicatoren", "/category/applicators"],
  printerAddOns: ["/category/accessoires"],
  miscellaneous: ["/category/diversen"],
};

export type AccessoryVirtualGroup = {
  key: "applicatorsDispensers" | "printerAddOns";
  title: Record<"en" | "nl", string>;
  parentKey: "root";
  childKeys: AccessoryCategoryKey[];
};

const accessoryVirtualGroups: AccessoryVirtualGroup[] = [
  {
    key: "applicatorsDispensers",
    title: {
      en: "Applicators and dispensers",
      nl: "Applicators en dispensers",
    },
    parentKey: "root",
    childKeys: ["applicators", "dispensers"],
  },
  {
    key: "printerAddOns",
    title: {
      en: "Printer add-ons",
      nl: "Printer add-ons",
    },
    parentKey: "root",
    childKeys: ["cutters", "wifiBluetooth", "cwC4000"],
  },
];

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function getAccessoryCategoryPath(
  locale: string,
  category: AccessoryCategoryKey = "root",
): string {
  const normalizedLocale = normalizeLocale(locale);
  return localePath(accessoryCategoryRoutes[normalizedLocale][category], normalizedLocale);
}

export function getLocalizedAccessoryCategoryPathForPath(
  pathname: string,
  locale: string,
): string | null {
  const cleanPath = normalizePath(stripLocalePath(pathname));
  const category = (Object.keys(accessoryCategoryRoutes.en) as AccessoryCategoryKey[]).find((key) => {
    return (
      cleanPath === normalizePath(accessoryCategoryRoutes.en[key]) ||
      cleanPath === normalizePath(accessoryCategoryRoutes.nl[key]) ||
      (legacyAccessoryCategoryRoutes[key] ?? []).some((path) => cleanPath === normalizePath(path))
    );
  });

  return category ? getAccessoryCategoryPath(locale, category) : null;
}

export function getAccessoryVirtualGroupForSegments(
  segments: string[],
  locale: string,
): AccessoryVirtualGroup | null {
  const normalizedLocale = normalizeLocale(locale);
  const cleanPath = normalizePath(`/${segments.map(decodeSegment).join("/")}`);

  return accessoryVirtualGroups.find((group) => {
    const path = stripLocalePath(getAccessoryCategoryPath(normalizedLocale, group.key));
    return cleanPath === normalizePath(path.replace(/^\/product-category\//, "/").replace(/^\/product-categorie\//, "/"));
  }) ?? null;
}

export function getAccessoryCategoryRouteSegments(
  locale: string,
  category: AccessoryCategoryKey,
): string[] {
  const normalizedLocale = normalizeLocale(locale);
  const cleanPath = stripLocalePath(accessoryCategoryRoutes[normalizedLocale][category]);
  return cleanPath.split("/").filter(Boolean).slice(1);
}

export function getAccessoryCategoryLookupSegmentsForSegments(
  segments: string[],
  locale: string,
): string[] | null {
  const normalizedLocale = normalizeLocale(locale);
  const cleanPath = normalizePath(`/${segments.map(decodeSegment).join("/")}`);
  const category = (Object.keys(accessoryCategoryRoutes[normalizedLocale]) as AccessoryCategoryKey[]).find((key) => {
    return cleanPath === normalizePath(`/${getAccessoryCategoryRouteSegments(normalizedLocale, key).join("/")}`);
  });

  return category ? getAccessoryCategoryRouteSegments("nl", category) : null;
}
