import type { ProductCardData, ProductWarrantyData } from "@/components/ProductCard";
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";

type LocalizedString = {
  en?: string | null;
  nl?: string | null;
};

type LaravelCategory = {
  id?: number;
  name?: string | LocalizedString | null;
  slug?: string | LocalizedString | null;
  name_en?: string | null;
  name_nl?: string | null;
  slug_en?: string | null;
  slug_nl?: string | null;
  translations?: Array<Record<string, { name?: string | null; slug?: string | null }> | { language?: string; name?: string | null; slug?: string | null }> | null;
};

type LaravelProductTranslation = {
  language?: string;
  name?: string | null;
  title?: string | null;
  subtitle?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  description?: string | null;
};

export type LaravelProduct = {
  id: number | string;
  sku?: string | null;
  article_number?: string | null;
  title?: string | null;
  name?: string | LocalizedString | null;
  subtitle?: string | LocalizedString | null;
  subtitle_locales?: LocalizedString | null;
  excerpt?: string | LocalizedString | null;
  excerpt_locales?: LocalizedString | null;
  price?: number | null;
  original_price?: number | null;
  stock?: number | null;
  delivery_dates_in_stock?: number | string | null;
  delivery_dates_no_stock?: number | string | null;
  in_stock?: boolean | null;
  main_image?: string | null;
  material?: {
    title?: string | LocalizedString | null;
  } | null;
  categories?: LaravelCategory[];
  slug?: string | LocalizedString | null;
  type?: string | null;
  translations?: Array<Record<string, LaravelProductTranslation> | LaravelProductTranslation> | Record<string, Record<string, LaravelProductTranslation> | LaravelProductTranslation> | null;
  warranty?: ProductWarrantyData | null;
  discount?: number | null;
  discounts?: Array<{ discount?: string | number | null; quantity?: string | number | null }> | string | null;
  packing_group?: number | string | null;
  allow_singulars?: string | number | boolean | null;
  labels_per_roll?: number | string | null;
  unit_type?: string | null;
  is_label?: boolean | null;
  is_label_product?: boolean | null;
  is_group_product?: boolean | null;
  properties?: Record<string, unknown> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  api_path_by_slug?: string | null;
};

function slugFromApiPath(apiPath: string | null | undefined): string | null {
  if (!apiPath) return null;
  const match = apiPath.match(/\/slug\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.trim().length > 0;
}

function normalizeTranslationsList(
  translations: LaravelProduct["translations"] | null | undefined
): LaravelProductTranslation[] {
  if (!translations) return [];
  const rawList = Array.isArray(translations) ? translations : Object.values(translations);
  const result: LaravelProductTranslation[] = [];

  for (const entry of rawList) {
    if (!entry || typeof entry !== "object") continue;

    if ("language" in entry && typeof (entry as any).language === "string") {
      result.push(entry as LaravelProductTranslation);
      continue;
    }

    for (const [key, value] of Object.entries(entry)) {
      if (value && typeof value === "object") {
        const sub = { ...(value as LaravelProductTranslation) };
        if (!sub.language) {
          sub.language = key;
        }
        result.push(sub);
      }
    }
  }

  return result;
}

function getFieldWithFallback(
  translationsList: LaravelProductTranslation[],
  preferredLocale: string,
  field: "title" | "name" | "slug" | "subtitle" | "excerpt" | "description"
): string | null {
  // 1. Try preferred locale
  const preferred = translationsList.find((t) => t.language === preferredLocale);
  if (preferred && isNonEmptyString(preferred[field])) {
    return preferred[field]!.trim();
  }

  // 2. Try alternate locale (nl <-> en)
  const alternateLocale = preferredLocale === "nl" ? "en" : "nl";
  const alternate = translationsList.find((t) => t.language === alternateLocale);
  if (alternate && isNonEmptyString(alternate[field])) {
    return alternate[field]!.trim();
  }

  // 3. Try any entry with a non-empty field
  for (const t of translationsList) {
    if (isNonEmptyString(t[field])) {
      return t[field]!.trim();
    }
  }

  return null;
}

export function getProductTranslation(
  translations: LaravelProduct["translations"] | null | undefined,
  locale: string
): LaravelProductTranslation | null {
  const list = normalizeTranslationsList(translations);
  const match = list.find(
    (t) =>
      t.language === locale &&
      (Boolean(t.title && t.title.trim()) || Boolean(t.name && t.name.trim()) || Boolean(t.slug && t.slug.trim()))
  );
  if (match) return match;
  return list.find((t) => t.language === locale) ?? null;
}

function getLocalizedValue(value: string | LocalizedString | null | undefined, locale: string): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value[locale as keyof LocalizedString] ?? value["en" as keyof LocalizedString] ?? null;
}

export function mapLaravelProductToCardData(product: LaravelProduct, locale: string = "en"): ProductCardData {
  const translationsList = normalizeTranslationsList(product.translations);

  const translatedTitle = getFieldWithFallback(translationsList, locale, "title");
  const translatedName = getFieldWithFallback(translationsList, locale, "name");

  const productTopTitle = isNonEmptyString(product.title) ? product.title.trim() : null;
  const productTopName =
    isNonEmptyString(product.name) && product.name !== "Unnamed Product"
      ? (typeof product.name === "string" ? product.name.trim() : getLocalizedValue(product.name, locale))
      : null;
  const metaTitle = isNonEmptyString(product.meta_title) ? product.meta_title.trim() : null;

  const rawName =
    translatedTitle ||
    translatedName ||
    productTopTitle ||
    productTopName ||
    metaTitle ||
    (product.article_number && product.article_number.trim() !== "" ? `Product ${product.article_number.trim()}` : null) ||
    (product.sku && product.sku.trim() !== "" && product.sku.trim() !== "-" ? `Product ${product.sku.trim()}` : null) ||
    "Unnamed Product";

  const name = typeof rawName === "string" ? rawName : getLocalizedValue(rawName, locale) || "Unnamed Product";

  const translatedSlug = getFieldWithFallback(translationsList, locale, "slug");
  const productTopSlug =
    typeof product.slug === "string" && isNonEmptyString(product.slug)
      ? product.slug.trim()
      : getLocalizedValue(product.slug, locale);
  const apiPathSlug = slugFromApiPath(product.api_path_by_slug);
  const slug = translatedSlug || productTopSlug || apiPathSlug || null;

  const translatedSubtitle = getFieldWithFallback(translationsList, locale, "subtitle");
  const productSubtitle =
    typeof product.subtitle === "string" && isNonEmptyString(product.subtitle)
      ? product.subtitle.trim()
      : getLocalizedValue(product.subtitle, locale);
  const subtitleLocales = getLocalizedValue(product.subtitle_locales, locale);
  const rawSubtitle = subtitleLocales || translatedSubtitle || productSubtitle;
  const subtitle = typeof rawSubtitle === "string" ? rawSubtitle : getLocalizedValue(rawSubtitle, locale);

  const translatedExcerpt = getFieldWithFallback(translationsList, locale, "excerpt");
  const productExcerpt =
    typeof product.excerpt === "string" && isNonEmptyString(product.excerpt)
      ? product.excerpt.trim()
      : getLocalizedValue(product.excerpt, locale);
  const excerptLocales = getLocalizedValue(product.excerpt_locales, locale);
  const rawExcerpt = excerptLocales || translatedExcerpt || productExcerpt;
  const excerpt = typeof rawExcerpt === "string" ? rawExcerpt : getLocalizedValue(rawExcerpt, locale);

  const materialTitle = product.material
    ? (typeof product.material.title === "string" ? product.material.title : getLocalizedValue(product.material.title, locale))
    : null;

  const categories = (product.categories ?? []).map((cat) => ({
    id: cat.id,
    name: typeof cat.name === "string" ? cat.name : getLocalizedValue(cat.name, locale),
    slug: typeof cat.slug === "string" ? cat.slug : getLocalizedValue(cat.slug, locale),
    name_en: cat.name_en ?? (typeof cat.name === "object" ? cat.name?.en ?? null : null),
    name_nl: cat.name_nl ?? (typeof cat.name === "object" ? cat.name?.nl ?? null : null),
    slug_en: cat.slug_en ?? (typeof cat.slug === "object" ? cat.slug?.en ?? null : null),
    slug_nl: cat.slug_nl ?? (typeof cat.slug === "object" ? cat.slug?.nl ?? null : null),
    translations: cat.translations ?? null,
  }));

  return {
    id: product.id,
    sku: product.sku || "-",
    article_number: product.article_number ?? null,
    name,
    title: name,
    subtitle,
    excerpt,
    materialTitle,
    price: product.price,
    originalPrice: product.original_price,
    stock: product.stock,
    delivery_dates_in_stock: product.delivery_dates_in_stock,
    delivery_dates_no_stock: product.delivery_dates_no_stock,
    inStock: product.in_stock ?? (product.stock ?? 0) > 0,
    mainImage: toDisplayImageUrl(product.main_image),
    categories,
    slug,
    type: product.type === "group"
      ? "group_product"
      : (product.type === "simple" || product.type === "variable" || product.type === "group_product") ? product.type : null,
    warranty: product.warranty ?? null,
    discount: product.discount ?? 0,
    discounts: product.discounts ?? null,
    packing_group: product.packing_group ? Number(product.packing_group) : null,
    allow_singulars: product.allow_singulars ?? null,
    labels_per_roll: product.labels_per_roll ?? null,
    unit_type: product.unit_type ?? null,
    is_label: product.is_label ?? product.is_label_product ?? null,
    is_label_product: product.is_label_product ?? null,
    is_group_product: product.is_group_product ?? null,
    properties: product.properties ?? null,
    translations: product.translations ?? null,
  };
}
