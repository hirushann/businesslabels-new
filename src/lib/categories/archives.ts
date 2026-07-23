export type CategoryArchiveNode = {
  term_id: number;
  external_id: number;
  identity_id: number | null;
  parent_term_id: number | null;
  locale: "en" | "nl";
  name: string;
  slug: string;
  path: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string;
  alternate_urls: Partial<Record<"en" | "nl", string>>;
  direct_count: number;
  count: number;
  upstream_count: number;
  is_linked_translation: boolean;
  children?: CategoryArchiveNode[];
};

export type ResolvedCategoryArchive = {
  archive: CategoryArchiveNode;
  ancestors: CategoryArchiveNode[];
  redirect_to: string | null;
};

export async function resolveCategoryArchive(
  locale: "en" | "nl",
  path: string,
): Promise<ResolvedCategoryArchive | null> {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  if (!baseUrl) return null;

  const url = new URL("/api/category-archives/resolve", baseUrl);
  url.searchParams.set("locale", locale);
  url.searchParams.set("path", path);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Category archive resolver returned ${response.status}.`);
  }

  const payload = (await response.json()) as { data?: ResolvedCategoryArchive };
  return payload.data ?? null;
}

type CategoryArchiveRoute = {
  locale: "en" | "nl";
  path: string;
};

function categoryArchiveRoute(pathname: string): CategoryArchiveRoute | null {
  const segments = pathname.split(/[?#]/, 1)[0].split("/").filter(Boolean);

  try {
    if (segments[0] === "en" && segments[1] === "product-category") {
      const path = segments.slice(2).map(decodeURIComponent).join("/");

      return path ? { locale: "en", path } : null;
    }

    if (segments[0] === "product-categorie") {
      const path = segments.slice(1).map(decodeURIComponent).join("/");

      return path ? { locale: "nl", path } : null;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Resolve a language switch through the exact locale-specific WordPress term.
 * Translated archives may have unrelated parent slugs, so rebuilding the path
 * segment-by-segment from a shared taxonomy is not reliable.
 */
export async function localizedCategoryArchivePath(
  pathname: string,
  targetLocale: "en" | "nl",
): Promise<string | null> {
  const route = categoryArchiveRoute(pathname);
  if (!route) return null;

  const resolved = await resolveCategoryArchive(route.locale, route.path);
  if (!resolved) return null;

  if (route.locale === targetLocale) {
    return resolved.archive.canonical_url;
  }

  return resolved.archive.alternate_urls[targetLocale] ?? null;
}
