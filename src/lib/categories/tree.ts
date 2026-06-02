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

/** Localized fields arrive resolved to a string, but stay defensive. */
export type LocalizedValue = string | { en?: string; nl?: string } | null | undefined;

export type CategoryNode = {
  id: number;
  name: LocalizedValue;
  slug: LocalizedValue;
  meta_title?: LocalizedValue;
  meta_description?: LocalizedValue;
  parent_id: number | null;
  count: number;
  children?: CategoryNode[];
};

export type CategoryGroup = {
  id: number;
  name: LocalizedValue;
  slug: LocalizedValue;
  count: number;
  categories: CategoryNode[];
};

/** A located category plus the chain of categories above it (root → parent). */
export type CategoryLookup = {
  category: CategoryNode;
  ancestors: CategoryNode[];
};

export function resolveLocalized(value: LocalizedValue, locale: string): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[locale as "en" | "nl"] ?? value.en ?? value.nl ?? "";
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
  const slug = resolveLocalized(category.slug, locale).trim();
  if (slug) return slug;
  return resolveLocalized(category.name, locale).trim();
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
    normalize(resolveLocalized(category.slug, locale)) === target ||
    normalize(resolveLocalized(category.name, locale)) === target
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
      const slug = resolveLocalized(node.slug, locale).trim();
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
 * Fetch the full category tree for the active locale. Returns an empty list
 * on any failure so the archive page degrades to a plain product listing
 * rather than erroring.
 */
export async function fetchCategoryGroups(locale: string): Promise<CategoryGroup[]> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) return [];

  try {
    const url = `${baseUrl}/api/categories?lang=${encodeURIComponent(locale)}`;
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return [];

    const json = (await response.json()) as { data?: CategoryGroup[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("Failed to load category tree.", error);
    return [];
  }
}
