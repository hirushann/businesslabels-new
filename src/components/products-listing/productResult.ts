"use client";

import type { LinkProps } from "next/link";
import type { ProductCardData } from "@/components/ProductCard";

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

function normalizeResultType(value: unknown): "simple" | "variable" | null {
  const scalar = valueAsString(value);
  return scalar === "simple" || scalar === "variable" ? scalar : null;
}

function titleForProduct(result: unknown): string {
  const title = valueAsString(getRaw(result, "title"));
  const name = valueAsString(getRaw(result, "name"));
  const postTitle = valueAsString(getRaw(result, "post_title"));

  if (title?.trim()) return title;
  if (name?.trim()) return name;
  if (postTitle?.trim()) return postTitle;
  return "Unnamed product";
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

function labelFromCode(value: string): string {
  return value
    .trim()
    .replace(/^\[\s*/, "")
    .replace(/\s*\]$/, "")
    .replace(/^["']|["']$/g, "")
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase();
      return upper.length <= 3 ? upper : `${upper.charAt(0)}${upper.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function categoriesForProduct(result: unknown): Array<{ id?: number; name?: string | null; slug?: string | null }> {
  const categories = getRaw(result, "categories");
  if (Array.isArray(categories)) {
    const normalizedCategories: Array<{ id?: number; name?: string | null; slug?: string | null }> = [];

    categories.forEach((category) => {
      if (typeof category === "string") {
        normalizedCategories.push({ name: category });
        return;
      }

      if (typeof category === "object" && category !== null) {
        const record = category as { id?: unknown; term_id?: unknown; name?: unknown; slug?: unknown };
        const id = valueAsNumber(record.id) ?? valueAsNumber(record.term_id) ?? undefined;
        const name = valueAsString(record.name);
        const slug = valueAsString(record.slug);
        normalizedCategories.push({ id, name, slug });
      }
    });

    return normalizedCategories;
  }

  const terms = getRaw(result, "terms");
  const productCategories =
    terms && typeof terms === "object" ? (terms as { product_cat?: unknown }).product_cat : null;

  if (!Array.isArray(productCategories)) return [];

  const normalizedCategories: Array<{ id?: number; name?: string | null; slug?: string | null }> = [];

  productCategories.forEach((category) => {
    if (typeof category === "string") {
      normalizedCategories.push({ name: category });
      return;
    }

    if (typeof category === "object" && category !== null) {
      const record = category as { id?: unknown; term_id?: unknown; name?: unknown; slug?: unknown };
      const id = valueAsNumber(record.id) ?? valueAsNumber(record.term_id) ?? undefined;
      const name = valueAsString(record.name);
      const slug = valueAsString(record.slug);
      normalizedCategories.push({ id, name, slug });
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

export function mapProductListingResult(
  result: unknown,
  resultIndex: number,
): { id: string; product: ProductCardData; href?: LinkProps["href"] } {
  const normalizedType =
    normalizeResultType(getRaw(result, "product_type")) ?? normalizeResultType(getRaw(result, "type"));
  const slug = valueAsString(getRaw(result, "slug")) ?? valueAsString(getRaw(result, "post_name"));
  const id = valueAsString(getRaw(result, "id")) ?? valueAsString(getRaw(result, "ID")) ?? `result-${resultIndex}`;

  const product: ProductCardData = {
    id,
    sku: skuForProduct(result) || "-",
    name: titleForProduct(result),
    subtitle: valueAsString(getRaw(result, "subtitle")),
    excerpt: valueAsString(getRaw(result, "excerpt")),
    materialTitle: materialTitleForProduct(result),
    price: valueAsNumber(getRaw(result, "price")),
    originalPrice: valueAsNumber(getRaw(result, "original_price")),
    inStock: valueAsBoolean(getRaw(result, "in_stock")),
    mainImage: toDisplayImageUrl(imageForProduct(result)),
    categories: categoriesForProduct(result),
    slug,
    type: normalizedType,
  };

  const categorySlugs = (valueAsString(getRaw(result, "category_slugs")) ?? "")
    .split(",")
    .map((slug) => ({ name: labelFromCode(slug), slug: slug }))
    .filter(Boolean);
  
  const isPrinter = categorySlugs.some(s => s.slug === "labelprinters") || 
                    product.categories?.some(c => c.name?.toLowerCase().includes("printer") || c.slug?.toLowerCase() === "labelprinters");

  const prefix = isPrinter ? "printers" : "products";

  const href =
    slug && normalizedType
      ? { pathname: `/${prefix}/${slug}`, query: { type: normalizedType } }
      : slug
        ? `/${prefix}/${slug}`
        : undefined;

  return { id, product, href };
}
