import { NextRequest, NextResponse } from "next/server";
import { getAccessoryCategoryPath } from "@/lib/routes/accessoryCategories";
import { getLabelCategoryPath } from "@/lib/routes/labelCategories";
import { getPrinterCategoryPath } from "@/lib/routes/printerCategories";
import { parseCatalogSearchParams, searchCatalogProducts } from "@/lib/search/products";
import { parseMaterialSearchParams, searchMaterials } from "@/lib/search/materials";
import type { Material } from "@/lib/search/materials";
import type { CatalogProductResult } from "@/lib/search/types";

const PRODUCTS_PER_GROUP = 4;
const MATERIALS_LIMIT = 4;

type HeaderSuggestionItem = {
  id: string;
  title: string;
  meta?: string;
  href: string;
  image?: string;
};

type HeaderSuggestionGroup = {
  id: "printers" | "labels" | "accessories";
  title: string;
  href: string;
  total: number;
  items: HeaderSuggestionItem[];
};

const PRODUCT_GROUPS: Array<{
  id: HeaderSuggestionGroup["id"];
  title: Record<"en" | "nl", string>;
  path: (locale: string) => string;
  slugs: string[];
  names: string[];
}> = [
  {
    id: "printers",
    title: { en: "Label Printers", nl: "Labelprinters" },
    path: getPrinterCategoryPath,
    slugs: ["labelprinters", "label-printers", "color-labelprinters", "kleuren-labelprinters", "thermal-labelprinters", "thermische-labelprinters"],
    names: ["label printer", "labelprinter", "printer"],
  },
  {
    id: "labels",
    title: { en: "Labels and tickets", nl: "Labels en tickets" },
    path: getLabelCategoryPath,
    slugs: ["labels-en-tickets", "labels-en-tickets-en", "inkjet-printer-media", "thermal-direct", "thermal-transfer", "jewellery-labels"],
    names: ["label", "ticket", "etiket"],
  },
  {
    id: "accessories",
    title: { en: "Accessories", nl: "Accessoires" },
    path: getAccessoryCategoryPath,
    slugs: ["accessories", "accessoires", "re-unwinders", "applicators", "dispensers", "printer-add-ons", "cutters", "dongles", "maintenance"],
    names: ["accessory", "accessories", "accessoire", "applicator", "dispenser", "cutter", "rewinder"],
  },
];

function withSearch(path: string, query: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("search", query.trim());
  return params.size ? `${path}?${params.toString()}` : path;
}

function productHref(result: CatalogProductResult): string {
  const href = result.href;
  if (typeof href === "string") return href;
  if (href && typeof href === "object" && "pathname" in href && href.pathname) {
    const params = new URLSearchParams();
    const query = href.query;
    if (query && typeof query === "object" && !Array.isArray(query)) {
      Object.entries(query).forEach(([key, value]) => {
        if (typeof value === "string") params.set(key, value);
        if (typeof value === "number" || typeof value === "boolean") params.set(key, String(value));
      });
    }
    return params.size ? `${href.pathname}?${params.toString()}` : String(href.pathname);
  }
  return result.product.slug ? `/product/${result.product.slug}` : "/product";
}

function productCategoryText(product: CatalogProductResult): string {
  return (product.product.categories ?? [])
    .flatMap((category) => [
      category.slug,
      category.slug_en,
      category.slug_nl,
      category.name,
      category.name_en,
      category.name_nl,
    ])
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function groupForProduct(product: CatalogProductResult): HeaderSuggestionGroup["id"] | null {
  const text = productCategoryText(product);
  if (!text) return null;

  const accessoryMatch = PRODUCT_GROUPS.find((group) => group.id === "accessories" && group.slugs.some((slug) => text.includes(slug)));
  if (accessoryMatch) return accessoryMatch.id;

  const slugMatch = PRODUCT_GROUPS.find((group) => group.slugs.some((slug) => text.includes(slug)));
  if (slugMatch) return slugMatch.id;

  const nameMatch = PRODUCT_GROUPS.find((group) => group.names.some((name) => text.includes(name)));
  return nameMatch?.id ?? null;
}

function mapProductItem(result: CatalogProductResult): HeaderSuggestionItem {
  const sku = result.product.sku && result.product.sku !== "-" ? `SKU: ${result.product.sku}` : undefined;
  return {
    id: result.id,
    title: result.product.name,
    meta: sku,
    href: productHref(result),
    image: result.product.mainImage ?? undefined,
  };
}

function mapMaterialItem(material: Material): HeaderSuggestionItem {
  return {
    id: String(material.id),
    title: material.title,
    meta: material.code || undefined,
    href: material.slug ? `/materials/${material.slug}` : "/materials",
    image: material.main_image,
  };
}

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "nl";
  const query = request.nextUrl.searchParams.get("search") || request.nextUrl.searchParams.get("q") || "";
  const materialTitle = locale === "nl" ? "Materialen" : "Materials";

  if (!query.trim()) {
    return NextResponse.json({
      query: "",
      productGroups: [],
      materials: { title: materialTitle, href: withSearch("/materials", query), total: 0, items: [] },
    });
  }

  try {
    const productParams = new URLSearchParams(request.nextUrl.searchParams);
    productParams.set("search", query);
    productParams.set("page", "1");
    productParams.set("per_page", "24");
    productParams.set("sort", "relevance");
    productParams.set("locale", locale);

    const materialParams = new URLSearchParams(request.nextUrl.searchParams);
    materialParams.set("search", query);
    materialParams.set("page", "1");
    materialParams.set("per_page", String(MATERIALS_LIMIT));
    materialParams.set("locale", locale);

    const [products, materials] = await Promise.all([
      searchCatalogProducts(parseCatalogSearchParams(productParams, locale)),
      searchMaterials(parseMaterialSearchParams(materialParams, locale)),
    ]);

    const buckets = new Map<HeaderSuggestionGroup["id"], CatalogProductResult[]>();
    products.products.forEach((product) => {
      const group = groupForProduct(product);
      if (!group) return;
      buckets.set(group, [...(buckets.get(group) ?? []), product]);
    });

    const productGroups = PRODUCT_GROUPS
      .map((group) => {
        const groupedProducts = buckets.get(group.id) ?? [];
        return {
          id: group.id,
          title: group.title[locale],
          href: withSearch(group.path(locale), query),
          total: groupedProducts.length,
          items: groupedProducts.slice(0, PRODUCTS_PER_GROUP).map(mapProductItem),
        };
      })
      .filter((group) => group.items.length > 0);

    return NextResponse.json({
      query,
      productGroups,
      materials: {
        title: materialTitle,
        href: withSearch("/materials", query),
        total: materials.total,
        items: materials.materials.slice(0, MATERIALS_LIMIT).map(mapMaterialItem),
      },
    });
  } catch (error) {
    console.error("Header search suggestions failed.", error);

    return NextResponse.json(
      {
        query,
        productGroups: [],
        materials: { title: materialTitle, href: withSearch("/materials", query), total: 0, items: [] },
        error: locale === "nl" ? "Zoeksuggesties zijn tijdelijk niet beschikbaar." : "Search suggestions are temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
