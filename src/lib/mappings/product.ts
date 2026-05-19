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
  excerpt?: string | LocalizedString | null;
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
  packing_group?: number | string | null;
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

  const rawName = translation?.name || translation?.title || product.name || product.title || "Unnamed Product";
  const name = typeof rawName === "string" ? rawName : getLocalizedValue(rawName, locale) || "Unnamed Product";

  const rawSlug = translation?.slug || product.slug;
  const slug = typeof rawSlug === "string" ? rawSlug : getLocalizedValue(rawSlug, locale);

  const rawSubtitle = translation?.subtitle || product.subtitle;
  const subtitle = typeof rawSubtitle === "string" ? rawSubtitle : getLocalizedValue(rawSubtitle, locale);

  const rawExcerpt = translation?.excerpt || product.excerpt;
  const excerpt = typeof rawExcerpt === "string" ? rawExcerpt : getLocalizedValue(rawExcerpt, locale);

  const materialTitle = product.material
    ? (typeof product.material.title === "string" ? product.material.title : getLocalizedValue(product.material.title, locale))
    : null;

  const categories = (product.categories ?? []).map((cat) => ({
    id: cat.id,
    name: typeof cat.name === "string" ? cat.name : getLocalizedValue(cat.name, locale),
    slug: typeof cat.slug === "string" ? cat.slug : getLocalizedValue(cat.slug, locale)
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
    type: (product.type === "simple" || product.type === "variable") ? product.type : null,
    warranty: product.warranty ?? null,
    discount: product.discount ?? 0,
    packing_group: product.packing_group ? Number(product.packing_group) : null,
  };
}
