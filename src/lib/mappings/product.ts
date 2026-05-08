import type { ProductCardData } from "@/components/ProductCard";

type LocalizedString = {
  en?: string | null;
  nl?: string | null;
};

type LaravelCategory = {
  id?: number;
  name?: string | LocalizedString | null;
  slug?: string | LocalizedString | null;
};

type LaravelProduct = {
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
};

function getLocalizedValue(value: string | LocalizedString | null | undefined, locale: string): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value[locale as keyof LocalizedString] ?? value["en" as keyof LocalizedString] ?? null;
}

export function mapLaravelProductToCardData(product: LaravelProduct, locale: string = "en"): ProductCardData {
  const name = getLocalizedValue(product.name, locale) || product.title || "Unnamed Product";
  const slug = getLocalizedValue(product.slug, locale);
  const subtitle = getLocalizedValue(product.subtitle, locale);
  const excerpt = getLocalizedValue(product.excerpt, locale);
  const materialTitle = product.material ? getLocalizedValue(product.material.title, locale) : null;

  const categories = (product.categories ?? []).map(cat => ({
    id: cat.id,
    name: getLocalizedValue(cat.name, locale),
    slug: getLocalizedValue(cat.slug, locale)
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
    mainImage: product.main_image,
    categories,
    slug,
    type: (product.type === "simple" || product.type === "variable") ? product.type : null,
  };
}
