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
