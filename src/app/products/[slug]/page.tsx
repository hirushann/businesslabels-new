import type { Metadata } from "next";
import Accordion from "@/components/Accordion";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard, { type ProductCardData, type ProductRouteType } from "@/components/ProductCard";
import ProductCompatibilityDialog from "@/components/ProductCompatibilityDialog";
import ProductImage from "@/components/ProductImage";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/utils";
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { toDisplayImageUrl } from "@/lib/utils/imageProxy";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const baseUrl = process.env.BBNL_API_BASE_URL;

  if (!slug) {
    return { title: "Product — Businesslabels" };
  }

  const selectedType = normalizeType(query.type);
  const locale = await getServerLocale();
  const product = await fetchProductBySlug(baseUrl, slug, selectedType, locale);

  if (!product) {
    return { title: "Product Not Found — Businesslabels" };
  }

  const title = product.meta_title || `${product.title || product.name} — Businesslabels`;
  const description = product.meta_description || product.description || product.excerpt || "Premium product from Businesslabels";
  const mainImage = product.main_image || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: mainImage ? [mainImage] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: mainImage ? [mainImage] : [],
    },
  };
}

type UpsellProduct = {
  id: number;
  title: string;
  slug: string;
  sku: string;
  price: number;
  original_price: number;
  main_image: string;
};

type ProductWarrantyOption = {
  id: number;
  name?: string | null;
  duration_months?: number | null;
  price?: number | null;
  description?: string | null;
  sort_order?: number | null;
};

type ComponentProduct = {
  id?: number;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  price?: number | null;
  stock?: number | null;
  quantity?: number | null;
  available_sets?: number | null;
  main_image?: string | null;
};

type ProductDetail = {
  id?: number;
  type?: string;
  is_group_product?: boolean | null;
  is_label_product?: boolean | null;
  api_path_by_slug?: string | null;
  title?: string | null;
  name?: string | null;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  sku?: string | null;
  article_number?: string | null;
  price?: number | null;
  original_price?: number | null;
  stock?: number | null;
  in_stock?: boolean | null;
  main_image?: string | null;
  gallery_images?: Array<{ id?: number; url?: string | null; name?: string | null }>;
  product_information?: Record<string, unknown> | string | null;
  content?: string | null;
  product_template?: string | null;
  material?: {
    id?: number;
    title?: string | null;
    slug?: string | null;
    subtitle?: string | null;
    category?: { id?: number; name?: string | null; slug?: string | null } | null;
  } | null;
  meta?: Record<string, string | number | boolean | null> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  material_information?: string | null;
  make?: string | null;
  packaging_unit?: number | null;
  jeritech_stock?: number | null;
  delivery_dates_in_stock?: number | null;
  delivery_dates_no_stock?: number | null;
  packing_group?: string | number | null;
  allow_singulars?: string | number | boolean | null;
  discounts?: string | Array<{ discount?: string | number | null; quantity?: string | number | null }> | null;
  discount?: number | null;
  dimensions?: {
    weight?: string | number | null;
    width?: string | number | null;
    height?: string | number | null;
    length?: string | number | null;
  } | null;
  categories?: Array<{ id?: number; name?: string | null; slug?: string | null }>;
  component_products?: ComponentProduct[] | null;
  up_sells?: UpsellProduct[];
  cross_sells?: UpsellProduct[];
  suitable_printers?: UpsellProduct[];
  printer_finder_id?: number | null;
  printer_ids?: Array<number | string> | null;
  product_ids?: Array<number | string> | null;
  warranty?: {
    is_available?: boolean | null;
    has_options?: boolean | null;
    options?: ProductWarrantyOption[] | null;
    default_option?: ProductWarrantyOption | null;
  } | null;
  translations?: ProductTranslationEntry[] | null;
  locale_slugs?: Partial<Record<"en" | "nl", string>>;
  properties?: unknown;
};

type ProductTranslation = {
  language?: string | null;
  name?: string | null;
  title?: string | null;
  subtitle?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  description?: string | null;
  content?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  product_information?: Record<string, unknown> | string | null;
};

type ProductTranslationEntry =
  | ProductTranslation
  | Partial<Record<"en" | "nl", ProductTranslation | null>>;

type TranslatedProductField =
  | "name"
  | "title"
  | "subtitle"
  | "slug"
  | "excerpt"
  | "description"
  | "content"
  | "meta_title"
  | "meta_description"
  | "product_information";

const PRODUCT_LOCALES = ["en", "nl"] as const;

function normalizeType(raw: string | string[] | undefined, isGroupProduct?: boolean | null): "simple" | "variable" | "group_product" | null {
  if (isGroupProduct) return "group_product";
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "simple" || value === "variable" || value === "group_product") {
    return value;
  }
  if (value === "group") {
    return "group_product";
  }
  return null;
}

function normalizeValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  return String(value).trim() || null;
}

function normalizeNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
}

function normalizeIdList(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeNumber(item))
    .filter((item): item is number => item !== null)
    .map((item) => Math.trunc(item));
}

function normalizePackingGroup(value: ProductDetail["packing_group"]): string | null {
  const numberValue = normalizeNumber(value);
  if (numberValue == null) {
    return normalizeValue(value);
  }

  return numberValue.toFixed(2);
}

function normalizeDisplayValue(value: unknown): string | null {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  return toTitleCaseFromSlug(normalized);
}

function normalizePropertyDisplayValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const values = value
      .map((item) => (item && typeof item === "object" && "title" in item ? item.title : item))
      .map(normalizeDisplayValue)
      .filter((item): item is string => Boolean(item));

    return values.length > 0 ? values.join(", ") : null;
  }

  if (value && typeof value === "object") {
    if ("title" in value) {
      return normalizeDisplayValue(value.title);
    }

    const values = Object.values(value)
      .map((item) => (item && typeof item === "object" && "title" in item ? item.title : item))
      .map(normalizeDisplayValue)
      .filter((item): item is string => Boolean(item));

    return values.length > 0 ? values.join(", ") : null;
  }

  return normalizeDisplayValue(value);
}

function specsFromProduct(product: ProductDetail | null): Array<{ label: string; value: string }> {
  const missing = "-";
  const categoryNames = (product?.categories ?? [])
    .map((category) => normalizeDisplayValue(category.name))
    .filter((name): name is string => Boolean(name))
    .join(", ");
  const specRows: Array<{ label: string; value: string }> = [
    { label: "SKU", value: normalizeDisplayValue(product?.sku) || missing },
    { label: "Category", value: categoryNames || missing },
  ];

  const metaRows = Object.entries(product?.properties ?? {})
    .map(([key, value]) => {
      const normalizedValue = normalizePropertyDisplayValue(value);
      if (!normalizedValue) {
        return null;
      }

      return {
        label: toTitleCaseFromSlug(key),
        value: normalizedValue,
      };
    })
    .filter((entry): entry is { label: string; value: string } => Boolean(entry));

  return [...specRows, ...metaRows];
}

function getProductTranslation(product: ProductDetail, locale: "en" | "nl"): ProductTranslation | null {
  for (const entry of product.translations ?? []) {
    if (!entry || typeof entry !== "object") continue;
    const keyed = (entry as Partial<Record<"en" | "nl", ProductTranslation | null>>)[locale];
    if (keyed) return keyed;
    const direct = entry as ProductTranslation;
    if (direct.language === locale) return direct;
  }
  return null;
}

function slugFromApiPath(apiPath: string | null | undefined): string | null {
  if (!apiPath) return null;
  const match = apiPath.match(/\/slug\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getProductLocaleSlugs(product: ProductDetail): Partial<Record<"en" | "nl", string>> {
  const localeSlugs: Partial<Record<"en" | "nl", string>> = { ...(product.locale_slugs ?? {}) };

  for (const locale of PRODUCT_LOCALES) {
    if (!localeSlugs[locale]) {
      const translation = getProductTranslation(product, locale);
      if (translation?.slug) localeSlugs[locale] = translation.slug;
    }
  }

  if (product.slug && !PRODUCT_LOCALES.some((l) => localeSlugs[l] === product.slug)) {
    const missing = PRODUCT_LOCALES.find((l) => !localeSlugs[l]);
    if (missing) localeSlugs[missing] = product.slug;
  }

  // Last resort: api_path_by_slug holds the model's canonical (often NL) slug.
  const stillMissing = PRODUCT_LOCALES.find((l) => !localeSlugs[l]);
  if (stillMissing) {
    const apiSlug = slugFromApiPath(product.api_path_by_slug);
    if (apiSlug && !Object.values(localeSlugs).includes(apiSlug)) {
      localeSlugs[stillMissing] = apiSlug;
    }
  }

  return localeSlugs;
}

function applyProductTranslation(product: ProductDetail, locale: "en" | "nl"): ProductDetail {
  const translation = getProductTranslation(product, locale);
  const localeSlugs = getProductLocaleSlugs(product);

  if (!translation) return { ...product, locale_slugs: localeSlugs };

  const out: ProductDetail = { ...product, locale_slugs: localeSlugs };

  const apply = (field: TranslatedProductField) => {
    const val = translation[field];
    const translatedOut = out as unknown as Record<TranslatedProductField, unknown>;
    // If the translation has a non-null, non-empty value, use it.
    // Otherwise, keep the existing value from the product (the default/Dutch value).
    if (val !== null && val !== undefined) {
      if (typeof val === "string") {
        if (val.trim() !== "") {
          translatedOut[field] = val.trim();
        }
      } else {
        translatedOut[field] = val;
      }
    }
  };

  apply("name");
  apply("title");
  apply("subtitle");
  apply("slug");
  apply("excerpt");
  apply("description");
  apply("content");
  apply("meta_title");
  apply("meta_description");
  apply("product_information");

  return out;
}

function productPathForSlug(slug: string, selectedType: "simple" | "variable" | "group_product" | null, locale: "en" | "nl"): string {
  const params = new URLSearchParams();
  if (selectedType) params.set("type", selectedType);
  const qs = params.toString();
  return localePath(`/products/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`, locale);
}

async function fetchProductByType(baseUrl: string, type: "simple" | "variable", slug: string, locale: "en" | "nl"): Promise<ProductDetail | null> {
  try {
    const response = await fetch(withLocaleParam(`${baseUrl}/api/products/${type}/slug/${encodeURIComponent(slug)}`, locale), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { data?: ProductDetail };
    return json.data ? applyProductTranslation(json.data, locale) : null;
  } catch (error) {
    console.error(`Failed to fetch product details for type '${type}' and slug '${slug}'`, error);
    return null;
  }
}

async function fetchGroupProductBySlug(baseUrl: string, slug: string, locale: "en" | "nl"): Promise<ProductDetail | null> {
  try {
    const response = await fetch(withLocaleParam(`${baseUrl}/api/group-products/slug/${encodeURIComponent(slug)}`, locale), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { data?: ProductDetail };
    return json.data ? applyProductTranslation(json.data, locale) : null;
  } catch (error) {
    console.error(`Failed to fetch group product details for slug '${slug}'`, error);
    return null;
  }
}

async function fetchProductByTypeWithSlugFallback(
  baseUrl: string,
  type: "simple" | "variable",
  slug: string,
  targetLocale: "en" | "nl",
): Promise<ProductDetail | null> {
  const direct = await fetchProductByType(baseUrl, type, slug, targetLocale);
  if (direct) return direct;

  for (const fallbackLocale of PRODUCT_LOCALES) {
    if (fallbackLocale === targetLocale) continue;
    const fallback = await fetchProductByType(baseUrl, type, slug, fallbackLocale);
    if (!fallback) continue;

    // If the fallback product knows the target-locale slug, try fetching that directly.
    const targetSlug = getProductLocaleSlugs(fallback)[targetLocale];
    if (targetSlug && targetSlug !== slug) {
      const byTargetSlug = await fetchProductByType(baseUrl, type, targetSlug, targetLocale);
      if (byTargetSlug) return byTargetSlug;
    }

    return applyProductTranslation(fallback, targetLocale);
  }

  return null;
}

async function fetchGroupProductBySlugWithFallback(
  baseUrl: string,
  slug: string,
  targetLocale: "en" | "nl",
): Promise<ProductDetail | null> {
  const direct = await fetchGroupProductBySlug(baseUrl, slug, targetLocale);
  if (direct) return direct;

  for (const fallbackLocale of PRODUCT_LOCALES) {
    if (fallbackLocale === targetLocale) continue;
    const fallback = await fetchGroupProductBySlug(baseUrl, slug, fallbackLocale);
    if (fallback) return applyProductTranslation(fallback, targetLocale);
  }

  return null;
}

async function fetchProductBySlug(
  baseUrl: string | undefined,
  slug: string,
  selectedType: "simple" | "variable" | "group_product" | null,
  locale: "en" | "nl",
): Promise<ProductDetail | null> {
  if (!baseUrl) {
    console.error("BBNL_API_BASE_URL is not configured");
    return null;
  }

  if (selectedType === "group_product") {
    return fetchGroupProductBySlugWithFallback(baseUrl, slug, locale);
  }

  const tryTypes: Array<"simple" | "variable"> = selectedType
    ? [selectedType]
    : ["simple", "variable"];

  for (const type of tryTypes) {
    const product = await fetchProductByTypeWithSlugFallback(baseUrl, type, slug, locale);
    if (product) return product;
  }

  return fetchGroupProductBySlugWithFallback(baseUrl, slug, locale);
}

function toTitleCaseFromSlug(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapUpsellToProductCard(upsell: UpsellProduct): ProductCardData {
  return {
    id: upsell.id,
    name: upsell.title,
    sku: upsell.sku,
    subtitle: null,
    excerpt: null,
    materialTitle: null,
    price: upsell.price,
    originalPrice: upsell.original_price,
    inStock: true,
    mainImage: upsell.main_image,
    categories: [],
    slug: upsell.slug,
    type: "simple",
  };
}

function productHref(product: ProductCardData): { pathname: string; query?: { type: ProductRouteType } } | null {
  if (!product.slug) {
    return null;
  }

  if (product.type === "simple" || product.type === "variable") {
    return {
      pathname: `/products/${product.slug}`,
      query: { type: product.type },
    };
  }

  return { pathname: `/products/${product.slug}` };
}

/** Map a full API product (ProductResource) to the ProductCard shape. */
function mapApiProductToCard(p: Record<string, unknown>): ProductCardData {
  const material = p.material as { title?: string | null } | null | undefined;
  return {
    id: Number(p.id),
    name: String((p.title as string) || (p.name as string) || ""),
    sku: (p.sku as string) ?? null,
    subtitle: (p.subtitle as string) ?? null,
    excerpt: (p.excerpt as string) ?? null,
    materialTitle: material?.title ?? null,
    price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
    originalPrice:
      typeof p.original_price === "number" ? p.original_price : Number(p.original_price) || 0,
    inStock: p.in_stock === true || Number(p.stock) > 0,
    mainImage: (p.main_image as string) ?? null,
    categories: (p.categories as ProductCardData["categories"]) ?? [],
    slug: (p.slug as string) ?? "",
    type: p.type === "variable" ? "variable" : "simple",
  };
}

/** Fetch products compatible with a product finder printer (Post), by sub-category. */
async function fetchPrinterProducts(
  baseUrl: string,
  printerId: number,
  productType: "ink" | "labels",
): Promise<ProductCardData[]> {
  try {
    const response = await fetch(`${baseUrl}/api/products/printer-products`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ printer_id: printerId, product_type: productType, per_page: 12 }),
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as { products?: { data?: Array<Record<string, unknown>> } };
    return (json.products?.data ?? []).map(mapApiProductToCard);
  } catch (error) {
    console.error(`Failed to fetch printer products (${productType})`, error);
    return [];
  }
}

/** A titled product carousel — used for related / cross-sell / compatibility sections. */
function ProductCarouselSection({
  title,
  products,
  bgClass = "bg-gray-50",
  id,
}: {
  title: string;
  products: ProductCardData[];
  bgClass?: string;
  id?: string;
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div id={id} className={`scroll-mt-24 px-4 sm:px-10 py-10 ${bgClass}`}>
      <div className="mx-auto flex flex-col gap-12">
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 px-4 sm:px-10 lg:px-20">
            <h2 className="text-neutral-800 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight md:leading-[48px]">
              {title}
            </h2>
            <div className="flex items-center gap-6 self-end sm:self-auto">
              <CarouselPrevious className="static translate-y-0 w-12 h-12 p-3 bg-gray-50 rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 hover:bg-white transition-colors" />
              <CarouselNext className="static translate-y-0 w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 hover:bg-amber-50 transition-colors" />
            </div>
          </div>
          <CarouselContent className="-ml-6 mt-6">
            {products.map((product) => {
              const href = productHref(product);
              return (
                <CarouselItem key={product.id} className="pl-6 basis-full sm:basis-1/2 lg:basis-1/3">
                  <ProductCard product={product} href={href ?? undefined} />
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}

export default async function SingleProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const t = await getTranslations();
  const { slug } = await params;
  const query = await searchParams;
  const baseUrl = process.env.BBNL_API_BASE_URL;

  if (!slug) {
    notFound();
  }

  const selectedType = normalizeType(query.type);
  const locale = await getServerLocale();
  const product = await fetchProductBySlug(baseUrl, slug, selectedType, locale);

  if (!product) {
    notFound();
  }

  console.log("[SingleProductPage] Full product details:", JSON.stringify(product, null, 2));

  const productName = product.title || product.name || "";
  const shortDescription = product.description || product.excerpt || "";
  const productDescription = product.content || "";
  const componentProducts = product.component_products ?? [];
  const mainImage = toDisplayImageUrl(product.main_image) || "";
  const galleryImages = (product.gallery_images ?? [])
    .map((item) => toDisplayImageUrl(item.url))
    .filter((url): url is string => Boolean(url));
  const specs = specsFromProduct(product);

  console.log('Specs:', specs);
  const compatiblePrinterIds = normalizeIdList(product.printer_ids ?? product.meta?.printer_ids);
  const productCategorySlugs = (product.categories ?? [])
    .map((category) => normalizeValue(category.slug))
    .filter((slug): slug is string => Boolean(slug));

  console.log("Specs derived from product:", specs);
  const relatedProducts = (product.up_sells ?? []).map(mapUpsellToProductCard);
  const suitablePrinters = (product.suitable_printers ?? []).map(mapUpsellToProductCard);
  const showCompatibilityCta = product.is_label_product == true || product.meta?.is_label_product === true;

  // A product linked to a product finder entry (via Printer URL) is a printer:
  // show its compatible consumables instead of generic up-sells.
  const printerFinderId = product.printer_finder_id ?? null;
  const isPrinterProduct = printerFinderId != null;
  const [printerInkProducts, printerHardwareProducts] =
    printerFinderId != null && baseUrl
      ? await Promise.all([
          fetchPrinterProducts(baseUrl, printerFinderId, "ink"),
          fetchPrinterProducts(baseUrl, printerFinderId, "labels"),
        ])
      : [[] as ProductCardData[], [] as ProductCardData[]];

  // Ink / label products show "Suitable Printers" and skip the generic up-sells block.
  const hasSuitablePrinters = suitablePrinters.length > 0;
  const showUpSells = !isPrinterProduct && !hasSuitablePrinters && relatedProducts.length > 0;

  const isGroup = normalizeType(product?.type, product?.is_group_product) === "group_product";
  let price = product?.price ?? 0;
  const originalPrice = product?.original_price ?? 0;
  const discount = product?.discount ?? 0;

  // For group products, if price is 0 or missing, derive it from original_price and discount
  if (isGroup && price === 0 && originalPrice > 0 && discount > 0) {
    price = originalPrice - (originalPrice * (discount / 100));
  } else if (!isGroup && discount > 0 && price > 0) {
    // If it's NOT a group product, the legacy logic applied discount to price.
    // We keep this for simple products if the API still returns original price in 'price' field.
    // However, if it IS a group product, the guide says 'price' is already the final price.
    // To be safe, if price is already significantly lower than originalPrice, we might not want to apply it again.
    // But for now, we'll just fix the 0 price for group products.
    price = price - (price * (discount / 100));
  }
  console.log(product)

  return (
    <div className="bg-white pb-28 lg:pb-0">


      <div className="px-4 md:px-8 lg:px-10 py-6 lg:py-10">
        {/* Breadcrumb */}
        <div className="pb-8">
          <div className="max-w-360 mx-auto">
            <Breadcrumbs 
              className="text-neutral-900"
              items={[
                { label: t('common.products'), href: localePath('/products', locale) },
                ...(product.categories && product.categories.length > 0 ? [{ 
                  label: product.categories[0].name || "", 
                  href: `/category/${product.categories[0].slug || product.categories[0].id}` 
                }] : []),
                { label: productName }
              ]} 
            />
          </div>
        </div>
        <div className="max-w-360 mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* LEFT: Images + Description + Specs */}
          <div className="w-full lg:flex-1 flex flex-col gap-8 lg:gap-12">
            {/* Title & Description */}
            <div className="flex flex-col gap-4">
              {productName ? (
                <h1 className="text-neutral-800 text-3xl font-bold leading-10">
                  {productName}
                </h1>
              ) : null}
              {shortDescription ? (
                <div className="text-neutral-700 text-lg font-normal leading-7" dangerouslySetInnerHTML={{ __html: shortDescription }}>
                </div>
              ) : null}
            </div>

            {/* Product Image */}
            <ProductImage
              productName={productName}
              mainImage={mainImage}
              galleryImages={galleryImages}
            />

            <div className="flex flex-col gap-6">

{componentProducts.length > 0 ? (
                <Accordion
                title={t('product.componentProduct')}
              >
                <div className="flex flex-col gap-2">
                  {componentProducts.map((item) => {
                    const proxiedImage = toDisplayImageUrl(item.main_image);
                    return (
                      <div key={item.id}>
                        <Link
                          href={item.slug ? productPathForSlug(item.slug, "simple", locale) : "#"}
                          className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-start transition-colors hover:border-amber-200 hover:bg-amber-50"
                        >
                          {proxiedImage ? (
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <Image
                                src={proxiedImage}
                                alt={item.name ?? ""}
                                width={56}
                                height={56}
                                className="h-full w-full object-contain p-1"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <h5 className="truncate text-sm font-semibold text-neutral-700 group-hover:text-amber-700">
                              {item.name}
                            </h5>
                            {item.sku && (
                              <span className="text-xs text-neutral-400">SKU: {item.sku}</span>
                            )}
                          </div>
                          {item.quantity && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                              x{item.quantity}
                            </span>
                          )}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            className="shrink-0 text-slate-400 transition-colors group-hover:text-amber-500"
                            aria-hidden="true"
                          >
                            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                </Accordion>
            ) : null}

              <Accordion
                title={t('product.productDescription')}
              >
                {productDescription ? (
                  <div
                    className="text-neutral-700 text-base font-normal leading-6 cms-content"
                    dangerouslySetInnerHTML={{ __html: productDescription }}
                  />
                ) : (
                  <div className="text-neutral-500 text-base font-normal leading-6">
                    {t('product.noDescriptionAvailable')}
                  </div>
                )}
              </Accordion>

              <Accordion
                title={t('product.productSpecifications')}
              >
                <div className="rounded-lg overflow-hidden flex flex-col gap-2">
                  {specs.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`flex px-6 py-3 justify-between items-center rounded-md ${i % 2 === 0 ? "bg-white/50" : ""}`}
                    >
                      <span className="text-neutral-500 text-base font-normal">{spec.label}</span>
                      <span className="text-neutral-700 text-base font-semibold">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </Accordion>

              {showCompatibilityCta ? (
                <div className="p-5 sm:p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl outline outline-2 outline-offset-[-2px] outline-orange-100">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 items-start">
                    <div className="w-8 h-8 p-2 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                      </svg>
                    </div>
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-neutral-700 text-xl sm:text-2xl font-bold leading-7">{t('product.doesThisFitMyPrinter')}</h3>
                        <p className="text-neutral-700 text-base font-normal leading-6">
                        {t('product.compatibilityDescription')}
                        </p>
                      </div>
                      <ProductCompatibilityDialog
                        productId={product.id}
                        compatiblePrinterIds={compatiblePrinterIds}
                        productCategorySlugs={productCategorySlugs}
                        productMake={normalizeValue(product.make)}
                        productName={productName}
                        productImage={product.main_image}
                        productSku={product.sku}
                        productSlug={product.slug}
                        productType={normalizeType(product.type) || (product.is_group_product || (product.component_products?.length ?? 0) > 0 ? "group_product" : null)}
                        productPrice={price}
                        packingGroup={product.packing_group != null ? Number(product.packing_group) : null}
                        allowSingulars={normalizeBoolean(product.allow_singulars)}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT: Purchase Card */}
          <div className="w-full lg:w-[400px] xl:w-[420px] flex flex-col gap-6 lg:sticky lg:top-24">
            <ProductPurchase
              id={product?.id}
              slug={product?.slug}
              type={normalizeType(product?.type) || (product?.is_group_product || (product?.component_products?.length ?? 0) > 0 ? "group_product" : null)}
              name={productName}
              sku={product?.sku}
              subtitle={normalizeValue(product?.subtitle)}
              excerpt={normalizeValue(product?.excerpt)}
              materialTitle={normalizeValue(product?.material?.title)}
              inStock={product?.in_stock}
              price={price}
              originalPrice={product?.original_price}
              mainImage={product?.main_image}
              packingGroup={normalizePackingGroup(product?.packing_group)}
              allowSingulars={normalizeBoolean(product?.allow_singulars)}
              stock={product?.stock}
              deliveryDatesInStock={product?.delivery_dates_in_stock}
              deliveryDatesNoStock={product?.delivery_dates_no_stock}
              discounts={product?.discounts}
              warranty={product?.warranty}
              componentCount={product?.component_products?.length || null}
              isLabelProduct={product?.is_label_product == true || product?.meta?.is_label_product === true}
              properties={product?.properties}
            />

            {/* Consumable Items — image cards (printer products only) */}
            {isPrinterProduct && (
              <div className="flex flex-col gap-4">
                <h3 className="text-[#222222] text-2xl font-bold leading-tight">
                  {t('product.consumableItems')}
                </h3>
                <div className="flex gap-4">
                  {[
                    {
                      label: t('product.inkCartridges'),
                      image: "/consumables/ink-cartridges.png",
                      href: "#ink-maintenance",
                      width: 550,
                      height: 303,
                    },
                    {
                      label: t('product.maintenanceKits'),
                      image: "/consumables/maintenance-kits.png",
                      href: "#hardwares",
                      width: 340,
                      height: 273,
                    },
                  ].map((card) => (
                    <a
                      key={card.label}
                      href={card.href}
                      className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-[#edf0f4] bg-white p-4 drop-shadow-[2px_4px_10px_rgba(109,109,120,0.10)] transition-colors hover:border-amber-300"
                    >
                      <span className="flex h-[60px] items-center justify-center">
                        <Image
                          src={card.image}
                          alt={card.label}
                          width={card.width}
                          height={card.height}
                          className="h-[60px] w-auto object-contain"
                        />
                      </span>
                      <span className="text-[#222222] text-base font-semibold">{card.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printer: compatible consumables pulled from the product finder */}
      {isPrinterProduct && (
        <>
          <ProductCarouselSection
            id="ink-maintenance"
            title={t('product.inkMaintenance')}
            products={printerInkProducts}
            bgClass="bg-gray-50"
          />
          <ProductCarouselSection
            id="hardwares"
            title={t('product.hardwares')}
            products={printerHardwareProducts}
            bgClass="bg-white"
          />
        </>
      )}

      {/* Ink / label: suitable printers (replaces the generic up-sell block) */}
      {hasSuitablePrinters && (
        <ProductCarouselSection
          title={t('product.suitablePrinters')}
          products={suitablePrinters}
          bgClass="bg-white"
        />
      )}

      {/* Generic up-sells — hidden for printers and ink/label products */}
      {showUpSells && (
        <ProductCarouselSection
          title={t('product.relatedProducts')}
          products={relatedProducts}
          bgClass="bg-gray-50"
        />
      )}
    </div>
  );
}
