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
  title?: string | null;
  name?: string | LocalizedString | null;
  subtitle?: string | LocalizedString | null;
  subtitle_locales?: LocalizedString | null;
  excerpt?: string | LocalizedString | null;
  excerpt_locales?: LocalizedString | null;
  price?: number | null;
  original_price?: number | null;
  stock?: number | null;
  in_stock?: boolean | null;
  main_image?: string | null;
  material?: {
    title?: string | LocalizedString | null;
  } | null;
  categories?: LaravelCategory[];
  slug?: string | LocalizedString | null;
  type?: string | null;
  translations?: Array<Record<string, LaravelProductTranslation> | LaravelProductTranslation> | null;
  warranty?: ProductWarrantyData | null;
  discount?: number | null;
  discounts?: Array<{ discount?: string | number | null; quantity?: string | number | null }> | string | null;
  packing_group?: number | string | null;
  allow_singulars?: string | number | boolean | null;
  is_label?: boolean | null;
  is_label_product?: boolean | null;
  is_group_product?: boolean | null;
  properties?: Record<string, unknown> | null;
};

function getProductTranslation(
  translations: Array<Record<string, LaravelProductTranslation> | LaravelProductTranslation> | null | undefined,
  locale: string
): LaravelProductTranslation | null {
  if (!translations) return null;
  for (const entry of translations) {
    if (!entry || typeof entry !== "object") continue;
    if (locale in entry) {
      const keyed = (entry as Record<string, LaravelProductTranslation>)[locale];
      if (keyed) return keyed;
    }
    const direct = entry as LaravelProductTranslation;
    if (direct.language === locale) return direct;
  }
  return null;
}

function getLocalizedValue(value: string | LocalizedString | null | undefined, locale: string): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value[locale as keyof LocalizedString] ?? value["en" as keyof LocalizedString] ?? null;
}

export function mapLaravelProductToCardData(product: LaravelProduct, locale: string = "en"): ProductCardData {
  const translation = getProductTranslation(product.translations, locale);

  const rawName = translation?.title || translation?.name || product.title || product.name || "Unnamed Product";
  const name = typeof rawName === "string" ? rawName : getLocalizedValue(rawName, locale) || "Unnamed Product";

  const rawSlug = translation?.slug || product.slug;
  const slug = typeof rawSlug === "string" ? rawSlug : getLocalizedValue(rawSlug, locale);

  const rawSubtitle = product.subtitle_locales || translation?.subtitle || product.subtitle;
  const subtitle = typeof rawSubtitle === "string" ? rawSubtitle : getLocalizedValue(rawSubtitle, locale);

  const rawExcerpt = product.excerpt_locales || translation?.excerpt || product.excerpt;
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
    name,
    subtitle,
    excerpt,
    materialTitle,
    price: product.price,
    originalPrice: product.original_price,
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
    is_label: product.is_label ?? product.is_label_product ?? null,
    is_label_product: product.is_label_product ?? null,
    is_group_product: product.is_group_product ?? null,
    properties: product.properties ?? null,
    translations: product.translations ?? null,
  };
}
