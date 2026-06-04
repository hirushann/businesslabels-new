import { normalizeLocale } from "@/lib/i18n/config";
import { localePath, stripLocalePath } from "@/lib/i18n/utils";

export type LabelCategoryKey =
  | "root"
  | "inkjet"
  | "thermalDirect"
  | "thermalTransfer"
  | "applications"
  | "shippingLabels"
  | "visitorBadges"
  | "jewelryLabels";

const labelCategoryRoutes: Record<"en" | "nl", Record<LabelCategoryKey, string>> = {
  en: {
    root: "/product-category/labels-en-tickets-en",
    inkjet: "/product-category/labels-en-tickets-en/inkjet-printer-media",
    thermalDirect: "/product-category/labels-en-tickets-en/thermal-direct-printer-media",
    thermalTransfer: "/product-category/labels-en-tickets-en/thermal-transfer-printer-media",
    applications: "/product-category/labels-en-tickets-en/applications",
    shippingLabels: "/product-category/labels-en-tickets-en/thermal-direct-printer-media/shipping-labels",
    visitorBadges: "/product-category/labels-en-tickets-en/inkjet-printer-media/visitors-badges",
    jewelryLabels: "/product-category/jewellery-labels",
  },
  nl: {
    root: "/product-categorie/labels-en-tickets",
    inkjet: "/product-categorie/labels-en-tickets/inkjet-printer-media",
    thermalDirect: "/product-categorie/labels-en-tickets/thermal-direct",
    thermalTransfer: "/product-categorie/labels-en-tickets/thermal-transfer",
    applications: "/product-categorie/labels-en-tickets/toepassingen",
    shippingLabels: "/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten",
    visitorBadges: "/product-categorie/labels-en-tickets/inkjet-printer-media/bezoekersbadges",
    jewelryLabels: "/product-categorie/labels-en-tickets/thermal-transfer/juweliersetiketten-thermische-overdracht-printer-media",
  },
};

const legacyLabelCategoryRoutes: Partial<Record<LabelCategoryKey, string[]>> = {
  root: ["/category/labels-en-tickets", "/category/labels-en-tickets-en"],
  inkjet: ["/category/inkjet-printer-media"],
  thermalDirect: ["/category/thermisch-directe-printer-media"],
  thermalTransfer: ["/category/thermische-overdracht-printer-media"],
};

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

function routeSegments(path: string): string[] {
  const cleanPath = stripLocalePath(path);
  return cleanPath.split("/").filter(Boolean).slice(1);
}

function segmentsPath(segments: string[]): string {
  return normalizePath(`/${segments.map(decodeSegment).join("/")}`);
}

export function getLabelCategoryPath(
  locale: string,
  category: LabelCategoryKey = "root",
): string {
  const normalizedLocale = normalizeLocale(locale);
  return localePath(labelCategoryRoutes[normalizedLocale][category], normalizedLocale);
}

export function getLocalizedLabelCategoryPathForPath(
  pathname: string,
  locale: string,
): string | null {
  const cleanPath = normalizePath(stripLocalePath(pathname));
  const category = (Object.keys(labelCategoryRoutes.en) as LabelCategoryKey[]).find((key) => {
    return (
      cleanPath === normalizePath(labelCategoryRoutes.en[key]) ||
      cleanPath === normalizePath(labelCategoryRoutes.nl[key]) ||
      (legacyLabelCategoryRoutes[key] ?? []).some((path) => cleanPath === normalizePath(path))
    );
  });

  return category ? getLabelCategoryPath(locale, category) : null;
}

export type LabelVirtualGroup = {
  key: "applications";
  title: Record<"en" | "nl", string>;
  parentKey: "root";
  childKeys: LabelCategoryKey[];
};

const labelVirtualGroups: LabelVirtualGroup[] = [
  {
    key: "applications",
    title: {
      en: "Applications",
      nl: "Toepassingen",
    },
    parentKey: "root",
    childKeys: ["visitorBadges", "shippingLabels", "jewelryLabels"],
  },
];

export function getLabelVirtualGroupForSegments(
  segments: string[],
  locale: string,
): LabelVirtualGroup | null {
  const normalizedLocale = normalizeLocale(locale);
  const cleanPath = segmentsPath(segments);

  return labelVirtualGroups.find((group) => {
    return cleanPath === normalizePath(`/${routeSegments(labelCategoryRoutes[normalizedLocale][group.key]).join("/")}`);
  }) ?? null;
}

export function getLabelCategoryRouteSegments(
  locale: string,
  category: LabelCategoryKey,
): string[] {
  const normalizedLocale = normalizeLocale(locale);
  return routeSegments(labelCategoryRoutes[normalizedLocale][category]);
}

export function getLabelCategoryLookupSegments(
  _locale: string,
  category: LabelCategoryKey,
): string[] {
  return routeSegments(labelCategoryRoutes.nl[category]);
}

export function getLabelCategoryLookupSegmentsForSegments(
  segments: string[],
  locale: string,
): string[] | null {
  const normalizedLocale = normalizeLocale(locale);
  const cleanPath = segmentsPath(segments);
  const category = (Object.keys(labelCategoryRoutes[normalizedLocale]) as LabelCategoryKey[]).find((key) => {
    return cleanPath === normalizePath(`/${routeSegments(labelCategoryRoutes[normalizedLocale][key]).join("/")}`);
  });

  return category ? getLabelCategoryLookupSegments(normalizedLocale, category) : null;
}
