/**
 * Category tree helpers.
 *
 * The `/api/categories` endpoint returns every taxonomy group with its
 * categories nested recursively (`children` to any depth). These utilities
 * fetch that tree and locate a single category by its route slug so the
 * category archive page can render the subcategory navigation for the level
 * the visitor is currently browsing.
 *
 * @see Laravel: App\Http\Controllers\Api\CategoryController@index
 * @see Laravel: App\Http\Resources\Api\CategoryResource
 */

/** Localized fields may arrive as strings or older `{ en, nl }` objects. */
export type LocalizedValue = string | { en?: string; nl?: string } | null | undefined;

export type CategoryTranslation = {
  name?: string | null;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

export type CategoryTranslations = Partial<Record<"en" | "nl", CategoryTranslation>>;

export type CategoryNode = {
  id: number;
  name: LocalizedValue;
  slug: LocalizedValue;
  meta_title?: LocalizedValue;
  meta_description?: LocalizedValue;
  translations?: CategoryTranslations | null;
  parent_id: number | null;
  count: number;
  image?: string | null;
  main_image?: string | null;
  children?: CategoryNode[];
};

export type CategoryGroup = {
  id: number;
  name: LocalizedValue;
  slug: LocalizedValue;
  translations?: CategoryTranslations | null;
  count: number;
  categories: CategoryNode[];
};

/** A located category plus the chain of categories above it (root → parent). */
export type CategoryLookup = {
  category: CategoryNode;
  ancestors: CategoryNode[];
};

export const CATEGORY_SOURCE_LOCALE = "nl";

const CATEGORY_NAME_FALLBACKS: Record<string, Partial<Record<"en" | "nl", string>>> = {
  labelprinters: {
    en: "Label Printers",
    nl: "Label Printers",
  },
  "kleuren labelprinters": {
    en: "Color label printers",
    nl: "Kleuren labelprinters",
  },
  "thermische labelprinters": {
    en: "Thermal label printers",
    nl: "Thermische labelprinters",
  },
  verbruiksmaterialen: {
    en: "Consumables",
    nl: "Verbruiksmaterialen",
  },
  starterkits: {
    en: "Starter kits",
    nl: "Starterkits",
  },
};

export function categoryNameFallback(name: string, locale: string): string {
  return CATEGORY_NAME_FALLBACKS[normalize(name)]?.[locale as "en" | "nl"] ?? name;
}

export function resolveLocalized(value: LocalizedValue, locale: string): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[locale as "en" | "nl"] ?? value.en ?? value.nl ?? "";
}

function resolveCategoryTranslation(
  category: Pick<CategoryNode, "translations">,
  locale: string,
  field: keyof CategoryTranslation,
): string {
  const value = category.translations?.[locale as "en" | "nl"]?.[field];
  return typeof value === "string" ? value : "";
}

export function categoryName(category: CategoryNode, locale: string): string {
  const name = (
    resolveCategoryTranslation(category, locale, "name").trim() ||
    resolveLocalized(category.name, locale).trim()
  );

  return categoryNameFallback(name, locale);
}

export function categorySlug(category: CategoryNode, locale: string): string {
  return (
    resolveCategoryTranslation(category, locale, "slug").trim() ||
    resolveLocalized(category.slug, locale).trim()
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * The URL segment used to link to a category. The slug is preferred; the name
 * is a fallback so categories without a dedicated slug still resolve. Both
 * are accepted when matching (see `findCategoryBySlug`), so the two stay
 * interchangeable as the visitor drills down.
 */
export function categoryRouteSlug(category: CategoryNode, locale: string): string {
  const slug = categorySlug(category, locale);
  if (slug) return slug;
  return categoryName(category, locale);
}

const publicCategoryPathBySlug: Record<string, string> = {
  labelprinters: "/product-category/labelprinters",
  "color-labelprinters": "/product-category/labelprinters/color-labelprinters",
  "color-label-printers": "/product-category/labelprinters/color-labelprinters",
  "kleuren-labelprinters-nl": "/product-category/labelprinters/color-labelprinters",
  "thermal-labelprinters": "/product-category/labelprinters/thermal-labelprinters",
  "thermal-label-printers": "/product-category/labelprinters/thermal-labelprinters",
  "thermische-labelprinters-nl": "/product-category/labelprinters/thermal-labelprinters",
  starterkits: "/product-category/labelprinters/starterkits",
  consumables: "/product-category/labelprinters/consumables",
  "verbruiksmaterialen-nl": "/product-category/labelprinters/consumables",
};

export function categoryPublicPathFromSlug(slug: string): string | null {
  return publicCategoryPathBySlug[slug] ?? null;
}

export function categoryPublicPath(
  category: CategoryNode,
  ancestors: CategoryNode[],
  locale: string,
): string {
  const chain = [...ancestors, category];
  const slugs = chain.map((node) => categoryRouteSlug(node, locale));

  for (let index = slugs.length - 1; index >= 0; index -= 1) {
    const publicPath = publicCategoryPathBySlug[slugs[index]];
    if (publicPath) {
      const childPath = slugs
        .slice(index + 1)
        .map((slug) => encodeURIComponent(slug))
        .join("/");

      return childPath ? `${publicPath}/${childPath}` : publicPath;
    }
  }

  return `/category/${encodeURIComponent(categoryRouteSlug(category, locale))}`;
}

function categoryMatchesSlug(
  category: CategoryNode,
  slug: string,
  locale: string,
): boolean {
  const target = normalize(slug);
  if (!target) return false;
  return (
    normalize(categorySlug(category, locale)) === target ||
    normalize(categoryName(category, locale)) === target
  );
}

/**
 * Depth-first search across every taxonomy group for the category whose slug
 * (or name) matches the route segment. The ancestor chain is collected along
 * the way so the page can render breadcrumbs without another request.
 */
export function findCategoryBySlug(
  groups: CategoryGroup[],
  slug: string,
  locale: string,
): CategoryLookup | null {
  const visit = (
    nodes: CategoryNode[],
    ancestors: CategoryNode[],
  ): CategoryLookup | null => {
    for (const node of nodes) {
      if (categoryMatchesSlug(node, slug, locale)) {
        return { category: node, ancestors };
      }
      const deeper = visit(node.children ?? [], [...ancestors, node]);
      if (deeper) return deeper;
    }
    return null;
  };

  for (const group of groups ?? []) {
    const found = visit(group.categories ?? [], []);
    if (found) return found;
  }
  return null;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function betterCategoryLookup(
  current: CategoryLookup | null,
  candidate: CategoryLookup,
): CategoryLookup {
  if (!current) return candidate;
  return candidate.category.count > current.category.count ? candidate : current;
}

/**
 * Resolve a catch-all category URL by its full localized hierarchy.
 *
 * Slugs are not globally unique (`accessoires`, `shipping-labels`, and a few
 * translated label roots can collide), so live product-category routes should
 * prefer path resolution over last-segment lookup. If duplicate translated
 * paths still exist, the category with the larger aggregated count wins.
 */
export function findCategoryByPath(
  groups: CategoryGroup[],
  segments: string[],
  locale: string,
): CategoryLookup | null {
  const targetSegments = segments.map(decodeSegment).filter((segment) => segment.trim().length > 0);
  if (!targetSegments.length) return null;

  const visit = (
    nodes: CategoryNode[],
    index: number,
    ancestors: CategoryNode[],
  ): CategoryLookup | null => {
    let best: CategoryLookup | null = null;

    for (const node of nodes) {
      if (!categoryMatchesSlug(node, targetSegments[index], locale)) continue;

      if (index === targetSegments.length - 1) {
        best = betterCategoryLookup(best, { category: node, ancestors });
        continue;
      }

      const deeper = visit(node.children ?? [], index + 1, [...ancestors, node]);
      if (deeper) best = betterCategoryLookup(best, deeper);
    }

    return best;
  };

  let best: CategoryLookup | null = null;
  for (const group of groups ?? []) {
    const found = visit(group.categories ?? [], 0, []);
    if (found) best = betterCategoryLookup(best, found);
  }

  return best;
}

type ProductCategoryLocale = "en" | "nl";

function productCategoryRoute(pathname: string): {
  sourceLocale: ProductCategoryLocale;
  segments: string[];
} | null {
  const pathOnly = pathname.split(/[?#]/, 1)[0];
  const parts = pathOnly.split("/").filter(Boolean);

  if (parts[0] === "en") parts.shift();

  const base = parts.shift();
  if (base !== "product-category" && base !== "product-categorie") return null;

  return {
    sourceLocale: base === "product-categorie" ? "nl" : "en",
    segments: parts.map(decodeSegment),
  };
}

/**
 * Rebuild a product-category URL from category identities in the API tree.
 * This deliberately translates every hierarchy level instead of carrying
 * route segments from the current URL into the selected locale.
 */
export function localizedProductCategoryPath(
  groups: CategoryGroup[],
  pathname: string,
  targetLocale: ProductCategoryLocale,
): string | null {
  const route = productCategoryRoute(pathname);
  if (!route || route.segments.length === 0) return null;

  // The route base identifies the source language. Trying the other locale is
  // useful for malformed legacy URLs such as `/en/product-categorie/...` and
  // for links created before the localized base segment was introduced.
  const sourceLocales: ProductCategoryLocale[] = route.sourceLocale === "nl"
    ? ["nl", "en"]
    : ["en", "nl"];
  const lookup = sourceLocales
    .map((locale) => findCategoryByPath(groups, route.segments, locale))
    .find((candidate) => candidate !== null);

  if (!lookup) return null;

  const translatedSegments = [...lookup.ancestors, lookup.category]
    .map((category) => categoryRouteSlug(category, targetLocale))
    .filter(Boolean)
    .map((slug) => encodeURIComponent(slug));
  if (translatedSegments.length === 0) return null;

  const base = targetLocale === "en" ? "/en/product-category" : "/product-categorie";
  return `${base}/${translatedSegments.join("/")}`;
}

/**
 * Walks every node in the tree and returns the set of live category slugs
 * (current locale). Used to drop stale slugs from the catalog's category
 * facet — products that weren't reindexed after admin-side deletes can still
 * surface their old slugs in ES aggregations, and this set is the
 * source-of-truth for "which slugs still exist."
 */
export function flattenCategorySlugs(
  groups: CategoryGroup[],
  locale: string,
): string[] {
  const slugs: string[] = [];
  const visit = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      const slug = categorySlug(node, locale);
      if (slug) slugs.push(slug);
      visit(node.children ?? []);
    }
  };
  for (const group of groups ?? []) {
    visit(group.categories ?? []);
  }
  return slugs;
}

/**
 * Fetch the stored NL category tree. Translated names/slugs are included under
 * each node's `translations`, so this endpoint no longer needs a `lang` query.
 * The backend owns category ordering; keep this uncached so admin sort-order
 * changes are reflected on the next page request.
 */
export async function fetchCategoryGroups(): Promise<CategoryGroup[]> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) return [];

  try {
    const url = `${baseUrl}/api/categories`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];

    const json = (await response.json()) as { data?: CategoryGroup[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("Failed to load category tree.", error);
    return [];
  }
}
