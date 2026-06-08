"use client";

import type { LinkProps } from "next/link";
import type { ProductCardCategory, ProductCardData } from "@/components/ProductCard";

function getRaw(result: unknown, field: string): unknown {
  const entry = (result as Record<string, { raw?: unknown }>)?.[field];
  return entry?.raw;
}

function getMetaValue(result: unknown, key: string): unknown {
  const direct = getRaw(result, key);
  if (direct !== undefined && direct !== null) return direct;

  const meta = getRaw(result, "meta");
  if (!meta) return null;

  if (Array.isArray(meta)) {
    const entry = meta.find((item) => {
      if (!item || typeof item !== "object") return false;
      return (item as { key?: unknown }).key === key;
    });

    return entry && typeof entry === "object" ? (entry as { value?: unknown }).value : null;
  }

  if (typeof meta === "object") {
    const value = (meta as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      const first = value[0];
      if (first && typeof first === "object" && "value" in first) {
        return (first as { value?: unknown }).value;
      }
      return first ?? null;
    }

    if (value && typeof value === "object" && "value" in value) {
      return (value as { value?: unknown }).value;
    }

    return value ?? null;
  }

  return null;
}

function firstScalar(value: unknown): string | number | boolean | null {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const scalar = firstScalar(item);
      if (scalar !== null) return scalar;
    }
  }

  return null;
}

function valueAsString(value: unknown): string | null {
  const scalar = firstScalar(value);
  return scalar === null ? null : String(scalar);
}

function valueAsNumber(value: unknown): number | null {
  const scalar = firstScalar(value);
  if (typeof scalar === "number") return scalar;
  if (typeof scalar === "string" && scalar.trim() !== "") {
    const parsed = Number(scalar);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function valueAsBoolean(value: unknown): boolean {
  const scalar = firstScalar(value);
  if (typeof scalar === "boolean") return scalar;
  if (typeof scalar === "number") return scalar > 0;
  if (typeof scalar === "string") return ["1", "true", "yes", "in_stock"].includes(scalar.toLowerCase());

  return false;
}

function normalizeResultType(value: unknown): "simple" | "variable" | "group_product" | null {
  const scalar = valueAsString(value);
  if (scalar === "group") return "group_product";
  return scalar === "simple" || scalar === "variable" || scalar === "group_product" ? scalar : null;
}

function titleForProduct(result: unknown, fallbackTitle: string): string {
  const title = valueAsString(getRaw(result, "title"));
  const name = valueAsString(getRaw(result, "name"));
  const postTitle = valueAsString(getRaw(result, "post_title"));

  if (title?.trim()) return title;
  if (name?.trim()) return name;
  if (postTitle?.trim()) return postTitle;
  return fallbackTitle;
}

function imageForProduct(result: unknown): string | null {
  const mainImage = valueAsString(getRaw(result, "main_image"));
  if (mainImage?.trim()) return mainImage;

  const fallbackImage = valueAsString(getRaw(result, "image"));
  if (fallbackImage?.trim()) return fallbackImage;

  const thumbnail = getRaw(result, "thumbnail");
  if (typeof thumbnail === "string" && thumbnail.trim() !== "") return thumbnail;
  if (thumbnail && typeof thumbnail === "object") {
    const src = valueAsString((thumbnail as { src?: unknown }).src);
    if (src?.trim()) return src;
    const url = valueAsString((thumbnail as { url?: unknown }).url);
    if (url?.trim()) return url;
  }

  const images = getRaw(result, "images");
  if (!Array.isArray(images) || images.length === 0) return null;

  const first = images[0];
  if (typeof first === "string" && first.trim() !== "") return first;
  if (typeof first === "object" && first !== null) {
    const src = valueAsString((first as { src?: unknown }).src);
    if (src?.trim()) return src;
    const url = valueAsString((first as { url?: unknown }).url);
    if (url?.trim()) return url;
  }

  return null;
}

function categoriesForProduct(result: unknown): ProductCardCategory[] {
  const categories = getRaw(result, "categories");
  if (Array.isArray(categories)) {
    const normalizedCategories: ProductCardCategory[] = [];

    const categoryTitlesEn = getRaw(result, "category_titles_en");
    const categoryTitlesNl = getRaw(result, "category_titles_nl");

    categories.forEach((category, index) => {
      if (typeof category === "string") {
        normalizedCategories.push({ name: category });
        return;
      }

      if (typeof category === "object" && category !== null) {
        const record = category as Record<string, unknown>;
        const id = valueAsNumber(record.id) ?? valueAsNumber(record.term_id) ?? undefined;
        const name = Array.isArray(record.name) ? record.name.filter((item): item is string => typeof item === "string") : valueAsString(record.name);
        const slug = Array.isArray(record.slug) ? record.slug.filter((item): item is string => typeof item === "string") : valueAsString(record.slug);
        normalizedCategories.push({
          id,
          name,
          slug,
          name_en: valueAsString(record.name_en) ?? (Array.isArray(categoryTitlesEn) ? valueAsString(categoryTitlesEn[index]) : null),
          name_nl: valueAsString(record.name_nl) ?? (Array.isArray(categoryTitlesNl) ? valueAsString(categoryTitlesNl[index]) : null),
          slug_en: valueAsString(record.slug_en),
          slug_nl: valueAsString(record.slug_nl),
          translations: record.translations as ProductCardCategory["translations"],
        });
      }
    });

    return normalizedCategories;
  }

  const terms = getRaw(result, "terms");
  const productCategories =
    terms && typeof terms === "object" ? (terms as { product_cat?: unknown }).product_cat : null;

  if (!Array.isArray(productCategories)) return [];

  const normalizedCategories: ProductCardCategory[] = [];

  productCategories.forEach((category) => {
    if (typeof category === "string") {
      normalizedCategories.push({ name: category });
      return;
    }

    if (typeof category === "object" && category !== null) {
      const record = category as Record<string, unknown>;
      const id = valueAsNumber(record.id) ?? valueAsNumber(record.term_id) ?? undefined;
      const name = Array.isArray(record.name) ? record.name.filter((item): item is string => typeof item === "string") : valueAsString(record.name);
      const slug = Array.isArray(record.slug) ? record.slug.filter((item): item is string => typeof item === "string") : valueAsString(record.slug);
      normalizedCategories.push({
        id,
        name,
        slug,
        name_en: valueAsString(record.name_en),
        name_nl: valueAsString(record.name_nl),
        slug_en: valueAsString(record.slug_en),
        slug_nl: valueAsString(record.slug_nl),
        translations: record.translations as ProductCardCategory["translations"],
      });
    }
  });

  return normalizedCategories;
}

function materialTitleForProduct(result: unknown): string | null {
  const direct = valueAsString(getRaw(result, "material_title"));
  if (direct) return direct;

  const material = getRaw(result, "material");
  if (material && typeof material === "object") {
    return valueAsString((material as { title?: unknown }).title);
  }

  return null;
}

function skuForProduct(result: unknown): string | null {
  return valueAsString(getRaw(result, "sku")) ?? valueAsString(getMetaValue(result, "_sku"));
}

function toDisplayImageUrl(url: string | null): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return url;

  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}

function localizedString(result: unknown, field: string, locale?: string): string | null {
  if (!locale) return null;

  // 1. Check for explicitly indexed localized fields (e.g., subtitle_en, excerpt_nl)
  const explicitField = getRaw(result, `${field}_${locale}`);
  if (typeof explicitField === "string" && explicitField.trim() !== "") {
    return explicitField;
  }

  // 2. Sometimes App Search returns stringified JSON for objects/arrays
  let translations = getRaw(result, "translations");
  if (typeof translations === "string") {
    try {
      translations = JSON.parse(translations);
    } catch {
      translations = null;
    }
  }

  if (Array.isArray(translations)) {
    for (let t of translations) {
       if (typeof t === "string") {
         try {
           t = JSON.parse(t);
         } catch {
           continue;
         }
       }
       if (!t || typeof t !== "object") continue;
       const record = t as Record<string, unknown>;

       // Structure 1: { "en": { "language": "en", "subtitle": "..." } }
       const locObj = record[locale];
       if (locObj && typeof locObj === "object") {
         const localizedValue = (locObj as Record<string, unknown>)[field];
         if (typeof localizedValue === "string" && localizedValue.trim() !== "") {
            return localizedValue;
         }
       }

       // Structure 2: { "language": "en", "subtitle": "..." }
       const directValue = record[field];
       if (record.language === locale && typeof directValue === "string" && directValue.trim() !== "") {
          return directValue;
       }
    }
  }
  return null;
}

function localizedMaterialTitle(result: unknown, locale?: string): string | null {
  if (!locale) return null;
  const translations = getRaw(result, "material_translations");
  if (Array.isArray(translations)) {
    for (const t of translations) {
       if (!t || typeof t !== "object") continue;
       const locObj = (t as Record<string, unknown>)[locale];
       if (locObj && typeof locObj === "object") {
         const title = (locObj as Record<string, unknown>).title;
         if (typeof title === "string" && title !== "") {
            return title;
         }
       }
    }
  }
  return null;
}

export function mapProductListingResult(
  result: unknown,
  resultIndex: number,
  fallbackTitle = "Unnamed product",
  locale?: string,
): { id: string; product: ProductCardData; href?: LinkProps["href"] } {
  const normalizedType =
    normalizeResultType(getRaw(result, "product_type")) ?? normalizeResultType(getRaw(result, "type"));
  const slug = localizedString(result, "slug", locale) ?? valueAsString(getRaw(result, "slug")) ?? valueAsString(getRaw(result, "post_name"));
  const id = valueAsString(getRaw(result, "id")) ?? valueAsString(getRaw(result, "ID")) ?? `result-${resultIndex}`;

  const name = localizedString(result, "title", locale) ?? localizedString(result, "name", locale) ?? titleForProduct(result, fallbackTitle);

  const product: ProductCardData = {
    id,
    sku: skuForProduct(result) || "-",
    name,
    subtitle: localizedString(result, "subtitle", locale) ?? valueAsString(getRaw(result, "subtitle")),
    excerpt: localizedString(result, "excerpt", locale) ?? valueAsString(getRaw(result, "excerpt")),
    materialTitle: localizedMaterialTitle(result, locale) ?? materialTitleForProduct(result),
    price: valueAsNumber(getRaw(result, "price")),
    originalPrice: valueAsNumber(getRaw(result, "original_price")),
    inStock: valueAsBoolean(getRaw(result, "in_stock")),
    mainImage: toDisplayImageUrl(imageForProduct(result)),
    categories: categoriesForProduct(result),
    slug,
    type: normalizedType,
    packing_group: valueAsNumber(getRaw(result, "packing_group")) ?? valueAsNumber(getMetaValue(result, "_packing_group")),
    allow_singulars: firstScalar(getRaw(result, "allow_singulars")) ?? firstScalar(getMetaValue(result, "_allow_singulars")),
    is_label: valueAsBoolean(getRaw(result, "is_label")) || valueAsBoolean(getRaw(result, "is_label_product")) || valueAsBoolean(getMetaValue(result, "is_label_product")) || null,
    is_label_product: valueAsBoolean(getRaw(result, "is_label_product")) || valueAsBoolean(getMetaValue(result, "is_label_product")) || null,
    is_group_product: valueAsBoolean(getRaw(result, "is_group_product")) || valueAsBoolean(getMetaValue(result, "is_group_product")) || null,
    translations: getRaw(result, "translations") as ProductCardData["translations"],
  };

  const href =
    slug && normalizedType
      ? { pathname: `/product/${slug}`, query: { type: normalizedType } }
      : slug
        ? `/product/${slug}`
        : undefined;

  return { id, product, href };
}
