import type { Metadata } from "next";
import Accordion from "@/components/Accordion";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard, { type ProductCardData, type ProductRouteType } from "@/components/ProductCard";
import ProductCompatibilityDialog from "@/components/ProductCompatibilityDialog";
import ProductImage from "@/components/ProductImage";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/utils";
import { notFound, redirect } from "next/navigation";
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
import type { ReactNode } from "react";
import LocaleLink from "@/components/LocaleLink";
import { localizeProductSpecValue } from "@/lib/products/specValues";
import { mapLaravelProductToCardData, type LaravelProduct } from "@/lib/mappings/product";
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
  const productType = productRouteType(product, selectedType);
  const localeSlugs = getProductLocaleSlugs(product);
  const canonicalSlug = localeSlugs[locale] ?? product.slug ?? slug;

  return {
    title,
    description,
    alternates: {
      canonical: productPathForSlug(canonicalSlug, productType, locale),
      languages: {
        en: productPathForSlug(localeSlugs.en ?? canonicalSlug, productType, "en"),
        nl: productPathForSlug(localeSlugs.nl ?? canonicalSlug, productType, "nl"),
      },
    },
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

type RelatedProductsSection = {
  title?: string | null;
  data?: ProductCardData[] | null;
  meta?: {
    total?: number | null;
  } | null;
};

type RelatedProductsSectionsResponse = {
  data?: {
    sections?: {
      ink_maintenance?: RelatedProductsSection | null;
      hardwares?: RelatedProductsSection | null;
    } | null;
  } | null;
};

type ProductCarouselDataSection = {
  id: string;
  title: string;
  products: ProductCardData[];
};

type ProductWarrantyOption = {
  id: number;
  name?: string | null;
  duration_months?: number | null;
  price?: number | null;
  description?: string | null;
  sort_order?: number | null;
};

type ProductWarrantyDefaultOption = {
  type?: string | null;
  warranty_option_id?: number | string | null;
  sku?: string | null;
  name?: string | null;
  duration_years?: number | null;
  price?: number | null;
  description?: string | null;
};

type ProductWarrantyType = {
  id: number;
  name?: string | null;
  description?: string | null;
  icon?: string | null;
  badge_text?: string | null;
  badge_color?: string | null;
  options?: Array<{
    id?: number | string | null;
    type?: string | null;
    warranty_option_id?: number | string | null;
    sku?: string | null;
    name?: string | null;
    duration_years?: number | null;
    description?: string | null;
    price?: number | null;
    cart?: {
      type?: string | null;
      warranty_option_id?: number | string | null;
      sku?: string | null;
    } | null;
  }> | null;
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

type NumericLike = number | string | null;

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
  stock?: NumericLike;
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
  jeritech_stock?: NumericLike;
  delivery_dates_in_stock?: NumericLike;
  delivery_dates_no_stock?: NumericLike;
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
    default_option?: ProductWarrantyDefaultOption | ProductWarrantyOption | null;
    types?: ProductWarrantyType[] | null;
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

type TranslationLookup = {
  (key: string, values?: Record<string, string | number | Date>): string;
  has: (key: string) => boolean;
};

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

function getSpecLabel(key: string, locale: "en" | "nl", t: TranslationLookup): string {
  const cleanKey = key.toLowerCase().trim();

  const mapping: Record<string, string> = {
    sku: "SKU",
    category: t.has("filters.category") ? t("filters.category") : (locale === "nl" ? "Categorie" : "Category"),
    breedte: t.has("filters.width") ? t("filters.width") : (locale === "nl" ? "Breedte" : "Width"),
    hoogte: t.has("filters.height") ? t("filters.height") : (locale === "nl" ? "Hoogte" : "Height"),
    afwerking: t.has("filters.finishing") ? t("filters.finishing") : (locale === "nl" ? "Afwerking" : "Finishing"),
    lijm: t.has("filters.glue") ? t("filters.glue") : (locale === "nl" ? "Lijm" : "Glue"),
    materiaal: t.has("filters.material") ? t("filters.material") : (locale === "nl" ? "Materiaal" : "Material"),
    kern: t.has("filters.core") ? t("filters.core") : (locale === "nl" ? "Kern" : "Core"),
    "buiten-diameter": t.has("filters.outer_diameter") ? t("filters.outer_diameter") : (locale === "nl" ? "Buitendiameter" : "Outer Diameter"),
    buitendiameter: t.has("filters.outer_diameter") ? t("filters.outer_diameter") : (locale === "nl" ? "Buitendiameter" : "Outer Diameter"),
    "max-buiten-dia": locale === "nl" ? "Max buiten dia" : "Max outer diameter",
    max_buiten_dia: locale === "nl" ? "Max buiten dia" : "Max outer diameter",
    "buiten-dia": locale === "nl" ? "Buiten dia" : "Outer diameter",
    buiten_dia: locale === "nl" ? "Buiten dia" : "Outer diameter",
    printmethode: t.has("filters.print_method") ? t("filters.print_method") : (locale === "nl" ? "Drukmethode" : "Print Method"),
    printer_type: t.has("filters.printer_type") ? t("filters.printer_type") : (locale === "nl" ? "Printer Type" : "Printer Type"),
    detectie: t.has("filters.detectie") ? t("filters.detectie") : (locale === "nl" ? "Detectie" : "Detection"),
    "compatibele-merken": t.has("filters.merken") ? t("filters.merken") : (locale === "nl" ? "Compatibele merken" : "Compatible Brands"),
    compatibele_merken: t.has("filters.merken") ? t("filters.merken") : (locale === "nl" ? "Compatibele merken" : "Compatible Brands"),
    brand: t.has("filters.brand") ? t("filters.brand") : (locale === "nl" ? "Merk" : "Brand"),
    merk: t.has("filters.brand") ? t("filters.brand") : (locale === "nl" ? "Merk" : "Brand"),
    kleur: locale === "nl" ? "Kleur" : "Color",
    vorm: locale === "nl" ? "Vorm" : "Shape",
    perforatie: locale === "nl" ? "Perforatie" : "Perforation",
    "aantal-banen": locale === "nl" ? "Aantal banen" : "Number of lanes",
    aantal_banen: locale === "nl" ? "Aantal banen" : "Number of lanes",
    verpakkingseenheid: locale === "nl" ? "Verpakkingseenheid" : "Packaging unit",
    "lijm-temperatuur": locale === "nl" ? "Lijm temperatuur" : "Glue temperature",
    lijm_temperatuur: locale === "nl" ? "Lijm temperatuur" : "Glue temperature",
    "material-code": t.has("filters.material_code") ? t("filters.material_code") : (locale === "nl" ? "Materiaalcode" : "Material Code"),
    "materiaal-code": t.has("filters.material_code") ? t("filters.material_code") : (locale === "nl" ? "Materiaalcode" : "Material Code"),
    material_code: t.has("filters.material_code") ? t("filters.material_code") : (locale === "nl" ? "Materiaalcode" : "Material Code"),
    materiaal_code: t.has("filters.material_code") ? t("filters.material_code") : (locale === "nl" ? "Materiaalcode" : "Material Code"),
  };

  if (mapping[cleanKey]) {
    return mapping[cleanKey];
  }

  return toTitleCaseFromSlug(key);
}

function appendUnitIfMissing(value: string, unit: string = "mm"): string {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().endsWith(unit.toLowerCase())) {
    return trimmed;
  }
  return `${trimmed} ${unit}`;
}

function specsFromProduct(product: ProductDetail | null, locale: "en" | "nl", t: TranslationLookup): Array<{ label: string; value: ReactNode }> {
  const missing = "-";
  const categoryNames = (product?.categories ?? [])
    .map((category) => normalizeDisplayValue(category.name))
    .filter((name): name is string => Boolean(name))
    .join(", ");
  const specRows: Array<{ label: string; value: ReactNode }> = [
    { label: "SKU", value: normalizeDisplayValue(product?.sku) || missing },
    { label: getSpecLabel("category", locale, t), value: categoryNames || missing },
  ];

  const metaRows = Object.entries(product?.properties ?? {})
    .map(([key, value]): { label: string; value: ReactNode } | null => {
      const normalizedValue = normalizePropertyDisplayValue(value);
      if (!normalizedValue) {
        return null;
      }

      const cleanKey = key.toLowerCase().trim();
      const needsMmSuffix = [
        "breedte",
        "hoogte",
        "kern",
        "buiten-diameter",
        "buitendiameter",
        "max-buiten-dia",
        "max_buiten_dia",
        "buiten-dia",
        "buiten_dia"
      ].includes(cleanKey);

      const localizedValue = localizeProductSpecValue(cleanKey, normalizedValue, locale);
      let finalValue: ReactNode = localizedValue;
      if (
        cleanKey === "material_code" ||
        cleanKey === "materiaal_code" ||
        cleanKey === "material-code" ||
        cleanKey === "materiaal-code"
      ) {
        finalValue = (
          <LocaleLink
            href={`/materials/${encodeURIComponent(normalizedValue)}`}
            className="text-amber-500 hover:text-amber-600 underline font-semibold transition-colors cursor-pointer"
          >
            {normalizedValue}
          </LocaleLink>
        );
      } else if (needsMmSuffix) {
        finalValue = appendUnitIfMissing(localizedValue, "mm");
      }

      return {
        label: getSpecLabel(key, locale, t),
        value: finalValue,
      };
    })
    .filter((entry): entry is { label: string; value: ReactNode } => entry !== null);

  return [...specRows, ...metaRows];
}

function getProductTranslation(product: ProductDetail, locale: "en" | "nl"): ProductTranslation | null {
  const translations = product.translations;
  if (!translations) return null;
  const list = Array.isArray(translations) ? translations : Object.values(translations);
  for (const entry of list) {
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
  return localePath(`/product/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`, locale);
}

function productRouteType(
  product: ProductDetail,
  selectedType: "simple" | "variable" | "group_product" | null,
): "simple" | "variable" | "group_product" | null {
  return normalizeType(product.type, product.is_group_product) ??
    (product.is_group_product || (product.component_products?.length ?? 0) > 0 ? "group_product" : selectedType);
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

function mapUpsellToProductCard(upsell: UpsellProduct, locale: "en" | "nl"): ProductCardData {
  return {
    ...mapLaravelProductToCardData(upsell as unknown as LaravelProduct, locale),
    inStock: true,
    type: "simple",
  };
}

function productHref(product: ProductCardData): { pathname: string; query?: { type: ProductRouteType } } | null {
  if (!product.slug) {
    return null;
  }

  if (product.type === "simple" || product.type === "variable") {
    return {
      pathname: `/product/${product.slug}`,
      query: { type: product.type },
    };
  }

  return { pathname: `/product/${product.slug}` };
}

async function fetchRelatedProductSections(
  baseUrl: string,
  product: ProductDetail,
  selectedType: "simple" | "variable" | "group_product" | null,
  locale: "en" | "nl",
): Promise<ProductCarouselDataSection[]> {
  const productType = productRouteType(product, selectedType);
  const productSlug = product.slug;

  if (!productType || !productSlug) {
    return [];
  }

  try {
    const url = withLocaleParam(
      `${baseUrl}/api/products/${encodeURIComponent(productType)}/slug/${encodeURIComponent(productSlug)}/related-sections?limit=12`,
      locale,
    );
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as RelatedProductsSectionsResponse;
    const sections = json.data?.sections;
    const sectionOrder: Array<{ id: string; fallbackTitle: string; section?: RelatedProductsSection | null }> = [
      { id: "ink-maintenance", fallbackTitle: "Ink & Maintenance", section: sections?.ink_maintenance },
      { id: "hardwares", fallbackTitle: "Hardwares", section: sections?.hardwares },
    ];

    return sectionOrder
      .map(({ id, fallbackTitle, section }) => {
        const products = section?.data ?? [];

        if (products.length === 0) {
          return null;
        }

        return {
          id,
          title: section?.title?.trim() || fallbackTitle,
          products,
        };
      })
      .filter((section): section is ProductCarouselDataSection => section !== null);
  } catch (error) {
    console.error(`Failed to fetch related product sections for slug '${productSlug}'`, error);
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
      <div className="max-w-360 mx-auto flex flex-col gap-12">
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

  const canonicalSlug = product.locale_slugs?.[locale] ?? product.slug;
  if (canonicalSlug && decodeURIComponent(slug) !== canonicalSlug) {
    redirect(productPathForSlug(canonicalSlug, productRouteType(product, selectedType), locale));
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
  const specs = specsFromProduct(product, locale, t);

  console.log('Specs:', specs);
  const compatiblePrinterIds = normalizeIdList(product.printer_ids ?? product.meta?.printer_ids);
  const productCategorySlugs = (product.categories ?? [])
    .map((category) => normalizeValue(category.slug))
    .filter((slug): slug is string => Boolean(slug));

  console.log("Specs derived from product:", specs);
  const relatedProducts = (product.up_sells ?? []).map((upsell) => mapUpsellToProductCard(upsell, locale));
  const suitablePrinters = (product.suitable_printers ?? []).map((upsell) => mapUpsellToProductCard(upsell, locale));
  // Only show the compatibility CTA for consumable products:
  // labels/etiketten, inks/inkt, transfer ribbons/lint.
  // Accessories (accessoires, onderdelen, diversen, overig, printers) must NOT show it.
  // NOTE: is_label_product is unreliable — the API sets it true for accessories too.
  const COMPATIBILITY_ALLOW_LIST = ['inkt', 'lint', 'ink', 'ribbon', 'etiket', 'labels', 'stickers', 'thermisch'];
  const COMPATIBILITY_BLOCK_LIST = ['printer', 'accessoire', 'onderdeel', 'parts', 'diversen', 'overig'];
  const isCompatibilityProduct = productCategorySlugs.some(slug => {
    const s = slug.toLowerCase();
    const blocked = COMPATIBILITY_BLOCK_LIST.some(b => s.includes(b));
    if (blocked) return false;
    return COMPATIBILITY_ALLOW_LIST.some(a => s.includes(a));
  });
  const showCompatibilityCta = isCompatibilityProduct;

  // A product linked to a product finder entry (via Printer URL) is a printer:
  // show its compatible consumables instead of generic up-sells.
  const printerFinderId = product.printer_finder_id ?? null;
  const isPrinterProduct = printerFinderId != null;
  const relatedProductSections = baseUrl
    ? await fetchRelatedProductSections(baseUrl, product, productRouteType(product, selectedType), locale)
    : [];

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
                { label: t('common.products'), href: localePath('/product', locale) },
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
          <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-8 lg:gap-12">
            {/* Title & Description */}
            <div className="flex flex-col gap-4">
              {productName ? (
                <h1 className="text-[#222222] text-[32px] font-semibold leading-10">
                  {productName}
                </h1>
              ) : null}
              {shortDescription ? (
                <div className="text-neutral-700 text-lg font-normal leading-7 [&_a]:text-[#f08500] [&_a]:underline hover:[&_a]:text-[#d97706] [&_a]:transition-colors" dangerouslySetInnerHTML={{ __html: shortDescription }}>
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
                    className="text-neutral-700 text-base font-normal leading-6 cms-content [&_a]:text-[#f08500] [&_a]:underline hover:[&_a]:text-[#d97706] [&_a]:transition-colors"
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
                      className={`flex px-6 py-3 justify-between items-start gap-4 rounded-md ${i % 2 === 0 ? "bg-white/50" : ""}`}
                    >
                      <span className="shrink-0 text-neutral-500 text-base font-normal">{spec.label}</span>
                      <span className="min-w-0 text-right text-neutral-700 text-base font-bold break-words">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </Accordion>

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

            {showCompatibilityCta ? (
              <div className="p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl outline outline-2 outline-offset-[-2px] outline-orange-100">
                <div className="flex flex-row gap-3 items-start">
                  <div className="w-8 h-8 p-2 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                    </svg>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-neutral-700 text-xl font-bold leading-6">{t('product.doesThisFitMyPrinter')}</h3>
                      <p className="text-neutral-700 text-sm font-normal leading-5">
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
                      warranty={product.warranty}
                    />
                  </div>
                </div>
              </div>
            ) : null}

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

      {relatedProductSections.map((section, index) => (
        <ProductCarouselSection
          key={section.id}
          id={section.id}
          title={section.title}
          products={section.products}
          bgClass={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
        />
      ))}

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
